
import asyncio
import os
import sqlite3
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from aiogram import Bot

import database

TASHKENT_TZ = ZoneInfo("Asia/Tashkent")

# Fixed UniUZ rules:
# 1) class reminder: 15 minutes before
# 2) homework reminder: 24 hours before
# 3) homework reminder: 1 hour before
SCHEDULE_REMINDER_MINUTES = 15
HOMEWORK_WINDOWS = (
    ("24h", 24 * 60),
    ("1h", 60),
)

CHECK_SECONDS = 30


def db():
    return sqlite3.connect(
        os.environ.get("DB_NAME", "uniuz.db"),
        check_same_thread=False
    )


def init_reminder_storage():
    c = db()
    c.execute("""
    CREATE TABLE IF NOT EXISTS sent_notifications(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER NOT NULL,
        notification_key TEXT NOT NULL UNIQUE,
        sent_at TEXT NOT NULL
    )
    """)
    c.commit()
    c.close()


def claim(key: str, telegram_id: int) -> bool:
    c = db()
    try:
        c.execute(
            """
            INSERT INTO sent_notifications(
                telegram_id, notification_key, sent_at
            ) VALUES(?,?,?)
            """,
            (
                telegram_id,
                key,
                datetime.now(TASHKENT_TZ).isoformat()
            )
        )
        c.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        c.close()


def users_with_reminders():
    c = db()
    rows = c.execute("""
        SELECT telegram_id, first_name
        FROM users
        WHERE reminders_enabled=1
    """).fetchall()
    c.close()
    return rows


def schedules_for_user(telegram_id):
    c = db()
    rows = c.execute("""
        SELECT day_of_week, subject, start_time, room
        FROM schedules
        WHERE user_id=(
            SELECT id FROM users WHERE telegram_id=?
        )
        ORDER BY day_of_week, start_time
    """, (telegram_id,)).fetchall()
    c.close()
    return rows


def homework_for_user(telegram_id):
    c = db()
    rows = c.execute("""
        SELECT id, title, description, due_at
        FROM homework
        WHERE user_id=(
            SELECT id FROM users WHERE telegram_id=?
        )
        AND completed=0
        ORDER BY due_at
    """, (telegram_id,)).fetchall()
    c.close()
    return rows


def next_class_datetime(day_of_week, start_time, now):
    try:
        hh, mm = map(int, str(start_time)[:5].split(":"))
        target = now + timedelta(
            days=(int(day_of_week) - now.weekday()) % 7
        )
        target = target.replace(
            hour=hh, minute=mm, second=0, microsecond=0
        )
        if target < now:
            target += timedelta(days=7)
        return target
    except Exception:
        return None


def parse_due_at(value):
    try:
        raw = str(value or "").strip()
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=TASHKENT_TZ)
        return dt.astimezone(TASHKENT_TZ)
    except Exception:
        return None


async def send(bot, telegram_id, text):
    try:
        await bot.send_message(
            telegram_id,
            text,
            parse_mode="HTML"
        )
        return True
    except Exception as exc:
        print(f"Telegram send error {telegram_id}: {exc}")
        return False


async def check_schedule(bot, now):
    weekday = now.weekday()

    for telegram_id, first_name in users_with_reminders():
        for day, subject, start_time, room in schedules_for_user(telegram_id):
            if int(day) != weekday:
                continue

            target = next_class_datetime(day, start_time, now)
            if not target or target.date() != now.date():
                continue

            minutes_left = (target - now).total_seconds() / 60

            # 15-minute window. The worker checks every 30 sec.
            if 14.0 <= minutes_left <= 15.5:
                key = (
                    f"schedule:{telegram_id}:"
                    f"{target.date().isoformat()}:"
                    f"{start_time}:{subject}"
                )

                if not claim(key, telegram_id):
                    continue

                room_line = (
                    f"\n🏫 Аудитория: {room}"
                    if room else ""
                )
                name = first_name or "Студент"

                await send(
                    bot,
                    telegram_id,
                    (
                        "🔔 <b>Напоминание о паре</b>\n\n"
                        f"Привет, {name}!\n"
                        "Через <b>15 минут</b> начинается:\n\n"
                        f"📚 <b>{subject}</b>\n"
                        f"🕐 {start_time}"
                        f"{room_line}\n\n"
                        "🇺🇿 Время: <b>Asia/Tashkent</b>"
                    )
                )


async def check_homework(bot, now):
    for telegram_id, first_name in users_with_reminders():
        for hw_id, title, description, due_at_raw in homework_for_user(telegram_id):
            due = parse_due_at(due_at_raw)
            if not due:
                continue

            minutes_left = (due - now).total_seconds() / 60
            if minutes_left < 0:
                continue

            for label, window in HOMEWORK_WINDOWS:
                # Send within a 30-second polling window around the target.
                if window - 0.5 <= minutes_left <= window + 0.5:
                    key = (
                        f"homework:{telegram_id}:{hw_id}:"
                        f"{due.isoformat()}:{label}"
                    )

                    if not claim(key, telegram_id):
                        continue

                    if label == "24h":
                        when = "через 24 часа"
                    else:
                        when = "через 1 час"

                    name = first_name or "Студент"

                    await send(
                        bot,
                        telegram_id,
                        (
                            "📝 <b>Напоминание о домашнем задании</b>\n\n"
                            f"Привет, {name}!\n"
                            f"До дедлайна {when}:\n\n"
                            f"📚 <b>{title}</b>\n"
                            f"⏰ Дедлайн: "
                            f"<b>{due.strftime('%d.%m.%Y %H:%M')}</b>\n\n"
                            "🇺🇿 Время: <b>Asia/Tashkent</b>"
                        )
                    )


async def worker():
    token = os.environ.get("BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("BOT_TOKEN is not configured")

    database.init_db()
    init_reminder_storage()

    bot = Bot(token)

    print("UniUZ reminders started")
    print("Timezone: Asia/Tashkent")
    print("Schedule reminder: 15 minutes")
    print("Homework reminders: 24 hours + 1 hour")

    try:
        while True:
            now = datetime.now(TASHKENT_TZ)

            try:
                await check_schedule(bot, now)
                await check_homework(bot, now)
            except Exception as exc:
                print(f"Reminder cycle error: {exc}")

            await asyncio.sleep(CHECK_SECONDS)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(worker())

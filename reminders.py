import asyncio
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from aiogram import Bot

import database


# ============================================================
# UniUZ Morning Reminders
# Sends ONE message every morning with today's schedule.
# Timezone: Asia/Tashkent
# Default send time: 07:00 Tashkent
# ============================================================

TZ = ZoneInfo("Asia/Tashkent")
MORNING_HOUR = int(os.environ.get("MORNING_REMINDER_HOUR", "8"))
MORNING_MINUTE = int(os.environ.get("MORNING_REMINDER_MINUTE", "0"))

BOT_TOKEN = os.environ.get("BOT_TOKEN") or os.environ.get("TELEGRAM_BOT_TOKEN")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is not set")


def tashkent_now():
    return datetime.now(TZ)


def today_schedule_for_user(conn, telegram_id, weekday):
    rows = conn.execute(
        """
        SELECT s.subject, s.start_time, s.end_time, s.room, s.teacher
        FROM schedules s
        JOIN users u ON u.id = s.user_id
        WHERE u.telegram_id = ?
          AND u.reminders_enabled = 1
          AND s.day_of_week = ?
        ORDER BY s.start_time
        """,
        (telegram_id, weekday),
    ).fetchall()

    return rows


def format_schedule(rows):
    if not rows:
        return "🎉 Сегодня пар нет. Хорошего дня!"

    lines = ["🗓️ <b>Пары на сегодня</b>", ""]

    for row in rows:
        subject = row["subject"] or "Без названия"
        start = row["start_time"] or "—"
        end = row["end_time"]
        room = row["room"]

        time_text = start
        if end:
            time_text += f"–{end}"

        line = f"⏰ <b>{time_text}</b> — {subject}"

        details = []
        if room:
            details.append(f"🏫 {room}")

        if row["teacher"]:
            details.append(f"👨‍🏫 {row['teacher']}")

        lines.append(line)

        if details:
            lines.append("   " + " · ".join(details))

    lines.append("")
    lines.append(f"📚 Всего пар: <b>{len(rows)}</b>")
    lines.append("Хорошего и продуктивного дня! 🎓")

    return "\n".join(lines)


async def send_morning_reminders(bot: Bot):
    now = tashkent_now()

    # Python weekday(): Monday=0 ... Sunday=6.
    weekday = now.weekday()

    conn = database.conn()

    try:
        users = conn.execute(
            """
            SELECT telegram_id, first_name
            FROM users
            WHERE reminders_enabled = 1
              AND telegram_id IS NOT NULL
            """
        ).fetchall()

        for user in users:
            telegram_id = int(user["telegram_id"])

            try:
                rows = today_schedule_for_user(
                    conn,
                    telegram_id,
                    weekday,
                )

                text = format_schedule(rows)

                await bot.send_message(
                    telegram_id,
                    text,
                    parse_mode="HTML",
                )

                print(
                    f"[MORNING] sent to {telegram_id}: "
                    f"{len(rows)} classes"
                )

            except Exception as exc:
                print(
                    f"[MORNING] send error for {telegram_id}: {exc}"
                )

    finally:
        conn.close()


async def sleep_until_next_morning():
    now = tashkent_now()

    target = now.replace(
        hour=MORNING_HOUR,
        minute=MORNING_MINUTE,
        second=0,
        microsecond=0,
    )

    if target <= now:
        target += timedelta(days=1)

    seconds = max(1, (target - now).total_seconds())

    print(
        f"[MORNING] next notification: "
        f"{target.strftime('%Y-%m-%d %H:%M:%S %Z')}"
    )

    await asyncio.sleep(seconds)


async def main():
    database.init_db()

    bot = Bot(BOT_TOKEN)

    # One-time test mode:
    # TEST_TELEGRAM_ID=123456789 python reminders.py
    test_id = os.environ.get("TEST_TELEGRAM_ID")
    if test_id:
        conn = database.conn()
        try:
            rows = today_schedule_for_user(conn, int(test_id), tashkent_now().weekday())
            text = format_schedule(rows)
        finally:
            conn.close()

        await bot.send_message(int(test_id), "🧪 <b>Тест утреннего уведомления</b>\\n\\n" + text, parse_mode="HTML")
        print(f"[TEST] sent morning reminder to {test_id}")
        await bot.session.close()
        return

    print("UniUZ Morning Reminders STARTED")
    print(
        f"Timezone: Asia/Tashkent | "
        f"send time: {MORNING_HOUR:02d}:{MORNING_MINUTE:02d}"
    )

    try:
        while True:
            await sleep_until_next_morning()
            await send_morning_reminders(bot)

    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())

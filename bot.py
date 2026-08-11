import asyncio
import os
import threading
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv
from werkzeug.serving import make_server

import database
from server import app

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEB_APP_URL = os.getenv("WEB_APP_URL", "")
TZ = ZoneInfo("Asia/Tashkent")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is required")

bot = Bot(BOT_TOKEN)
dp = Dispatcher()


def mini_app_markup():
    if not WEB_APP_URL:
        return None
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Open UniUZ", web_app=WebAppInfo(url=WEB_APP_URL))]
    ])


@dp.message(F.text == "/start")
async def start(message: Message):
    database.add_user(message.from_user.id, message.from_user.username, message.from_user.full_name)
    text = (
        "🎓 <b>UniUZ</b>\n\n"
        "Open the Mini App to set up your university, faculty, group and schedule."
    )
    await message.answer(text, reply_markup=mini_app_markup())


@dp.message(F.text == "/id")
async def telegram_id(message: Message):
    await message.answer(f"Your Telegram ID: <code>{message.from_user.id}</code>")


async def send_reminder(user, text):
    try:
        await bot.send_message(user["id"], text, parse_mode="HTML")
        return True
    except Exception as exc:
        print("Reminder send error", user["id"], exc)
        return False


def lang_text(user, ru, en):
    return ru if (user["language"] or "ru") == "ru" else en


async def reminder_loop():
    while True:
        try:
            now = datetime.now(TZ)
            day = now.isoweekday()
            users = database.get_reminder_users()
            for user in users:
                # Class reminders: 30 minutes before start.
                for item in database.get_today_schedule(user["id"], day):
                    try:
                        start = datetime.strptime(item["start_time"], "%H:%M").replace(year=now.year, month=now.month, day=now.day, tzinfo=TZ)
                    except ValueError:
                        continue
                    delta = start - now
                    if timedelta(minutes=29) <= delta <= timedelta(minutes=31):
                        key = f"class30:{now.date()}:{item['id']}"
                        if not database.reminder_sent(user["id"], key):
                            room = f"\n📍 {item['room']}" if item["room"] else ""
                            text = lang_text(
                                user,
                                f"⏰ <b>Пара через 30 минут</b>\n\n📚 {item['subject']}\n🕐 {item['start_time']}–{item['end_time']}{room}",
                                f"⏰ <b>Class in 30 minutes</b>\n\n📚 {item['subject']}\n🕐 {item['start_time']}–{item['end_time']}{room}",
                            )
                            if await send_reminder(user, text):
                                database.mark_reminder(user["id"], key)

                # Homework reminders: 24h and 2h before due time.
                for hw in database.get_homework(user["id"]):
                    try:
                        due = datetime.fromisoformat(hw["due_at"].replace("Z", "+00:00"))
                        if due.tzinfo is None:
                            due = due.replace(tzinfo=TZ)
                        due = due.astimezone(TZ)
                    except ValueError:
                        continue
                    diff = due - now
                    reminder_type = None
                    if timedelta(hours=23, minutes=59) <= diff <= timedelta(hours=24, minutes=1):
                        reminder_type = "24h"
                    elif timedelta(hours=1, minutes=59) <= diff <= timedelta(hours=2, minutes=1):
                        reminder_type = "2h"
                    if reminder_type:
                        key = f"hw:{reminder_type}:{hw['id']}:{due.date()}"
                        if not database.reminder_sent(user["id"], key):
                            text = lang_text(
                                user,
                                f"📝 <b>Напоминание о ДЗ</b>\n\n{hw['title']}\n⏰ Сдать: {due.strftime('%d.%m.%Y %H:%M')}",
                                f"📝 <b>Homework reminder</b>\n\n{hw['title']}\n⏰ Due: {due.strftime('%d.%m.%Y %H:%M')}",
                            )
                            if await send_reminder(user, text):
                                database.mark_reminder(user["id"], key)
        except Exception as exc:
            print("Reminder loop error:", exc)
        await asyncio.sleep(60)


class FlaskThread(threading.Thread):
    daemon = True
    def run(self):
        port = int(os.getenv("PORT", "8080"))
        server = make_server("0.0.0.0", port, app)
        server.serve_forever()


async def main():
    database.init_db()
    FlaskThread().start()
    asyncio.create_task(reminder_loop())
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())

import os, time, threading, requests
from datetime import datetime, timedelta
import database

def send(chat_id, text):
    token = os.environ.get("BOT_TOKEN")
    if not token:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=10
        )
    except Exception as e:
        print("telegram reminder:", e)

def worker():
    database.init_db()
    sent = set()
    while True:
        try:
            now = datetime.now()
            keybase = now.strftime("%Y-%m-%d %H:%M")
            # Homework reminders: 24h and 1h before due time.
            for x in database.due_for_reminders():
                try:
                    due = datetime.fromisoformat(x["due_at"])
                except Exception:
                    continue
                for minutes, label in [(1440, "завтра"), (60, "через 1 час")]:
                    if abs((due - now).total_seconds()/60 - minutes) < 0.6:
                        key = f"hw:{x['telegram_id']}:{x['homework_id']}:{label}:{keybase}"
                        if key not in sent:
                            send(x["telegram_id"], f"📝 Напоминание: {x['title']} — сдача {label}.")
                            sent.add(key)

            # Class reminder: 30 minutes before start.
            weekday = now.weekday()
            target = (now + timedelta(minutes=30)).strftime("%H:%M")
            for x in database.schedule_reminders():
                if x["day_of_week"] == weekday and x["start_time"] == target:
                    key = f"class:{x['telegram_id']}:{weekday}:{x['subject']}:{keybase}"
                    if key not in sent:
                        send(x["telegram_id"], f"🗓️ Через 30 минут: {x['subject']} ({x['start_time']}).")
                        sent.add(key)
            if len(sent) > 10000:
                sent.clear()
        except Exception as e:
            print("reminder worker:", e)
        time.sleep(60)

def start_reminder_worker():
    threading.Thread(target=worker, daemon=True).start()

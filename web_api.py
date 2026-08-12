import os, json, hmac, hashlib
from urllib.parse import parse_qsl
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import database
from ai_service import ask, extract_schedule_from_image, extract_schedule_from_pdf

BASE = os.path.dirname(os.path.abspath(__file__))
UPLOADS = os.path.join(BASE, "uploads")
os.makedirs(UPLOADS, exist_ok=True)

app = Flask(__name__, static_folder=BASE, static_url_path="")
CORS(app)
database.init_db()

def telegram_user():
    raw = request.headers.get("X-Telegram-Init-Data", "")
    if not raw:
        # Useful only for local browser testing if a TEST_TELEGRAM_ID is configured.
        tid = os.environ.get("TEST_TELEGRAM_ID")
        if tid:
            return {"id": int(tid), "first_name": "Test", "last_name": "User"}
        return None
    try:
        bot_token = os.environ.get("BOT_TOKEN", "")
        pairs = dict(parse_qsl(raw, keep_blank_values=True))
        received = pairs.pop("hash", None)
        if not received or not bot_token:
            return None
        check = "\n".join(f"{k}={v}" for k,v in sorted(pairs.items()))
        secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calc = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calc, received):
            return None
        return json.loads(pairs["user"])
    except Exception as e:
        print("auth:", e)
        return None

def user_required():
    u = telegram_user()
    if not u:
        return None
    return database.create_or_update_user(u)

def admin_required():
    u = user_required()
    if not u:
        return None
    admin_id = os.environ.get("ADMIN_ID", "")
    if str(u["telegram_id"]) != str(admin_id) and not u["is_admin"]:
        return None
    return u

@app.get("/")
def index():
    return send_from_directory(BASE, "index.html")

@app.get("/api/health")
def health():
    return jsonify(ok=True, service="UniUZ API", status="online", version="4")

@app.get("/api/me")
def me():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    admin_id = os.environ.get("ADMIN_ID", "")
    return jsonify(
        profile=dict(u),
        is_admin=(str(u["telegram_id"]) == str(admin_id) or bool(u["is_admin"]))
    )

@app.post("/api/setup")
def setup():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    d = request.get_json(silent=True) or {}
    required = ["language","university","department","group_name","first_name","last_name"]
    if any(not str(d.get(k,"")).strip() for k in required):
        return jsonify(error="Fill all fields"), 400
    row = database.update_profile(int(u["telegram_id"]), **{k:d[k].strip() for k in required})
    return jsonify(ok=True, profile=dict(row))

@app.put("/api/profile")
def profile():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    d = request.get_json(silent=True) or {}
    row = database.update_profile(int(u["telegram_id"]), **d)
    return jsonify(ok=True, profile=dict(row))

@app.get("/api/schedule")
def schedule():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    return jsonify(items=database.get_schedule(int(u["telegram_id"])))

@app.post("/api/schedule/upload")
def schedule_upload():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    f = request.files.get("file")
    if not f: return jsonify(error="File required"), 400
    name = f.filename or "schedule"
    path = os.path.join(UPLOADS, f"{u['telegram_id']}_{name}")
    f.save(path)
    try:
        if f.mimetype == "application/pdf" or name.lower().endswith(".pdf"):
            items = extract_schedule_from_pdf(path)
        elif f.mimetype.startswith("image/"):
            items = extract_schedule_from_image(path, f.mimetype)
        else:
            return jsonify(error="Use PDF, JPG or PNG"), 400
        database.save_schedule(int(u["telegram_id"]), items)
        return jsonify(ok=True, items=items)
    except Exception as e:
        print("schedule:", e)
        return jsonify(error=str(e)), 500

@app.post("/api/homework")
def add_hw():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    d = request.get_json(silent=True) or {}
    if not d.get("title") or not d.get("due_at"):
        return jsonify(error="Title and due date are required"), 400
    hid = database.add_homework(int(u["telegram_id"]), d["title"], d.get("description",""), d["due_at"], d.get("file_name"))
    return jsonify(ok=True, id=hid)

@app.post("/api/homework/upload")
def homework_upload():
    u = user_required()
    if not u:
        return jsonify(error="Unauthorized"), 401

    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()
    due_at = (request.form.get("due_at") or "").strip()
    f = request.files.get("file")

    if not title or not due_at:
        return jsonify(error="Title and due date are required"), 400

    file_name = None
    file_path = None

    if f and f.filename:
        safe = os.path.basename(f.filename).replace(" ", "_")
        file_name = safe
        file_path = os.path.join(
            UPLOADS,
            f"hw_{u['telegram_id']}_{os.getpid()}_{safe}"
        )
        f.save(file_path)

    hid = database.add_homework(
        int(u["telegram_id"]),
        title,
        description,
        due_at,
        file_name,
        file_path
    )
    return jsonify(ok=True, id=hid, file_name=file_name)

@app.get("/api/homework")
def hw():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    return jsonify(items=database.get_homework(int(u["telegram_id"])))

@app.post("/api/homework/<int:hid>/complete")
def complete(hid):
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    d = request.get_json(silent=True) or {}
    completed = bool(d.get("completed", True))
    database.complete_homework(int(u["telegram_id"]), hid, completed)
    return jsonify(ok=True, completed=completed)

@app.delete("/api/homework/<int:hid>")
def delete_hw(hid):
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    database.delete_homework(int(u["telegram_id"]), hid)
    return jsonify(ok=True)

@app.get("/api/reminders")
def reminders():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    return jsonify(enabled=bool(u["reminders_enabled"]))

@app.post("/api/reminders")
def set_reminders():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    enabled = bool((request.get_json(silent=True) or {}).get("enabled"))
    row = database.update_profile(int(u["telegram_id"]), reminders_enabled=1 if enabled else 0)
    return jsonify(ok=True, enabled=bool(row["reminders_enabled"]))

@app.post("/api/ai")
def ai():
    u = user_required()
    if not u: return jsonify(error="Unauthorized"), 401
    d = request.get_json(silent=True) or {}
    question = str(d.get("message","")).strip()
    if not question: return jsonify(error="Message required"), 400
    allowed, used = database.consume_ai(int(u["telegram_id"]))
    if not allowed:
        return jsonify(error="Daily AI limit reached", used=used, limit=10), 429
    try:
        answer = ask(u, question, database.get_schedule(int(u["telegram_id"])), database.get_homework(int(u["telegram_id"])))
        return jsonify(ok=True, answer=answer, used=used, limit=None if u["unlimited_ai"] else 10)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.get("/api/admin/stats")
def admin_stats():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    return jsonify(database.stats())

@app.get("/api/admin/users")
def admin_users():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    return jsonify(items=database.all_users())

@app.post("/api/admin/unlimited")
def admin_unlimited():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    d = request.get_json(silent=True) or {}
    tid = int(d.get("telegram_id",0))
    database.set_unlimited(tid, bool(d.get("enabled")))
    return jsonify(ok=True)

@app.post("/api/admin/add")
def admin_add():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    d = request.get_json(silent=True) or {}
    tid = int(d.get("telegram_id",0))
    c = database.conn()
    c.execute("UPDATE users SET is_admin=1 WHERE telegram_id=?", (tid,))
    c.commit(); c.close()
    return jsonify(ok=True)

@app.errorhandler(404)
def nf(e):
    return jsonify(error="Endpoint not found"), 404

@app.errorhandler(500)
def se(e):
    return jsonify(error="Internal server error"), 500


# ==========================================================
# TELEGRAM SCHEDULE REMINDERS
# ==========================================================

import threading
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from urllib.request import Request, urlopen
from urllib.parse import urlencode

TASHKENT_TZ = ZoneInfo("Asia/Tashkent")
PAIR_REMINDER_MINUTES = 15


def _telegram_send_message(chat_id, text):
    token = os.environ.get("BOT_TOKEN", "").strip()
    if not token:
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = urlencode({
        "chat_id": str(chat_id),
        "text": text,
        "parse_mode": "HTML"
    }).encode()

    try:
        req = Request(url, data=payload, method="POST")
        with urlopen(req, timeout=10) as response:
            return response.status == 200
    except Exception as exc:
        print(f"Telegram reminder error for {chat_id}: {exc}")
        return False


def _schedule_reminder_worker():
    """
    Checks every 30 seconds.
    Schedule times are interpreted as Asia/Tashkent.
    A reminder is sent exactly once when a class is 15 minutes away.
    """
    while True:
        try:
            now = datetime.now(TASHKENT_TZ)
            today = now.date()
            weekday = today.weekday()  # 0=Monday ... 6=Sunday

            c = database.conn()
            rows = c.execute("""
                SELECT u.telegram_id,
                       u.first_name,
                       s.subject,
                       s.start_time,
                       s.room
                FROM users u
                JOIN schedules s ON s.user_id = u.id
                WHERE u.reminders_enabled = 1
                  AND s.day_of_week = ?
            """, (weekday,)).fetchall()
            c.close()

            for row in rows:
                start_text = str(row["start_time"] or "").strip()

                try:
                    start = datetime.strptime(
                        f"{today.isoformat()} {start_text}",
                        "%Y-%m-%d %H:%M"
                    ).replace(tzinfo=TASHKENT_TZ)
                except ValueError:
                    continue

                minutes_left = (start - now).total_seconds() / 60

                # 15-minute reminder window.
                # The 30-second worker interval prevents missing it.
                if 14.0 <= minutes_left <= 15.5:
                    if not database.claim_schedule_reminder(
                        int(row["telegram_id"]),
                        weekday,
                        str(row["subject"] or ""),
                        start_text,
                        today.isoformat()
                    ):
                        continue

                    room = str(row["room"] or "").strip()
                    room_line = f"\n🏫 Аудитория: {room}" if room else ""

                    name = str(row["first_name"] or "Студент")
                    text = (
                        f"🔔 <b>Напоминание о паре</b>\n\n"
                        f"Привет, {name}!\n"
                        f"Через <b>15 минут</b> начинается пара:\n\n"
                        f"📚 <b>{row['subject']}</b>\n"
                        f"🕐 Начало: <b>{start_text}</b>"
                        f"{room_line}\n\n"
                        f"🇺🇿 Время: Ташкент (Asia/Tashkent)"
                    )

                    _telegram_send_message(
                        int(row["telegram_id"]),
                        text
                    )

        except Exception as exc:
            print(f"Schedule reminder worker error: {exc}")

        time.sleep(30)


def _start_schedule_reminder_worker():
    thread = threading.Thread(
        target=_schedule_reminder_worker,
        name="uniuz-schedule-reminders",
        daemon=True
    )
    thread.start()


# Start once when the Flask module is loaded.
_start_schedule_reminder_worker()

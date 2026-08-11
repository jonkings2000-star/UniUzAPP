import base64
import hashlib
import hmac
import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qsl

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI

import database

app = Flask(__name__)
CORS(app)
database.init_db()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

API_VERSION = "2026-08-11-simple"
AI_LIMIT = 10
AI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

UNIVERSITIES = [
    {"id": "ajou", "name": "Ajou", "full_name": "Ajou University in Tashkent"}
]

FACULTIES = [
    "Architecture",
    "Interior Design",
    "Civil Systems Engineering",
    "Electrical & Computer Engineering",
    "AI Software",
    "IT Business",
    "Business Administration",
    "English Philology & Management",
    "Korean Philology & Management",
]

# Telegram Mini App initData validation.
def telegram_user_from_init_data(init_data):
    if not init_data:
        return None
    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        raw_user = pairs.get("user")
        if not raw_user:
            return None
        bot_token = os.getenv("BOT_TOKEN", "")
        if bot_token:
            received_hash = pairs.pop("hash", None)
            if not received_hash:
                return None
            data_check = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
            secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
            calc = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(calc, received_hash):
                return None
        return json.loads(raw_user)
    except Exception as exc:
        print("Telegram auth error:", exc)
        return None


def current_user():
    user = telegram_user_from_init_data(request.headers.get("X-Telegram-Init-Data", ""))
    if not user or not user.get("id"):
        return None
    database.add_user(user["id"], user.get("username"), (user.get("first_name", "") + " " + user.get("last_name", "")).strip())
    return user


def auth():
    user = current_user()
    if not user:
        return None, (jsonify({"error": "Unauthorized"}), 401)
    return user, None


def admin_auth():
    user, err = auth()
    if err:
        return None, err
    if not database.is_admin(user["id"]):
        return None, (jsonify({"error": "Forbidden"}), 403)
    return user, None


def safe_filename(name):
    name = re.sub(r"[^\w.\- ]+", "_", name or "file")
    return name[:120]


def save_upload(file, user_id, prefix):
    if not file or not file.filename:
        return None, None, None
    ext = Path(file.filename).suffix.lower()
    filename = f"{user_id}_{prefix}_{uuid.uuid4().hex}{ext}"
    path = UPLOAD_DIR / filename
    file.save(path)
    return str(path), safe_filename(file.filename), file.mimetype


def ai_json_from_text(text):
    if not ai_client:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    prompt = """Extract a student's weekly university schedule from the text. Return JSON only with key items, an array. Each item: day_of_week (1 Monday..7 Sunday), day_name, start_time HH:MM, end_time HH:MM, subject, room, teacher, notes. Ignore unrelated text. If a field is unknown use an empty string."""
    response = ai_client.chat.completions.create(
        model=AI_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role":"system","content":prompt},{"role":"user","content":text[:30000]}],
    )
    return json.loads(response.choices[0].message.content)


def ai_json_from_image(path, mime):
    if not ai_client:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    data = base64.b64encode(Path(path).read_bytes()).decode()
    data_url = f"data:{mime};base64,{data}"
    prompt = "Extract the weekly university schedule from this image. Return JSON only with key items. Each item: day_of_week 1-7, day_name, start_time HH:MM, end_time HH:MM, subject, room, teacher, notes. Ignore unrelated text."
    response = ai_client.chat.completions.create(
        model=AI_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role":"system","content":prompt},
            {"role":"user","content":[{"type":"text","text":"Parse this schedule."},{"type":"image_url","image_url":{"url":data_url}}]},
        ],
    )
    return json.loads(response.choices[0].message.content)


def extract_pdf_text(path):
    try:
        from pypdf import PdfReader
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""


def ai_chat(user_id, message):
    if not ai_client:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    schedule = [dict(x) for x in database.get_schedule(user_id)]
    homework = [dict(x) for x in database.get_homework(user_id)]
    context = json.dumps({"schedule": schedule, "homework": homework}, ensure_ascii=False)
    system = """You are UniUZ student assistant. Answer in the user's language when possible. Use the student's saved schedule and homework. Be concise and practical. Never invent a class or deadline. If information is missing, say so."""
    response = ai_client.chat.completions.create(
        model=AI_MODEL,
        temperature=0.3,
        messages=[
            {"role":"system","content":system},
            {"role":"system","content":"Student data:\n" + context[:50000]},
            {"role":"user","content":message[:8000]},
        ],
    )
    return response.choices[0].message.content


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "UniUZ API", "version": API_VERSION})


@app.get("/api/me")
def me():
    user, err = auth()
    if err: return err
    profile = database.get_user(user["id"])
    status = database.ai_status(user["id"], AI_LIMIT)
    return jsonify({"ok": True, "user": dict(profile), "is_admin": database.is_admin(user["id"]), "ai": status})


@app.post("/api/language")
def language():
    user, err = auth()
    if err: return err
    lang = (request.get_json(silent=True) or {}).get("language", "ru")
    if lang not in {"ru", "en"}: return jsonify({"error":"Unsupported language"}), 400
    database.set_language(user["id"], lang)
    return jsonify({"ok": True, "language": lang})


@app.get("/api/setup")
def setup():
    user, err = auth()
    if err: return err
    return jsonify({"universities": UNIVERSITIES, "faculties": FACULTIES, "user": dict(database.get_user(user["id"]))})


@app.post("/api/profile")
def profile():
    user, err = auth()
    if err: return err
    data = request.get_json(silent=True) or {}
    university = (data.get("university") or "").strip()
    department = (data.get("department") or "").strip()
    group_name = (data.get("group_name") or "").strip()
    full_name = (data.get("full_name") or "").strip()
    language = data.get("language")
    if university not in {x["id"] for x in UNIVERSITIES}:
        return jsonify({"error":"Choose a university"}), 400
    if department not in FACULTIES:
        return jsonify({"error":"Choose a faculty"}), 400
    if not group_name or len(group_name) > 80:
        return jsonify({"error":"Enter your group"}), 400
    if len(full_name.split()) < 2:
        return jsonify({"error":"Enter first and last name"}), 400
    database.update_profile(user["id"], university, department, group_name, full_name, language)
    return jsonify({"ok": True, "user": dict(database.get_user(user["id"]))})


@app.get("/api/reminders")
def reminders():
    user, err = auth()
    if err: return err
    profile = database.get_user(user["id"])
    return jsonify({"enabled": bool(profile["reminders_enabled"])})


@app.post("/api/reminders")
def reminders_set():
    user, err = auth()
    if err: return err
    enabled = bool((request.get_json(silent=True) or {}).get("enabled", True))
    database.set_reminders(user["id"], enabled)
    return jsonify({"ok": True, "enabled": enabled})


@app.get("/api/schedule")
def schedule():
    user, err = auth()
    if err: return err
    return jsonify({"items": [dict(x) for x in database.get_schedule(user["id"]) ]})


@app.post("/api/schedule/upload")
def schedule_upload():
    user, err = auth()
    if err: return err
    file = request.files.get("file")
    if not file:
        return jsonify({"error":"Upload an image or PDF"}), 400
    path, original, mime = save_upload(file, user["id"], "schedule")
    if not path: return jsonify({"error":"Invalid file"}), 400
    try:
        if mime == "application/pdf" or Path(path).suffix.lower() == ".pdf":
            text = extract_pdf_text(path)
            if not text.strip():
                return jsonify({"error":"Could not read this PDF"}), 400
            parsed = ai_json_from_text(text)
        elif mime and mime.startswith("image/"):
            parsed = ai_json_from_image(path, mime)
        else:
            return jsonify({"error":"Use JPG, PNG or PDF"}), 400
        items = parsed.get("items", [])
        valid=[]
        for x in items:
            if x.get("subject") and x.get("start_time"):
                valid.append(x)
        if not valid:
            return jsonify({"error":"No schedule entries found"}), 400
        database.clear_schedule(user["id"])
        fid = database.save_schedule_file(user["id"], original, mime, path)
        database.add_schedule_items(user["id"], valid, fid)
        return jsonify({"ok": True, "items": [dict(x) for x in database.get_schedule(user["id"]) ]})
    except Exception as exc:
        print("Schedule parse error:", exc)
        return jsonify({"error": str(exc)}), 500


@app.get("/api/homework")
def homework():
    user, err = auth()
    if err: return err
    return jsonify({"items": [dict(x) for x in database.get_homework(user["id"]) ]})


@app.post("/api/homework")
def homework_create():
    user, err = auth()
    if err: return err
    title=(request.form.get("title") or "").strip()
    description=(request.form.get("description") or "").strip()
    due_at=(request.form.get("due_at") or "").strip()
    if not title or not due_at:
        return jsonify({"error":"Title and due date are required"}), 400
    file=request.files.get("file")
    path=original=mime=None
    if file and file.filename:
        path, original, mime = save_upload(file, user["id"], "homework")
    hid=database.add_homework(user["id"], title, description, due_at, path, original, mime)
    return jsonify({"ok":True,"id":hid})


@app.patch("/api/homework/<int:homework_id>")
def homework_done(homework_id):
    user, err = auth()
    if err: return err
    completed=bool((request.get_json(silent=True) or {}).get("completed", True))
    database.set_homework_completed(user["id"], homework_id, completed)
    return jsonify({"ok":True})


@app.delete("/api/homework/<int:homework_id>")
def homework_delete(homework_id):
    user, err = auth()
    if err: return err
    row=database.get_homework_item(user["id"], homework_id)
    if row and row["file_path"]:
        try: Path(row["file_path"]).unlink(missing_ok=True)
        except Exception: pass
    database.delete_homework(user["id"], homework_id)
    return jsonify({"ok":True})


@app.get("/api/ai/usage")
def ai_usage():
    user, err=auth()
    if err: return err
    return jsonify(database.ai_status(user["id"], AI_LIMIT))


@app.post("/api/ai")
def ai():
    user, err=auth()
    if err: return err
    message=(request.get_json(silent=True) or {}).get("message", "").strip()
    if not message: return jsonify({"error":"Message is required"}), 400
    if not database.ai_can_use(user["id"], AI_LIMIT):
        status = database.ai_status(user["id"], AI_LIMIT)
        return jsonify({"error":"Daily AI limit reached", "used":status["used"], "limit":AI_LIMIT}), 429
    try:
        answer=ai_chat(user["id"], message)
        database.consume_ai(user["id"], AI_LIMIT)
        return jsonify({"ok":True,"answer":answer,"usage":database.ai_status(user["id"],AI_LIMIT)})
    except Exception as exc:
        print("AI error:",exc)
        return jsonify({"error":"AI is temporarily unavailable"}), 500


@app.get("/api/admin/stats")
def admin_stats():
    user, err=admin_auth()
    if err: return err
    return jsonify(database.stats())


@app.get("/api/admin/users")
def admin_users():
    user, err=admin_auth()
    if err: return err
    q=request.args.get("q", "")
    rows=database.list_users(q=q)
    return jsonify({"items":[dict(x) for x in rows]})


@app.post("/api/admin/users/<int:user_id>/unlimited-ai")
def admin_unlimited(user_id):
    user, err=admin_auth()
    if err: return err
    enabled=bool((request.get_json(silent=True) or {}).get("enabled", True))
    if not database.get_user(user_id): return jsonify({"error":"User not found"}),404
    database.set_ai_unlimited(user_id, enabled)
    return jsonify({"ok":True,"enabled":enabled})


@app.post("/api/admin/admins")
def admin_add():
    user, err=admin_auth()
    if err: return err
    telegram_id=int((request.get_json(silent=True) or {}).get("telegram_id",0))
    if not telegram_id: return jsonify({"error":"Telegram ID is required"}),400
    database.add_admin(telegram_id,user["id"])
    return jsonify({"ok":True})


@app.get("/api/admin/admins")
def admins():
    user, err=admin_auth()
    if err: return err
    return jsonify({"items":[dict(x) for x in database.get_admins()]})


@app.delete("/api/admin/admins/<int:telegram_id>")
def admin_remove(telegram_id):
    user, err=admin_auth()
    if err: return err
    if telegram_id == user["id"]:
        return jsonify({"error":"You cannot remove yourself"}),400
    database.remove_admin(telegram_id)
    return jsonify({"ok":True})


@app.errorhandler(404)
def not_found(_):
    return jsonify({"error":"Endpoint not found"}),404


@app.errorhandler(500)
def server_error(exc):
    print("500:",exc)
    return jsonify({"error":"Internal server error"}),500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT","8080")))

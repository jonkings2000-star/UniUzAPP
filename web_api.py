import os, json, hmac, hashlib, uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qsl
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import database
from ai_service import ask, extract_schedule_from_image, extract_schedule_from_pdf

BASE = os.path.dirname(os.path.abspath(__file__))
UPLOADS = os.path.join(BASE, "uploads")
os.makedirs(UPLOADS, exist_ok=True)

app = Flask(__name__, static_folder=BASE, static_url_path="")
CORS(app)
database.init_db()


# ============================================================
# AI PAYMENT REQUESTS / SUBSCRIPTIONS
# ============================================================
PAYMENTS_DIR = os.path.join(UPLOADS, "ai_payments")
os.makedirs(PAYMENTS_DIR, exist_ok=True)


def init_payment_tables():
    c = database.conn()
    c.execute("""
        CREATE TABLE IF NOT EXISTS ai_payment_requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER NOT NULL,
            amount INTEGER NOT NULL DEFAULT 19900,
            currency TEXT NOT NULL DEFAULT 'UZS',
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            telegram_message_id INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TEXT,
            reviewed_by INTEGER,
            expires_at TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS ai_subscriptions(
            telegram_id INTEGER PRIMARY KEY,
            expires_at TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.commit()
    c.close()


def sync_ai_subscription(u):
    """Expire paid AI only; manually granted unlimited_ai without a subscription stays active."""
    if not u or not bool(u["unlimited_ai"]):
        return u
    c = database.conn()
    row = c.execute(
        "SELECT expires_at FROM ai_subscriptions WHERE telegram_id=?",
        (int(u["telegram_id"]),)
    ).fetchone()
    c.close()
    if row and row["expires_at"] <= datetime.now(timezone.utc).isoformat():
        database.set_unlimited(int(u["telegram_id"]), False)
        return database.get_user(int(u["telegram_id"]))
    return u


init_payment_tables()

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
    row = database.create_or_update_user(u)
    return sync_ai_subscription(row)

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

@app.get("/api/ai/status")
def ai_status():
    u = user_required()
    if not u:
        return jsonify(error="Unauthorized"), 401
    from datetime import date
    today = date.today().isoformat()
    used = int(u["ai_used_count"] or 0) if u["ai_used_date"] == today else 0
    return jsonify(
        ok=True,
        used=used,
        limit=None if u["unlimited_ai"] else 10
    )


@app.get("/api/ai/payment-info")
def ai_payment_info():
    u = user_required()
    if not u:
        return jsonify(error="Unauthorized"), 401

    card = os.environ.get("AI_PAYMENT_CARD", "").strip()
    if not card:
        return jsonify(error="Payment card is not configured by administrator"), 503

    return jsonify(
        ok=True,
        price=19900,
        currency="UZS",
        card_number=card
    )


def _get_payment_admin_chat_id():
    """Return the Telegram chat id where payment receipts must be sent.

    Priority:
    1) ADMIN_CHAT_ID
    2) ADMIN_ID
    3) first user marked as admin in the UniUZ database
    """
    explicit = (
        os.environ.get("ADMIN_CHAT_ID", "").strip()
        or os.environ.get("ADMIN_ID", "").strip()
    )
    if explicit:
        return explicit

    try:
        conn = database.conn()
        row = conn.execute(
            "SELECT telegram_id FROM users WHERE is_admin=1 ORDER BY telegram_id LIMIT 1"
        ).fetchone()
        conn.close()
        if row:
            return str(row[0])
    except Exception as e:
        print("payment admin lookup error:", e)

    return ""


def _telegram_multipart_request(method, chat_id, file_storage, caption):
    """Send a receipt to Telegram using the Bot API."""
    import uuid
    import urllib.request
    import urllib.error

    bot_token = os.environ.get("BOT_TOKEN", "").strip()
    if not bot_token:
        raise RuntimeError("BOT_TOKEN is not configured")

    filename = os.path.basename(file_storage.filename or f"receipt-{uuid.uuid4().hex}.bin")
    content = file_storage.read()
    if not content:
        raise RuntimeError("The uploaded receipt is empty")

    boundary = "----UniUZReceiptBoundary" + uuid.uuid4().hex

    def field(name, value):
        return (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n"
        ).encode("utf-8")

    body = []
    body.append(field("chat_id", chat_id))
    body.append(field("caption", caption))
    body.append(field("parse_mode", "HTML"))

    mime = file_storage.mimetype or "application/octet-stream"
    body.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{method}"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n"
        ).encode("utf-8")
    )
    body.append(content)
    body.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    url = f"https://api.telegram.org/bot{bot_token}/{method}"
    req = urllib.request.Request(
        url,
        data=b"".join(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Telegram HTTP {e.code}: {raw}") from e
    except Exception as e:
        raise RuntimeError(f"Telegram request failed: {e}") from e

    try:
        result = json.loads(raw)
    except Exception as e:
        raise RuntimeError(f"Invalid Telegram response: {raw[:500]}") from e

    if not result.get("ok"):
        raise RuntimeError(
            f"Telegram rejected receipt: {result.get('description', 'unknown error')}"
        )

    return result


def _send_receipt_to_admin(file_storage, user):
    admin_chat_id = _get_payment_admin_chat_id()
    if not admin_chat_id:
        raise RuntimeError(
            "Admin chat is not configured. Set ADMIN_ID or ADMIN_CHAT_ID in Railway Variables."
        )

    caption = (
        "💳 <b>Новый чек на UniUZ AI</b>\n\n"
        f"👤 {user.get('first_name', '')} {user.get('last_name', '')}\n"
        f"🆔 Telegram ID: <code>{user.get('telegram_id')}</code>\n"
        f"💰 Сумма: <b>19 900 UZS</b>\n"
        "📌 Требуется проверка оплаты."
    )

    filename = (file_storage.filename or "").lower()
    method = "sendDocument" if filename.endswith(".pdf") else "sendPhoto"

    # Telegram's sendPhoto expects the field name `photo`, while sendDocument expects `document`.
    return _telegram_multipart_request(
        "photo" if method == "sendPhoto" else "document",
        admin_chat_id,
        file_storage,
        caption,
    )


@app.post("/api/ai/payment-receipt")
def ai_payment_receipt():
    u = user_required()
    if not u:
        return jsonify(error="Unauthorized"), 401

    receipt = request.files.get("receipt")
    if not receipt:
        return jsonify(error="Receipt file required"), 400

    filename = os.path.basename(receipt.filename or "receipt")
    lower = filename.lower()
    allowed = lower.endswith((".pdf", ".png", ".jpg", ".jpeg", ".webp"))
    if not allowed:
        return jsonify(error="Receipt must be PDF, PNG, JPG or WEBP"), 400
    if request.content_length and request.content_length > 12 * 1024 * 1024:
        return jsonify(error="Receipt must be no larger than 10 MB"), 400

    c = database.conn()
    pending = c.execute(
        "SELECT id FROM ai_payment_requests WHERE telegram_id=? AND status='pending' ORDER BY id DESC LIMIT 1",
        (int(u["telegram_id"]),)
    ).fetchone()
    c.close()
    if pending:
        return jsonify(error="У вас уже есть чек на проверке администратором."), 409

    ext = os.path.splitext(filename)[1].lower() or ".bin"
    stored_name = f"{int(u['telegram_id'])}_{uuid.uuid4().hex}{ext}"
    path = os.path.join(PAYMENTS_DIR, stored_name)
    try:
        receipt.save(path)
        caption = (
            "💳 <b>Новый чек на UniUZ AI</b>\n\n"
            f"👤 {u.get('first_name','')} {u.get('last_name','')}\n"
            f"🆔 Telegram ID: <code>{u.get('telegram_id')}</code>\n"
            f"💰 Сумма: <b>19 900 UZS</b>\n"
            "📌 Проверьте чек в админ-панели и примите решение."
        )
        # Re-open because Telegram sender consumes the stream.
        with open(path, "rb") as fp:
            class StoredFile:
                filename = filename
                mimetype = receipt.mimetype or "application/octet-stream"
                def read(self):
                    return fp.read()
            result = _send_receipt_to_admin(StoredFile(), u)

        msg_id = ((result or {}).get("result") or {}).get("message_id")
        c = database.conn()
        cur = c.execute("""
            INSERT INTO ai_payment_requests
            (telegram_id, amount, currency, filename, file_path, status, telegram_message_id)
            VALUES(?,?,?,?,?,?,?)
        """, (int(u["telegram_id"]), 19900, "UZS", filename, path, "pending", msg_id))
        c.commit(); c.close()
    except Exception as e:
        try:
            if os.path.exists(path): os.remove(path)
        except Exception:
            pass
        print("Payment receipt error:", e)
        return jsonify(error="Не удалось отправить чек администратору"), 500

    return jsonify(
        ok=True,
        message="Чек отправлен администратору. После проверки вам включат безлимитный UniUZ AI."
    )


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

@app.get("/api/admin/payments")
def admin_payments():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    c = database.conn()
    rows = c.execute("""
        SELECT p.*, u.first_name, u.last_name, u.username, u.department, u.group_name
        FROM ai_payment_requests p
        LEFT JOIN users u ON u.telegram_id=p.telegram_id
        ORDER BY CASE WHEN p.status='pending' THEN 0 ELSE 1 END, p.id DESC
        LIMIT 100
    """).fetchall()
    c.close()
    items=[]
    for r in rows:
        items.append({
            "id": r["id"], "telegram_id": r["telegram_id"], "amount": r["amount"],
            "currency": r["currency"], "filename": r["filename"], "status": r["status"],
            "created_at": r["created_at"], "reviewed_at": r["reviewed_at"],
            "expires_at": r["expires_at"], "first_name": r["first_name"] or "",
            "last_name": r["last_name"] or "", "username": r["username"] or "",
            "department": r["department"] or "", "group_name": r["group_name"] or ""
        })
    return jsonify(items=items)


@app.get("/api/admin/payments/<int:payment_id>/receipt")
def admin_payment_receipt(payment_id):
    if not admin_required(): return jsonify(error="Forbidden"), 403
    c = database.conn()
    row = c.execute("SELECT file_path, filename FROM ai_payment_requests WHERE id=?", (payment_id,)).fetchone()
    c.close()
    if not row or not os.path.isfile(row["file_path"]):
        return jsonify(error="Receipt not found"), 404
    return send_file(row["file_path"], download_name=row["filename"], as_attachment=False)


def _notify_user(chat_id, text):
    import urllib.request
    import urllib.parse
    token = os.environ.get("BOT_TOKEN", "").strip()
    if not token: return
    data = urllib.parse.urlencode({"chat_id": str(chat_id), "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=data, method="POST")
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        print("notify user:", e)


@app.post("/api/admin/payments/<int:payment_id>/approve")
def admin_payment_approve(payment_id):
    admin = admin_required()
    if not admin: return jsonify(error="Forbidden"), 403
    c = database.conn()
    row = c.execute("SELECT * FROM ai_payment_requests WHERE id=?", (payment_id,)).fetchone()
    if not row: c.close(); return jsonify(error="Payment not found"), 404
    if row["status"] != "pending": c.close(); return jsonify(error="Payment already reviewed"), 409
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    exp = expires.isoformat()
    c.execute("UPDATE ai_payment_requests SET status='approved', reviewed_at=?, reviewed_by=?, expires_at=? WHERE id=?",
              (datetime.now(timezone.utc).isoformat(), int(admin["telegram_id"]), exp, payment_id))
    c.execute("INSERT INTO ai_subscriptions(telegram_id, expires_at, updated_at) VALUES(?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET expires_at=excluded.expires_at, updated_at=excluded.updated_at",
              (int(row["telegram_id"]), exp, datetime.now(timezone.utc).isoformat()))
    c.commit(); c.close()
    database.set_unlimited(int(row["telegram_id"]), True)
    _notify_user(int(row["telegram_id"]), "✅ <b>Оплата подтверждена!</b>\n\nБезлимитный UniUZ AI активирован на 30 дней.\nДата окончания: <b>" + expires.astimezone(timezone.utc).strftime("%d.%m.%Y %H:%M UTC") + "</b>.")
    return jsonify(ok=True, expires_at=exp)


@app.post("/api/admin/payments/<int:payment_id>/reject")
def admin_payment_reject(payment_id):
    admin = admin_required()
    if not admin: return jsonify(error="Forbidden"), 403
    c = database.conn()
    row = c.execute("SELECT * FROM ai_payment_requests WHERE id=?", (payment_id,)).fetchone()
    if not row: c.close(); return jsonify(error="Payment not found"), 404
    if row["status"] != "pending": c.close(); return jsonify(error="Payment already reviewed"), 409
    c.execute("UPDATE ai_payment_requests SET status='rejected', reviewed_at=?, reviewed_by=? WHERE id=?",
              (datetime.now(timezone.utc).isoformat(), int(admin["telegram_id"]), payment_id))
    c.commit(); c.close()
    _notify_user(int(row["telegram_id"]), "❌ <b>Чек не подтверждён.</b>\n\nПроверьте сумму и данные оплаты и при необходимости отправьте новый чек.")
    return jsonify(ok=True)


@app.get("/api/admin/stats")
def admin_stats():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    stats = database.stats()
    c = database.conn()
    stats["pending_payments"] = c.execute("SELECT COUNT(*) FROM ai_payment_requests WHERE status='pending'").fetchone()[0]
    stats["approved_payments"] = c.execute("SELECT COUNT(*) FROM ai_payment_requests WHERE status='approved'").fetchone()[0]
    c.close()
    return jsonify(stats)

@app.get("/api/admin/users")
def admin_users():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    return jsonify(items=database.all_users())

@app.post("/api/admin/unlimited")
def admin_unlimited():
    if not admin_required(): return jsonify(error="Forbidden"), 403
    d = request.get_json(silent=True) or {}
    tid = int(d.get("telegram_id",0))
    enabled = bool(d.get("enabled"))
    database.set_unlimited(tid, enabled)
    if not enabled:
        c = database.conn(); c.execute("DELETE FROM ai_subscriptions WHERE telegram_id=?", (tid,)); c.commit(); c.close()
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

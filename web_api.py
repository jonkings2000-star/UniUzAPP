import os
import json
import hmac
import hashlib
import urllib.parse
from datetime import datetime, timezone

from flask import Flask, request, jsonify

import database


# ============================================================
# APP
# ============================================================

app = Flask(__name__)

database.init_db()


# ============================================================
# CONFIG
# ============================================================

BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    print("WARNING: BOT_TOKEN is not set.")


# ============================================================
# TELEGRAM INIT DATA
# ============================================================

def validate_telegram_init_data(init_data: str):
    """
    Проверяет Telegram WebApp initData.

    Возвращает Telegram user dict,
    если подпись правильная.

    Возвращает None, если данные недействительны.
    """

    if not init_data:
        return None

    if not BOT_TOKEN:
        return None

    try:
        parsed = urllib.parse.parse_qsl(
            init_data,
            keep_blank_values=True
        )

        data = dict(parsed)

        received_hash = data.pop("hash", None)

        if not received_hash:
            return None

        # Telegram WebApp secret key
        secret_key = hmac.new(
            b"WebAppData",
            BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()

        # data-check-string
        data_check_string = "\n".join(
            f"{key}={data[key]}"
            for key in sorted(data.keys())
        )

        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(
            calculated_hash,
            received_hash
        ):
            return None

        user_json = data.get("user")

        if not user_json:
            return None

        telegram_user = json.loads(
            urllib.parse.unquote(user_json)
        )

        return telegram_user

    except Exception as exc:
        print(
            f"Telegram initData validation error: {exc}"
        )
        return None


# ============================================================
# AUTH
# ============================================================

def get_telegram_user():
    """
    Получает и проверяет Telegram пользователя
    из заголовка X-Telegram-Init-Data.
    """

    init_data = request.headers.get(
        "X-Telegram-Init-Data",
        ""
    )

    return validate_telegram_init_data(
        init_data
    )


def require_user():
    """
    Проверяет пользователя.

    Возвращает:
        telegram_user

    или:
        None
    """

    telegram_user = get_telegram_user()

    if not telegram_user:
        return None

    user_id = telegram_user.get("id")

    if not user_id:
        return None

    return telegram_user


# ============================================================
# HELPERS
# ============================================================

def teacher_status(telegram_id):
    teacher = database.get_teacher(
        telegram_id
    )

    if not teacher:
        return None

    return teacher["status"]


def serialize_teacher(teacher):
    if not teacher:
        return None

    return {
        "telegram_id": teacher["telegram_id"],
        "full_name": teacher["full_name"],
        "status": teacher["status"],
        "created_at": teacher["created_at"],
    }


def serialize_user(user):
    if not user:
        return None

    return {
        "id": user["id"],
        "username": user["username"],
        "full_name": user["full_name"],
        "university": user["university"],
        "department": user["department"],
        "group_name": user["group_name"],
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "service": "UniUZ API",
        "time": datetime.now(
            timezone.utc
        ).isoformat()
    })


# ============================================================
# PROFILE
# ============================================================

@app.get("/api/me")
def api_me():

    telegram_user = require_user()

    if not telegram_user:
        return jsonify({
            "ok": False,
            "error": "Unauthorized"
        }), 401

    telegram_id = telegram_user["id"]

    # Сохраняем/обновляем пользователя
    database.add_user(
        telegram_id,
        telegram_user.get("username"),
        (
            telegram_user.get("first_name", "")
            + " "
            + telegram_user.get("last_name", "")
        ).strip()
    )

    user = database.get_user(
        telegram_id
    )

    teacher = database.get_teacher(
        telegram_id
    )

    status = (
        teacher["status"]
        if teacher
        else None
    )

    # ВАЖНО:
    # teacher только если approved
    role = (
        "teacher"
        if status == "approved"
        else "student"
    )

    return jsonify({
        "ok": True,

        "telegram_user": telegram_user,

        "profile": serialize_user(
            user
        ),

        "role": role,

        "teacher": serialize_teacher(
            teacher
        ),

        "teacher_status": status,

        "is_teacher": (
            status == "approved"
        )
    })


# ============================================================
# TEACHER STATUS
# ============================================================

@app.get("/api/teacher/status")
def teacher_status_api():

    telegram_user = require_user()

    if not telegram_user:
        return jsonify({
            "ok": False,
            "error": "Unauthorized"
        }), 401

    telegram_id = telegram_user["id"]

    teacher = database.get_teacher(
        telegram_id
    )

    if not teacher:
        return jsonify({
            "ok": True,
            "exists": False,
            "status": None,
            "is_teacher": False
        })

    return jsonify({
        "ok": True,
        "exists": True,
        "status": teacher["status"],
        "is_teacher": (
            teacher["status"] == "approved"
        ),
        "teacher": serialize_teacher(
            teacher
        )
    })


# ============================================================
# TEACHER REQUEST
# ============================================================

@app.post("/api/teacher/request")
def teacher_request():

    telegram_user = require_user()

    if not telegram_user:
        return jsonify({
            "ok": False,
            "error": "Unauthorized"
        }), 401

    telegram_id = telegram_user["id"]

    # Telegram имя
    first_name = (
        telegram_user.get("first_name")
        or ""
    )

    last_name = (
        telegram_user.get("last_name")
        or ""
    )

    telegram_full_name = (
        f"{first_name} {last_name}"
    ).strip()

    # Если Telegram имени нет
    if not telegram_full_name:
        telegram_full_name = (
            telegram_user.get("username")
            or "Unknown"
        )

    # Проверяем существующую заявку
    teacher = database.get_teacher(
        telegram_id
    )

    if teacher:

        # Уже одобрен
        if teacher["status"] == "approved":
            return jsonify({
                "ok": True,
                "status": "approved",
                "message": (
                    "Ты уже зарегистрирован "
                    "как преподаватель."
                )
            })

        # Заявка уже ожидает
        if teacher["status"] == "pending":
            return jsonify({
                "ok": True,
                "status": "pending",
                "message": (
                    "Заявка уже отправлена "
                    "и ожидает одобрения."
                )
            })

        # rejected
        if teacher["status"] == "rejected":
            database.add_teacher_request(
                telegram_id,
                telegram_full_name
            )

            return jsonify({
                "ok": True,
                "status": "pending",
                "message": (
                    "Новая заявка отправлена "
                    "администратору."
                )
            })

    # Новая заявка
    database.add_teacher_request(
        telegram_id,
        telegram_full_name
    )

    return jsonify({
        "ok": True,
        "status": "pending",
        "message": (
            "Заявка отправлена "
            "администратору."
        )
    }), 201


# ============================================================
# HOMEWORK
# ============================================================

@app.get("/api/homework")
def api_homework():

    telegram_user = require_user()

    if not telegram_user:
        return jsonify({
            "ok": False,
            "error": "Unauthorized"
        }), 401

    telegram_id = telegram_user["id"]

    user = database.get_user(
        telegram_id
    )

    if not user:
        return jsonify({
            "ok": True,
            "items": []
        })

    department = user["department"]
    group_name = user["group_name"]

    if not department or not group_name:
        return jsonify({
            "ok": True,
            "items": []
        })

    rows = database.get_student_homework(
        department,
        group_name
    )

    items = []

    for row in rows:
        items.append({
            "id": row["id"],
            "teacher_id": row["teacher_id"],
            "department": row["department"],
            "group_name": row["group_name"],
            "subject_name": row["subject_name"],
            "task_text": row["task_text"],
            "homework_date": row["homework_date"],
            "homework_time": row["homework_time"],
            "file_id": row["file_id"],
            "file_type": row["file_type"],
            "created_at": row["created_at"],
        })

    return jsonify({
        "ok": True,
        "items": items
    })


# ============================================================
# ANNOUNCEMENTS
# ============================================================

@app.get("/api/announcements")
def api_announcements():

    telegram_user = require_user()

    if not telegram_user:
        return jsonify({
            "ok": False,
            "error": "Unauthorized"
        }), 401

    telegram_id = telegram_user["id"]

    user = database.get_user(
        telegram_id
    )

    if not user:
        return jsonify({
            "ok": True,
            "items": []
        })

    department = user["department"]
    group_name = user["group_name"]

    if not department or not group_name:
        return jsonify({
            "ok": True,
            "items": []
        })

    rows = database.get_student_announcements(
        department,
        group_name
    )

    items = []

    for row in rows:
        items.append({
            "id": row["id"],
            "teacher_id": row["teacher_id"],
            "department": row["department"],
            "group_name": row["group_name"],
            "title": row["title"],
            "message": row["message"],
            "file_id": row["file_id"],
            "file_type": row["file_type"],
            "created_at": row["created_at"],
        })

    return jsonify({
        "ok": True,
        "items": items
    })


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "ok": False,
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):

    print(
        f"Internal server error: {error}"
    )

    return jsonify({
        "ok": False,
        "error": "Internal server error"
    }), 500


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    port = int(
        os.getenv(
            "PORT",
            "8000"
        )
    )

    print(
        "UniUZ API started"
    )

    print(
        f"Port: {port}"
    )

    app.run(
        host="0.0.0.0",
        port=port
    )

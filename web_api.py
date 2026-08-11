# ==========================================================
# UniUZ API
# Flask backend for the Telegram Mini App
# ==========================================================

import json
import os
from urllib.parse import parse_qs
from urllib.request import Request as URLRequest, urlopen
from urllib.error import HTTPError, URLError

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

import database

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


app = Flask(__name__)
CORS(app)
database.init_db()


# ==========================================================
# APP FACTORY
# ==========================================================

def create_app():
    return app


# ==========================================================
# TELEGRAM AUTH
# ==========================================================

def get_telegram_user():
    init_data = request.headers.get("X-Telegram-Init-Data", "").strip()

    if not init_data:
        return None

    try:
        values = parse_qs(init_data)
        raw_user = values.get("user")

        if not raw_user:
            return None

        return json.loads(raw_user[0])

    except Exception as exc:
        print("Telegram auth parse error:", exc)
        return None


def require_user():
    user = get_telegram_user()

    if not user or not user.get("id"):
        return None

    database.add_user(
        user_id=user["id"],
        username=user.get("username"),
        full_name=(
            user.get("first_name", "")
            + " "
            + user.get("last_name", "")
        ).strip()
    )

    return user


def require_admin():
    user = require_user()

    if not user:
        return None

    if not database.is_admin(user["id"]):
        return None

    return user


def require_teacher():
    user = require_user()

    if not user:
        return None

    teacher = database.get_teacher(user["id"])

    if not teacher or teacher["status"] != "approved":
        return None

    return user


# ==========================================================
# HELPERS
# ==========================================================

def json_rows(rows):
    return [dict(row) for row in rows]


def telegram_api(method, payload):
    token = os.getenv("BOT_TOKEN")

    if not token:
        return False, "BOT_TOKEN is not configured"

    url = f"https://api.telegram.org/bot{token}/{method}"

    try:
        body = json.dumps(payload).encode("utf-8")
        req = URLRequest(
            url,
            data=body,
            headers={
                "Content-Type": "application/json"
            },
            method="POST"
        )

        with urlopen(req, timeout=15) as response:
            data = json.loads(
                response.read().decode("utf-8")
            )

        if data.get("ok"):
            return True, data

        return False, data.get("description", "Telegram API error")

    except (HTTPError, URLError, TimeoutError) as exc:
        return False, str(exc)
    except Exception as exc:
        return False, str(exc)


def notify_students(
    department,
    group_names,
    title,
    message,
    file_id=None,
    file_type=None
):
    students = database.get_students_by_groups(
        department,
        group_names
    )

    sent = 0
    failed = 0

    for student in students:
        telegram_id = student["id"]

        text = (
            f"📢 <b>{title}</b>\n\n"
            f"{message}\n\n"
            f"👥 {student['group_name']}"
        )

        ok, _ = telegram_api(
            "sendMessage",
            {
                "chat_id": telegram_id,
                "text": text,
                "parse_mode": "HTML"
            }
        )

        if ok:
            sent += 1
        else:
            failed += 1

        if ok and file_id:
            if file_type == "photo":
                telegram_api(
                    "sendPhoto",
                    {
                        "chat_id": telegram_id,
                        "photo": file_id
                    }
                )
            elif file_type == "document":
                telegram_api(
                    "sendDocument",
                    {
                        "chat_id": telegram_id,
                        "document": file_id
                    }
                )

    return {
        "students": len(students),
        "sent": sent,
        "failed": failed
    }


def get_valid_groups(department, groups):
    available = set(database.get_groups(department))

    result = []
    for group in groups or []:
        group = str(group).strip()
        if group and group in available and group not in result:
            result.append(group)

    return result


# ==========================================================
# VERSION
# ==========================================================

@app.get("/api/version")
def version():
    return jsonify({
        "ok": True,
        "service": "UniUZ API",
        "version": "2026-08-11-v3"
    })


# ==========================================================
# HEALTH
# ==========================================================

@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "service": "UniUZ API",
        "status": "online"
    })


# ==========================================================
# PROFILE
# ==========================================================

@app.get("/api/me")
def me():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    profile = database.get_user(user["id"])
    teacher = database.get_teacher(user["id"])

    return jsonify({
        "ok": True,
        "telegram": user,
        "telegram_user": user,
        "profile": dict(profile) if profile else None,
        "teacher_status": (
            teacher["status"] if teacher else None
        ),
        "teacher": (
            dict(teacher) if teacher else None
        ),
        "is_admin": database.is_admin(user["id"])
    })


@app.get("/api/departments")
def get_departments():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT department
        FROM groups
        WHERE department IS NOT NULL
        AND TRIM(department) != ''
        ORDER BY department
    """)

    rows = cur.fetchall()
    conn.close()

    return jsonify({
        "items": [row["department"] for row in rows]
    })


@app.get("/api/groups")
def get_groups():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    department = request.args.get("department", "").strip()

    if not department:
        return jsonify({
            "error": "Department is required"
        }), 400

    return jsonify({
        "items": database.get_groups(department)
    })


@app.post("/api/profile")
def save_profile():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}

    university = data.get("university")
    department = str(data.get("department") or "").strip()
    group_name = str(data.get("group_name") or "").strip()
    role = str(data.get("role") or "student").strip()

    if role not in {"student", "teacher"}:
        role = "student"

    if not department:
        return jsonify({
            "error": "Department is required"
        }), 400

    if not group_name:
        return jsonify({
            "error": "Group is required"
        }), 400

    if group_name not in database.get_groups(department):
        return jsonify({
            "error": "Group not found"
        }), 400

    database.update_user(
        user_id=user["id"],
        university=university,
        department=department,
        group_name=group_name,
        role=role
    )

    profile = database.get_user(user["id"])

    return jsonify({
        "ok": True,
        "profile": dict(profile) if profile else None
    })


# ==========================================================
# TEACHER REQUEST / STATUS
# ==========================================================

@app.post("/api/teacher/request")
def teacher_request():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    existing = database.get_teacher(user["id"])

    if existing:
        return jsonify({
            "ok": True,
            "status": existing["status"]
        })

    database.add_teacher_request(
        telegram_id=user["id"],
        full_name=(
            user.get("first_name", "")
            + " "
            + user.get("last_name", "")
        ).strip()
    )

    return jsonify({
        "ok": True,
        "status": "pending"
    })


@app.get("/api/teacher/status")
def teacher_status():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    teacher = database.get_teacher(user["id"])

    return jsonify({
        "ok": True,
        "status": (
            teacher["status"]
            if teacher else "none"
        )
    })


# ==========================================================
# ADMIN - TEACHER REQUESTS
# ==========================================================

@app.get("/api/admin/teacher-requests")
def admin_teacher_requests():
    if not require_admin():
        return jsonify({"error": "Forbidden"}), 403

    rows = database.get_pending_teachers()

    return jsonify({
        "items": json_rows(rows)
    })


@app.post("/api/admin/teacher/<int:telegram_id>/approve")
def approve_teacher(telegram_id):
    if not require_admin():
        return jsonify({"error": "Forbidden"}), 403

    database.approve_teacher(telegram_id)

    return jsonify({"ok": True})


@app.post("/api/admin/teacher/<int:telegram_id>/reject")
def reject_teacher(telegram_id):
    if not require_admin():
        return jsonify({"error": "Forbidden"}), 403

    database.reject_teacher(telegram_id)

    return jsonify({"ok": True})


# ==========================================================
# ADMIN - STATISTICS
# ==========================================================

@app.get("/api/admin/statistics")
def admin_statistics():
    if not require_admin():
        return jsonify({"error": "Forbidden"}), 403

    return jsonify({
        "stats": database.get_statistics()
    })


# ==========================================================
# ADMIN - USERS
# ==========================================================

@app.get("/api/admin/users")
def admin_users():
    if not require_admin():
        return jsonify({"error": "Forbidden"}), 403

    limit = min(
        max(int(request.args.get("limit", 200)), 1),
        500
    )
    offset = max(
        int(request.args.get("offset", 0)),
        0
    )

    rows = database.get_users(
        limit=limit,
        offset=offset
    )

    return jsonify({
        "items": json_rows(rows)
    })


@app.post("/api/admin/users/<int:user_id>/role")
def admin_user_role(user_id):
    if not require_admin():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    role = str(data.get("role") or "student").strip()

    if role not in {"student", "teacher", "admin"}:
        return jsonify({
            "error": "Invalid role"
        }), 400

    if role == "admin":
        database.add_admin(
            user_id,
            added_by=get_telegram_user()["id"]
        )
        database.update_user_role(user_id, "admin")
    else:
        database.update_user_role(
            user_id,
            role
        )
        database.remove_admin(
            user_id,
            requester_id=get_telegram_user()["id"]
        )

    return jsonify({"ok": True})


@app.delete("/api/admin/users/<int:user_id>")
def admin_delete_user(user_id):
    admin = require_admin()

    if not admin:
        return jsonify({"error": "Forbidden"}), 403

    if user_id == admin["id"]:
        return jsonify({
            "error": "You cannot delete yourself"
        }), 400

    database.delete_user(user_id)

    return jsonify({"ok": True})


# ==========================================================
# ADMIN - MANAGE ADMINS
# ==========================================================

@app.get("/api/admin/admins")
def admin_list_admins():
    if not require_admin():
        return jsonify({"error": "Forbidden"}), 403

    return jsonify({
        "items": json_rows(database.get_admins())
    })


@app.post("/api/admin/admins")
def admin_add_admin():
    admin = require_admin()

    if not admin:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}

    try:
        telegram_id = int(data.get("telegram_id"))
    except (TypeError, ValueError):
        return jsonify({
            "error": "Telegram ID is required"
        }), 400

    added = database.add_admin(
        telegram_id,
        added_by=admin["id"]
    )

    return jsonify({
        "ok": True,
        "added": added
    })


@app.delete("/api/admin/admins/<int:telegram_id>")
def admin_remove_admin(telegram_id):
    admin = require_admin()

    if not admin:
        return jsonify({"error": "Forbidden"}), 403

    if telegram_id == admin["id"]:
        return jsonify({
            "error": "You cannot remove yourself"
        }), 400

    removed = database.remove_admin(
        telegram_id,
        requester_id=admin["id"]
    )

    return jsonify({
        "ok": True,
        "removed": removed
    })


# ==========================================================
# STUDENT HOMEWORK
# ==========================================================

@app.get("/api/homework")
def homework():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    profile = database.get_user(user["id"])

    if not profile:
        return jsonify({
            "items": [],
            "profile_required": True
        })

    department = profile["department"] or ""
    group_name = profile["group_name"] or ""

    if not department or not group_name:
        return jsonify({
            "items": [],
            "profile_required": True
        })

    return jsonify({
        "items": json_rows(
            database.get_student_homework(
                department,
                group_name
            )
        ),
        "profile_required": False
    })


# ==========================================================
# TEACHER HOMEWORK
# ==========================================================

@app.post("/api/teacher/homework/create")
def create_homework():
    user = require_teacher()

    if not user:
        return jsonify({
            "error": "Teacher approval required"
        }), 403

    data = request.get_json(silent=True) or {}

    department = str(
        data.get("department") or ""
    ).strip()
    group_name = str(
        data.get("group_name") or ""
    ).strip()
    title = str(
        data.get("title") or ""
    ).strip()
    description = str(
        data.get("description") or ""
    ).strip()
    deadline = str(
        data.get("deadline") or ""
    ).strip()

    profile = database.get_user(user["id"])

    if not department:
        department = (
            profile["department"]
            if profile and profile["department"]
            else ""
        )

    if not department:
        return jsonify({
            "error": "Choose department first"
        }), 400

    if not title:
        return jsonify({
            "error": "Title is required"
        }), 400

    if not group_name:
        return jsonify({
            "error": "Choose a group"
        }), 400

    if group_name not in database.get_groups(department):
        return jsonify({
            "error": "Group not found"
        }), 400

    homework_id = database.add_homework(
        teacher_id=user["id"],
        department=department,
        group_name=group_name,
        title=title,
        description=description,
        deadline=deadline
    )

    return jsonify({
        "ok": True,
        "id": homework_id
    })


@app.get("/api/teacher/homework")
def teacher_homework():
    user = require_teacher()

    if not user:
        return jsonify({
            "error": "Teacher approval required"
        }), 403

    return jsonify({
        "items": json_rows(
            database.get_teacher_homework(user["id"])
        )
    })


@app.delete("/api/teacher/homework/<int:homework_id>")
def teacher_delete_homework(homework_id):
    user = require_teacher()

    if not user:
        return jsonify({
            "error": "Teacher approval required"
        }), 403

    database.delete_homework(
        homework_id,
        user["id"]
    )

    return jsonify({"ok": True})


# ==========================================================
# ANNOUNCEMENTS - STUDENT
# ==========================================================

@app.get("/api/announcements")
def announcements():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    profile = database.get_user(user["id"])

    if not profile:
        return jsonify({
            "items": [],
            "profile_required": True
        })

    department = profile["department"] or ""
    group_name = profile["group_name"] or ""

    if not department or not group_name:
        return jsonify({
            "items": [],
            "profile_required": True
        })

    return jsonify({
        "items": json_rows(
            database.get_student_announcements(
                department,
                group_name
            )
        )
    })


# ==========================================================
# ANNOUNCEMENTS - TEACHER
# ==========================================================

@app.get("/api/teacher/announcements")
def teacher_announcements():
    user = require_teacher()

    if not user:
        return jsonify({
            "error": "Teacher approval required"
        }), 403

    rows = database.get_teacher_announcements(user["id"])
    items = []

    for row in rows:
        item = dict(row)
        raw_groups = item.get("target_groups") or ""
        item["target_groups"] = [
            g for g in raw_groups.split("||")
            if g
        ]
        items.append(item)

    return jsonify({
        "items": items
    })


@app.post("/api/teacher/announcements/create")
def create_announcement():
    user = require_teacher()

    if not user:
        return jsonify({
            "error": "Teacher approval required"
        }), 403

    data = request.get_json(silent=True) or {}

    profile = database.get_user(user["id"])

    department = str(
        data.get("department")
        or (
            profile["department"]
            if profile and profile["department"]
            else ""
        )
        or ""
    ).strip()

    title = str(
        data.get("title") or ""
    ).strip()

    message = str(
        data.get("message") or ""
    ).strip()

    group_names = data.get("group_names") or []

    if isinstance(group_names, str):
        group_names = [group_names]

    if not department:
        return jsonify({
            "error": "Choose department first"
        }), 400

    if not title:
        return jsonify({
            "error": "Title is required"
        }), 400

    if not message:
        return jsonify({
            "error": "Message is required"
        }), 400

    group_names = get_valid_groups(
        department,
        group_names
    )

    if not group_names:
        return jsonify({
            "error": "Choose at least one group"
        }), 400

    file_id = data.get("file_id")
    file_type = data.get("file_type")

    announcement_id = database.add_announcement(
        teacher_id=user["id"],
        department=department,
        group_names=group_names,
        title=title,
        message=message,
        file_id=file_id,
        file_type=file_type
    )

    notification = notify_students(
        department=department,
        group_names=group_names,
        title=title,
        message=message,
        file_id=file_id,
        file_type=file_type
    )

    return jsonify({
        "ok": True,
        "id": announcement_id,
        "groups": group_names,
        "notification": notification
    })


@app.delete("/api/teacher/announcements/<int:announcement_id>")
def teacher_delete_announcement(announcement_id):
    user = require_teacher()

    if not user:
        return jsonify({
            "error": "Teacher approval required"
        }), 403

    database.delete_announcement(
        announcement_id,
        user["id"]
    )

    return jsonify({"ok": True})


# ==========================================================
# SCHEDULE
# ==========================================================

@app.get("/api/schedule")
def schedule():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    profile = database.get_user(user["id"])

    if not profile or not profile["department"] or not profile["group_name"]:
        return jsonify({
            "available": False,
            "profile_required": True
        })

    file_id = database.get_schedule_image(
        profile["department"],
        profile["group_name"]
    )

    return jsonify({
        "available": bool(file_id),
        "file_id": file_id
    })


@app.get("/api/schedule/file")
def schedule_file():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    profile = database.get_user(user["id"])

    if not profile or not profile["department"] or not profile["group_name"]:
        return jsonify({
            "error": "Profile is incomplete"
        }), 400

    file_id = database.get_schedule_image(
        profile["department"],
        profile["group_name"]
    )

    if not file_id:
        return jsonify({
            "error": "Schedule not found"
        }), 404

    token = os.getenv("BOT_TOKEN")
    if not token:
        return jsonify({
            "error": "BOT_TOKEN is not configured"
        }), 500

    ok, result = telegram_api(
        "getFile",
        {"file_id": file_id}
    )

    if not ok:
        return jsonify({
            "error": str(result)
        }), 502

    file_path = result.get("result", {}).get("file_path")

    if not file_path:
        return jsonify({
            "error": "Telegram file path not found"
        }), 502

    try:
        file_url = (
            f"https://api.telegram.org/file/bot"
            f"{token}/{file_path}"
        )

        with urlopen(file_url, timeout=20) as response:
            data = response.read()
            content_type = (
                response.headers.get(
                    "Content-Type",
                    "application/octet-stream"
                )
            )

        return Response(
            data,
            mimetype=content_type
        )

    except Exception as exc:
        return jsonify({
            "error": str(exc)
        }), 502


# ==========================================================
# AI
# ==========================================================

@app.post("/api/ai")
def ai():
    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if OpenAI is None:
        return jsonify({
            "error": "OpenAI package is not installed"
        }), 500

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return jsonify({
            "error": "OPENAI_API_KEY is not configured"
        }), 503

    data = request.get_json(silent=True) or {}
    messages = data.get("messages") or []

    if not messages:
        text = str(data.get("message") or "").strip()
        if text:
            messages = [
                {
                    "role": "user",
                    "content": text
                }
            ]

    if not messages:
        return jsonify({
            "error": "Message is required"
        }), 400

    safe_messages = []

    for item in messages[-20:]:
        role = item.get("role")
        content = item.get("content")

        if role not in {"user", "assistant", "system"}:
            continue

        if not isinstance(content, str):
            continue

        safe_messages.append({
            "role": role,
            "content": content[:6000]
        })

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model=os.getenv(
                "OPENAI_MODEL",
                "gpt-4o-mini"
            ),
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are UniUZ AI Assistant. "
                        "Help university students with studying, "
                        "assignments, schedules and general questions. "
                        "Answer clearly and concisely."
                    )
                },
                *safe_messages
            ]
        )

        answer = response.choices[0].message.content or ""

        return jsonify({
            "ok": True,
            "answer": answer
        })

    except Exception as exc:
        print("AI error:", exc)

        return jsonify({
            "error": "AI request failed"
        }), 502


# ==========================================================
# ERRORS
# ==========================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def server_error(error):
    print("Internal server error:", error)

    return jsonify({
        "error": "Internal server error"
    }), 500


# ==========================================================
# START
# ==========================================================

if __name__ == "__main__":
    port = int(
        os.environ.get("PORT", 8080)
    )

    app.run(
        host="0.0.0.0",
        port=port
    )

# ==========================================================
# UniUZ API
# Flask Backend
# ==========================================================

import os
import json

from urllib.parse import parse_qs

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import database


# ==========================================================
# APP
# ==========================================================

app = Flask(__name__)

CORS(app)

database.init_db()


# ==========================================================
# TELEGRAM AUTH
# ==========================================================

def get_telegram_user():

    init_data = request.headers.get(
        "X-Telegram-Init-Data"
    )

    if not init_data:
        return None

    try:
        data = parse_qs(init_data)

        user = data.get("user")

        if not user:
            return None

        return json.loads(user[0])

    except Exception as e:

        print("Telegram error:", e)

        return None


def require_user():

    user = get_telegram_user()

    if not user:
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
        return jsonify({
            "error": "Unauthorized"
        }), 401

    profile = database.get_user(
        user["id"]
    )

    teacher = database.get_teacher(
        user["id"]
    )

    return jsonify({
        "telegram": user,
        "telegram_user": user,
        "profile": dict(profile) if profile else None,
        "teacher_status": (
            teacher["status"]
            if teacher else None
        ),
        "teacher": (
            dict(teacher)
            if teacher else None
        ),
        "is_admin": database.is_admin(
            user["id"]
        )
    })


# ==========================================================
# STUDENT PROFILE SETUP
# ==========================================================

@app.get("/api/departments")
def get_departments():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

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
        "items": [
            row["department"]
            for row in rows
        ]
    })


@app.get("/api/groups")
def get_groups():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    department = (
        request.args.get(
            "department",
            ""
        ).strip()
    )

    if not department:
        return jsonify({
            "error": "Department is required"
        }), 400

    groups = database.get_groups(
        department
    )

    return jsonify({
        "items": groups
    })


@app.post("/api/profile")
def save_profile():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    data = request.get_json(
        silent=True
    ) or {}

    university = data.get(
        "university"
    )

    department = (
        data.get("department")
        or ""
    ).strip()

    group_name = (
        data.get("group_name")
        or ""
    ).strip()

    role = (
        data.get("role")
        or "student"
    ).strip()

    if not department:
        return jsonify({
            "error": "Department is required"
        }), 400

    if not group_name:
        return jsonify({
            "error": "Group is required"
        }), 400

    groups = database.get_groups(
        department
    )

    if group_name not in groups:
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

    profile = database.get_user(
        user["id"]
    )

    return jsonify({
        "ok": True,
        "profile": (
            dict(profile)
            if profile else None
        )
    })


# ==========================================================
# TEACHER REQUEST
# ==========================================================

@app.post("/api/teacher/request")
def teacher_request():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    telegram_id = user["id"]

    existing = database.get_teacher(
        telegram_id
    )

    if existing:

        # If already approved, do not create a new request.
        return jsonify({
            "status": existing["status"]
        })

    database.add_teacher_request(
        telegram_id=telegram_id,
        full_name=(
            user.get("first_name", "")
            + " "
            + user.get("last_name", "")
        ).strip()
    )

    return jsonify({
        "status": "pending"
    })


# ==========================================================
# TEACHER STATUS
# ==========================================================

@app.get("/api/teacher/status")
def teacher_status():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    teacher = database.get_teacher(
        user["id"]
    )

    if not teacher:
        return jsonify({
            "status": "none"
        })

    return jsonify({
        "status": teacher["status"]
    })


# ==========================================================
# ADMIN AUTH
# ==========================================================

def require_admin():

    user = require_user()

    if not user:
        return None

    if not database.is_admin(
        user["id"]
    ):
        return None

    return user


# ==========================================================
# ADMIN TEACHER REQUESTS
# ==========================================================

@app.get("/api/admin/teacher-requests")
def admin_teacher_requests():

    admin = require_admin()

    if not admin:
        return jsonify({
            "error": "Forbidden"
        }), 403

    teachers = database.get_pending_teachers()

    items = []

    for teacher in teachers:

        items.append({
            "telegram_id":
                teacher["telegram_id"],

            "full_name":
                teacher["full_name"],

            "status":
                teacher["status"],

            "created_at":
                teacher["created_at"]
        })

    return jsonify({
        "items": items
    })


# ==========================================================
# APPROVE TEACHER
# ==========================================================

@app.post(
    "/api/admin/teacher/<int:telegram_id>/approve"
)
def approve_teacher(telegram_id):

    admin = require_admin()

    if not admin:
        return jsonify({
            "error": "Forbidden"
        }), 403

    database.approve_teacher(
        telegram_id
    )

    return jsonify({
        "ok": True
    })


# ==========================================================
# REJECT TEACHER
# ==========================================================

@app.post(
    "/api/admin/teacher/<int:telegram_id>/reject"
)
def reject_teacher(telegram_id):

    admin = require_admin()

    if not admin:
        return jsonify({
            "error": "Forbidden"
        }), 403

    database.reject_teacher(
        telegram_id
    )

    return jsonify({
        "ok": True
    })


# ==========================================================
# STUDENT HOMEWORK
# ==========================================================

@app.get("/api/homework")
def homework():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    profile = database.get_user(
        user["id"]
    )

    if not profile:
        return jsonify({
            "items": []
        })

    department = (
        profile["department"]
        or ""
    )

    group_name = (
        profile["group_name"]
        or ""
    )

    if not group_name:
        return jsonify({
            "items": [],
            "profile_required": True,
            "message": (
                "Choose department and group first"
            )
        })

    try:

        items = database.get_student_homework(
            department,
            group_name
        )

    except Exception as e:

        print(
            "Homework error:",
            e
        )

        items = []

    return jsonify({
        "items": [
            dict(item)
            for item in items
        ],
        "profile_required": (
            not bool(department)
        )
    })


# ==========================================================
# TEACHER HOMEWORK CREATE
# ==========================================================

@app.post("/api/teacher/homework/create")
def create_homework():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    teacher = database.get_teacher(
        user["id"]
    )

    if (
        not teacher
        or teacher["status"] != "approved"
    ):
        return jsonify({
            "error":
                "Only approved teachers allowed"
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    title = (
        data.get("title")
        or ""
    ).strip()

    description = (
        data.get("description")
        or ""
    ).strip()

    group_name = (
        data.get("group_name")
        or ""
    ).strip()

    deadline = (
        data.get("deadline")
        or ""
    ).strip()

    if not title:
        return jsonify({
            "error":
                "Title is required"
        }), 400

    if not group_name:
        return jsonify({
            "error":
                "Group is required"
        }), 400

    # Check that the selected group exists.
    profile = database.get_user(
        user["id"]
    )

    teacher_department = (
        profile["department"]
        if profile
        else None
    )

    if teacher_department:

        teacher_groups = database.get_groups(
            teacher_department
        )

        if group_name not in teacher_groups:

            return jsonify({
                "error":
                    "Group not found"
            }), 400

    database.add_homework(
        teacher_id=user["id"],
        title=title,
        description=description,
        group_name=group_name,
        deadline=deadline
    )

    return jsonify({
        "ok": True,
        "message": "Homework created"
    })


# ==========================================================
# TEACHER HOMEWORK LIST
# ==========================================================

@app.get("/api/teacher/homework")
def teacher_homework():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    teacher = database.get_teacher(
        user["id"]
    )

    if (
        not teacher
        or teacher["status"] != "approved"
    ):
        return jsonify({
            "error":
                "Only approved teachers allowed"
        }), 403

    items = database.get_teacher_homework(
        user["id"]
    )

    return jsonify({
        "items": [
            dict(item)
            for item in items
        ]
    })


# ==========================================================
# ANNOUNCEMENTS
# ==========================================================

@app.get("/api/announcements")
def announcements():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    profile = database.get_user(
        user["id"]
    )

    if not profile:
        return jsonify({
            "items": []
        })

    department = (
        profile["department"]
        or ""
    )

    group_name = (
        profile["group_name"]
        or ""
    )

    if not department or not group_name:
        return jsonify({
            "items": [],
            "profile_required": True,
            "message": (
                "Choose department and group first"
            )
        })

    try:

        items = database.get_student_announcements(
            department,
            group_name
        )

    except Exception as e:

        print(
            "Announcements error:",
            e
        )

        items = []

    return jsonify({
        "items": [
            dict(item)
            for item in items
        ]
    })


# ==========================================================
# TEACHER ANNOUNCEMENTS
# ==========================================================

@app.get("/api/teacher/announcements")
def teacher_announcements():

    user = require_user()

    if not user:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    teacher = database.get_teacher(
        user["id"]
    )

    if (
        not teacher
        or teacher["status"] != "approved"
    ):
        return jsonify({
            "error":
                "Only approved teachers allowed"
        }), 403

    items = database.get_teacher_announcements(
        user["id"]
    )

    return jsonify({
        "items": [
            dict(item)
            for item in items
        ]
    })




# ==========================================================
# AI GENERATED FILE DOWNLOAD
# ==========================================================

@app.get("/api/ai/generated/<int:file_id>")
def ai_generated_file(file_id):

    user = require_user()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    file = database.get_ai_generated_file(
        user["id"],
        file_id
    )

    if not file:
        return jsonify({"error": "File not found"}), 404

    if not os.path.exists(file["file_path"]):
        return jsonify({"error": "File missing"}), 404

    return send_file(
        file["file_path"],
        as_attachment=True,
        download_name=file["filename"]
    )


# ==========================================================
# 404
# ==========================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error":
            "Endpoint not found"
    }), 404


# ==========================================================
# GENERAL ERROR
# ==========================================================

@app.errorhandler(500)
def server_error(error):

    print(
        "Internal server error:",
        error
    )

    return jsonify({
        "error":
            "Internal server error"
    }), 500


# ==========================================================
# START
# ==========================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            8080
        )
    )

    print(
        "================================"
    )

    print(
        "UniUZ API STARTED"
    )

    print(
        f"PORT: {port}"
    )

    print(
        "================================"
    )

    app.run(
        host="0.0.0.0",
        port=port
    )

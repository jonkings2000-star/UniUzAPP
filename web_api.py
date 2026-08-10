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


ADMIN_ID = int(
    os.getenv(
        "ADMIN_ID",
        "6477136658"
    )
)


# ============================================================
# CORS
# ============================================================

@app.after_request
def add_cors_headers(response):

    response.headers[
        "Access-Control-Allow-Origin"
    ] = "*"

    response.headers[
        "Access-Control-Allow-Headers"
    ] = (
        "Content-Type, "
        "X-Telegram-Init-Data"
    )

    response.headers[
        "Access-Control-Allow-Methods"
    ] = (
        "GET, POST, OPTIONS"
    )

    response.headers[
        "Access-Control-Max-Age"
    ] = "86400"

    return response


# ============================================================
# TELEGRAM INIT DATA
# ============================================================

def validate_telegram_init_data(
    init_data: str
):

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


        received_hash = data.pop(
            "hash",
            None
        )


        if not received_hash:
            return None


        secret_key = hmac.new(
            b"WebAppData",
            BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()


        data_check_string = "\n".join(
            f"{key}={data[key]}"
            for key in sorted(
                data.keys()
            )
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


        user_json = data.get(
            "user"
        )


        if not user_json:
            return None


        telegram_user = json.loads(
            urllib.parse.unquote(
                user_json
            )
        )


        return telegram_user


    except Exception as exc:

        print(
            "Telegram initData validation error:",
            exc
        )

        return None


# ============================================================
# AUTH
# ============================================================

def get_telegram_user():

    init_data = request.headers.get(
        "X-Telegram-Init-Data",
        ""
    )


    return validate_telegram_init_data(
        init_data
    )


def require_user():

    telegram_user =
        get_telegram_user()


    if not telegram_user:
        return None


    user_id =
        telegram_user.get("id")


    if not user_id:
        return None


    return telegram_user


def is_admin_user(
    telegram_user
):

    if not telegram_user:
        return False


    try:

        return (
            int(
                telegram_user.get(
                    "id",
                    0
                )
            )
            ==
            ADMIN_ID
        )

    except Exception:

        return False


# ============================================================
# SERIALIZERS
# ============================================================

def serialize_teacher(
    teacher
):

    if not teacher:
        return None


    return {

        "telegram_id":
            teacher["telegram_id"],

        "full_name":
            teacher["full_name"],

        "status":
            teacher["status"],

        "created_at":
            teacher["created_at"]

    }


def serialize_user(
    user
):

    if not user:
        return None


    return {

        "id":
            user["id"],

        "username":
            user["username"],

        "full_name":
            user["full_name"],

        "university":
            user["university"],

        "department":
            user["department"],

        "group_name":
            user["group_name"]

    }


# ============================================================
# HEALTH
# ============================================================

@app.get(
    "/api/health"
)
def health():

    return jsonify({

        "ok": True,

        "service":
            "UniUZ API",

        "status":
            "online",

        "time":
            datetime.now(
                timezone.utc
            ).isoformat()

    })


# ============================================================
# PROFILE
# ============================================================

@app.get(
    "/api/me"
)
def api_me():

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    telegram_id =
        telegram_user["id"]


    first_name =
        telegram_user.get(
            "first_name",
            ""
        )


    last_name =
        telegram_user.get(
            "last_name",
            ""
        )


    full_name = (
        f"{first_name} {last_name}"
    ).strip()


    if not full_name:

        full_name =
            telegram_user.get(
                "username",
                "Unknown"
            )


    user =
        database.get_user(
            telegram_id
        )


    teacher =
        database.get_teacher(
            telegram_id
        )


    status = (

        teacher["status"]

        if teacher

        else None

    )


    role = (

        "teacher"

        if status == "approved"

        else "student"

    )


    return jsonify({

        "ok":
            True,

        "telegram_user":
            telegram_user,

        "profile":
            serialize_user(
                user
            ),

        "role":
            role,

        "teacher":
            serialize_teacher(
                teacher
            ),

        "teacher_status":
            status,

        "is_teacher":
            status == "approved",

        "is_admin":
            is_admin_user(
                telegram_user
            )

    })


# ============================================================
# TEACHER STATUS
# ============================================================

@app.get(
    "/api/teacher/status"
)
def teacher_status_api():

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    telegram_id =
        telegram_user["id"]


    teacher =
        database.get_teacher(
            telegram_id
        )


    if not teacher:

        return jsonify({

            "ok":
                True,

            "exists":
                False,

            "status":
                None,

            "is_teacher":
                False

        })


    return jsonify({

        "ok":
            True,

        "exists":
            True,

        "status":
            teacher["status"],

        "is_teacher":
            teacher["status"] ==
            "approved",

        "teacher":
            serialize_teacher(
                teacher
            )

    })


# ============================================================
# TEACHER REQUEST
# ============================================================

@app.post(
    "/api/teacher/request"
)
def teacher_request():

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    telegram_id =
        telegram_user["id"]


    first_name =
        telegram_user.get(
            "first_name",
            ""
        )


    last_name =
        telegram_user.get(
            "last_name",
            ""
        )


    full_name = (
        f"{first_name} {last_name}"
    ).strip()


    if not full_name:

        full_name =
            telegram_user.get(
                "username",
                "Unknown"
            )


    teacher =
        database.get_teacher(
            telegram_id
        )


    if teacher:

        if (
            teacher["status"]
            ==
            "approved"
        ):

            return jsonify({

                "ok":
                    True,

                "status":
                    "approved",

                "message":
                    "Ты уже зарегистрирован как преподаватель."

            })


        if (
            teacher["status"]
            ==
            "pending"
        ):

            return jsonify({

                "ok":
                    True,

                "status":
                    "pending",

                "message":
                    "Заявка уже отправлена и ожидает одобрения."

            })


        if (
            teacher["status"]
            ==
            "rejected"
        ):

            database.add_teacher_request(
                telegram_id,
                full_name
            )


            return jsonify({

                "ok":
                    True,

                "status":
                    "pending",

                "message":
                    "Новая заявка отправлена администратору."

            })


    database.add_teacher_request(
        telegram_id,
        full_name
    )


    return jsonify({

        "ok":
            True,

        "status":
            "pending",

        "message":
            "Заявка отправлена администратору."

    }), 201


# ============================================================
# ADMIN — REQUESTS
# ============================================================

@app.get(
    "/api/admin/teacher-requests"
)
def admin_teacher_requests():

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    if not is_admin_user(
        telegram_user
    ):

        return jsonify({

            "ok":
                False,

            "error":
                "Forbidden"

        }), 403


    teachers =
        database.get_pending_teachers()


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

        "ok":
            True,

        "items":
            items,

        "count":
            len(items)

    })


# ============================================================
# ADMIN — APPROVE
# ============================================================

@app.post(
    "/api/admin/teacher/<int:telegram_id>/approve"
)
def admin_approve_teacher(
    telegram_id
):

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    if not is_admin_user(
        telegram_user
    ):

        return jsonify({

            "ok":
                False,

            "error":
                "Forbidden"

        }), 403


    teacher =
        database.get_teacher(
            telegram_id
        )


    if not teacher:

        return jsonify({

            "ok":
                False,

            "error":
                "Teacher request not found"

        }), 404


    if (
        teacher["status"]
        !=
        "pending"
    ):

        return jsonify({

            "ok":
                True,

            "status":
                teacher["status"],

            "message":
                "Request was already processed"

        })


    database.approve_teacher(
        telegram_id
    )


    return jsonify({

        "ok":
            True,

        "status":
            "approved",

        "telegram_id":
            telegram_id

    })


# ============================================================
# ADMIN — REJECT
# ============================================================

@app.post(
    "/api/admin/teacher/<int:telegram_id>/reject"
)
def admin_reject_teacher(
    telegram_id
):

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    if not is_admin_user(
        telegram_user
    ):

        return jsonify({

            "ok":
                False,

            "error":
                "Forbidden"

        }), 403


    teacher =
        database.get_teacher(
            telegram_id
        )


    if not teacher:

        return jsonify({

            "ok":
                False,

            "error":
                "Teacher request not found"

        }), 404


    if (
        teacher["status"]
        !=
        "pending"
    ):

        return jsonify({

            "ok":
                True,

            "status":
                teacher["status"],

            "message":
                "Request was already processed"

        })


    database.reject_teacher(
        telegram_id
    )


    return jsonify({

        "ok":
            True,

        "status":
            "rejected",

        "telegram_id":
            telegram_id

    })


# ============================================================
# HOMEWORK
# ============================================================

@app.get(
    "/api/homework"
)
def api_homework():

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    telegram_id =
        telegram_user["id"]


    user =
        database.get_user(
            telegram_id
        )


    if not user:

        return jsonify({

            "ok":
                True,

            "items":
                []

        })


    department =
        user["department"]


    group_name =
        user["group_name"]


    if not department or not group_name:

        return jsonify({

            "ok":
                True,

            "items":
                []

        })


    rows =
        database.get_student_homework(
            department,
            group_name
        )


    items = []


    for row in rows:

        items.append({

            "id":
                row["id"],

            "teacher_id":
                row["teacher_id"],

            "department":
                row["department"],

            "group_name":
                row["group_name"],

            "subject_name":
                row["subject_name"],

            "task_text":
                row["task_text"],

            "homework_date":
                row["homework_date"],

            "homework_time":
                row["homework_time"],

            "file_id":
                row["file_id"],

            "file_type":
                row["file_type"],

            "created_at":
                row["created_at"]

        })


    return jsonify({

        "ok":
            True,

        "items":
            items

    })


# ============================================================
# ANNOUNCEMENTS
# ============================================================

@app.get(
    "/api/announcements"
)
def api_announcements():

    telegram_user =
        require_user()


    if not telegram_user:

        return jsonify({

            "ok":
                False,

            "error":
                "Unauthorized"

        }), 401


    telegram_id =
        telegram_user["id"]


    user =
        database.get_user(
            telegram_id
        )


    if not user:

        return jsonify({

            "ok":
                True,

            "items":
                []

        })


    department =
        user["department"]


    group_name =
        user["group_name"]


    if not department or not group_name:

        return jsonify({

            "ok":
                True,

            "items":
                []

        })


    rows =
        database.get_student_announcements(
            department,
            group_name
        )


    items = []


    for row in rows:

        items.append({

            "id":
                row["id"],

            "teacher_id":
                row["teacher_id"],

            "department":
                row["department"],

            "group_name":
                row["group_name"],

            "title":
                row["title"],

            "message":
                row["message"],

            "file_id":
                row["file_id"],

            "file_type":
                row["file_type"],

            "created_at":
                row["created_at"]

        })


    return jsonify({

        "ok":
            True,

        "items":
            items

    })


# ============================================================
# ERRORS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "ok":
            False,

        "error":
            "Endpoint not found"

    }), 404


@app.errorhandler(500)
def internal_error(error):

    print(
        "Internal server error:",
        error
    )


    return jsonify({

        "ok":
            False,

        "error":
            "Internal server error"

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

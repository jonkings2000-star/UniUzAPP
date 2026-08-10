# ==========================================================
# UniUZ API
# Flask Backend
# ==========================================================

import os
import json

from urllib.parse import parse_qs

from flask import (
    Flask,
    request,
    jsonify
)

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

        data = parse_qs(
            init_data
        )


        user = data.get(
            "user"
        )


        if not user:
            return None


        return json.loads(
            user[0]
        )


    except Exception as e:

        print(
            "Telegram error:",
            e
        )

        return None





def require_user():

    user = get_telegram_user()


    if not user:

        return None



    database.add_user(

        user_id=user["id"],

        username=user.get(
            "username"
        ),

        full_name=(

            user.get(
                "first_name",
                ""
            )

            +

            " "

            +

            user.get(
                "last_name",
                ""
            )

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

        "service":
        "UniUZ API",

        "status":
        "online"

    })





# ==========================================================
# PROFILE
# ==========================================================


@app.get("/api/me")
def me():

    user = require_user()


    if not user:

        return jsonify({

            "error":
            "Unauthorized"

        }),401



    profile = database.get_user(
        user["id"]
    )


    teacher = database.get_teacher(
        user["id"]
    )


    return jsonify({

        "telegram":
        user,


        "profile":
        dict(profile)
        if profile else None,


        "teacher_status":
        teacher["status"]
        if teacher else None,


        "is_admin":
        database.is_admin(
            user["id"]
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

            "error":
            "Unauthorized"

        }),401



    telegram_id = user["id"]



    existing = database.get_teacher(
        telegram_id
    )


    if existing:

        return jsonify({

            "status":
            existing["status"]

        })



    # ВАЖНО:
    # без username, потому что database.py
    # его не принимает

    database.add_teacher_request(

        telegram_id=telegram_id,


        full_name=(

            user.get(
                "first_name",
                ""
            )

            +

            " "

            +

            user.get(
                "last_name",
                ""
            )

        ).strip()

    )



    return jsonify({

        "status":
        "pending"

    })





# ==========================================================
# TEACHER STATUS
# ==========================================================


@app.get("/api/teacher/status")
def teacher_status():


    user = require_user()



    if not user:

        return jsonify({

            "error":
            "Unauthorized"

        }),401




    teacher = database.get_teacher(

        user["id"]

    )



    if not teacher:

        return jsonify({

            "status":
            "none"

        })



    return jsonify({

        "status":
        teacher["status"]

    })





# ==========================================================
# ADMIN CHECK
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

            "error":
            "Forbidden"

        }),403




    teachers = database.get_pending_teachers()



    items = []



    for teacher in teachers:


        items.append({

            "telegram_id":
            teacher["telegram_id"],


            "full_name":
            teacher["full_name"],


            "status":
            teacher["status"]

        })



    return jsonify({

        "items":
        items

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

            "error":
            "Forbidden"

        }),403




    database.approve_teacher(

        telegram_id

    )


    return jsonify({

        "ok":
        True

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

            "error":
            "Forbidden"

        }),403




    database.reject_teacher(

        telegram_id

    )


    return jsonify({

        "ok":
        True

    })
    # ==========================================================
# HOMEWORK
# ==========================================================


@app.get("/api/homework")
def homework():


    user = require_user()


    if not user:

        return jsonify({

            "error":
            "Unauthorized"

        }),401



    profile = database.get_user(

        user["id"]

    )



    if not profile:

        return jsonify({

            "items":
            []

        })



    try:

        items = database.get_student_homework(

            profile["department"],

            profile["group_name"]

        )


    except Exception:

        items = []



    return jsonify({

        "items":

        [

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

            "error":
            "Unauthorized"

        }),401




    profile = database.get_user(

        user["id"]

    )



    if not profile:

        return jsonify({

            "items":
            []

        })



    try:

        items = database.get_student_announcements(

            profile["department"],

            profile["group_name"]

        )


    except Exception:

        items = []



    return jsonify({

        "items":

        [

            dict(item)

            for item in items

        ]

    })





# ==========================================================
# 404
# ==========================================================


@app.errorhandler(404)
def not_found(error):


    return jsonify({

        "error":
        "Endpoint not found"

    }),404





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

import os
import time
import hmac
import hashlib
import json
from urllib.parse import parse_qsl

from aiohttp import web, ClientSession

import database


BOT_TOKEN = os.getenv("BOT_TOKEN")
MAX_INIT_DATA_AGE = 24 * 60 * 60


def _validate_init_data(init_data: str):
    if not BOT_TOKEN or not init_data:
        return None

    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = pairs.pop("hash", None)

        if not received_hash:
            return None

        data_check_string = "\n".join(
            f"{key}={pairs[key]}"
            for key in sorted(pairs)
        )

        secret_key = hmac.new(
            b"WebAppData",
            BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()

        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(calculated_hash, received_hash):
            return None

        auth_date = int(pairs.get("auth_date", "0"))
        if not auth_date or time.time() - auth_date > MAX_INIT_DATA_AGE:
            return None

        user_raw = pairs.get("user")
        if not user_raw:
            return None

        return json.loads(user_raw)

    except Exception as exc:
        print(f"Mini App auth error: {exc}")
        return None


def _get_telegram_user(request):
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    return _validate_init_data(init_data)


def _row_to_dict(row):
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def _homework_dict(row):
    data = _row_to_dict(row)
    if not data:
        return None
    data.pop("file_id", None)
    return data


def _announcement_dict(row):
    data = _row_to_dict(row)
    if not data:
        return None
    data.pop("file_id", None)
    return data


async def auth_required(request):
    telegram_user = _get_telegram_user(request)

    if not telegram_user or not telegram_user.get("id"):
        raise web.HTTPUnauthorized(
            text=json.dumps({
                "ok": False,
                "error": "Invalid Telegram Mini App authorization"
            }),
            content_type="application/json"
        )

    return telegram_user


async def health(request):
    return web.json_response({
        "ok": True,
        "service": "UniUZ API",
        "status": "online"
    })


async def me(request):
    telegram_user = await auth_required(request)
    telegram_id = int(telegram_user["id"])

    database.add_user(
        telegram_id,
        telegram_user.get("username"),
        " ".join(
            x for x in [
                telegram_user.get("first_name"),
                telegram_user.get("last_name")
            ]
            if x
        ) or telegram_user.get("username") or "Telegram User"
    )

    user = database.get_user(telegram_id)

    return web.json_response({
        "ok": True,
        "telegram": {
            "id": telegram_id,
            "username": telegram_user.get("username"),
            "first_name": telegram_user.get("first_name"),
            "last_name": telegram_user.get("last_name")
        },
        "profile": _row_to_dict(user)
    })


async def home(request):
    telegram_user = await auth_required(request)
    telegram_id = int(telegram_user["id"])

    database.add_user(
        telegram_id,
        telegram_user.get("username"),
        " ".join(
            x for x in [
                telegram_user.get("first_name"),
                telegram_user.get("last_name")
            ]
            if x
        ) or telegram_user.get("username") or "Telegram User"
    )

    user = database.get_user(telegram_id)

    if not user:
        raise web.HTTPNotFound(
            text=json.dumps({"ok": False, "error": "User not found"}),
            content_type="application/json"
        )

    department = user["department"]
    group_name = user["group_name"]

    homework = []
    announcements = []
    schedule_available = False

    if department and group_name:
        homework = [
            _homework_dict(row)
            for row in database.get_student_homework(
                department,
                group_name
            )
        ]

        announcements = [
            _announcement_dict(row)
            for row in database.get_student_announcements(
                department,
                group_name
            )
        ]

        schedule_available = bool(
            database.get_schedule_image(
                department,
                group_name
            )
        )

    return web.json_response({
        "ok": True,
        "profile": _row_to_dict(user),
        "homework": homework,
        "announcements": announcements,
        "schedule_available": schedule_available
    })


async def schedule_image(request):
    telegram_user = await auth_required(request)
    telegram_id = int(telegram_user["id"])

    user = database.get_user(telegram_id)

    if not user or not user["department"] or not user["group_name"]:
        raise web.HTTPBadRequest(
            text=json.dumps({
                "ok": False,
                "error": "Student profile is not configured"
            }),
            content_type="application/json"
        )

    file_id = database.get_schedule_image(
        user["department"],
        user["group_name"]
    )

    if not file_id:
        raise web.HTTPNotFound(
            text=json.dumps({
                "ok": False,
                "error": "Schedule not found"
            }),
            content_type="application/json"
        )

    telegram_api_url = (
        f"https://api.telegram.org/bot{BOT_TOKEN}/getFile"
    )

    async with ClientSession() as session:
        async with session.get(
            telegram_api_url,
            params={"file_id": file_id}
        ) as response:
            result = await response.json()

        if not result.get("ok"):
            raise web.HTTPBadGateway(
                text=json.dumps({
                    "ok": False,
                    "error": "Telegram getFile failed"
                }),
                content_type="application/json"
            )

        file_path = result["result"]["file_path"]
        download_url = (
            f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        )

        async with session.get(download_url) as image_response:
            if image_response.status != 200:
                raise web.HTTPBadGateway(
                    text=json.dumps({
                        "ok": False,
                        "error": "Could not download schedule image"
                    }),
                    content_type="application/json"
                )

            body = await image_response.read()
            content_type = image_response.headers.get(
                "Content-Type",
                "image/jpeg"
            )

    return web.Response(
        body=body,
        content_type=content_type
    )


@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        response = web.Response(status=204)
    else:
        response = await handler(request)

    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type, X-Telegram-Init-Data"
    )
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    return response


def create_app():
    app = web.Application(middlewares=[cors_middleware])

    app.router.add_get("/api/health", health)
    app.router.add_get("/api/me", me)
    app.router.add_get("/api/home", home)
    app.router.add_get("/api/schedule/image", schedule_image)

    # Serve the Telegram Mini App from the same Railway service.
    # This keeps the API and Mini App on one domain.
    miniapp_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "miniapp"
    )
    if os.path.isdir(miniapp_dir):
        app.router.add_static("/", miniapp_dir, show_index=True)

    return app

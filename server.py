# ============================================================
# UniUZ SERVER
# Mini App + API
# ============================================================

import os

from flask import send_from_directory

from web_api import app


# ============================================================
# PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# ============================================================
# MINI APP
# ============================================================

@app.get("/")
def mini_app():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


@app.get("/style.css")
def style_css():

    return send_from_directory(
        BASE_DIR,
        "style.css"
    )


@app.get("/app.js")
def app_js():

    return send_from_directory(
        BASE_DIR,
        "app.js"
    )


# ============================================================
# OPTIONAL FAVICON
# ============================================================

@app.get("/favicon.ico")
def favicon():

    favicon_path = os.path.join(
        BASE_DIR,
        "favicon.ico"
    )

    if os.path.exists(favicon_path):

        return send_from_directory(
            BASE_DIR,
            "favicon.ico"
        )

    return "", 204


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    port = int(
        os.getenv(
            "PORT",
            "8080"
        )
    )

    print("=" * 50)
    print("UniUZ Server started")
    print(f"Port: {port}")
    print("Mini App + API are running together")
    print("=" * 50)

    app.run(
        host="0.0.0.0",
        port=port
    )

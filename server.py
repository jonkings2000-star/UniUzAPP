# ==========================================================
# UniUZ SERVER
# Mini App + API
# ==========================================================

import os

from web_api import app

from flask import send_from_directory


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# ==========================================================
# MINI APP FILES
# ==========================================================


@app.route("/")
def index():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )



@app.route("/style.css")
def css():

    return send_from_directory(
        BASE_DIR,
        "style.css"
    )



@app.route("/app.js")
def javascript():

    return send_from_directory(
        BASE_DIR,
        "app.js"
    )



@app.route("/favicon.ico")
def favicon():

    return "", 204



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


    print("==============================")
    print("UniUZ Server Started")
    print(f"PORT: {port}")
    print("Mini App + API ONLINE")
    print("==============================")


    app.run(
        host="0.0.0.0",
        port=port
    )

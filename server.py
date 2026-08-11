import os
from flask import send_from_directory
from web_api import app

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.get("/app.js")
def js():
    return send_from_directory(BASE_DIR, "app.js")

@app.get("/style.css")
def css():
    return send_from_directory(BASE_DIR, "style.css")

@app.get("/favicon.ico")
def favicon():
    return ("", 204)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")))

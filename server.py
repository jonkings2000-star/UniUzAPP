import os
import threading
from web_api import app
from reminders import start_reminder_worker

if __name__ == "__main__":
    start_reminder_worker()
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)

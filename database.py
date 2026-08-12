import sqlite3
import os
from datetime import datetime, date

DB_NAME = os.environ.get("DB_NAME", "uniuz.db")

def conn():
    c = sqlite3.connect(DB_NAME, check_same_thread=False)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    c = conn()
    cur = c.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language TEXT DEFAULT 'ru',
        university TEXT,
        department TEXT,
        group_name TEXT,
        reminders_enabled INTEGER DEFAULT 1,
        unlimited_ai INTEGER DEFAULT 0,
        ai_used_date TEXT,
        ai_used_count INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS schedules(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        subject TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        room TEXT,
        teacher TEXT,
        raw_text TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS homework(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_at TEXT NOT NULL,
        file_name TEXT,
        file_path TEXT,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS ai_usage(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        usage_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Safe migration for existing databases.
    try:
        cur.execute("ALTER TABLE homework ADD COLUMN file_path TEXT")
        c.commit()
    except sqlite3.OperationalError:
        pass

    c.commit()
    c.close()

def get_user(telegram_id):
    c = conn()
    row = c.execute("SELECT * FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
    c.close()
    return row

def create_or_update_user(telegram_user):
    tid = int(telegram_user["id"])
    c = conn()
    cur = c.cursor()
    cur.execute("""
    INSERT INTO users(telegram_id, username, first_name, last_name)
    VALUES(?,?,?,?)
    ON CONFLICT(telegram_id) DO UPDATE SET
        username=excluded.username,
        first_name=excluded.first_name,
        last_name=excluded.last_name,
        updated_at=CURRENT_TIMESTAMP
    """, (
        tid,
        telegram_user.get("username"),
        telegram_user.get("first_name", ""),
        telegram_user.get("last_name", "")
    ))
    c.commit()
    row = cur.execute("SELECT * FROM users WHERE telegram_id=?", (tid,)).fetchone()
    c.close()
    return row

def update_profile(telegram_id, **fields):
    allowed = {
        "language","university","department","group_name",
        "first_name","last_name","reminders_enabled"
    }
    fields = {k:v for k,v in fields.items() if k in allowed}
    if not fields:
        return get_user(telegram_id)
    fields["updated_at"] = datetime.utcnow().isoformat()
    c = conn()
    sql = "UPDATE users SET " + ", ".join(f"{k}=?" for k in fields) + " WHERE telegram_id=?"
    c.execute(sql, list(fields.values()) + [telegram_id])
    c.commit()
    row = c.execute("SELECT * FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
    c.close()
    return row

def set_unlimited(telegram_id, enabled):
    c = conn()
    c.execute("UPDATE users SET unlimited_ai=? WHERE telegram_id=?", (1 if enabled else 0, telegram_id))
    c.commit()
    c.close()

def consume_ai(telegram_id):
    c = conn()
    row = c.execute("SELECT unlimited_ai, ai_used_date, ai_used_count FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
    if not row:
        c.close()
        return False, 0
    today = date.today().isoformat()
    count = row["ai_used_count"] if row["ai_used_date"] == today else 0
    if row["unlimited_ai"]:
        c.close()
        return True, count
    if count >= 10:
        c.close()
        return False, count
    if row["ai_used_date"] != today:
        c.execute("UPDATE users SET ai_used_date=?, ai_used_count=1 WHERE telegram_id=?", (today, telegram_id))
        count = 1
    else:
        c.execute("UPDATE users SET ai_used_count=ai_used_count+1 WHERE telegram_id=?", (telegram_id,))
        count += 1
    c.execute("INSERT INTO ai_usage(user_id, usage_date) SELECT id, ? FROM users WHERE telegram_id=?", (today, telegram_id))
    c.commit()
    c.close()
    return True, count

def save_schedule(telegram_id, items):
    c = conn()
    uid = c.execute("SELECT id FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()["id"]
    c.execute("DELETE FROM schedules WHERE user_id=?", (uid,))
    for x in items:
        c.execute("""
        INSERT INTO schedules(user_id,day_of_week,subject,start_time,end_time,room,teacher,raw_text)
        VALUES(?,?,?,?,?,?,?,?)
        """, (uid, int(x["day_of_week"]), x["subject"], x["start_time"], x.get("end_time"),
              x.get("room"), x.get("teacher"), x.get("raw_text")))
    c.commit()
    c.close()

def get_schedule(telegram_id):
    c = conn()
    rows = c.execute("""
    SELECT day_of_week,subject,start_time,end_time,room,teacher
    FROM schedules s JOIN users u ON u.id=s.user_id
    WHERE u.telegram_id=? ORDER BY day_of_week,start_time
    """, (telegram_id,)).fetchall()
    c.close()
    return [dict(r) for r in rows]

def add_homework(telegram_id, title, description, due_at, file_name=None, file_path=None):
    c = conn()
    uid = c.execute("SELECT id FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()["id"]
    cur = c.execute("""
    INSERT INTO homework(user_id,title,description,due_at,file_name,file_path)
    VALUES(?,?,?,?,?,?)
    """, (uid,title,description,due_at,file_name,file_path))
    hid = cur.lastrowid
    c.commit()
    c.close()
    return hid

def get_homework(telegram_id, include_completed=True):
    c = conn()
    sql = """
    SELECT h.* FROM homework h JOIN users u ON u.id=h.user_id
    WHERE u.telegram_id=?
    """
    params = [telegram_id]
    if not include_completed:
        sql += " AND h.completed=0"
    sql += " ORDER BY due_at ASC"
    rows = c.execute(sql, params).fetchall()
    c.close()
    return [dict(r) for r in rows]

def complete_homework(telegram_id, hid, completed=True):
    c = conn()
    c.execute("""
    UPDATE homework SET completed=?
    WHERE id=? AND user_id=(SELECT id FROM users WHERE telegram_id=?)
    """, (1 if completed else 0, hid, telegram_id))
    c.commit()
    c.close()

def delete_homework(telegram_id, hid):
    c = conn()
    c.execute("""
    DELETE FROM homework
    WHERE id=? AND user_id=(SELECT id FROM users WHERE telegram_id=?)
    """, (hid, telegram_id))
    c.commit()
    c.close()

def due_for_reminders():
    c = conn()
    rows = c.execute("""
    SELECT u.telegram_id,u.language,u.first_name,u.reminders_enabled,
           h.id AS homework_id,h.title,h.due_at
    FROM users u JOIN homework h ON h.user_id=u.id
    WHERE u.reminders_enabled=1 AND h.completed=0
    """).fetchall()
    c.close()
    return [dict(r) for r in rows]

def schedule_reminders():
    c = conn()
    rows = c.execute("""
    SELECT u.telegram_id,u.language,u.first_name,
           s.subject,s.start_time,s.day_of_week
    FROM users u JOIN schedules s ON s.user_id=u.id
    WHERE u.reminders_enabled=1
    """).fetchall()
    c.close()
    return [dict(r) for r in rows]

def stats():
    c = conn()
    total = c.execute("SELECT COUNT(*) n FROM users").fetchone()["n"]
    unlimited = c.execute("SELECT COUNT(*) n FROM users WHERE unlimited_ai=1").fetchone()["n"]
    reminders = c.execute("SELECT COUNT(*) n FROM users WHERE reminders_enabled=1").fetchone()["n"]
    today = date.today().isoformat()
    ai_today = c.execute("SELECT COUNT(*) n FROM ai_usage WHERE usage_date=?", (today,)).fetchone()["n"]
    c.close()
    return {"total_users": total, "unlimited_ai": unlimited, "reminders_enabled": reminders, "ai_requests_today": ai_today}

def all_users(limit=200):
    c = conn()
    rows = c.execute("""
    SELECT telegram_id,username,first_name,last_name,language,university,
           department,group_name,reminders_enabled,unlimited_ai,created_at
    FROM users ORDER BY created_at DESC LIMIT ?
    """, (limit,)).fetchall()
    c.close()
    return [dict(r) for r in rows]


# ==========================================================
# TELEGRAM CLASS REMINDERS
# ==========================================================

def claim_schedule_reminder(telegram_id, day_of_week, subject, start_time, reminder_date):
    """
    Atomically claims a pair reminder so it is sent only once.
    reminder_date is the date in Asia/Tashkent (YYYY-MM-DD).
    """
    c = conn()
    c.execute("""
        CREATE TABLE IF NOT EXISTS sent_schedule_reminders(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER NOT NULL,
            reminder_date TEXT NOT NULL,
            day_of_week INTEGER NOT NULL,
            subject TEXT NOT NULL,
            start_time TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(telegram_id, reminder_date, day_of_week, subject, start_time)
        )
    """)
    try:
        c.execute("""
            INSERT INTO sent_schedule_reminders
            (telegram_id, reminder_date, day_of_week, subject, start_time)
            VALUES(?,?,?,?,?)
        """, (telegram_id, reminder_date, day_of_week, subject, start_time))
        c.commit()
        claimed = True
    except sqlite3.IntegrityError:
        claimed = False
    c.close()
    return claimed

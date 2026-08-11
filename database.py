import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo

DB_NAME = "uniuz.db"
TZ = ZoneInfo("Asia/Tashkent")


def now_str():
    return datetime.now(TZ).strftime("%Y-%m-%d %H:%M:%S")


def today_str():
    return datetime.now(TZ).strftime("%Y-%m-%d")


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username TEXT,
        full_name TEXT,
        university TEXT,
        department TEXT,
        group_name TEXT,
        language TEXT DEFAULT 'ru',
        reminders_enabled INTEGER DEFAULT 1,
        ai_unlimited INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
    )
    """)

    # Migrate columns for existing UniUZ databases.
    cur.execute("PRAGMA table_info(users)")
    cols = {row[1] for row in cur.fetchall()}
    migrations = {
        "language": "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'ru'",
        "reminders_enabled": "ALTER TABLE users ADD COLUMN reminders_enabled INTEGER DEFAULT 1",
        "ai_unlimited": "ALTER TABLE users ADD COLUMN ai_unlimited INTEGER DEFAULT 0",
        "updated_at": "ALTER TABLE users ADD COLUMN updated_at TEXT",
    }
    for col, sql in migrations.items():
        if col not in cols:
            cur.execute(sql)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS admins(
        telegram_id INTEGER PRIMARY KEY,
        added_by INTEGER,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS schedule_files(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT,
        mime_type TEXT,
        storage_path TEXT,
        parsed_at TEXT,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS schedule_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        day_name TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        subject TEXT NOT NULL,
        room TEXT,
        teacher TEXT,
        notes TEXT,
        source_file_id INTEGER,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(source_file_id) REFERENCES schedule_files(id) ON DELETE SET NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS homework(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_at TEXT NOT NULL,
        file_path TEXT,
        file_name TEXT,
        mime_type TEXT,
        completed INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS ai_usage(
        user_id INTEGER NOT NULL,
        usage_date TEXT NOT NULL,
        requests INTEGER DEFAULT 0,
        PRIMARY KEY(user_id, usage_date),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS reminder_log(
        user_id INTEGER NOT NULL,
        reminder_key TEXT NOT NULL,
        sent_at TEXT,
        PRIMARY KEY(user_id, reminder_key),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS settings(
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)

    admin_id = None
    try:
        import os
        admin_id = int(os.getenv("ADMIN_ID", "0"))
    except ValueError:
        pass
    if admin_id:
        cur.execute("""
        INSERT OR IGNORE INTO admins(telegram_id, added_by, created_at)
        VALUES(?,?,?)
        """, (admin_id, admin_id, now_str()))

    conn.commit()
    conn.close()


def add_user(user_id, username=None, full_name=None):
    conn = get_connection()
    cur = conn.cursor()
    now = now_str()
    cur.execute("""
    INSERT INTO users(id, username, full_name, created_at, updated_at)
    VALUES(?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
        username=excluded.username,
        updated_at=excluded.updated_at
    """, (user_id, username, full_name, now, now))
    # Don't overwrite a manually entered name with an empty value.
    if full_name:
        cur.execute("UPDATE users SET full_name=? WHERE id=?", (full_name, user_id))
    conn.commit()
    conn.close()


def get_user(user_id):
    conn = get_connection(); cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id=?", (user_id,))
    row = cur.fetchone(); conn.close(); return row


def update_profile(user_id, university, department, group_name, full_name, language=None):
    conn = get_connection(); cur = conn.cursor()
    if language is None:
        cur.execute("""
        UPDATE users SET university=?, department=?, group_name=?, full_name=?, updated_at=? WHERE id=?
        """, (university, department, group_name, full_name, now_str(), user_id))
    else:
        cur.execute("""
        UPDATE users SET university=?, department=?, group_name=?, full_name=?, language=?, updated_at=? WHERE id=?
        """, (university, department, group_name, full_name, language, now_str(), user_id))
    conn.commit(); conn.close()


def set_language(user_id, language):
    conn = get_connection(); conn.execute("UPDATE users SET language=?, updated_at=? WHERE id=?", (language, now_str(), user_id)); conn.commit(); conn.close()


def set_reminders(user_id, enabled):
    conn = get_connection(); conn.execute("UPDATE users SET reminders_enabled=?, updated_at=? WHERE id=?", (1 if enabled else 0, now_str(), user_id)); conn.commit(); conn.close()


def get_admins():
    conn = get_connection(); cur = conn.cursor(); cur.execute("SELECT * FROM admins ORDER BY created_at"); rows=cur.fetchall(); conn.close(); return rows


def is_admin(user_id):
    conn=get_connection(); cur=conn.cursor(); cur.execute("SELECT 1 FROM admins WHERE telegram_id=?", (user_id,)); ok=cur.fetchone() is not None; conn.close(); return ok


def add_admin(user_id, added_by):
    conn=get_connection(); cur=conn.cursor(); cur.execute("INSERT OR IGNORE INTO admins(telegram_id, added_by, created_at) VALUES(?,?,?)", (user_id, added_by, now_str())); conn.commit(); conn.close()


def remove_admin(user_id):
    conn=get_connection(); cur=conn.cursor(); cur.execute("DELETE FROM admins WHERE telegram_id=?", (user_id,)); conn.commit(); conn.close()


def set_ai_unlimited(user_id, enabled):
    conn=get_connection(); conn.execute("UPDATE users SET ai_unlimited=?, updated_at=? WHERE id=?", (1 if enabled else 0, now_str(), user_id)); conn.commit(); conn.close()


def ai_usage(user_id):
    conn=get_connection(); cur=conn.cursor(); day=today_str(); cur.execute("SELECT requests FROM ai_usage WHERE user_id=? AND usage_date=?", (user_id,day)); row=cur.fetchone(); conn.close(); return int(row[0]) if row else 0


def consume_ai(user_id, limit=10):
    conn=get_connection(); cur=conn.cursor(); day=today_str()
    cur.execute("SELECT ai_unlimited FROM users WHERE id=?", (user_id,)); user=cur.fetchone()
    unlimited=bool(user and user[0])
    if not unlimited:
        cur.execute("SELECT requests FROM ai_usage WHERE user_id=? AND usage_date=?", (user_id,day)); row=cur.fetchone(); used=int(row[0]) if row else 0
        if used >= limit:
            conn.close(); return False, used, limit
        cur.execute("""
        INSERT INTO ai_usage(user_id, usage_date, requests) VALUES(?,?,1)
        ON CONFLICT(user_id, usage_date) DO UPDATE SET requests=requests+1
        """, (user_id, day))
        used += 1
    else:
        used=ai_usage(user_id)
    conn.commit(); conn.close(); return True, used, None if unlimited else limit


def ai_status(user_id, limit=10):
    user=get_user(user_id); used=ai_usage(user_id); unlimited=bool(user and user["ai_unlimited"])
    return {"used": used, "limit": None if unlimited else limit, "remaining": None if unlimited else max(0,limit-used), "unlimited": unlimited}

def ai_can_use(user_id, limit=10):
    user=get_user(user_id)
    if user and user["ai_unlimited"]:
        return True
    return ai_usage(user_id) < limit


def save_schedule_file(user_id, filename, mime_type, storage_path):
    conn=get_connection(); cur=conn.cursor(); cur.execute("INSERT INTO schedule_files(user_id,filename,mime_type,storage_path,created_at) VALUES(?,?,?,?,?)", (user_id,filename,mime_type,storage_path,now_str())); fid=cur.lastrowid; conn.commit(); conn.close(); return fid


def clear_schedule(user_id):
    conn=get_connection(); cur=conn.cursor(); cur.execute("DELETE FROM schedule_items WHERE user_id=?", (user_id,)); cur.execute("DELETE FROM schedule_files WHERE user_id=?", (user_id,)); conn.commit(); conn.close()


def add_schedule_items(user_id, items, source_file_id=None):
    conn=get_connection(); cur=conn.cursor()
    for item in items:
        cur.execute("""
        INSERT INTO schedule_items(user_id,day_of_week,day_name,start_time,end_time,subject,room,teacher,notes,source_file_id,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
        """, (user_id,int(item.get("day_of_week",0)),item.get("day_name",""),item.get("start_time",""),item.get("end_time",""),item.get("subject",""),item.get("room",""),item.get("teacher",""),item.get("notes",""),source_file_id,now_str()))
    conn.commit(); conn.close()


def get_schedule(user_id):
    conn=get_connection(); cur=conn.cursor(); cur.execute("SELECT * FROM schedule_items WHERE user_id=? ORDER BY day_of_week,start_time", (user_id,)); rows=cur.fetchall(); conn.close(); return rows


def get_today_schedule(user_id, day_of_week):
    conn=get_connection(); cur=conn.cursor(); cur.execute("SELECT * FROM schedule_items WHERE user_id=? AND day_of_week=? ORDER BY start_time", (user_id,day_of_week)); rows=cur.fetchall(); conn.close(); return rows


def add_homework(user_id, title, description, due_at, file_path=None, file_name=None, mime_type=None):
    conn=get_connection(); cur=conn.cursor(); cur.execute("INSERT INTO homework(user_id,title,description,due_at,file_path,file_name,mime_type,created_at) VALUES(?,?,?,?,?,?,?,?)", (user_id,title,description,due_at,file_path,file_name,mime_type,now_str())); hid=cur.lastrowid; conn.commit(); conn.close(); return hid


def get_homework(user_id, include_completed=False):
    conn=get_connection(); cur=conn.cursor()
    q="SELECT * FROM homework WHERE user_id=?"
    args=[user_id]
    if not include_completed: q += " AND completed=0"
    q += " ORDER BY due_at"
    cur.execute(q,args); rows=cur.fetchall(); conn.close(); return rows


def get_homework_item(user_id, homework_id):
    conn=get_connection(); cur=conn.cursor(); cur.execute("SELECT * FROM homework WHERE id=? AND user_id=?", (homework_id,user_id)); row=cur.fetchone(); conn.close(); return row


def set_homework_completed(user_id, homework_id, completed):
    conn=get_connection(); conn.execute("UPDATE homework SET completed=? WHERE id=? AND user_id=?", (1 if completed else 0, homework_id,user_id)); conn.commit(); conn.close()


def delete_homework(user_id, homework_id):
    conn=get_connection(); conn.execute("DELETE FROM homework WHERE id=? AND user_id=?", (homework_id,user_id)); conn.commit(); conn.close()


def reminder_sent(user_id, key):
    conn=get_connection(); cur=conn.cursor(); cur.execute("SELECT 1 FROM reminder_log WHERE user_id=? AND reminder_key=?", (user_id,key)); ok=cur.fetchone() is not None; conn.close(); return ok


def mark_reminder(user_id,key):
    conn=get_connection(); conn.execute("INSERT OR IGNORE INTO reminder_log(user_id,reminder_key,sent_at) VALUES(?,?,?)", (user_id,key,now_str())); conn.commit(); conn.close()


def get_reminder_users():
    conn=get_connection(); cur=conn.cursor(); cur.execute("SELECT * FROM users WHERE reminders_enabled=1 AND (department IS NOT NULL OR group_name IS NOT NULL)"); rows=cur.fetchall(); conn.close(); return rows


def stats():
    conn=get_connection(); cur=conn.cursor()
    cur.execute("SELECT COUNT(*) FROM users"); total=cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM users WHERE university IS NOT NULL AND university!=''"); profiles=cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM users WHERE ai_unlimited=1"); unlimited=cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM homework WHERE completed=0"); homework=cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM schedule_items"); schedule=cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM admins"); admins=cur.fetchone()[0]
    conn.close()
    return {"users":total,"completed_profiles":profiles,"ai_unlimited":unlimited,"open_homework":homework,"schedule_items":schedule,"admins":admins}


def list_users(limit=200, offset=0, q=""):
    conn=get_connection(); cur=conn.cursor()
    if q:
        like=f"%{q}%"
        cur.execute("SELECT * FROM users WHERE CAST(id AS TEXT) LIKE ? OR username LIKE ? OR full_name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?", (like,like,like,limit,offset))
    else:
        cur.execute("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit,offset))
    rows=cur.fetchall(); conn.close(); return rows

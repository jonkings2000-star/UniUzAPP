import sqlite3
from datetime import datetime


DB_NAME = "uniuz.db"



# ==========================================================
# CONNECTION
# ==========================================================


def get_connection():

    conn = sqlite3.connect(DB_NAME)

    conn.row_factory = sqlite3.Row

    return conn





# ==========================================================
# DATABASE INIT
# ==========================================================


def init_db():

    conn = get_connection()

    cur = conn.cursor()
# USERS

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users(

        id INTEGER PRIMARY KEY,

        username TEXT,

        full_name TEXT,

        university TEXT,

        department TEXT,

        group_name TEXT,

        role TEXT,

        reminders_enabled INTEGER DEFAULT 1,

        created_at TEXT

    )
    """)



    # ROLE MIGRATION
    cur.execute("PRAGMA table_info(users)")
    user_columns = {row[1] for row in cur.fetchall()}

    if "role" not in user_columns:
        cur.execute("ALTER TABLE users ADD COLUMN role TEXT")



    # TEACHERS

    cur.execute("""
    CREATE TABLE IF NOT EXISTS teachers(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        telegram_id INTEGER UNIQUE,

        full_name TEXT,

        status TEXT DEFAULT 'pending',

        created_at TEXT

    )
    """)




    # ADMINS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS admins(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        added_by INTEGER,
        created_at TEXT
    )
    """)

    # Keep the original ADMIN_ID as a permanent/super admin.
    try:
        import os
        env_admin_id = os.getenv("ADMIN_ID")
        if env_admin_id:
            cur.execute("""
            INSERT OR IGNORE INTO admins(telegram_id, added_by, created_at)
            VALUES(?,?,?)
            """, (
                int(env_admin_id),
                int(env_admin_id),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ))
    except (ValueError, TypeError):
        pass

    # GROUPS

    cur.execute("""
    CREATE TABLE IF NOT EXISTS groups(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        department TEXT NOT NULL,

        group_name TEXT NOT NULL,

        UNIQUE(department,group_name)

    )
    """)



    # SCHEDULES

    cur.execute("""
    CREATE TABLE IF NOT EXISTS schedules(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        department TEXT NOT NULL,

        group_name TEXT NOT NULL,

        file_id TEXT NOT NULL,

        created_at TEXT,

        UNIQUE(department,group_name)

    )
    """)



    # SUBJECTS

    cur.execute("""
    CREATE TABLE IF NOT EXISTS subjects(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        teacher_id INTEGER NOT NULL,

        department TEXT NOT NULL,

        group_name TEXT NOT NULL,

        subject_name TEXT NOT NULL,

        created_at TEXT

    )
    """)



    # HOMEWORK
    # ----------------------------------------------------------
    # Безопасная миграция старой Mini App-схемы homework.
    # ----------------------------------------------------------

    cur.execute("""
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name='homework'
    """)
    homework_exists = cur.fetchone() is not None

    if homework_exists:
        cur.execute("PRAGMA table_info(homework)")
        homework_columns = {row[1] for row in cur.fetchall()}

        required_homework_columns = {
            "teacher_id",
            "department",
            "group_name",
            "subject_name",
            "task_text",
            "homework_date",
            "homework_time",
            "file_id",
            "file_type",
            "created_at"
        }

        if not required_homework_columns.issubset(homework_columns):
            cur.execute("DROP TABLE IF EXISTS homework_legacy")
            cur.execute("ALTER TABLE homework RENAME TO homework_legacy")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS homework(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        teacher_id INTEGER NOT NULL,

        department TEXT NOT NULL,

        group_name TEXT NOT NULL,

        subject_name TEXT NOT NULL,

        task_text TEXT NOT NULL,

        homework_date TEXT NOT NULL,

        homework_time TEXT NOT NULL,

        file_id TEXT,

        file_type TEXT,

        created_at TEXT

    )
    """)




    # Переносим старые задания, если таблица была устаревшей.
    cur.execute("""
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name='homework_legacy'
    """)
    legacy_exists = cur.fetchone() is not None

    if legacy_exists:
        cur.execute("""
            INSERT INTO homework(
                teacher_id,
                department,
                group_name,
                subject_name,
                task_text,
                homework_date,
                homework_time,
                file_id,
                file_type,
                created_at
            )
            SELECT
                h.teacher_id,
                COALESCE(u.department, ''),
                h.group_name,
                COALESCE(h.title, 'Задание'),
                COALESCE(h.description, ''),
                COALESCE(h.deadline, ''),
                '',
                NULL,
                NULL,
                COALESCE(h.created_at, datetime('now'))
            FROM homework_legacy h
            LEFT JOIN users u ON u.id = h.teacher_id
        """)
        cur.execute("DROP TABLE homework_legacy")

    # ANNOUNCEMENTS

    cur.execute("""
    CREATE TABLE IF NOT EXISTS announcements(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        teacher_id INTEGER NOT NULL,

        department TEXT NOT NULL,

        group_name TEXT NOT NULL,

        title TEXT NOT NULL,

        message TEXT NOT NULL,

        file_id TEXT,

        file_type TEXT,

        created_at TEXT

    )
    """)



    conn.commit()

    conn.close()





# ==========================================================
# USERS
# ==========================================================


def add_user(
    user_id,
    username=None,
    full_name=None
):

    conn=get_connection()

    cur=conn.cursor()


    now=datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


    cur.execute("""
    INSERT OR IGNORE INTO users(

        id,
        username,
        full_name,
        created_at

    )

    VALUES(?,?,?,?)

    """,(
        user_id,
        username,
        full_name,
        now
    ))


    cur.execute("""
    UPDATE users

    SET username=?,
        full_name=?

    WHERE id=?

    """,(
        username,
        full_name,
        user_id
    ))


    conn.commit()

    conn.close()
# ==========================================================
# USER FUNCTIONS
# ==========================================================


def get_user(user_id):

    conn = get_connection()

    cur = conn.cursor()


    cur.execute("""
    SELECT *

    FROM users

    WHERE id=?

    """,(user_id,))


    user = cur.fetchone()


    conn.close()


    return user





def update_user(
    user_id,
    university=None,
    department=None,
    group_name=None,
    role=None
):

    conn=get_connection()

    cur=conn.cursor()



    if university is not None:

        cur.execute("""
        UPDATE users

        SET university=?

        WHERE id=?

        """,(
            university,
            user_id
        ))



    if department is not None:

        cur.execute("""
        UPDATE users

        SET department=?

        WHERE id=?

        """,(
            department,
            user_id
        ))



    if group_name is not None:

        cur.execute("""
        UPDATE users

        SET group_name=?

        WHERE id=?

        """,(
            group_name,
            user_id
        ))



    if role is not None:
        cur.execute(
            "UPDATE users SET role=? WHERE id=?",
            (role, user_id)
        )

    conn.commit()

    conn.close()


def set_user_role(user_id, role):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET role=? WHERE id=?",
        (role, user_id)
    )
    conn.commit()
    conn.close()


def get_user_role(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT role FROM users WHERE id=?",
        (user_id,)
    )
    row = cur.fetchone()
    conn.close()
    return row["role"] if row else None







# ==========================================================
# TEACHERS
# ==========================================================


def add_teacher_request(
    telegram_id,
    full_name
):

    conn=get_connection()

    cur=conn.cursor()


    now=datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )



    cur.execute("""
    INSERT INTO teachers(

        telegram_id,

        full_name,

        status,

        created_at

    )

    VALUES(?,?,?,?)

    ON CONFLICT(telegram_id)

    DO UPDATE SET

        full_name=excluded.full_name,

        status='pending',

        created_at=excluded.created_at

    """,(
        telegram_id,
        full_name,
        "pending",
        now
    ))



    conn.commit()

    conn.close()





def get_teacher(
    telegram_id
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    SELECT *

    FROM teachers

    WHERE telegram_id=?

    """,(telegram_id,))


    teacher=cur.fetchone()


    conn.close()


    return teacher





def is_teacher(
    telegram_id
):

    teacher=get_teacher(
        telegram_id
    )


    return (

        teacher is not None

        and teacher["status"]=="approved"

    )





def approve_teacher(
    telegram_id
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    UPDATE teachers

    SET status='approved'

    WHERE telegram_id=?

    """,(telegram_id,))


    conn.commit()

    conn.close()





def reject_teacher(
    telegram_id
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    UPDATE teachers

    SET status='rejected'

    WHERE telegram_id=?

    """,(telegram_id,))


    conn.commit()

    conn.close()





def get_pending_teachers():

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    SELECT *

    FROM teachers

    WHERE status='pending'

    ORDER BY id DESC

    """)


    rows=cur.fetchall()


    conn.close()


    return rows






# ==========================================================
# ADMINS
# ==========================================================

def is_admin(telegram_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM admins WHERE telegram_id=? LIMIT 1",
        (telegram_id,)
    )
    row = cur.fetchone()
    conn.close()
    return row is not None


def add_admin(telegram_id, added_by=None):
    conn = get_connection()
    cur = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute("""
        INSERT OR IGNORE INTO admins(telegram_id, added_by, created_at)
        VALUES(?,?,?)
    """, (telegram_id, added_by, now))
    conn.commit()
    added = cur.rowcount > 0
    conn.close()
    return added


def remove_admin(telegram_id, requester_id=None):
    conn = get_connection()
    cur = conn.cursor()

    # The original ADMIN_ID cannot be removed through the bot.
    try:
        import os
        root_id = int(os.getenv("ADMIN_ID", "0"))
    except ValueError:
        root_id = 0

    if telegram_id == root_id:
        conn.close()
        return False

    cur.execute(
        "DELETE FROM admins WHERE telegram_id=?",
        (telegram_id,)
    )
    removed = cur.rowcount > 0
    conn.commit()
    conn.close()
    return removed


def get_admins():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT telegram_id, added_by, created_at
        FROM admins
        ORDER BY id ASC
    """)
    rows = cur.fetchall()
    conn.close()
    return rows


# ==========================================================
# GROUPS
# ==========================================================


def add_group(
    department,
    group_name
):

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    INSERT OR IGNORE INTO groups(

        department,

        group_name

    )

    VALUES(?,?)

    """,(
        department,
        group_name
    ))



    conn.commit()

    conn.close()





def get_groups(
    department
):

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    SELECT group_name

    FROM groups

    WHERE department=?

    ORDER BY group_name

    """,(department,))


    rows=cur.fetchall()


    conn.close()


    return [

        row["group_name"]

        for row in rows

    ]





def delete_group(
    department,
    group_name
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    DELETE FROM groups

    WHERE department=?

    AND group_name=?

    """,(
        department,
        group_name
    ))



    conn.commit()

    conn.close()
# ==========================================================
# SCHEDULES
# ==========================================================


def save_schedule_image(
    department,
    group_name,
    file_id
):

    conn=get_connection()

    cur=conn.cursor()


    now=datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


    cur.execute("""
    INSERT INTO schedules(

        department,

        group_name,

        file_id,

        created_at

    )

    VALUES(?,?,?,?)

    ON CONFLICT(department,group_name)

    DO UPDATE SET

        file_id=excluded.file_id,

        created_at=excluded.created_at

    """,(
        department,
        group_name,
        file_id,
        now
    ))



    conn.commit()

    conn.close()





def get_schedule_image(
    department,
    group_name
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    SELECT file_id

    FROM schedules

    WHERE department=?

    AND group_name=?

    """,(
        department,
        group_name
    ))


    row=cur.fetchone()


    conn.close()


    if row:

        return row["file_id"]


    return None





def delete_schedule_image(
    department,
    group_name
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    DELETE FROM schedules

    WHERE department=?

    AND group_name=?

    """,(
        department,
        group_name
    ))



    conn.commit()

    conn.close()





# ==========================================================
# REMINDERS
# ==========================================================


def reminders_enabled(
    user_id
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    SELECT reminders_enabled

    FROM users

    WHERE id=?

    """,(user_id,))


    row=cur.fetchone()


    conn.close()



    if not row:

        return False



    return bool(
        row["reminders_enabled"]
    )





def set_reminders(
    user_id,
    enabled
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    UPDATE users

    SET reminders_enabled=?

    WHERE id=?

    """,(
        1 if enabled else 0,

        user_id
    ))


    conn.commit()

    conn.close()





def get_enabled_reminder_users():

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    SELECT

        id,

        university,

        department,

        group_name


    FROM users

    WHERE reminders_enabled=1

    """)



    rows=cur.fetchall()


    conn.close()



    return [

        (

            row["id"],

            row["university"],

            row["department"],

            row["group_name"]

        )

        for row in rows

    ]





# ==========================================================
# SUBJECTS
# ==========================================================


def add_subject(
    teacher_id,
    department,
    group_name,
    subject_name
):

    conn=get_connection()

    cur=conn.cursor()


    now=datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


    cur.execute("""
    INSERT INTO subjects(

        teacher_id,

        department,

        group_name,

        subject_name,

        created_at

    )

    VALUES(?,?,?,?,?)

    """,(
        teacher_id,

        department,

        group_name,

        subject_name,

        now
    ))



    conn.commit()

    conn.close()





def get_teacher_subjects(
    teacher_id
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    SELECT *

    FROM subjects

    WHERE teacher_id=?

    ORDER BY id DESC

    """,(teacher_id,))


    rows=cur.fetchall()


    conn.close()


    return rows





# ==========================================================
# HOMEWORK
# ==========================================================


def add_homework(
    teacher_id,
    department=None,
    group_name=None,
    subject_name=None,
    task_text=None,
    homework_date=None,
    homework_time=None,
    file_id=None,
    file_type=None,
    title=None,
    description=None,
    deadline=None
):
    """
    Основная функция создания задания.

    Поддерживает старый вызов бота:
        add_homework(teacher_id, department, group_name,
                     subject_name, task_text, homework_date,
                     homework_time, file_id, file_type)

    И вызов Mini App:
        teacher_id, title, description, group_name, deadline
        (через именованные аргументы).
    """

    if title is not None or description is not None or deadline is not None:
        subject_name = title or subject_name or "Задание"
        task_text = description or task_text or ""
        homework_date = deadline or homework_date or ""
        homework_time = homework_time or ""

        if not department:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT department FROM users WHERE id=?",
                (teacher_id,)
            )
            row = cur.fetchone()
            conn.close()
            department = row["department"] if row and row["department"] else ""

    department = department or ""
    group_name = group_name or ""
    subject_name = subject_name or "Задание"
    task_text = task_text or ""
    homework_date = homework_date or ""
    homework_time = homework_time or ""

    conn = get_connection()
    cur = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
    INSERT INTO homework(
        teacher_id,
        department,
        group_name,
        subject_name,
        task_text,
        homework_date,
        homework_time,
        file_id,
        file_type,
        created_at
    )
    VALUES(?,?,?,?,?,?,?,?,?,?)
    """, (
        teacher_id,
        department,
        group_name,
        subject_name,
        task_text,
        homework_date,
        homework_time,
        file_id,
        file_type,
        now
    ))

    homework_id = cur.lastrowid
    conn.commit()
    conn.close()
    return homework_id


def get_homework(
    homework_id
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    SELECT *

    FROM homework

    WHERE id=?

    """,(homework_id,))


    row=cur.fetchone()


    conn.close()


    return row





def get_teacher_homework(
    teacher_id
):

    conn=get_connection()

    cur=conn.cursor()


    cur.execute("""
    SELECT *

    FROM homework

    WHERE teacher_id=?

    ORDER BY id DESC

    """,(teacher_id,))


    rows=cur.fetchall()


    conn.close()


    return rows





def get_student_homework(
    department,
    group_name
):

    conn = get_connection()
    cur = conn.cursor()

    if department:
        cur.execute("""
        SELECT *
        FROM homework
        WHERE department=?
        AND group_name=?
        ORDER BY id DESC
        """, (
            department,
            group_name
        ))
    else:
        cur.execute("""
        SELECT *
        FROM homework
        WHERE group_name=?
        ORDER BY id DESC
        """, (
            group_name,
        ))

    rows = cur.fetchall()
    conn.close()
    return rows


# ==========================================================
# DELETE HOMEWORK
# ==========================================================


def delete_homework(
    homework_id,
    teacher_id
):

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    DELETE FROM homework

    WHERE id=?

    AND teacher_id=?

    """,(
        homework_id,

        teacher_id

    ))



    conn.commit()

    conn.close()





# ==========================================================
# ANNOUNCEMENTS
# ==========================================================


def add_announcement(
    teacher_id,
    department,
    group_name,
    title,
    message,
    file_id=None,
    file_type=None
):

    conn=get_connection()

    cur=conn.cursor()



    now=datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )



    cur.execute("""
    INSERT INTO announcements(

        teacher_id,

        department,

        group_name,

        title,

        message,

        file_id,

        file_type,

        created_at

    )

    VALUES(?,?,?,?,?,?,?,?)

    """,(
        teacher_id,

        department,

        group_name,

        title,

        message,

        file_id,

        file_type,

        now

    ))



    announcement_id=cur.lastrowid



    conn.commit()

    conn.close()



    return announcement_id





def get_students_by_group(
    department,
    group_name
):

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    SELECT id

    FROM users

    WHERE department=?

    AND group_name=?

    """,(
        department,

        group_name

    ))



    rows=cur.fetchall()



    conn.close()



    return rows





def get_student_announcements(
    department,
    group_name
):

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    SELECT *

    FROM announcements

    WHERE department=?

    AND group_name=?

    ORDER BY id DESC

    """,(
        department,

        group_name

    ))



    rows=cur.fetchall()



    conn.close()



    return rows





def get_teacher_announcements(
    teacher_id
):

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    SELECT *

    FROM announcements

    WHERE teacher_id=?

    ORDER BY id DESC

    """,(
        teacher_id,

    ))



    rows=cur.fetchall()



    conn.close()



    return rows





def delete_announcement(
    announcement_id,
    teacher_id
):

    conn=get_connection()

    cur=conn.cursor()



    cur.execute("""
    DELETE FROM announcements

    WHERE id=?

    AND teacher_id=?

    """,(
        announcement_id,

        teacher_id

    ))



    conn.commit()

    conn.close()





# ==========================================================
# STATISTICS
# ==========================================================


def get_statistics():
    conn = get_connection()
    cur = conn.cursor()

    def count(table, where=None, params=()):
        query = f"SELECT COUNT(*) AS total FROM {table}"
        if where:
            query += f" WHERE {where}"
        cur.execute(query, params)
        return cur.fetchone()["total"]

    stats = {
        "users": count("users"),
        "approved_teachers": count("teachers", "status=?", ("approved",)),
        "pending_teachers": count("teachers", "status=?", ("pending",)),
        "groups": count("groups"),
        "schedules": count("schedules"),
        "subjects": count("subjects"),
        "homework": count("homework"),
        "announcements": count("announcements"),
        "reminders_enabled": count("users", "reminders_enabled=1"),
        "updated_at": datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    }

    conn.close()
    return stats


# ==========================================================
# START DATABASE
# ==========================================================


if __name__ == "__main__":

    init_db()

    print(
        "UniUZ Database initialized successfully!"
    )

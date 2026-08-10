
import os
import asyncio
from openai import AsyncOpenAI

from dotenv import load_dotenv

load_dotenv()

from aiohttp import web
from web_api import create_app

from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message,
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    CallbackQuery
)

import database


TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID", "6477136658"))

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

bot = Bot(TOKEN)
dp = Dispatcher()


# ==========================
# MENUS
# ==========================

main_menu = ReplyKeyboardMarkup(
    keyboard=[
        [
            KeyboardButton(text="🎓 Student / 학생"),
            KeyboardButton(text="👨‍🏫 Professor / 교수님")
        ],
        [
            KeyboardButton(text="⚙️ Settings / 설정")
        ]
    ],
    resize_keyboard=True
)


student_menu = ReplyKeyboardMarkup(
    keyboard=[
        [
            KeyboardButton(text="📅 Schedule / 시간표"),
            KeyboardButton(text="📚 Homework / 과제")
        ],
        [
            KeyboardButton(text="📢 Announcements / 공지사항")
        ],
        [
            KeyboardButton(text="🔔 Reminders / 알림"),
            KeyboardButton(text="🤖 AI Assistant / AI 도우미")
        ],
        [
            KeyboardButton(text="⬅️ Back / 뒤로")
        ]
    ],
    resize_keyboard=True
)


teacher_menu = ReplyKeyboardMarkup(
    keyboard=[
        [
            KeyboardButton(text="➕ Add Homework / 과제 등록")
        ],
        [
            KeyboardButton(text="📢 Create Announcement / 공지 작성")
        ],
        [
            KeyboardButton(text="📋 My Homework / 내 과제"),
            KeyboardButton(text="📚 My Subjects / 내 과목")
        ],
        [
            KeyboardButton(text="⬅️ Back / 뒤로")
        ]
    ],
    resize_keyboard=True
)


admin_menu = ReplyKeyboardMarkup(
    keyboard=[
        [
            KeyboardButton(text="📷 Upload Schedule / 시간표 업로드"),
            KeyboardButton(text="🖼 View Schedule / 시간표 보기")
        ],
        [
            KeyboardButton(text="➕ Add Group / 그룹 추가"),
            KeyboardButton(text="👥 Groups / 그룹")
        ],
        [
            KeyboardButton(text="🗑 Delete Schedule / 시간표 삭제")
        ],
        [
            KeyboardButton(text="👨‍🏫 Professor Requests / 교수 신청")
        ],
        [
            KeyboardButton(text="📊 Statistics / 통계")
        ],
        [
            KeyboardButton(text="⬅️ Exit Admin / 관리자 종료")
        ]
    ],
    resize_keyboard=True
)


teacher_state = {}
admin_state = {}


def is_admin(user_id):
    return user_id == ADMIN_ID


# ==========================
# START
# ==========================

@dp.message(F.text == "/start")
async def start(message: Message):

    database.add_user(
        message.from_user.id,
        message.from_user.username,
        message.from_user.full_name
    )

    await message.answer(
        "Welcome to UniUZ / UniUZ에 오신 것을 환영합니다",
        reply_markup=main_menu
    )


# ==========================
# STUDENT
# ==========================

student_state = {}

@dp.message(F.text == "🎓 Student / 학생")
async def student(message: Message):

    user_id = message.from_user.id

    database.add_user(
        user_id,
        message.from_user.username,
        message.from_user.full_name
    )

    user = database.get_user(user_id)

    if not user or not user["department"] or not user["group_name"]:
        student_state[user_id] = {
            "step": "department"
        }

        await message.answer(
            "🎓 <b>Student Setup / 학생 등록</b>\n\n"
            "Step 1/2\n"
            "Choose department / 학과를 선택하세요.",
            reply_markup=departments_keyboard(),
            parse_mode="HTML"
        )
        return

    await message.answer(
        "🎓 Student Menu / 학생 메뉴",
        reply_markup=student_menu
    )




# ==========================
# STUDENT SETUP
# ==========================

@dp.message(
    lambda message: isinstance(
        student_state.get(message.from_user.id), dict
    )
)
async def student_setup_handler(message: Message):

    user_id = message.from_user.id
    state = student_state.get(user_id)

    if not state:
        return

    text_value = (message.text or "").strip()

    if text_value == "⬅️ Back / 뒤로":
        student_state[user_id] = None
        await message.answer(
            "Main Menu / 메인 메뉴",
            reply_markup=main_menu
        )
        return

    if state["step"] == "department":

        if text_value not in DEPARTMENTS:
            await message.answer(
                "Please choose a department button / 학과 버튼을 선택하세요."
            )
            return

        department = DEPARTMENTS[text_value]
        groups = database.get_groups(department)

        if not groups:
            await message.answer(
                "No groups are available for this department. "
                "Please ask the administrator to add your group. / "
                "이 학과에는 등록된 그룹이 없습니다. 관리자에게 그룹 추가를 요청하세요."
            )
            return

        state["department"] = department
        state["step"] = "group"

        await message.answer(
            "👥 <b>Step 2/2</b>\n\n"
            "Choose your group / 그룹을 선택하세요.",
            reply_markup=groups_keyboard(groups),
            parse_mode="HTML"
        )
        return

    if state["step"] == "group":

        if not text_value.startswith("👥 "):
            await message.answer(
                "Please choose a group button / 그룹 버튼을 선택하세요."
            )
            return

        group_name = text_value[2:].strip()

        if group_name not in database.get_groups(state["department"]):
            await message.answer(
                "Group not found / 그룹을 찾을 수 없습니다."
            )
            return

        database.update_user(
            user_id,
            university="Ajou University in Tashkent",
            department=state["department"],
            group_name=group_name
        )

        student_state[user_id] = None

        await message.answer(
            "✅ <b>Student profile saved / 학생 정보가 저장되었습니다!</b>\n\n"
            f"🏛 {state['department']}\n"
            f"👥 {group_name}",
            reply_markup=student_menu,
            parse_mode="HTML"
        )
        return


# ==========================
# STUDENT - SCHEDULE
# ==========================

@dp.message(F.text == "📅 Schedule / 시간표")
async def student_schedule(message: Message):

    user = database.get_user(message.from_user.id)

    if not user or not user["department"] or not user["group_name"]:
        await message.answer(
            "Please choose your department and group first / "
            "먼저 학과와 그룹을 선택하세요."
        )
        return

    file_id = database.get_schedule_image(
        user["department"],
        user["group_name"]
    )

    if not file_id:
        await message.answer(
            "📅 No schedule has been uploaded yet / "
            "아직 시간표가 업로드되지 않았습니다.",
            reply_markup=student_menu
        )
        return

    await message.answer_photo(
        file_id,
        caption=(
            f"📅 <b>Schedule / 시간표</b>\n\n"
            f"🏛 {user['department']}\n"
            f"👥 {user['group_name']}"
        ),
        parse_mode="HTML"
    )


# ==========================
# STUDENT - HOMEWORK
# ==========================

@dp.message(F.text == "📚 Homework / 과제")
async def student_homework(message: Message):

    user = database.get_user(message.from_user.id)

    if not user or not user["department"] or not user["group_name"]:
        await message.answer(
            "Please choose your department and group first / "
            "먼저 학과와 그룹을 선택하세요."
        )
        return

    rows = database.get_student_homework(
        user["department"],
        user["group_name"]
    )

    if not rows:
        await message.answer(
            "📚 No homework / 등록된 과제가 없습니다.",
            reply_markup=student_menu
        )
        return

    for row in rows:

        await message.answer(
            "📚 <b>Homework / 과제</b>\n\n"
            f"📖 {row['subject_name']}\n"
            f"📝 {row['task_text']}\n"
            f"📅 {row['homework_date']}\n"
            f"⏰ {row['homework_time']}",
            parse_mode="HTML"
        )

        if row["file_id"]:
            try:
                if row["file_type"] == "photo":
                    await message.answer_photo(row["file_id"])
                elif row["file_type"] == "document":
                    await message.answer_document(row["file_id"])
            except Exception as exc:
                print(f"Homework file error: {exc}")



# ==========================
# DEPARTMENTS / GROUP KEYBOARDS
# ==========================

DEPARTMENTS = {
    "🏛 Architecture": "Architecture",
    "🎨 Interior Design": "Interior Design",
    "🏗 Civil Systems Engineering": "Civil Systems Engineering",
    "⚡ Electrical & Computer Engineering": "Electrical & Computer Engineering",
    "🤖 AI Software": "AI Software",
    "💻 IT Business": "IT Business",
    "📊 Business Administration": "Business Administration",
    "🇬🇧 English Philology & Management": "English Philology & Management",
    "🇰🇷 Korean Philology & Management": "Korean Philology & Management",
}


def departments_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=name)]
            for name in DEPARTMENTS
        ] + [[KeyboardButton(text="⬅️ Back / 뒤로")]],
        resize_keyboard=True
    )


def groups_keyboard(groups):
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=f"👥 {group}")]
            for group in groups
        ] + [[KeyboardButton(text="⬅️ Back / 뒤로")]],
        resize_keyboard=True
    )


# ==========================
# ROLE-AWARE ANNOUNCEMENTS
# ==========================

@dp.message(F.text == "📢 Announcements / 공지사항")
async def student_announcements_handler(message: Message):

    user_id = message.from_user.id
    user = database.get_user(user_id)

    if not user or not user["department"] or not user["group_name"]:
        await message.answer(
            "Please choose your department and group first / "
            "먼저 학과와 그룹을 선택하세요.",
            reply_markup=student_menu
        )
        return

    rows = database.get_student_announcements(
        user["department"],
        user["group_name"]
    )

    if not rows:
        await message.answer(
            "No announcements / 공지가 없습니다.",
            reply_markup=student_menu
        )
        return

    for row in rows:
        await message.answer(
            f"📢 <b>{row['title']}</b>\n\n{row['message']}",
            parse_mode="HTML"
        )

        if row["file_id"]:
            try:
                if row["file_type"] == "photo":
                    await message.answer_photo(row["file_id"])
                elif row["file_type"] == "document":
                    await message.answer_document(row["file_id"])
            except Exception as exc:
                print(f"Announcement file error: {exc}")


# ==========================
# PROFESSOR - ADD HOMEWORK
# ==========================

@dp.message(F.text == "➕ Add Homework / 과제 등록")
async def homework_start(message: Message):
    user_id = message.from_user.id

    if not database.is_teacher(user_id):
        await message.answer(
            "⛔ Professor access required / 교수 권한이 필요합니다.",
            reply_markup=main_menu
        )
        return

    teacher_state[user_id] = {
        "action": "add_homework",
        "step": "department"
    }

    await message.answer(
        "📝 <b>Add Homework / 과제 등록</b>\n\n"
        "Step 1/7\n"
        "Choose department / 학과를 선택하세요.",
        reply_markup=departments_keyboard(),
        parse_mode="HTML"
    )



# ==========================
# PROFESSOR
# ==========================

@dp.message(F.text == "👨‍🏫 Professor / 교수님")
async def professor(message: Message):

    if database.is_teacher(message.from_user.id):

        await message.answer(
            "Professor Menu / 교수 메뉴",
            reply_markup=teacher_menu
        )

    else:

        database.add_teacher_request(
            message.from_user.id,
            message.from_user.full_name
        )

        await message.answer(
            "Professor request sent / 교수 신청 완료"
        )


@dp.message(F.text == "📋 My Homework / 내 과제")
async def my_homework(message: Message):

    if not database.is_teacher(message.from_user.id):
        return

    rows = database.get_teacher_homework(
        message.from_user.id
    )

    if not rows:
        await message.answer("No homework")
        return

    for row in rows:
        await message.answer(
            f"📚 {row['subject_name']}\n{row['task_text']}"
        )


# ==========================
# ADMIN
# ==========================

@dp.message(F.text == "/admin")
async def admin(message: Message):

    if not is_admin(message.from_user.id):
        return

    teacher_state[message.from_user.id] = None
    admin_state[message.from_user.id] = None

    await message.answer(
        "Admin Panel / 관리자 패널",
        reply_markup=admin_menu
    )


@dp.message(F.text == "📊 Statistics / 통계")
async def admin_statistics(message: Message):

    if not is_admin(message.from_user.id):
        return

    stats = database.get_statistics()

    await message.answer(
        "📊 <b>UniUZ Statistics / UniUZ 통계</b>\n\n"
        f"👥 <b>Users:</b> {stats['users']}\n"
        f"👨‍🏫 <b>Approved professors:</b> {stats['approved_teachers']}\n"
        f"⏳ <b>Pending professor requests:</b> {stats['pending_teachers']}\n"
        f"👥 <b>Groups:</b> {stats['groups']}\n"
        f"📅 <b>Schedules:</b> {stats['schedules']}\n"
        f"📚 <b>Subjects:</b> {stats['subjects']}\n"
        f"📝 <b>Homework:</b> {stats['homework']}\n"
        f"📢 <b>Announcements:</b> {stats['announcements']}\n"
        f"🔔 <b>Reminders enabled:</b> {stats['reminders_enabled']}\n\n"
        f"🕐 <b>Database time:</b> {stats['updated_at']}",
        reply_markup=admin_menu,
        parse_mode="HTML"
    )


@dp.message(F.text == "👨‍🏫 Professor Requests / 교수 신청")
async def requests(message: Message):

    if not is_admin(message.from_user.id):
        return

    teachers = database.get_pending_teachers()

    if not teachers:
        await message.answer("No requests")
        return

    for t in teachers:

        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="✅ Approve",
                        callback_data=f"approve:{t['telegram_id']}"
                    ),
                    InlineKeyboardButton(
                        text="❌ Reject",
                        callback_data=f"reject:{t['telegram_id']}"
                    )
                ]
            ]
        )

        await message.answer(
            f"👨‍🏫 {t['full_name']}",
            reply_markup=kb
        )


@dp.callback_query(F.data.startswith("approve:"))
async def approve(call: CallbackQuery):

    if not is_admin(call.from_user.id):
        return

    user_id = int(call.data.split(":")[1])

    database.approve_teacher(user_id)

    await call.answer("Approved")


@dp.callback_query(F.data.startswith("reject:"))
async def reject(call: CallbackQuery):

    if not is_admin(call.from_user.id):
        return

    user_id = int(call.data.split(":")[1])

    database.reject_teacher(user_id)

    await call.answer("Rejected")



# ==========================
# PROFESSOR - MY SUBJECTS
# ==========================

@dp.message(F.text == "📚 My Subjects / 내 과목")
async def professor_my_subjects(message: Message):
    user_id = message.from_user.id

    if not database.is_teacher(user_id):
        await message.answer(
            "⛔ Professor access required / 교수 권한이 필요합니다.",
            reply_markup=main_menu
        )
        return

    # Prefer subjects explicitly assigned to the professor if the database
    # provides such a function. Otherwise derive subjects from published
    # homework created by this professor.
    subjects = []

    if hasattr(database, "get_teacher_subjects"):
        try:
            subjects = database.get_teacher_subjects(user_id) or []
        except Exception as exc:
            print(f"get_teacher_subjects error: {exc}")

    if not subjects:
        try:
            homework_rows = database.get_teacher_homework(user_id) or []
            seen = set()

            for row in homework_rows:
                name = row["subject_name"]
                if name and name not in seen:
                    seen.add(name)
                    subjects.append(name)
        except Exception as exc:
            print(f"get_teacher_homework error: {exc}")

    if not subjects:
        await message.answer(
            "📚 <b>My Subjects / 내 과목</b>\n\n"
            "No subjects yet / 등록된 과목이 없습니다.\n\n"
            "Create homework first to add a subject / "
            "먼저 과제를 등록하면 과목이 표시됩니다.",
            reply_markup=teacher_menu,
            parse_mode="HTML"
        )
        return

    lines = [
        "📚 <b>My Subjects / 내 과목</b>\n"
    ]

    for index, subject in enumerate(subjects, 1):
        if isinstance(subject, dict):
            name = (
                subject.get("subject_name")
                or subject.get("name")
                or subject.get("title")
                or "Unknown"
            )
        else:
            name = str(subject)

        lines.append(f"{index}. 📖 {name}")

    await message.answer(
        "\n".join(lines),
        reply_markup=teacher_menu,
        parse_mode="HTML"
    )


@dp.message(F.text == "⬅️ Back / 뒤로")
async def back(message: Message):

    await message.answer(
        "Main Menu",
        reply_markup=main_menu
    )



# ==========================
# ADMIN - ADD GROUP
# ==========================

@dp.message(F.text == "➕ Add Group / 그룹 추가")
async def admin_add_group_start(message: Message):
    if not is_admin(message.from_user.id):
        return

    admin_state[message.from_user.id] = {
        "action": "add_group",
        "step": "department"
    }

    await message.answer(
        "➕ <b>Add Group / 그룹 추가</b>\n\n"
        "Step 1/2\nChoose department / 학과를 선택하세요.",
        reply_markup=departments_keyboard(),
        parse_mode="HTML"
    )


@dp.message(F.text == "👥 Groups / 그룹")
async def admin_groups(message: Message):
    if not is_admin(message.from_user.id):
        return

    parts = ["👥 <b>Groups / 그룹</b>\n"]

    for department in DEPARTMENTS.values():
        groups = database.get_groups(department)
        if groups:
            parts.append(f"📚 <b>{department}</b>")
            parts.extend(f"• {g}" for g in groups)
            parts.append("")

    if len(parts) == 1:
        parts.append("No groups / 등록된 그룹이 없습니다.")

    await message.answer(
        "\n".join(parts),
        reply_markup=admin_menu,
        parse_mode="HTML"
    )


@dp.message(F.text == "📷 Upload Schedule / 시간표 업로드")
async def admin_upload_schedule_start(message: Message):
    if not is_admin(message.from_user.id):
        return

    admin_state[message.from_user.id] = {
        "action": "upload_schedule",
        "step": "department"
    }

    await message.answer(
        "📷 <b>Upload Schedule / 시간표 업로드</b>\n\n"
        "Step 1/3\nChoose department / 학과를 선택하세요.",
        reply_markup=departments_keyboard(),
        parse_mode="HTML"
    )


@dp.message(F.text == "🖼 View Schedule / 시간표 보기")
async def admin_view_schedule_start(message: Message):
    if not is_admin(message.from_user.id):
        return

    admin_state[message.from_user.id] = {
        "action": "view_schedule",
        "step": "department"
    }

    await message.answer(
        "🖼 <b>View Schedule / 시간표 보기</b>\n\n"
        "Choose department / 학과를 선택하세요.",
        reply_markup=departments_keyboard(),
        parse_mode="HTML"
    )


@dp.message(F.text == "🗑 Delete Schedule / 시간표 삭제")
async def admin_delete_schedule_start(message: Message):
    if not is_admin(message.from_user.id):
        return

    admin_state[message.from_user.id] = {
        "action": "delete_schedule",
        "step": "department"
    }

    await message.answer(
        "🗑 <b>Delete Schedule / 시간표 삭제</b>\n\n"
        "Choose department / 학과를 선택하세요.",
        reply_markup=departments_keyboard(),
        parse_mode="HTML"
    )


@dp.message(
    lambda message: (
        is_admin(message.from_user.id)
        and isinstance(admin_state.get(message.from_user.id), dict)
    )
)
async def admin_state_handler(message: Message):
    user_id = message.from_user.id

    if not is_admin(user_id):
        return

    state = admin_state.get(user_id)

    if not isinstance(state, dict):
        return

    action = state.get("action")
    step = state.get("step")
    text_value = (message.text or "").strip()

    if text_value == "⬅️ Back / 뒤로":
        admin_state[user_id] = None
        await message.answer(
            "Admin Panel / 관리자 패널",
            reply_markup=admin_menu
        )
        return

    # ADD GROUP
    if action == "add_group":
        if step == "department":
            if text_value not in DEPARTMENTS:
                await message.answer(
                    "Please choose a department button / 학과 버튼을 선택하세요."
                )
                return

            state["department"] = DEPARTMENTS[text_value]
            state["step"] = "group_name"

            await message.answer(
                "Step 2/2\n"
                "Enter group name / 그룹명을 입력하세요."
            )
            return

        if step == "group_name":
            if not text_value:
                await message.answer(
                    "Enter group name / 그룹명을 입력하세요."
                )
                return

            database.add_group(
                state["department"],
                text_value
            )

            admin_state[user_id] = None

            await message.answer(
                "✅ Group added / 그룹이 추가되었습니다.\n\n"
                f"📚 {state['department']}\n"
                f"👥 {text_value}",
                reply_markup=admin_menu
            )
            return

    # UPLOAD SCHEDULE
    if action == "upload_schedule":
        if step == "department":
            if text_value not in DEPARTMENTS:
                await message.answer(
                    "Please choose a department button / 학과 버튼을 선택하세요."
                )
                return

            state["department"] = DEPARTMENTS[text_value]
            state["step"] = "group"

            groups = database.get_groups(state["department"])

            if not groups:
                admin_state[user_id] = None
                await message.answer(
                    "No groups are available. Add a group first / "
                    "등록된 그룹이 없습니다. 먼저 그룹을 추가하세요.",
                    reply_markup=admin_menu
                )
                return

            await message.answer(
                "Step 2/3\nChoose group / 그룹을 선택하세요.",
                reply_markup=groups_keyboard(groups)
            )
            return

        if step == "group":
            if not text_value.startswith("👥 "):
                await message.answer(
                    "Please choose a group button / 그룹 버튼을 선택하세요."
                )
                return

            group_name = text_value[2:].strip()

            if group_name not in database.get_groups(state["department"]):
                await message.answer(
                    "Group not found / 그룹을 찾을 수 없습니다."
                )
                return

            state["group_name"] = group_name
            state["step"] = "file"

            await message.answer(
                "Step 3/3\n"
                "Send the schedule image / 시간표 이미지를 보내세요."
            )
            return

        if step == "file":
            if not message.photo:
                await message.answer(
                    "Please send a photo / 사진을 보내주세요."
                )
                return

            file_id = message.photo[-1].file_id

            database.save_schedule_image(
                state["department"],
                state["group_name"],
                file_id
            )

            admin_state[user_id] = None

            await message.answer(
                "✅ Schedule saved / 시간표가 저장되었습니다.",
                reply_markup=admin_menu
            )
            return

    # VIEW SCHEDULE
    if action == "view_schedule":
        if step == "department":
            if text_value not in DEPARTMENTS:
                await message.answer(
                    "Please choose a department button / 학과 버튼을 선택하세요."
                )
                return

            state["department"] = DEPARTMENTS[text_value]
            state["step"] = "group"

            groups = database.get_groups(state["department"])

            if not groups:
                admin_state[user_id] = None
                await message.answer(
                    "No groups / 등록된 그룹이 없습니다.",
                    reply_markup=admin_menu
                )
                return

            await message.answer(
                "Choose group / 그룹을 선택하세요.",
                reply_markup=groups_keyboard(groups)
            )
            return

        if step == "group":
            if not text_value.startswith("👥 "):
                await message.answer(
                    "Please choose a group button / 그룹 버튼을 선택하세요."
                )
                return

            group_name = text_value[2:].strip()

            file_id = database.get_schedule_image(
                state["department"],
                group_name
            )

            admin_state[user_id] = None

            if not file_id:
                await message.answer(
                    "No schedule found / 시간표가 없습니다.",
                    reply_markup=admin_menu
                )
                return

            await message.answer_photo(
                file_id,
                caption=f"📅 {state['department']}\n👥 {group_name}",
                reply_markup=admin_menu
            )
            return

    # DELETE SCHEDULE
    if action == "delete_schedule":
        if step == "department":
            if text_value not in DEPARTMENTS:
                await message.answer(
                    "Please choose a department button / 학과 버튼을 선택하세요."
                )
                return

            state["department"] = DEPARTMENTS[text_value]
            state["step"] = "group"

            groups = database.get_groups(state["department"])

            if not groups:
                admin_state[user_id] = None
                await message.answer(
                    "No groups / 등록된 그룹이 없습니다.",
                    reply_markup=admin_menu
                )
                return

            await message.answer(
                "Choose group / 그룹을 선택하세요.",
                reply_markup=groups_keyboard(groups)
            )
            return

        if step == "group":
            if not text_value.startswith("👥 "):
                await message.answer(
                    "Please choose a group button / 그룹 버튼을 선택하세요."
                )
                return

            group_name = text_value[2:].strip()

            database.delete_schedule_image(
                state["department"],
                group_name
            )

            admin_state[user_id] = None

            await message.answer(
                "🗑 Schedule deleted / 시간표가 삭제되었습니다.",
                reply_markup=admin_menu
            )
            return



# ==========================
# PROFESSOR - CREATE ANNOUNCEMENT
# ==========================

@dp.message(F.text == "📢 Create Announcement / 공지 작성")
async def professor_announcements_start(message: Message):
    user_id = message.from_user.id

    if not database.is_teacher(user_id):
        await message.answer(
            "⛔ Professor access required / 교수 권한이 필요합니다.",
            reply_markup=main_menu
        )
        return

    teacher_state[user_id] = {
        "action": "add_announcement",
        "step": "department"
    }

    await message.answer(
        "📢 <b>Create Announcement / 공지 작성</b>\n\n"
        "Step 1/5\n"
        "Choose department / 학과를 선택하세요.",
        reply_markup=departments_keyboard(),
        parse_mode="HTML"
    )


@dp.message(
    lambda message: (
        database.is_teacher(message.from_user.id)
        and isinstance(teacher_state.get(message.from_user.id), dict)
        and teacher_state.get(message.from_user.id, {}).get("action") == "add_announcement"
    )
)
async def announcement_state_handler(message: Message):
    user_id = message.from_user.id
    state = teacher_state[user_id]
    step = state.get("step")
    text_value = (message.text or "").strip()

    if text_value == "⬅️ Back / 뒤로":
        teacher_state[user_id] = None
        await message.answer(
            "Professor Menu / 교수 메뉴",
            reply_markup=teacher_menu
        )
        return

    # STEP 1 - DEPARTMENT
    if step == "department":
        if text_value not in DEPARTMENTS:
            await message.answer(
                "Please choose a department button / 학과 버튼을 선택하세요."
            )
            return

        state["department"] = DEPARTMENTS[text_value]
        groups = database.get_groups(state["department"])

        if not groups:
            teacher_state[user_id] = None
            await message.answer(
                "No groups are available / 등록된 그룹이 없습니다.",
                reply_markup=teacher_menu
            )
            return

        state["step"] = "group"

        await message.answer(
            "👥 <b>Step 2/5</b>\n\n"
            "Choose group / 그룹을 선택하세요.",
            reply_markup=groups_keyboard(groups),
            parse_mode="HTML"
        )
        return

    # STEP 2 - GROUP
    if step == "group":
        if not text_value.startswith("👥 "):
            await message.answer(
                "Please choose a group button / 그룹 버튼을 선택하세요."
            )
            return

        group_name = text_value[2:].strip()

        if group_name not in database.get_groups(state["department"]):
            await message.answer(
                "Group not found / 그룹을 찾을 수 없습니다."
            )
            return

        state["group_name"] = group_name
        state["step"] = "title"

        await message.answer(
            "📝 <b>Step 3/5</b>\n\n"
            "Enter announcement title / 공지 제목을 입력하세요."
        )
        return

    # STEP 3 - TITLE
    if step == "title":
        if not text_value:
            await message.answer(
                "Enter a title / 제목을 입력하세요."
            )
            return

        state["title"] = text_value
        state["step"] = "message"

        await message.answer(
            "💬 <b>Step 4/5</b>\n\n"
            "Enter announcement text / 공지 내용을 입력하세요."
        )
        return

    # STEP 4 - MESSAGE
    if step == "message":
        if not text_value:
            await message.answer(
                "Enter announcement text / 공지 내용을 입력하세요."
            )
            return

        state["message"] = text_value
        state["step"] = "file"

        await message.answer(
            "📎 <b>Step 5/5</b>\n\n"
            "Send a photo or document / 사진 또는 파일을 보내세요.\n\n"
            "Or type <code>Skip</code> / 파일 없이 진행하려면 <code>Skip</code>을 입력하세요.",
            parse_mode="HTML"
        )
        return

    # STEP 5 - FILE
    if step == "file":
        file_id = None
        file_type = None

        if message.photo:
            file_id = message.photo[-1].file_id
            file_type = "photo"
        elif message.document:
            file_id = message.document.file_id
            file_type = "document"
        elif text_value.lower() in {
            "skip", "no file", "없음", "건너뛰기"
        }:
            pass
        else:
            await message.answer(
                "Send a photo/document or type Skip / "
                "사진/파일을 보내거나 Skip을 입력하세요."
            )
            return

        announcement_id = database.add_announcement(
            teacher_id=user_id,
            department=state["department"],
            group_name=state["group_name"],
            title=state["title"],
            message=state["message"],
            file_id=file_id,
            file_type=file_type
        )

        teacher_state[user_id] = None

        await message.answer(
            "✅ <b>Announcement published / 공지가 등록되었습니다!</b>\n\n"
            f"📢 {state['title']}\n"
            f"👥 {state['group_name']}\n"
            f"🆔 ID: {announcement_id}",
            reply_markup=teacher_menu,
            parse_mode="HTML"
        )
        return


@dp.message(
    lambda message: (
        database.is_teacher(message.from_user.id)
        and isinstance(teacher_state.get(message.from_user.id), dict)
        and teacher_state.get(message.from_user.id, {}).get("action") == "add_homework"
    )
)
async def professor_state_handler(message: Message):
    user_id = message.from_user.id
    state = teacher_state.get(user_id)

    if not isinstance(state, dict):
        return

    if state.get("action") != "add_homework":
        return

    text = (message.text or "").strip()

    # STEP 1
    if state["step"] == "department":
        if text == "⬅️ Back / 뒤로":
            teacher_state[user_id] = None
            await message.answer(
                "Professor Menu / 교수 메뉴",
                reply_markup=teacher_menu
            )
            return

        if text not in DEPARTMENTS:
            await message.answer(
                "Please choose a department button / 학과 버튼을 선택하세요."
            )
            return

        department = DEPARTMENTS[text]
        groups = database.get_groups(department)

        if not groups:
            await message.answer(
                "No groups are available / 등록된 그룹이 없습니다."
            )
            return

        state["department"] = department
        state["step"] = "group"

        await message.answer(
            "👥 <b>Step 2/7</b>\n\n"
            "Choose group / 그룹을 선택하세요.",
            reply_markup=groups_keyboard(groups),
            parse_mode="HTML"
        )
        return

    # STEP 2
    if state["step"] == "group":
        if text == "⬅️ Back / 뒤로":
            state["step"] = "department"
            await message.answer(
                "Step 1/7\nChoose department / 학과를 선택하세요.",
                reply_markup=departments_keyboard()
            )
            return

        if not text.startswith("👥 "):
            await message.answer(
                "Please choose a group button / 그룹 버튼을 선택하세요."
            )
            return

        group_name = text[2:].strip()

        if group_name not in database.get_groups(state["department"]):
            await message.answer(
                "Group not found / 그룹을 찾을 수 없습니다."
            )
            return

        state["group_name"] = group_name
        state["step"] = "subject"

        await message.answer(
            "📚 <b>Step 3/7</b>\n\n"
            "Enter subject name / 과목명을 입력하세요."
        )
        return

    # STEP 3
    if state["step"] == "subject":
        if text == "⬅️ Back / 뒤로":
            state["step"] = "group"
            await message.answer(
                "Step 2/7\nChoose group / 그룹을 선택하세요.",
                reply_markup=groups_keyboard(
                    database.get_groups(state["department"])
                )
            )
            return

        if len(text) < 2:
            await message.answer(
                "Enter a valid subject name / 올바른 과목명을 입력하세요."
            )
            return

        state["subject_name"] = text
        state["step"] = "task"

        await message.answer(
            "📝 <b>Step 4/7</b>\n\n"
            "Enter homework task / 과제 내용을 입력하세요."
        )
        return

    # STEP 4
    if state["step"] == "task":
        if text == "⬅️ Back / 뒤로":
            state["step"] = "subject"
            await message.answer(
                "Step 3/7\nEnter subject name / 과목명을 입력하세요."
            )
            return

        if len(text) < 1:
            await message.answer(
                "Enter homework task / 과제 내용을 입력하세요."
            )
            return

        state["task_text"] = text
        state["step"] = "date"

        await message.answer(
            "📅 <b>Step 5/7</b>\n\n"
            "Enter due date / 제출 날짜를 입력하세요.\n"
            "Format / 형식: <code>15.08.2026</code>",
            parse_mode="HTML"
        )
        return

    # STEP 5
    if state["step"] == "date":
        if text == "⬅️ Back / 뒤로":
            state["step"] = "task"
            await message.answer(
                "Step 4/7\nEnter homework task / 과제 내용을 입력하세요."
            )
            return

        from datetime import datetime
        try:
            datetime.strptime(text, "%d.%m.%Y")
        except ValueError:
            await message.answer(
                "Invalid date / 잘못된 날짜입니다.\n"
                "Format / 형식: <code>15.08.2026</code>",
                parse_mode="HTML"
            )
            return

        state["homework_date"] = text
        state["step"] = "time"

        await message.answer(
            "⏰ <b>Step 6/7</b>\n\n"
            "Enter due time / 제출 시간을 입력하세요.\n"
            "Format / 형식: <code>18:00</code>",
            parse_mode="HTML"
        )
        return

    # STEP 6
    if state["step"] == "time":
        if text == "⬅️ Back / 뒤로":
            state["step"] = "date"
            await message.answer(
                "Step 5/7\nEnter due date / 제출 날짜를 입력하세요."
            )
            return

        from datetime import datetime
        try:
            datetime.strptime(text, "%H:%M")
        except ValueError:
            await message.answer(
                "Invalid time / 잘못된 시간입니다.\n"
                "Format / 형식: <code>18:00</code>",
                parse_mode="HTML"
            )
            return

        state["homework_time"] = text
        state["step"] = "file"

        await message.answer(
            "📎 <b>Step 7/7</b>\n\n"
            "Send a photo or document / 사진 또는 파일을 보내세요.\n\n"
            "Or type <code>Skip</code> / 파일 없이 진행하려면 <code>Skip</code>을 입력하세요.",
            parse_mode="HTML"
        )
        return

    # STEP 7
    if state["step"] == "file":
        if text == "⬅️ Back / 뒤로":
            state["step"] = "time"
            await message.answer(
                "Step 6/7\nEnter due time / 제출 시간을 입력하세요."
            )
            return

        file_id = None
        file_type = None

        if message.photo:
            file_id = message.photo[-1].file_id
            file_type = "photo"
        elif message.document:
            file_id = message.document.file_id
            file_type = "document"
        elif text.lower() in {
            "skip", "no file", "없음", "건너뛰기"
        }:
            pass
        else:
            await message.answer(
                "Send a photo/document or type Skip / "
                "사진/파일을 보내거나 Skip을 입력하세요."
            )
            return

        homework_id = database.add_homework(
            teacher_id=user_id,
            department=state["department"],
            group_name=state["group_name"],
            subject_name=state["subject_name"],
            task_text=state["task_text"],
            homework_date=state["homework_date"],
            homework_time=state["homework_time"],
            file_id=file_id,
            file_type=file_type
        )

        teacher_state[user_id] = None

        await message.answer(
            "✅ <b>Homework published / 과제가 등록되었습니다!</b>\n\n"
            f"📚 {state['subject_name']}\n"
            f"👥 {state['group_name']}\n"
            f"📅 {state['homework_date']}\n"
            f"⏰ {state['homework_time']}\n"
            f"🆔 ID: {homework_id}",
            reply_markup=teacher_menu,
            parse_mode="HTML"
        )
        return




# ==========================
# STUDENT REMINDERS
# ==========================

REMINDER_MINUTES = 30
reminder_sent = set()


@dp.message(F.text == "🔔 Reminders / 알림")
async def student_reminders(message: Message):

    user_id = message.from_user.id

    user = database.get_user(user_id)

    if not user or not user["department"] or not user["group_name"]:
        await message.answer(
            "Please choose your department and group first / "
            "먼저 학과와 그룹을 선택하세요.",
            reply_markup=student_menu
        )
        return

    enabled = database.reminders_enabled(user_id)

    if enabled:
        database.set_reminders(user_id, False)

        await message.answer(
            "🔕 Reminders OFF / 알림 OFF",
            reply_markup=student_menu
        )
    else:
        database.set_reminders(user_id, True)

        await message.answer(
            "🔔 Reminders ON / 알림 ON\n\n"
            f"You will receive a reminder {REMINDER_MINUTES} minutes "
            "before the homework deadline.\n"
            f"과제 마감 {REMINDER_MINUTES}분 전에 알림을 받습니다.",
            reply_markup=student_menu
        )


async def reminder_worker():

    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    tz = ZoneInfo("Asia/Tashkent")

    while True:

        try:
            now = datetime.now(tz)

            users = database.get_enabled_reminder_users()

            for user_id, university, department, group_name in users:

                if not department or not group_name:
                    continue

                rows = database.get_student_homework(
                    department,
                    group_name
                )

                for row in rows:

                    try:
                        deadline = datetime.strptime(
                            f"{row['homework_date']} {row['homework_time']}",
                            "%d.%m.%Y %H:%M"
                        ).replace(tzinfo=tz)
                    except (ValueError, TypeError):
                        continue

                    minutes_left = (deadline - now).total_seconds() / 60

                    # Send once when the deadline is within the reminder window
                    # and has not already passed.
                    if 0 <= minutes_left <= REMINDER_MINUTES:

                        key = (
                            user_id,
                            row["id"],
                            row["homework_date"],
                            row["homework_time"]
                        )

                        if key in reminder_sent:
                            continue

                        try:
                            await bot.send_message(
                                user_id,
                                "🔔 <b>Homework Reminder / 과제 알림</b>\n\n"
                                f"📚 {row['subject_name']}\n"
                                f"📝 {row['task_text']}\n"
                                f"👥 {group_name}\n"
                                f"📅 {row['homework_date']}\n"
                                f"⏰ {row['homework_time']}\n\n"
                                f"⚠️ Deadline in about "
                                f"{max(0, int(minutes_left))} minutes.",
                                parse_mode="HTML"
                            )

                            reminder_sent.add(key)

                        except Exception as exc:
                            print(
                                f"Reminder send error for {user_id}: {exc}"
                            )

        except Exception as exc:
            print(f"Reminder worker error: {exc}")

        await asyncio.sleep(60)



# ==========================
# AI ASSISTANT
# ==========================

ai_users = set()


@dp.message(F.text == "🤖 AI Assistant / AI 도우미")
async def ai_start(message: Message):
    ai_users.add(message.from_user.id)
    await message.answer(
        "🤖 UniUZ AI Assistant\n\n"
        "Задайте вопрос по учебе.\n\n"
        "Примеры:\n"
        "• Объясни тему\n"
        "• Сделай конспект\n"
        "• Переведи текст\n"
        "• Помоги с презентацией"
    )


@dp.message()
async def ai_chat(message: Message):
    if message.from_user.id not in ai_users:
        return

    if not message.text or not ai_client:
        return

    try:
        response = await ai_client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are UniUZ AI Assistant. Help university students with studying."
                },
                {
                    "role": "user",
                    "content": message.text
                }
            ]
        )

        await message.answer(response.choices[0].message.content)

    except Exception as e:
        print("AI error:", e)
        await message.answer("⚠️ AI временно недоступен.")

# ==========================
# RUN
# ==========================

async def main():

    database.init_db()

    print("UniUZ BOT STARTED")

    # Mini App API runs in the same Railway service as the bot.
    # Railway exposes the service through the PORT environment variable.
    port = int(os.getenv("PORT", "8080"))

    api_app = create_app()
    api_runner = web.AppRunner(api_app)
    await api_runner.setup()

    api_site = web.TCPSite(
        api_runner,
        host="0.0.0.0",
        port=port
    )

    await api_site.start()

    print(f"UniUZ Mini App API started on port {port}")

    reminder_task = asyncio.create_task(
        reminder_worker()
    )

    try:
        await dp.start_polling(bot)
    finally:
        reminder_task.cancel()

        try:
            await reminder_task
        except asyncio.CancelledError:
            pass

        await api_runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())

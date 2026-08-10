const API_URL = "https://uniuz-production.up.railway.app";

const tg = window.Telegram?.WebApp || null;

if (tg) {
    try {
        tg.ready();
        tg.expand();
    } catch (_) {}
}

const initData = tg?.initData || "";

let currentLanguage =
    localStorage.getItem("uniuz_language") || null;

let currentRole =
    localStorage.getItem("uniuz_role") || null;

let teacherStatus = null;
let isAdmin = false;

let cachedProfile = null;
let cachedHomework = [];
let cachedAnnouncements = [];


const translations = {

    ru: {
        chooseRole: "Выберите вашу роль",
        roleSub: "Как вы будете использовать UniUZ?",
        student: "🎓 Студент",
        teacher: "👨‍🏫 Преподаватель",
        admin: "🔐 Панель администратора",

        pending: "⏳ Заявка отправлена",

        pendingText:
            "Ваша заявка отправлена администратору. Дождитесь одобрения.",

        sendRequest: "📨 Отправить заявку",
        check: "🔄 Проверить статус",

        approved:
            "✅ Вы одобрены как преподаватель",

        rejected:
            "❌ Заявка отклонена",

        retry:
            "📨 Подать заявку снова",

        back:
            "⬅️ Назад к выбору роли",

        approve:
            "✅ Одобрить",

        reject:
            "❌ Отклонить",

        refresh:
            "🔄 Обновить",

        noRequests:
            "📭 Новых заявок нет",

        adminTitle:
            "Заявки преподавателей",

        welcome:
            "Добро пожаловать 👋",

        schedule:
            "Расписание",

        homework:
            "Задания",

        announcements:
            "Объявления",

        ai:
            "ИИ",

        profile:
            "Профиль",

        today:
            "Сегодня",

        quick:
            "Быстрые действия",

        apiError:
            "⚠️ API недоступен"
    },


    en: {
        chooseRole: "Choose your role",
        roleSub: "How will you use UniUZ?",
        student: "🎓 Student",
        teacher: "👨‍🏫 Professor",
        admin: "🔐 Administrator panel",

        pending:
            "⏳ Request submitted",

        pendingText:
            "Your request was sent to the administrator. Please wait for approval.",

        sendRequest:
            "📨 Send request",

        check:
            "🔄 Check status",

        approved:
            "✅ You are approved as a professor",

        rejected:
            "❌ Request rejected",

        retry:
            "📨 Submit again",

        back:
            "⬅️ Back to role selection",

        approve:
            "✅ Approve",

        reject:
            "❌ Reject",

        refresh:
            "🔄 Refresh",

        noRequests:
            "📭 No new requests",

        adminTitle:
            "Teacher requests",

        welcome:
            "Welcome 👋",

        schedule:
            "Schedule",

        homework:
            "Homework",

        announcements:
            "Announcements",

        ai:
            "AI",

        profile:
            "Profile",

        today:
            "Today",

        quick:
            "Quick actions",

        apiError:
            "⚠️ API unavailable"
    },


    ko: {
        chooseRole:
            "역할을 선택하세요",

        roleSub:
            "UniUZ를 어떻게 사용하시겠습니까?",

        student:
            "🎓 학생",

        teacher:
            "👨‍🏫 교수님",

        admin:
            "🔐 관리자 패널",

        pending:
            "⏳ 신청이 접수되었습니다",

        pendingText:
            "관리자에게 신청이 전송되었습니다. 승인을 기다려 주세요.",

        sendRequest:
            "📨 신청 보내기",

        check:
            "🔄 상태 확인",

        approved:
            "✅ 교수님으로 승인되었습니다",

        rejected:
            "❌ 신청이 거절되었습니다",

        retry:
            "📨 다시 신청",

        back:
            "⬅️ 역할 선택으로 돌아가기",

        approve:
            "✅ 승인",

        reject:
            "❌ 거절",

        refresh:
            "🔄 새로고침",

        noRequests:
            "📭 새로운 신청이 없습니다",

        adminTitle:
            "교수 신청",

        welcome:
            "환영합니다 👋",

        schedule:
            "시간표",

        homework:
            "과제",

        announcements:
            "공지사항",

        ai:
            "AI",

        profile:
            "프로필",

        today:
            "오늘",

        quick:
            "빠른 메뉴",

        apiError:
            "⚠️ API를 사용할 수 없습니다"
    }

};


function T(key) {

    return (
        translations[currentLanguage] ||
        translations.ru
    )[key] || key;
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function screen() {
    return document.querySelector("#screen");
}


function setNav(visible) {

    const nav =
        document.querySelector(".bottom-nav");

    if (nav) {
        nav.style.display =
            visible ? "" : "none";
    }
}


function hideLanguageScreen() {

    const el =
        document.querySelector(
            "#languageScreen, #language-screen, .language-screen"
        );

    if (el) {
        el.style.display = "none";
    }
}


function showLoading() {

    const el =
        document.querySelector("#loading");

    if (el) {
        el.style.display = "flex";
    }
}


function hideLoading() {

    const el =
        document.querySelector("#loading");

    if (el) {
        el.style.display = "none";
    }
}


function showError(message) {

    console.error(message);

    alert(message);
}


// ============================================================
// API
// ============================================================

async function apiRequest(
    path,
    options = {}
) {

    const headers = {

        "X-Telegram-Init-Data":
            initData,

        ...(options.headers || {})

    };


    if (
        options.body !== undefined
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    const response =
        await fetch(
            API_URL + path,
            {
                method:
                    options.method || "GET",

                headers,

                body:
                    options.body === undefined
                        ? undefined
                        : JSON.stringify(
                            options.body
                        )
            }
        );


    let data = {};

    try {

        data =
            await response.json();

    } catch (_) {}


    if (!response.ok) {

        throw new Error(
            data.error ||
            `API error ${response.status}`
        );
    }


    return data;
}


async function checkApi() {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/health"
            );


        const data =
            await response.json();


        return data.ok === true;

    } catch (error) {

        console.error(
            "API health:",
            error
        );

        return false;
    }
}


// ============================================================
// PROFILE
// ============================================================

async function loadProfile() {

    const data =
        await apiRequest(
            "/api/me"
        );


    if (!data.ok) {

        throw new Error(
            "Profile loading failed"
        );
    }


    cachedProfile =
        data;


    isAdmin =
        data.is_admin === true;


    teacherStatus =
        data.teacher_status || null;


    const user =
        data.telegram_user || {};


    const profile =
        data.profile || {};


    const name =
        user.first_name ||
        user.username ||
        profile.full_name ||
        "UniUZ";


    const avatar =
        document.querySelector(
            "#avatar, #user-avatar"
        );


    if (avatar) {

        avatar.textContent =
            (
                name[0] ||
                "U"
            ).toUpperCase();
    }


    const welcome =
        document.querySelector(
            "#welcome"
        );


    if (welcome) {

        welcome.textContent =
            T("welcome");
    }
}


// ============================================================
// HOMEWORK
// ============================================================

async function loadHomework() {

    const data =
        await apiRequest(
            "/api/homework"
        );


    cachedHomework =
        data.items || [];
}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    const data =
        await apiRequest(
            "/api/announcements"
        );


    cachedAnnouncements =
        data.items || [];
}


// ============================================================
// TEACHER STATUS
// ============================================================

async function loadTeacherStatus() {

    const data =
        await apiRequest(
            "/api/teacher/status"
        );


    teacherStatus =
        data.status || null;


    return data;
}


// ============================================================
// ROLE CSS
// ============================================================

function injectRoleStyles() {

    if (
        document.getElementById(
            "uniuz-role-style"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "uniuz-role-style";


    style.textContent = `

        #uniuz-role-root {

            min-height: 100%;

            padding:
                24px 16px;

            box-sizing:
                border-box;

            display: flex;

            align-items:
                center;

            justify-content:
                center;

        }


        .uniuz-role-card {

            width: 100%;

            max-width: 390px;

            padding:
                28px 20px;

            border-radius:
                26px;

            background:
                rgba(20,32,52,.96);

            border:
                1px solid
                rgba(110,145,200,.35);

            box-shadow:
                0 20px 60px
                rgba(0,0,0,.35);

            text-align:
                center;

        }


        .uniuz-role-logo {

            width: 72px;

            height: 72px;

            margin:
                0 auto 16px;

            border-radius:
                22px;

            display: flex;

            align-items:
                center;

            justify-content:
                center;

            font-size:
                36px;

            background:
                #1d3151;

            border:
                1px solid
                rgba(130,165,220,.4);

        }


        .uniuz-role-card h1 {

            margin:
                0 0 8px;

            font-size:
                30px;

        }


        .uniuz-role-sub {

            margin:
                0 0 24px;

            opacity:
                .7;

        }


        .uniuz-role-btn {

            width:
                100%;

            padding:
                18px;

            margin-top:
                12px;

            border:
                1px solid
                rgba(120,155,215,.35);

            border-radius:
                17px;

            background:
                #263f68;

            color:
                #fff;

            font-size:
                17px;

            font-weight:
                700;

            cursor:
                pointer;

        }


        .uniuz-role-btn.teacher {

            background:
                linear-gradient(
                    135deg,
                    #30466f,
                    #493675
                );

        }


        .uniuz-role-btn.admin {

            background:
                #111827;

        }


        .uniuz-status {

            margin-top:
                16px;

            padding:
                16px;

            border-radius:
                16px;

            background:
                #0d1727;

            border:
                1px solid
                rgba(110,145,200,.25);

            line-height:
                1.5;

        }


        .uniuz-status button {

            width:
                100%;

            margin-top:
                12px;

            padding:
                13px;

            border:
                0;

            border-radius:
                13px;

            background:
                #294676;

            color:
                #fff;

            font-weight:
                700;

            cursor:
                pointer;

        }


        .uniuz-admin-card {

            padding:
                16px;

            margin:
                12px 0;

            border-radius:
                18px;

            background:
                #121e31;

            border:
                1px solid
                rgba(110,145,200,.25);

        }


        .uniuz-admin-actions {

            display:
                grid;

            grid-template-columns:
                1fr 1fr;

            gap:
                8px;

            margin-top:
                12px;

        }


        .uniuz-admin-actions button {

            padding:
                13px;

            border:
                0;

            border-radius:
                12px;

            font-weight:
                700;

            cursor:
                pointer;

        }

    `;


    document.head.appendChild(
        style
    );
}


// ============================================================
// ROLE SCREEN
// ============================================================

function showRoleScreen() {

    injectRoleStyles();

    setNav(false);


    const s =
        screen();


    if (!s) {
        return;
    }


    s.innerHTML = `

        <div id="uniuz-role-root">

            <div class="uniuz-role-card">

                <div class="uniuz-role-logo">
                    🎓
                </div>


                <h1>
                    UniUZ
                </h1>


                <p class="uniuz-role-sub">
                    ${escapeHtml(
                        T("chooseRole")
                    )}
                </p>


                <button
                    id="role-student"
                    class="uniuz-role-btn"
                >
                    ${escapeHtml(
                        T("student")
                    )}
                </button>


                <button
                    id="role-teacher"
                    class="uniuz-role-btn teacher"
                >
                    ${escapeHtml(
                        T("teacher")
                    )}
                </button>


                ${
                    isAdmin
                    ? `
                        <button
                            id="role-admin"
                            class="uniuz-role-btn admin"
                        >
                            ${escapeHtml(
                                T("admin")
                            )}
                        </button>
                    `
                    : ""
                }

            </div>

        </div>

    `;


    document
        .getElementById(
            "role-student"
        )
        ?.addEventListener(
            "click",
            () => selectRole(
                "student"
            )
        );


    document
        .getElementById(
            "role-teacher"
        )
        ?.addEventListener(
            "click",
            () => selectRole(
                "teacher"
            )
        );


    document
        .getElementById(
            "role-admin"
        )
        ?.addEventListener(
            "click",
            openAdminPanel
        );
}


// ============================================================
// SELECT ROLE
// ============================================================

async function selectRole(role) {

    if (
        role === "student"
    ) {

        currentRole =
            "student";


        localStorage.setItem(
            "uniuz_role",
            "student"
        );


        await openStudentApp();

        return;
    }


    if (
        role === "teacher"
    ) {

        await requestTeacherAccess();
    }
}


// ============================================================
// TEACHER REQUEST
// ============================================================

async function requestTeacherAccess() {

    showLoading();


    try {

        const data =
            await apiRequest(
                "/api/teacher/request",
                {
                    method:
                        "POST"
                }
            );


        teacherStatus =
            data.status ||
            "pending";


        currentRole =
            "teacher";


        localStorage.setItem(
            "uniuz_role",
            "teacher"
        );


        showTeacherStatus();


    } catch (error) {

        showError(
            error.message ||
            "Не удалось отправить заявку."
        );


    } finally {

        hideLoading();
    }
}


// ============================================================
// TEACHER STATUS SCREEN
// ============================================================

function showTeacherStatus() {

    setNav(false);


    const s =
        screen();


    if (!s) {
        return;
    }


    let title =
        T("pending");


    let text =
        T("pendingText");


    let extra = `

        <button
            id="teacher-check"
        >
            ${escapeHtml(
                T("check")
            )}
        </button>

    `;


    if (
        teacherStatus ===
        "approved"
    ) {

        title =
            T("approved");

        text = "";

        extra = `

            <button
                id="teacher-open"
            >
                ${escapeHtml(
                    T("teacher")
                )}
            </button>

        `;

    }


    if (
        teacherStatus ===
        "rejected"
    ) {

        title =
            T("rejected");

        text =
            T("pendingText");

        extra = `

            <button
                id="teacher-retry"
            >
                ${escapeHtml(
                    T("retry")
                )}
            </button>

        `;
    }


    s.innerHTML = `

        <div id="uniuz-role-root">

            <div class="uniuz-role-card">

                <div class="uniuz-role-logo">
                    👨‍🏫
                </div>


                <h1>
                    ${escapeHtml(
                        title
                    )}
                </h1>


                <p class="uniuz-role-sub">
                    ${escapeHtml(
                        text
                    )}
                </p>


                <div class="uniuz-status">

                    ${extra}

                </div>


                <button
                    id="role-back"
                    class="uniuz-role-btn"
                >
                    ${escapeHtml(
                        T("back")
                    )}
                </button>

            </div>

        </div>

    `;


    document
        .getElementById(
            "teacher-check"
        )
        ?.addEventListener(
            "click",
            async () => {

                try {

                    await loadTeacherStatus();


                    if (
                        teacherStatus ===
                        "approved"
                    ) {

                        await loadProfile();

                        showTeacherHome();

                    } else {

                        showTeacherStatus();

                    }

                } catch (e) {

                    showError(
                        e.message
                    );
                }

            }
        );


    document
        .getElementById(
            "teacher-retry"
        )
        ?.addEventListener(
            "click",
            requestTeacherAccess
        );


    document
        .getElementById(
            "teacher-open"
        )
        ?.addEventListener(
            "click",
            showTeacherHome
        );


    document
        .getElementById(
            "role-back"
        )
        ?.addEventListener(
            "click",
            showRoleScreen
        );
}


// ============================================================
// TEACHER HOME
// ============================================================

function showTeacherHome() {

    setNav(false);


    const s =
        screen();


    if (!s) {
        return;
    }


    const name =
        cachedProfile?.teacher?.full_name ||
        cachedProfile?.profile?.full_name ||
        "Преподаватель";


    s.innerHTML = `

        <section
            class="page"
            style="padding:18px 16px"
        >

            <div class="page-header">

                <div>

                    <h1>
                        👨‍🏫 UniUZ
                    </h1>

                    <p>
                        Панель преподавателя
                    </p>

                </div>

                <div class="avatar">
                    👨‍🏫
                </div>

            </div>


            <div class="profile-card">

                <div class="eyebrow">
                    ПРЕПОДАВАТЕЛЬ
                </div>

                <h2>
                    ${escapeHtml(
                        name
                    )}
                </h2>

                <p>
                    Статус: ✅ approved
                </p>

            </div>


            <div
                class="info-card"
                style="margin-top:16px"
            >

                <h3>
                    📚 Панель преподавателя
                </h3>

                <p>
                    Здесь будут функции преподавателя.
                </p>

            </div>

        </section>

    `;
}


// ============================================================
// ADMIN PANEL
// ============================================================

async function openAdminPanel() {

    if (!isAdmin) {

        showRoleScreen();

        return;
    }


    showLoading();


    try {

        const data =
            await apiRequest(
                "/api/admin/teacher-requests"
            );


        renderAdminPanel(
            data.items || []
        );


    } catch (error) {

        showError(
            error.message ||
            "Не удалось открыть панель администратора."
        );


    } finally {

        hideLoading();
    }
}


function renderAdminPanel(items) {

    injectRoleStyles();

    setNav(false);


    const s =
        screen();


    if (!s) {
        return;
    }


    const cards =
        items.length

        ? items.map(
            teacher => `

                <div
                    class="uniuz-admin-card"
                >

                    <h3>
                        👨‍🏫
                        ${escapeHtml(
                            teacher.full_name
                        )}
                    </h3>


                    <p>
                        Telegram ID:
                        ${escapeHtml(
                            teacher.telegram_id
                        )}
                    </p>


                    <p
                        style="opacity:.65"
                    >
                        ${escapeHtml(
                            teacher.created_at || ""
                        )}
                    </p>


                    <div
                        class="uniuz-admin-actions"
                    >

                        <button
                            class="admin-approve"
                            data-id="${escapeHtml(
                                teacher.telegram_id
                            )}"
                        >
                            ${escapeHtml(
                                T("approve")
                            )}
                        </button>


                        <button
                            class="admin-reject"
                            data-id="${escapeHtml(
                                teacher.telegram_id
                            )}"
                        >
                            ${escapeHtml(
                                T("reject")
                            )}
                        </button>

                    </div>

                </div>

            `
        ).join("")

        :

        `

            <div
                class="uniuz-admin-card"
            >

                <h3>
                    ${escapeHtml(
                        T("noRequests")
                    )}
                </h3>

            </div>

        `;


    s.innerHTML = `

        <section
            class="page"
            style="padding:18px 16px"
        >

            <div class="page-header">

                <div>

                    <h1>
                        🔐 Admin
                    </h1>

                    <p>
                        ${escapeHtml(
                            T("adminTitle")
                        )}
                    </p>

                </div>


                <div class="avatar">
                    🔐
                </div>

            </div>


            ${cards}


            <button
                id="admin-refresh"
                style="
                    width:100%;
                    padding:15px;
                    border:0;
                    border-radius:15px;
                    font-weight:700;
                "
            >
                ${escapeHtml(
                    T("refresh")
                )}
            </button>


            <button
                id="admin-back"
                style="
                    width:100%;
                    margin-top:10px;
                    padding:15px;
                    border:0;
                    border-radius:15px;
                "
            >
                ${escapeHtml(
                    T("back")
                )}
            </button>

        </section>

    `;


    document
        .getElementById(
            "admin-refresh"
        )
        ?.addEventListener(
            "click",
            openAdminPanel
        );


    document
        .getElementById(
            "admin-back"
        )
        ?.addEventListener(
            "click",
            showRoleScreen
        );


    document
        .querySelectorAll(
            ".admin-approve"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        changeTeacherStatus(
                            button.dataset.id,
                            "approve"
                        )
                );

            }
        );


    document
        .querySelectorAll(
            ".admin-reject"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        changeTeacherStatus(
                            button.dataset.id,
                            "reject"
                        )
                );

            }
        );
}


async function changeTeacherStatus(
    telegramId,
    action
) {

    if (!isAdmin) {
        return;
    }


    try {

        await apiRequest(
            `/api/admin/teacher/${encodeURIComponent(
                telegramId
            )}/${action}`,
            {
                method:
                    "POST"
            }
        );


        await openAdminPanel();


    } catch (error) {

        showError(
            error.message ||
            "Не удалось изменить статус."
        );
    }
}


// ============================================================
// STUDENT APP
// ============================================================

async function openStudentApp() {

    showLoading();


    try {

        await loadProfile();

        await loadHomework();

        await loadAnnouncements();


        setNav(true);

        bindBottomNavigation();

        openPage("home");


    } catch (error) {

        showError(
            error.message ||
            T("apiError")
        );


    } finally {

        hideLoading();
    }
}


// ============================================================
// HOME
// ============================================================

function renderHomeScreen() {

    const s =
        screen();


    if (!s) {
        return;
    }


    const user =
        cachedProfile?.telegram_user ||
        {};


    const profile =
        cachedProfile?.profile ||
        {};


    const name =
        user.first_name ||
        user.username ||
        profile.full_name ||
        "UniUZ";


    s.innerHTML = `

        <section class="home-page">

            <div class="page-header">

                <div>

                    <h1>
                        🎓 UniUZ
                    </h1>

                    <p>
                        ${escapeHtml(
                            T("welcome")
                        )}
                    </p>

                </div>


                <div class="avatar">

                    ${escapeHtml(
                        (
                            name[0] ||
                            "U"
                        ).toUpperCase()
                    )}

                </div>

            </div>


            <div class="profile-card">

                <div class="eyebrow">
                    ${escapeHtml(
                        T("student")
                    )}
                </div>


                <h2>
                    ${escapeHtml(
                        name
                    )}
                </h2>


                <p>
                    ${escapeHtml(
                        profile.department ||
                        "—"
                    )}

                    ·

                    ${escapeHtml(
                        profile.group_name ||
                        "—"
                    )}
                </p>

            </div>


            <div class="next-card">

                <div class="card-label">
                    ${escapeHtml(
                        T("schedule")
                    )}
                </div>


                <div class="next-time">
                    09:00
                </div>


                <h3>
                    Расписание будет подключено к базе
                </h3>

            </div>


            <div class="dashboard-grid">

                <button
                    class="dashboard-card"
                    data-page="schedule"
                >
                    <span>📅</span>

                    <strong>
                        ${escapeHtml(
                            T("schedule")
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            T("today")
                        )}
                    </small>

                </button>


                <button
                    class="dashboard-card"
                    data-page="homework"
                >
                    <span>📝</span>

                    <strong>
                        ${escapeHtml(
                            T("homework")
                        )}
                    </strong>

                    <small>
                        ${cachedHomework.length}
                    </small>

                </button>


                <button
                    class="dashboard-card"
                    data-page="announcements"
                >
                    <span>📢</span>

                    <strong>
                        ${escapeHtml(
                            T("announcements")
                        )}
                    </strong>

                    <small>
                        ${cachedAnnouncements.length}
                    </small>

                </button>


                <button
                    class="dashboard-card"
                    data-page="ai"
                >
                    <span>🤖</span>

                    <strong>
                        ${escapeHtml(
                            T("ai")
                        )}
                    </strong>

                    <small>
                        7 / day
                    </small>

                </button>

            </div>


            <div class="quick-card">

                <h3>
                    ${escapeHtml(
                        T("quick")
                    )}
                </h3>


                <div class="quick-grid">

                    <button
                        data-page="schedule"
                    >
                        📅
                        ${escapeHtml(
                            T("today")
                        )}
                    </button>


                    <button
                        data-page="homework"
                    >
                        📝
                        ${escapeHtml(
                            T("homework")
                        )}
                    </button>


                    <button
                        data-page="announcements"
                    >
                        📢
                        ${escapeHtml(
                            T("announcements")
                        )}
                    </button>


                    <button
                        data-page="profile"
                    >
                        👤
                        ${escapeHtml(
                            T("profile")
                        )}
                    </button>

                </div>

            </div>

        </section>

    `;


    bindScreenButtons();
}


// ============================================================
// SIMPLE PAGES
// ============================================================

function renderSimplePage(page) {

    const s =
        screen();


    if (!s) {
        return;
    }


    const data = {

        schedule: [
            "📅",
            T("schedule"),
            "Расписание будет подключено к базе"
        ],

        homework: [
            "📝",
            T("homework"),
            `${cachedHomework.length} заданий`
        ],

        announcements: [
            "📢",
            T("announcements"),
            `${cachedAnnouncements.length} новых`
        ],

        ai: [
            "🤖",
            T("ai"),
            "7 запросов/день"
        ],

        profile: [
            "👤",
            T("profile"),
            cachedProfile?.profile
                ? `${cachedProfile.profile.department || "—"} · ${cachedProfile.profile.group_name || "—"}`
                : "—"
        ]

    };


    const item =
        data[page] ||
        data.homework;


    s.innerHTML = `

        <section class="page">

            <div class="page-title">

                <span>
                    ${item[0]}
                </span>

                <h1>
                    ${escapeHtml(
                        item[1]
                    )}
                </h1>

            </div>


            <div class="info-card">

                <h3>
                    ${escapeHtml(
                        item[2]
                    )}
                </h3>

            </div>

        </section>

    `;
}


// ============================================================
// NAVIGATION
// ============================================================

function bindScreenButtons() {

    document
        .querySelectorAll(
            "#screen [data-page]"
        )
        .forEach(
            button => {

                button.onclick =
                    () =>
                        openPage(
                            button.dataset.page
                        );

            }
        );
}


function bindBottomNavigation() {

    document
        .querySelectorAll(
            ".bottom-nav .nav-item"
        )
        .forEach(
            button => {

                button.onclick =
                    () =>
                        openPage(
                            button.dataset.page
                        );

            }
        );
}


function openPage(page) {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item =>
                item.classList.toggle(
                    "active",
                    item.dataset.page === page
                )
        );


    if (
        page === "home"
    ) {

        renderHomeScreen();

    } else {

        renderSimplePage(
            page
        );
    }
}


// ============================================================
// LANGUAGE
// ============================================================

async function selectLanguage(
    language
) {

    if (
        ![
            "ru",
            "en",
            "ko"
        ].includes(language)
    ) {

        return;
    }


    currentLanguage =
        language;


    localStorage.setItem(
        "uniuz_language",
        language
    );


    hideLanguageScreen();


    try {

        if (
            !(await checkApi())
        ) {

            throw new Error(
                "API недоступен. Проверь Railway."
            );
        }


        await loadProfile();


        showRoleScreen();


    } catch (error) {

        showError(
            error.message ||
            T("apiError")
        );
    }
}


window.selectLanguage =
    selectLanguage;


// ============================================================
// LANGUAGE BUTTONS
// ============================================================

function bindLanguageButtons() {

    document
        .querySelectorAll(
            ".language-btn"
        )
        .forEach(
            button => {

                button.onclick =
                    event => {

                        event.preventDefault();


                        selectLanguage(
                            button.dataset.lang
                        );

                    };

            }
        );
}


// ============================================================
// INITIALIZE
// ============================================================

async function initializeUniUZ() {

    try {

        if (
            !(await checkApi())
        ) {

            throw new Error(
                "API недоступен. Проверь Railway."
            );
        }


        await loadProfile();


        if (isAdmin) {

            showRoleScreen();

            return;
        }


        if (
            teacherStatus ===
            "approved"
        ) {

            currentRole =
                "teacher";


            localStorage.setItem(
                "uniuz_role",
                "teacher"
            );


            showTeacherHome();

            return;
        }


        if (
            teacherStatus ===
            "pending" &&
            currentRole ===
            "teacher"
        ) {

            showTeacherStatus();

            return;
        }


        if (
            currentRole ===
            "student"
        ) {

            await openStudentApp();

            return;
        }


        if (
            currentRole ===
            "teacher"
        ) {

            await loadTeacherStatus();


            if (
                teacherStatus ===
                "approved"
            ) {

                showTeacherHome();

            } else {

                showTeacherStatus();

            }


            return;
        }


        showRoleScreen();


    } catch (error) {

        showError(
            error.message ||
            T("apiError")
        );
    }
}


// ============================================================
// REFRESH
// ============================================================

async function refreshUniUZ() {

    try {

        await loadProfile();


        if (isAdmin) {

            await openAdminPanel();

            return;
        }


        await loadHomework();

        await loadAnnouncements();


        if (
            currentRole ===
            "student"
        ) {

            openPage("home");
        }


    } catch (error) {

        showError(
            error.message
        );
    }
}


// ============================================================
// TELEGRAM MAIN BUTTON
// ============================================================

if (tg) {

    try {

        tg.MainButton.setText(
            "Обновить"
        );


        tg.MainButton.onClick(
            refreshUniUZ
        );

    } catch (_) {}

}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindLanguageButtons();


        if (
            !currentLanguage
        ) {

            setNav(false);

            return;
        }


        hideLanguageScreen();


        await initializeUniUZ();

    }
);

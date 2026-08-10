// ============================================================
// UniUZ Mini App
// app_FIXED.js
// ============================================================

const API_URL =
    "https://uniuz-production.up.railway.app";


// ============================================================
// TELEGRAM
// ============================================================

const tg =
    window.Telegram?.WebApp || null;

if (tg) {
    tg.ready();
    tg.expand();
}

const initData =
    tg?.initData || "";


// ============================================================
// STORAGE
// ============================================================

let currentLanguage =
    localStorage.getItem("uniuz_language") || null;

let currentRole =
    localStorage.getItem("uniuz_role") || null;


// ============================================================
// CACHE
// ============================================================

let cachedProfile = null;
let cachedHomework = [];
let cachedAnnouncements = [];

let teacherStatus = null;


// ============================================================
// TRANSLATIONS
// ============================================================

const translations = {

    ru: {
        loading: "Загрузка...",
        error: "⚠️ Не удалось загрузить данные UniUZ.",

        welcome: "Добро пожаловать 👋",

        student: "СТУДЕНТ",
        teacher: "ПРЕПОДАВАТЕЛЬ",

        chooseRole: "Выберите вашу роль",

        studentRole: "Студент",
        teacherRole: "Преподаватель",

        pendingTitle: "⏳ Заявка на рассмотрении",
        pendingText:
            "Ваша заявка на регистрацию преподавателя отправлена администратору. Дождитесь одобрения.",

        checkStatus: "🔄 Проверить статус",

        rejectedTitle: "❌ Заявка отклонена",
        rejectedText:
            "Администратор отклонил предыдущую заявку. Вы можете отправить новую.",

        sendRequest: "📨 Отправить заявку",

        approvedTitle: "✅ Преподаватель подтверждён",

        schedule: "Расписание",
        homework: "Задания",
        announcements: "Объявления",
        ai: "AI Assistant",
        profile: "Профиль",

        today: "На сегодня",
        deadlines: "Дедлайны",
        news: "Новости",

        quick: "⚡ Быстрые действия",

        scheduleConnect:
            "Расписание подключится к базе",

        noHomework:
            "📚 Нет заданий",

        noAnnouncements:
            "📢 Нет объявлений",

        changeRole:
            "🔄 Сменить роль",

        changeLanguage:
            "🌐 Сменить язык",

        roleStudent:
            "🎓 Студент",

        roleTeacher:
            "👨‍🏫 Преподаватель"
    },


    en: {
        loading: "Loading...",
        error: "⚠️ Failed to load UniUZ data.",

        welcome: "Welcome 👋",

        student: "STUDENT",
        teacher: "PROFESSOR",

        chooseRole: "Choose your role",

        studentRole: "Student",
        teacherRole: "Professor",

        pendingTitle:
            "⏳ Application under review",

        pendingText:
            "Your professor registration request has been sent to the administrator. Please wait for approval.",

        checkStatus:
            "🔄 Check status",

        rejectedTitle:
            "❌ Application rejected",

        rejectedText:
            "The administrator rejected your previous application. You can submit a new one.",

        sendRequest:
            "📨 Send application",

        approvedTitle:
            "✅ Professor approved",

        schedule: "Schedule",
        homework: "Homework",
        announcements: "Announcements",
        ai: "AI Assistant",
        profile: "Profile",

        today: "Today",
        deadlines: "Deadlines",
        news: "News",

        quick: "⚡ Quick actions",

        scheduleConnect:
            "Schedule will be connected to the database",

        noHomework:
            "📚 No homework",

        noAnnouncements:
            "📢 No announcements",

        changeRole:
            "🔄 Change role",

        changeLanguage:
            "🌐 Change language",

        roleStudent:
            "🎓 Student",

        roleTeacher:
            "👨‍🏫 Professor"
    },


    ko: {
        loading: "로딩 중...",
        error:
            "⚠️ UniUZ 데이터를 불러오지 못했습니다.",

        welcome: "환영합니다 👋",

        student: "학생",
        teacher: "교수님",

        chooseRole:
            "역할을 선택하세요",

        studentRole: "학생",
        teacherRole: "교수님",

        pendingTitle:
            "⏳ 승인 대기 중",

        pendingText:
            "교수님 등록 신청이 관리자에게 전달되었습니다. 승인을 기다려 주세요.",

        checkStatus:
            "🔄 상태 확인",

        rejectedTitle:
            "❌ 신청 거절됨",

        rejectedText:
            "관리자가 이전 신청을 거절했습니다. 다시 신청할 수 있습니다.",

        sendRequest:
            "📨 신청 보내기",

        approvedTitle:
            "✅ 교수님 승인 완료",

        schedule: "시간표",
        homework: "과제",
        announcements: "공지사항",
        ai: "AI Assistant",
        profile: "프로필",

        today: "오늘",
        deadlines: "마감일",
        news: "뉴스",

        quick: "⚡ 빠른 실행",

        scheduleConnect:
            "실제 데이터를 받은 후 시간표가 연결됩니다",

        noHomework:
            "📚 과제가 없습니다",

        noAnnouncements:
            "📢 공지가 없습니다",

        changeRole:
            "🔄 역할 변경",

        changeLanguage:
            "🌐 언어 변경",

        roleStudent:
            "🎓 학생",

        roleTeacher:
            "👨‍🏫 교수님"
    }

};


// ============================================================
// LANGUAGE
// ============================================================

function getLanguage() {

    return currentLanguage || "ru";
}


function T(key) {

    const lang =
        translations[getLanguage()] ||
        translations.ru;

    return (
        lang[key] ??
        translations.ru[key] ??
        key
    );
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// DOM HELPERS
// ============================================================

function getLanguageScreen() {

    return (
        document.querySelector(
            "#languageScreen"
        ) ||
        document.querySelector(
            "#language-screen"
        ) ||
        document.querySelector(
            ".language-screen"
        )
    );
}


function getRoleScreen() {

    return document.querySelector(
        "#roleScreen"
    );
}


function getApp() {

    return (
        document.querySelector("#app") ||
        document.querySelector(".app") ||
        document.querySelector("#main-app")
    );
}


function getScreen() {

    return document.querySelector(
        "#screen"
    );
}


// ============================================================
// LANGUAGE SCREEN
// ============================================================

function hideLanguageScreen() {

    const screen =
        getLanguageScreen();

    if (screen) {

        screen.style.display =
            "none";
    }
}


function showLanguageScreen() {

    const screen =
        getLanguageScreen();

    if (screen) {

        screen.style.display =
            "flex";
    }

    hideRoleScreen();
    hideMainApplication();
}


// ============================================================
// ROLE SCREEN
// ============================================================

function ensureRoleScreen() {

    let screen =
        getRoleScreen();

    if (screen) {
        return screen;
    }


    screen =
        document.createElement("div");

    screen.id =
        "roleScreen";

    screen.className =
        "language-screen";


    screen.innerHTML = `

        <div class="language-card">

            <div class="language-logo">
                🎓
            </div>

            <h1>
                UniUZ
            </h1>

            <p
                id="roleSubtitle"
                class="language-subtitle"
            ></p>


            <button
                class="role-btn"
                data-role="student"
            >

                <span class="role-icon">
                    🎓
                </span>

                <span id="studentRoleText"></span>

            </button>


            <button
                class="role-btn"
                data-role="teacher"
            >

                <span class="role-icon">
                    👨‍🏫
                </span>

                <span id="teacherRoleText"></span>

            </button>


            <div
                id="teacherRequestArea"
                style="
                    display:none;
                    margin-top:16px;
                "
            ></div>

        </div>

    `;


    document.body.appendChild(
        screen
    );


    return screen;
}


function hideRoleScreen() {

    const screen =
        getRoleScreen();

    if (screen) {

        screen.style.display =
            "none";
    }
}


function showRoleScreen() {

    const screen =
        ensureRoleScreen();

    hideLanguageScreen();

    hideMainApplication();


    screen.style.display =
        "flex";


    updateRoleScreen();
}


// ============================================================
// ROLE SCREEN TEXT
// ============================================================

function updateRoleScreen() {

    const screen =
        ensureRoleScreen();


    const subtitle =
        screen.querySelector(
            "#roleSubtitle"
        );

    const student =
        screen.querySelector(
            "#studentRoleText"
        );

    const teacher =
        screen.querySelector(
            "#teacherRoleText"
        );


    if (subtitle) {

        subtitle.textContent =
            T("chooseRole");
    }


    if (student) {

        student.textContent =
            T("studentRole");
    }


    if (teacher) {

        teacher.textContent =
            T("teacherRole");
    }


    updateTeacherRequestArea();
}


// ============================================================
// MAIN APPLICATION
// ============================================================

function showMainApplication() {

    const app =
        getApp();

    const screen =
        getScreen();

    const nav =
        document.querySelector(
            ".bottom-nav"
        );


    if (app) {

        app.style.display =
            "";
    }


    if (screen) {

        screen.style.display =
            "";
    }


    if (nav) {

        nav.style.display =
            "";
    }
}


function hideMainApplication() {

    const app =
        getApp();

    if (app) {

        app.style.display =
            "none";
    }
}


// ============================================================
// LANGUAGE SELECTION
// ============================================================

async function selectLanguage(
    language
) {

    if (
        !["ru", "en", "ko"]
            .includes(language)
    ) {
        return;
    }


    currentLanguage =
        language;


    localStorage.setItem(
        "uniuz_language",
        language
    );


    console.log(
        "UniUZ language:",
        language
    );


    // После выбора языка
    // показываем выбор роли.

    showRoleScreen();
}


window.selectLanguage =
    selectLanguage;


// ============================================================
// LANGUAGE BUTTONS
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".language-btn"
            );


        if (!button) {
            return;
        }


        const language =
            button.dataset.lang;


        if (
            ["ru", "en", "ko"]
                .includes(language)
        ) {

            event.preventDefault();
            event.stopPropagation();


            selectLanguage(
                language
            );
        }

    },
    true
);


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(
    path,
    options = {}
) {

    const headers = {

        ...(options.headers || {}),

        "X-Telegram-Init-Data":
            initData

    };


    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                ...options,
                headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            `API returned ${response.status}`
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            "API error"
        );
    }


    return data;
}


// ============================================================
// API HEALTH
// ============================================================

async function checkApi() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/health`
            );


        const data =
            await response.json();


        console.log(
            "UniUZ API:",
            data
        );


        return (
            data &&
            data.ok === true
        );

    } catch (error) {

        console.error(
            "API unavailable:",
            error
        );


        return false;
    }
}


// ============================================================
// TEACHER STATUS
// ============================================================

async function getTeacherStatus() {

    const data =
        await apiRequest(
            "/api/teacher/status"
        );


    teacherStatus =
        data.status || null;


    return data;
}


// ============================================================
// TEACHER REQUEST
// ============================================================

async function sendTeacherRequest() {

    try {

        const button =
            document.querySelector(
                "#teacherRequestButton"
            );


        if (button) {

            button.disabled =
                true;

            button.textContent =
                T("loading");
        }


        const data =
            await apiRequest(
                "/api/teacher/request",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({})
                }
            );


        teacherStatus =
            data.status || null;


        console.log(
            "Teacher request:",
            data
        );


        updateTeacherRequestArea();


        if (
            data.status ===
            "approved"
        ) {

            currentRole =
                "teacher";


            localStorage.setItem(
                "uniuz_role",
                "teacher"
            );


            hideRoleScreen();

            showMainApplication();

            await initializeUniUZ();

            openPage("home");

            return;
        }


    } catch (error) {

        console.error(
            "Teacher request error:",
            error
        );


        alert(
            error.message ||
            T("error")
        );


        updateTeacherRequestArea();
    }
}


// ============================================================
// UPDATE TEACHER REQUEST AREA
// ============================================================

function updateTeacherRequestArea() {

    const area =
        document.querySelector(
            "#teacherRequestArea"
        );


    if (!area) {
        return;
    }


    area.innerHTML =
        "";


    if (
        teacherStatus ===
        "pending"
    ) {

        area.style.display =
            "block";


        area.innerHTML = `

            <div
                class="info-card"
                style="
                    text-align:center;
                    padding:16px;
                "
            >

                <h3>
                    ${escapeHtml(
                        T("pendingTitle")
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        T("pendingText")
                    )}
                </p>


                <button
                    id="checkTeacherStatusButton"
                    class="role-btn"
                    style="
                        margin-top:12px;
                    "
                >

                    ${escapeHtml(
                        T("checkStatus")
                    )}

                </button>

            </div>

        `;


        document
            .querySelector(
                "#checkTeacherStatusButton"
            )
            ?.addEventListener(
                "click",
                checkTeacherApproval
            );


        return;
    }


    if (
        teacherStatus ===
        "rejected"
    ) {

        area.style.display =
            "block";


        area.innerHTML = `

            <div
                class="info-card"
                style="
                    text-align:center;
                    padding:16px;
                "
            >

                <h3>
                    ${escapeHtml(
                        T("rejectedTitle")
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        T("rejectedText")
                    )}
                </p>


                <button
                    id="teacherRequestButton"
                    class="role-btn"
                >

                    ${escapeHtml(
                        T("sendRequest")
                    )}

                </button>

            </div>

        `;


        document
            .querySelector(
                "#teacherRequestButton"
            )
            ?.addEventListener(
                "click",
                sendTeacherRequest
            );


        return;
    }


    if (
        teacherStatus ===
        "approved"
    ) {

        area.style.display =
            "block";


        area.innerHTML = `

            <div
                class="info-card"
                style="
                    text-align:center;
                    padding:16px;
                "
            >

                <h3>
                    ${escapeHtml(
                        T("approvedTitle")
                    )}
                </h3>

            </div>

        `;


        return;
    }


    // Нет заявки

    area.style.display =
        "block";


    area.innerHTML = `

        <button
            id="teacherRequestButton"
            class="role-btn"
        >

            ${escapeHtml(
                T("sendRequest")
            )}

        </button>

    `;


    document
        .querySelector(
            "#teacherRequestButton"
        )
        ?.addEventListener(
            "click",
            sendTeacherRequest
        );
}


// ============================================================
// CHECK TEACHER APPROVAL
// ============================================================

async function checkTeacherApproval() {

    try {

        const data =
            await getTeacherStatus();


        if (
            data.status ===
            "approved"
        ) {

            currentRole =
                "teacher";


            localStorage.setItem(
                "uniuz_role",
                "teacher"
            );


            hideRoleScreen();

            showMainApplication();


            await initializeUniUZ();


            openPage("home");


            return;
        }


        updateTeacherRequestArea();


    } catch (error) {

        console.error(
            "Teacher status error:",
            error
        );


        alert(
            error.message ||
            T("error")
        );
    }
}


// ============================================================
// SELECT STUDENT
// ============================================================

async function selectStudent() {

    currentRole =
        "student";


    localStorage.setItem(
        "uniuz_role",
        "student"
    );


    hideRoleScreen();

    showMainApplication();


    await initializeUniUZ();


    openPage("home");
}


// ============================================================
// ROLE BUTTONS
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".role-btn"
            );


        if (!button) {
            return;
        }


        // Кнопки внутри заявки
        if (
            button.id ===
            "teacherRequestButton" ||
            button.id ===
            "checkTeacherStatusButton"
        ) {
            return;
        }


        const role =
            button.dataset.role;


        if (
            role ===
            "student"
        ) {

            selectStudent();

            return;
        }


        if (
            role ===
            "teacher"
        ) {

            // НЕ выдаём teacher сразу.
            // Сначала проверяем статус.

            getTeacherStatus()
                .then(data => {

                    teacherStatus =
                        data.status ||
                        null;


                    if (
                        data.status ===
                        "approved"
                    ) {

                        currentRole =
                            "teacher";


                        localStorage.setItem(
                            "uniuz_role",
                            "teacher"
                        );


                        hideRoleScreen();

                        showMainApplication();

                        initializeUniUZ()
                            .then(() => {

                                openPage(
                                    "home"
                                );

                            });


                        return;
                    }


                    updateTeacherRequestArea();

                })
                .catch(error => {

                    console.error(
                        "Teacher status error:",
                        error
                    );


                    // Если пользователь ещё
                    // не зарегистрирован,
                    // показываем заявку.

                    teacherStatus =
                        null;


                    updateTeacherRequestArea();
                });
        }

    }
);


// ============================================================
// PROFILE
// ============================================================

async function loadProfile() {

    const data =
        await apiRequest(
            "/api/me"
        );


    cachedProfile = {

        telegramUser:
            data.telegram_user,

        profile:
            data.profile,

        role:
            data.role,

        teacherStatus:
            data.teacher_status,

        isTeacher:
            data.is_teacher

    };


    teacherStatus =
        data.teacher_status ||
        null;


    console.log(
        "UniUZ profile:",
        data
    );


    // Сервер — источник истины.
    // Не доверяем localStorage для teacher.

    if (
        data.is_teacher === true &&
        data.teacher_status ===
            "approved"
    ) {

        currentRole =
            "teacher";


        localStorage.setItem(
            "uniuz_role",
            "teacher"
        );

    } else if (
        currentRole ===
        "teacher"
    ) {

        // Если сервер не подтвердил teacher,
        // удаляем локальную роль.

        currentRole =
            null;


        localStorage.removeItem(
            "uniuz_role"
        );
    }


    const telegramUser =
        data.telegram_user;

    const profile =
        data.profile;


    const name =
        telegramUser?.first_name ||
        telegramUser?.username ||
        profile?.full_name ||
        "UniUZ";


    setText(
        "#user-name",
        name
    );


    setText(
        "#profile-name",
        profile?.full_name ||
        name
    );


    setText(
        "#profile-username",
        profile?.username
            ? `@${profile.username}`
            : telegramUser?.username
                ? `@${telegramUser.username}`
                : ""
    );


    setText(
        "#profile-university",
        profile?.university ||
        "Ajou University in Tashkent"
    );


    setText(
        "#profile-department",
        profile?.department ||
        "—"
    );


    setText(
        "#profile-group",
        profile?.group_name ||
        "—"
    );


    document
        .querySelectorAll(
            "#user-avatar, #avatar"
        )
        .forEach(element => {

            element.textContent =
                (
                    name[0] ||
                    "U"
                ).toUpperCase();

        });


    return data;
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


    console.log(
        "UniUZ homework:",
        data
    );


    return data;
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


    console.log(
        "UniUZ announcements:",
        data
    );


    return data;
}


// ============================================================
// TEXT HELPER
// ============================================================

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {

        element.textContent =
            value ?? "";
    }
}


// ============================================================
// HOME
// ============================================================

function renderHomeScreen() {

    const screen =
        getScreen();


    if (!screen) {
        return;
    }


    const user =
        cachedProfile?.telegramUser;

    const profile =
        cachedProfile?.profile;


    const name =
        user?.first_name ||
        user?.username ||
        profile?.full_name ||
        "UniUZ";


    const isTeacher =
        currentRole ===
        "teacher";


    screen.innerHTML = `

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


                <div
                    class="avatar"
                    id="user-avatar"
                >
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
                        isTeacher
                            ? T("teacher")
                            : T("student")
                    )}

                </div>


                <h2
                    id="profile-name"
                >
                    ${escapeHtml(name)}
                </h2>


                <p>

                    ${
                        profile
                            ? `
                                ${escapeHtml(
                                    profile.department ||
                                    "—"
                                )}
                                ·
                                ${escapeHtml(
                                    profile.group_name ||
                                    "—"
                                )}
                              `
                            : escapeHtml(
                                "Профиль будет загружен из базы UniUZ"
                            )
                    }

                </p>

            </div>


            <div class="next-card">

                <div class="card-label">

                    📅
                    ${
                        getLanguage() === "ru"
                            ? "Следующая пара"
                            : getLanguage() === "en"
                                ? "Next class"
                                : "다음 수업"
                    }

                </div>


                <div class="next-time">
                    09:00
                </div>


                <h3>

                    ${escapeHtml(
                        T("scheduleConnect")
                    )}

                </h3>


                <p>
                    🏫 —
                </p>

            </div>


            <div class="dashboard-grid">

                <button
                    class="dashboard-card"
                    data-page="schedule"
                >

                    <span>
                        📅
                    </span>

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

                    <span>
                        📝
                    </span>

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

                    <span>
                        📢
                    </span>

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

                    <span>
                        🤖
                    </span>

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
                        ${escapeHtml(
                            T("today")
                        )}
                    </button>


                    <button
                        data-page="homework"
                    >
                        ${escapeHtml(
                            T("deadlines")
                        )}
                    </button>


                    <button
                        data-page="announcements"
                    >
                        ${escapeHtml(
                            T("news")
                        )}
                    </button>


                    <button
                        data-page="profile"
                    >
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

    const screen =
        getScreen();


    if (!screen) {
        return;
    }


    if (
        page ===
        "profile"
    ) {

        renderProfilePage();

        return;
    }


    const data = {

        schedule: [
            "📅",
            T("schedule"),
            T("scheduleConnect")
        ],

        homework: [
            "📝",
            T("homework"),
            `${cachedHomework.length}`
        ],

        announcements: [
            "📢",
            T("announcements"),
            `${cachedAnnouncements.length}`
        ],

        ai: [
            "🤖",
            T("ai"),
            "7 / day"
        ]

    };


    const item =
        data[page] ||
        data.homework;


    screen.innerHTML = `

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
// PROFILE PAGE
// ============================================================

function renderProfilePage() {

    const screen =
        getScreen();


    if (!screen) {
        return;
    }


    const profile =
        cachedProfile?.profile;


    const name =
        cachedProfile?.telegramUser?.first_name ||
        profile?.full_name ||
        "UniUZ";


    const isTeacher =
        currentRole ===
        "teacher";


    screen.innerHTML = `

        <section class="profile-page">

            <div class="profile-card">

                <div
                    class="avatar"
                    id="profile-avatar"
                >
                    ${escapeHtml(
                        (
                            name[0] ||
                            "U"
                        ).toUpperCase()
                    )}
                </div>


                <h2>
                    ${escapeHtml(name)}
                </h2>


                <p>
                    ${
                        isTeacher
                            ? escapeHtml(
                                T("roleTeacher")
                              )
                            : escapeHtml(
                                T("roleStudent")
                              )
                    }
                </p>

            </div>


            <div class="info-card">

                <h3>
                    👤
                    ${
                        getLanguage() === "ru"
                            ? "Личная информация"
                            : getLanguage() === "en"
                                ? "Personal information"
                                : "개인 정보"
                    }
                </h3>


                <p>

                    🏫
                    ${escapeHtml(
                        profile?.university ||
                        "Ajou University in Tashkent"
                    )}

                </p>


                <p>

                    🎓
                    ${escapeHtml(
                        profile?.department ||
                        "—"
                    )}

                </p>


                <p>

                    👥
                    ${escapeHtml(
                        profile?.group_name ||
                        "—"
                    )}

                </p>

            </div>


            <div class="info-card">

                <h3>
                    ⚙️
                    ${
                        getLanguage() === "ru"
                            ? "Настройки"
                            : getLanguage() === "en"
                                ? "Settings"
                                : "설정"
                    }
                </h3>


                <p>

                    🌐
                    ${
                        getLanguage() === "ru"
                            ? "Русский"
                            : getLanguage() === "en"
                                ? "English"
                                : "한국어"
                    }

                </p>


                <p>

                    🎭
                    ${
                        isTeacher
                            ? escapeHtml(
                                T("roleTeacher")
                              )
                            : escapeHtml(
                                T("roleStudent")
                              )
                    }

                </p>

            </div>


            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                "
            >

                <button
                    id="changeRoleButton"
                    class="role-btn"
                    style="width:auto;"
                >

                    ${escapeHtml(
                        T("changeRole")
                    )}

                </button>


                <button
                    id="changeLanguageButton"
                    class="role-btn"
                    style="width:auto;"
                >

                    ${escapeHtml(
                        T("changeLanguage")
                    )}

                </button>

            </div>

        </section>

    `;


    document
        .querySelector(
            "#changeRoleButton"
        )
        ?.addEventListener(
            "click",
            function() {

                currentRole =
                    null;

                localStorage.removeItem(
                    "uniuz_role"
                );

                teacherStatus =
                    null;

                showRoleScreen();
            }
        );


    document
        .querySelector(
            "#changeLanguageButton"
        )
        ?.addEventListener(
            "click",
            function() {

                currentLanguage =
                    null;

                currentRole =
                    null;


                teacherStatus =
                    null;


                localStorage.removeItem(
                    "uniuz_language"
                );


                localStorage.removeItem(
                    "uniuz_role"
                );


                showLanguageScreen();
            }
        );
}


// ============================================================
// NAVIGATION
// ============================================================

function setActivePage(page) {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                page
            );

        });
}


function openPage(page) {

    setActivePage(page);


    if (
        page ===
        "home"
    ) {

        renderHomeScreen();

    } else {

        renderSimplePage(
            page
        );
    }
}


function bindScreenButtons() {

    document
        .querySelectorAll(
            "#screen [data-page]"
        )
        .forEach(button => {

            button.onclick =
                function() {

                    openPage(
                        this.dataset.page
                    );

                };

        });
}


function bindBottomNavigation() {

    document
        .querySelectorAll(
            ".bottom-nav .nav-item"
        )
        .forEach(button => {

            button.onclick =
                function() {

                    openPage(
                        this.dataset.page
                    );

                };

        });
}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const loading =
        document.querySelector(
            "#loading"
        );


    if (loading) {

        loading.style.display =
            "flex";
    }
}


function hideLoading() {

    const loading =
        document.querySelector(
            "#loading"
        );


    if (loading) {

        loading.style.display =
            "none";
    }
}


// ============================================================
// ERROR
// ============================================================

function showError(
    message
) {

    console.error(
        message
    );


    const element =
        document.querySelector(
            "#error"
        );


    if (element) {

        element.textContent =
            message;

        element.style.display =
            "block";
    }
}


// ============================================================
// INITIALIZE
// ============================================================

async function initializeUniUZ() {

    showLoading();


    try {

        const apiOnline =
            await checkApi();


        if (!apiOnline) {

            console.warn(
                "UniUZ API unavailable."
            );

            return;
        }


        if (!initData) {

            console.warn(
                "Telegram initData is empty."
            );
        }


        const profileData =
            await loadProfile();


        // Сервер не подтвердил teacher
        if (
            currentRole ===
            "teacher" &&
            !(
                profileData.is_teacher ===
                true &&
                profileData.teacher_status ===
                "approved"
            )
        ) {

            currentRole =
                null;


            localStorage.removeItem(
                "uniuz_role"
            );


            showRoleScreen();


            return;
        }


        await Promise.allSettled([
            loadHomework(),
            loadAnnouncements()
        ]);


        console.log(
            "UniUZ initialized successfully."
        );


    } catch (error) {

        console.error(
            "UniUZ initialization error:",
            error
        );


        showError(
            T("error")
        );

    } finally {

        hideLoading();
    }
}


// ============================================================
// REFRESH
// ============================================================

async function refreshUniUZ() {

    try {

        await initializeUniUZ();


        if (
            currentRole
        ) {

            openPage("home");
        }

    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );
    }
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Starting UniUZ..."
        );


        bindBottomNavigation();


        // ----------------------------------------------------
        // Нет языка
        // ----------------------------------------------------

        if (!currentLanguage) {

            showLanguageScreen();

            return;
        }


        // ----------------------------------------------------
        // Язык есть, роли нет
        // ----------------------------------------------------

        if (!currentRole) {

            showRoleScreen();

            // Если уже есть заявка преподавателя,
            // сразу узнаём её статус.

            try {

                const data =
                    await getTeacherStatus();


                teacherStatus =
                    data.status ||
                    null;

                updateRoleScreen();

            } catch {

                teacherStatus =
                    null;

                updateRoleScreen();
            }


            return;
        }


        // ----------------------------------------------------
        // Студент
        // ----------------------------------------------------

        if (
            currentRole ===
            "student"
        ) {

            hideLanguageScreen();
            hideRoleScreen();

            showMainApplication();


            await initializeUniUZ();


            if (
                currentRole ===
                "student"
            ) {

                openPage("home");
            }


            return;
        }


        // ----------------------------------------------------
        // Teacher
        // ----------------------------------------------------

        if (
            currentRole ===
            "teacher"
        ) {

            hideLanguageScreen();
            hideRoleScreen();

            showMainApplication();


            try {

                const status =
                    await getTeacherStatus();


                if (
                    status.status !==
                    "approved"
                ) {

                    currentRole =
                        null;


                    localStorage.removeItem(
                        "uniuz_role"
                    );


                    showRoleScreen();

                    updateRoleScreen();

                    return;
                }


                await initializeUniUZ();


                if (
                    currentRole ===
                    "teacher"
                ) {

                    openPage("home");
                }

            } catch (error) {

                console.error(
                    "Teacher verification error:",
                    error
                );


                currentRole =
                    null;


                localStorage.removeItem(
                    "uniuz_role"
                );


                showRoleScreen();
            }
        }
    }
);


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

    } catch (error) {

        console.warn(
            "Telegram MainButton unavailable:",
            error
        );
    }
}


// ============================================================
// DEBUG
// ============================================================

window.UniUZ = {

    getLanguage:
        () => currentLanguage,

    getRole:
        () => currentRole,

    getTeacherStatus:
        () => teacherStatus,

    selectLanguage:
        selectLanguage,

    selectStudent:
        selectStudent,

    sendTeacherRequest:
        sendTeacherRequest,

    checkTeacherApproval:
        checkTeacherApproval,

    refresh:
        refreshUniUZ,

    reset:
        function() {

            localStorage.removeItem(
                "uniuz_language"
            );

            localStorage.removeItem(
                "uniuz_role"
            );


            currentLanguage =
                null;

            currentRole =
                null;

            teacherStatus =
                null;


            showLanguageScreen();
        }

};

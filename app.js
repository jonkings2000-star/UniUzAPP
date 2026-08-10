// =====================================================
// UniUZ Mini App
// app.js
// CLEAN VERSION
// =====================================================

"use strict";


// =====================================================
// CONFIG
// =====================================================

const API_URL = window.location.origin;

const tg = window.Telegram?.WebApp || null;

const initData = tg?.initData || "";


// =====================================================
// TELEGRAM
// =====================================================

if (tg) {
    try {
        tg.ready();
        tg.expand();
    } catch (error) {
        console.error("Telegram WebApp error:", error);
    }
}


// =====================================================
// STATE
// =====================================================

let currentLanguage = null;
let currentRole = null;

let teacherStatus = null;
let isAdmin = false;

let cachedProfile = null;
let cachedHomework = [];
let cachedAnnouncements = [];


// =====================================================
// TRANSLATIONS
// =====================================================

const translations = {

    ru: {

        chooseRole: "Выберите вашу роль",
        roleSub: "Как вы будете использовать UniUZ?",

        student: "🎓 Студент",
        teacher: "👨‍🏫 Преподаватель",
        admin: "🔐 Администратор",

        pending: "⏳ Заявка отправлена",
        pendingText:
            "Ваша заявка на регистрацию преподавателя отправлена администратору. Дождитесь одобрения.",

        approved: "✅ Вы одобрены как преподаватель",
        rejected: "❌ Заявка отклонена",

        sendRequest: "📨 Отправить заявку",
        check: "🔄 Проверить статус",

        approve: "✅ Одобрить",
        reject: "❌ Отклонить",

        refresh: "🔄 Обновить",
        back: "⬅️ Назад",

        noRequests: "📭 Новых заявок нет",
        adminTitle: "Заявки преподавателей",

        welcome: "Добро пожаловать 👋",

        schedule: "Расписание",
        homework: "Задания",
        announcements: "Объявления",
        ai: "ИИ",
        profile: "Профиль",

        today: "Сегодня",
        quick: "Быстрые действия",

        apiError: "⚠️ API недоступен"

    },


    en: {

        chooseRole: "Choose your role",
        roleSub: "How will you use UniUZ?",

        student: "🎓 Student",
        teacher: "👨‍🏫 Teacher",
        admin: "🔐 Administrator",

        pending: "⏳ Request submitted",
        pendingText:
            "Your teacher registration request has been sent to the administrator. Please wait for approval.",

        approved: "✅ You are approved as a teacher",
        rejected: "❌ Request rejected",

        sendRequest: "📨 Send request",
        check: "🔄 Check status",

        approve: "✅ Approve",
        reject: "❌ Reject",

        refresh: "🔄 Refresh",
        back: "⬅️ Back",

        noRequests: "📭 No new requests",
        adminTitle: "Teacher requests",

        welcome: "Welcome 👋",

        schedule: "Schedule",
        homework: "Homework",
        announcements: "Announcements",
        ai: "AI",
        profile: "Profile",

        today: "Today",
        quick: "Quick actions",

        apiError: "⚠️ API unavailable"

    },


    ko: {

        chooseRole: "역할을 선택하세요",
        roleSub: "UniUZ를 어떻게 사용하시겠습니까?",

        student: "🎓 학생",
        teacher: "👨‍🏫 교수",
        admin: "🔐 관리자",

        pending: "⏳ 승인 요청이 전송되었습니다",
        pendingText:
            "교수 등록 요청이 관리자에게 전송되었습니다. 승인을 기다려 주세요.",

        approved: "✅ 교수로 승인되었습니다",
        rejected: "❌ 요청이 거절되었습니다",

        sendRequest: "📨 요청 보내기",
        check: "🔄 상태 확인",

        approve: "✅ 승인",
        reject: "❌ 거절",

        refresh: "🔄 새로고침",
        back: "⬅️ 뒤로",

        noRequests: "📭 새로운 요청이 없습니다",
        adminTitle: "교수 승인 요청",

        welcome: "환영합니다 👋",

        schedule: "시간표",
        homework: "과제",
        announcements: "공지",
        ai: "AI",
        profile: "프로필",

        today: "오늘",
        quick: "빠른 작업",

        apiError: "⚠️ API에 연결할 수 없습니다"

    }

};


// =====================================================
// HELPERS
// =====================================================

function T(key) {

    const language =
        translations[currentLanguage] ||
        translations.ru;

    return language[key] || key;
}


function getScreen() {

    return document.getElementById("screen");
}


function setNav(visible) {

    const nav =
        document.querySelector(".bottom-nav");

    if (!nav) return;

    nav.style.display =
        visible ? "flex" : "none";
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// API
// =====================================================

async function apiRequest(path, options = {}) {

    const headers = {};

    if (initData) {

        headers["X-Telegram-Init-Data"] =
            initData;
    }

    if (options.body !== undefined) {

        headers["Content-Type"] =
            "application/json";
    }


    let response;

    try {

        response = await fetch(
            API_URL + path,
            {
                method:
                    options.method || "GET",

                headers,

                body:
                    options.body !== undefined
                        ? JSON.stringify(options.body)
                        : undefined
            }
        );

    } catch (error) {

        throw new Error(
            "Не удалось подключиться к API"
        );
    }


    let data = {};

    try {

        data = await response.json();

    } catch (error) {

        data = {};
    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            `API Error: ${response.status}`
        );
    }


    return data;
}


async function checkApi() {

    try {

        const response =
            await fetch(
                API_URL + "/api/health"
            );


        if (!response.ok) {
            return false;
        }


        const data =
            await response.json();


        return (
            data.ok === true ||
            data.status === "online"
        );

    } catch (error) {

        console.error(
            "API health error:",
            error
        );

        return false;
    }
}


// =====================================================
// PROFILE
// =====================================================

async function loadProfile() {

    const data =
        await apiRequest("/api/me");

    cachedProfile = data;

    isAdmin =
        data.is_admin === true;

    teacherStatus =
        data.teacher_status || null;

    return data;
}


// =====================================================
// LANGUAGE
// =====================================================

function bindLanguageButtons() {

    const buttons =
        document.querySelectorAll(
            ".language-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const lang =
                    button.dataset.lang;

                if (!lang) return;

                await selectLanguage(lang);
            }
        );

    });
}


async function selectLanguage(lang) {

    currentLanguage = lang;

    const languageScreen =
        document.getElementById(
            "languageScreen"
        );


    if (languageScreen) {

        languageScreen.style.display =
            "none";
    }


    setNav(false);


    // Пытаемся получить профиль.
    // Для нового пользователя API может вернуть 401.
    // Это не мешает выбрать роль.

    try {

        await loadProfile();

    } catch (error) {

        console.log(
            "Profile is not available yet:",
            error.message
        );

        cachedProfile = null;
        isAdmin = false;
        teacherStatus = null;
    }


    showRoleScreen();
}


// =====================================================
// ROLE SCREEN
// =====================================================

function showRoleScreen() {

    setNav(false);


    const screen =
        getScreen();

    if (!screen) return;


    screen.innerHTML = `

        <div class="role-container">

            <div class="role-card">

                <div class="role-logo">
                    🎓
                </div>

                <h1>
                    UniUZ
                </h1>

                <p>
                    ${escapeHtml(T("chooseRole"))}
                </p>

                <button
                    type="button"
                    id="studentBtn"
                    class="role-button"
                >
                    ${escapeHtml(T("student"))}
                </button>

                <button
                    type="button"
                    id="teacherBtn"
                    class="role-button teacher"
                >
                    ${escapeHtml(T("teacher"))}
                </button>

                ${
                    isAdmin
                        ? `
                            <button
                                type="button"
                                id="adminBtn"
                                class="role-button admin"
                            >
                                ${escapeHtml(T("admin"))}
                            </button>
                          `
                        : ""
                }

            </div>

        </div>

    `;


    const studentButton =
        document.getElementById(
            "studentBtn"
        );


    const teacherButton =
        document.getElementById(
            "teacherBtn"
        );


    const adminButton =
        document.getElementById(
            "adminBtn"
        );


    if (studentButton) {

        studentButton.addEventListener(
            "click",
            async () => {

                currentRole = "student";

                await openStudentApp();
            }
        );
    }


    if (teacherButton) {

        teacherButton.addEventListener(
            "click",
            async () => {

                currentRole = "teacher";

                await requestTeacherAccess();
            }
        );
    }


    if (adminButton) {

        adminButton.addEventListener(
            "click",
            async () => {

                await openAdminPanel();
            }
        );
    }
}


// =====================================================
// TEACHER REQUEST
// =====================================================

async function requestTeacherAccess() {

    try {

        const data =
            await apiRequest(
    "/api/teacher/request",
    {
        method:"POST",
        body:{
            telegram_id:
            tg?.initDataUnsafe?.user?.id
        }
    }
);


        teacherStatus =
            data.status || "pending";


        showTeacherStatus();

    } catch (error) {

        console.error(
            "Teacher request error:",
            error
        );


        showError(
            error.message
        );
    }
}


// =====================================================
// TEACHER STATUS
// =====================================================

function showTeacherStatus() {

    setNav(false);


    const screen =
        getScreen();

    if (!screen) return;


    let title =
        T("pending");

    let text =
        T("pendingText");


    if (teacherStatus === "approved") {

        title =
            T("approved");

        text =
            "Теперь вам доступен режим преподавателя.";

    }


    if (teacherStatus === "rejected") {

        title =
            T("rejected");

        text =
            "Вы можете отправить заявку повторно.";

    }


    screen.innerHTML = `

        <div class="role-container">

            <div class="role-card">

                <div class="role-logo">
                    ${
                        teacherStatus === "approved"
                            ? "✅"
                            : teacherStatus === "rejected"
                                ? "❌"
                                : "⏳"
                    }
                </div>

                <h1>
                    ${escapeHtml(title)}
                </h1>

                <p>
                    ${escapeHtml(text)}
                </p>

                <button
                    type="button"
                    id="checkTeacher"
                    class="role-button"
                >
                    ${escapeHtml(T("check"))}
                </button>

                ${
                    teacherStatus === "approved"
                        ? `
                            <button
                                type="button"
                                id="openTeacher"
                                class="role-button teacher"
                            >
                                👨‍🏫 Открыть режим преподавателя
                            </button>
                          `
                        : ""
                }

                ${
                    teacherStatus === "rejected"
                        ? `
                            <button
                                type="button"
                                id="retryTeacher"
                                class="role-button teacher"
                            >
                                ${escapeHtml(T("sendRequest"))}
                            </button>
                          `
                        : ""
                }

                <button
                    type="button"
                    id="backRole"
                    class="role-button"
                >
                    ${escapeHtml(T("back"))}
                </button>

            </div>

        </div>

    `;


    const checkButton =
        document.getElementById(
            "checkTeacher"
        );


    const openButton =
        document.getElementById(
            "openTeacher"
        );


    const retryButton =
        document.getElementById(
            "retryTeacher"
        );


    const backButton =
        document.getElementById(
            "backRole"
        );


    if (checkButton) {

        checkButton.addEventListener(
            "click",
            async () => {

                await checkTeacherStatus();
            }
        );
    }


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                showTeacherHome();
            }
        );
    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            async () => {

                await requestTeacherAccess();
            }
        );
    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                showRoleScreen();
            }
        );
    }
}


async function checkTeacherStatus() {

    try {

        const data =
            await apiRequest(
                "/api/teacher/status"
            );


        teacherStatus =
            data.status || "pending";


        if (
            teacherStatus === "approved"
        ) {

            showTeacherHome();

        } else {

            showTeacherStatus();
        }

    } catch (error) {

        showError(
            error.message
        );
    }
}


// =====================================================
// TEACHER HOME
// =====================================================

function showTeacherHome(){

    setNav(false);


    const s = getScreen();


    s.innerHTML = `

    <div class="page">

        <div class="page-header">

            <h1>
            👨‍🏫 UniUZ
            </h1>

        </div>


        <div class="info-card">

            <h2>
            ✅ Преподаватель
            </h2>


            <p>
            Добро пожаловать в кабинет преподавателя.
            </p>


        </div>


        <div class="dashboard-grid">


            <button class="dashboard-card">

                📅
                <br>

                Моё расписание

            </button>



            <button class="dashboard-card">

                📝
                <br>

                Создать задание

            </button>



            <button class="dashboard-card">

                📢
                <br>

                Объявления

            </button>



            <button class="dashboard-card">

                👥
                <br>

                Студенты

            </button>


        </div>



        <button
        class="role-button"
        id="backProfile"
        >

        ⬅️ Вернуться

        </button>


    </div>

    `;



    document
    .getElementById("backProfile")
    .onclick = ()=>{


        showRoleScreen();


    };


}


// =====================================================
// STUDENT APP
// =====================================================

async function openStudentApp() {

    setNav(true);


    await Promise.all([
        loadHomework(),
        loadAnnouncements()
    ]);


    bindBottomNavigation();


    openPage("home");
}


// =====================================================
// HOMEWORK
// =====================================================

async function loadHomework() {

    try {

        const data =
            await apiRequest(
                "/api/homework"
            );


        cachedHomework =
            Array.isArray(data.items)
                ? data.items
                : [];

    } catch (error) {

        console.warn(
            "Homework unavailable:",
            error.message
        );

        cachedHomework = [];
    }
}


// =====================================================
// ANNOUNCEMENTS
// =====================================================

async function loadAnnouncements() {

    try {

        const data =
            await apiRequest(
                "/api/announcements"
            );


        cachedAnnouncements =
            Array.isArray(data.items)
                ? data.items
                : [];

    } catch (error) {

        console.warn(
            "Announcements unavailable:",
            error.message
        );

        cachedAnnouncements = [];
    }
}


// =====================================================
// HOME
// =====================================================

function renderHomeScreen() {

    const screen =
        getScreen();

    if (!screen) return;


    const firstName =
        cachedProfile
            ?.telegram_user
            ?.first_name ||
        "Студент";


    screen.innerHTML = `

        <section class="home-page">

            <div class="page-header">

                <div>

                    <h1>
                        🎓 UniUZ
                    </h1>

                    <p>
                        ${escapeHtml(T("welcome"))}
                    </p>

                </div>

                <div class="avatar">
                    👤
                </div>

            </div>


            <div class="profile-card">

                <h2>
                    ${escapeHtml(firstName)}
                </h2>

                <p>
                    UniUZ Assistant
                </p>

            </div>


            <div class="dashboard-grid">

                <button
                    type="button"
                    class="dashboard-card"
                    data-page="schedule"
                >
                    📅
                    <br>
                    ${escapeHtml(T("schedule"))}
                </button>


                <button
                    type="button"
                    class="dashboard-card"
                    data-page="homework"
                >
                    📝
                    <br>
                    ${escapeHtml(T("homework"))}
                </button>


                <button
                    type="button"
                    class="dashboard-card"
                    data-page="announcements"
                >
                    📢
                    <br>
                    ${escapeHtml(T("announcements"))}
                </button>


                <button
                    type="button"
                    class="dashboard-card"
                    data-page="ai"
                >
                    🤖
                    <br>
                    ${escapeHtml(T("ai"))}
                </button>

            </div>

        </section>

    `;


    bindScreenButtons();
}


// =====================================================
// PAGES
// =====================================================

function openPage(page) {

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );
        });


    if (page === "home") {

        renderHomeScreen();

        return;
    }


    if (page === "profile") {

        renderProfilePage();

        return;
    }


    const screen =
        getScreen();

    if (!screen) return;


    let title = "";
    let text = "";


    if (page === "schedule") {

        title =
            `📅 ${T("schedule")}`;

        text =
            "Расписание будет подключено после получения реальных данных.";

    }


    else if (page === "homework") {

        title =
            `📝 ${T("homework")}`;

        text =
            cachedHomework.length > 0
                ? `Загружено заданий: ${cachedHomework.length}`
                : "Пока нет заданий.";

    }


    else if (page === "announcements") {

        title =
            `📢 ${T("announcements")}`;

        text =
            cachedAnnouncements.length > 0
                ? `Новых объявлений: ${cachedAnnouncements.length}`
                : "Пока нет объявлений.";

    }


    else if (page === "ai") {

        title =
            `🤖 ${T("ai")}`;

        text =
            "ИИ-помощник UniUZ будет подключён здесь.";

    }


    else {

        title = page;
        text = "Раздел будет подключён позже.";
    }


    screen.innerHTML = `

        <section class="page">

            <div class="info-card">

                <h2>
                    ${escapeHtml(title)}
                </h2>

                <p>
                    ${escapeHtml(text)}
                </p>

            </div>

        </section>

    `;
}


// =====================================================
// PROFILE
// =====================================================

function renderProfilePage() {

    const screen =
        getScreen();

    if (!screen) return;


    const firstName =
        cachedProfile
            ?.telegram_user
            ?.first_name ||
        "Студент";


    const username =
        cachedProfile
            ?.telegram_user
            ?.username
            ? "@" +
              cachedProfile.telegram_user.username
            : "";


    screen.innerHTML = `

        <section class="page">

            <div class="profile-card">

                <div class="avatar">
                    👤
                </div>

                <h1>
                    ${escapeHtml(firstName)}
                </h1>

                <p>
                    ${escapeHtml(username)}
                </p>

                <p>
                    ${escapeHtml(
                        currentRole === "teacher"
                            ? T("teacher")
                            : T("student")
                    )}
                </p>

            </div>


            <div class="info-card">

                <h2>
                    ⚙️ Настройки
                </h2>

                <p>
                    🌐 Язык:
                    ${escapeHtml(
                        currentLanguage || "ru"
                    )}
                </p>

                <p>
                    👤 Роль:
                    ${escapeHtml(
                        currentRole || "student"
                    )}
                </p>

            </div>


            <button
                type="button"
                id="changeRoleButton"
                class="role-button"
            >
                🔄 Сменить роль
            </button>


            <button
                type="button"
                id="changeLanguageButton"
                class="role-button"
            >
                🌐 Сменить язык
            </button>

        </section>

    `;


    document
        .getElementById(
            "changeRoleButton"
        )
        ?.addEventListener(
            "click",
            () => {

                currentRole = null;

                showRoleScreen();
            }
        );


    document
        .getElementById(
            "changeLanguageButton"
        )
        ?.addEventListener(
            "click",
            () => {

                currentLanguage = null;

                const languageScreen =
                    document.getElementById(
                        "languageScreen"
                    );


                if (languageScreen) {

                    languageScreen.style.display =
                        "flex";
                }


                setNav(false);

                getScreen().innerHTML = "";
            }
        );
}


// =====================================================
// BOTTOM NAVIGATION
// =====================================================

function bindBottomNavigation() {

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.onclick = () => {

                const page =
                    button.dataset.page;

                if (page) {

                    openPage(page);
                }
            };

        });
}


// =====================================================
// SCREEN BUTTONS
// =====================================================

function bindScreenButtons() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(button => {

            button.onclick = () => {

                const page =
                    button.dataset.page;

                if (page) {

                    openPage(page);
                }
            };

        });
}


// =====================================================
// ADMIN
// =====================================================

async function openAdminPanel() {

    setNav(false);


    try {

        const data =
            await apiRequest(
                "/api/admin/teacher-requests"
            );


        renderAdminPanel(
            Array.isArray(data.items)
                ? data.items
                : []
        );

    } catch (error) {

        showError(
            error.message
        );
    }
}


function renderAdminPanel(items) {

    const screen =
        getScreen();

    if (!screen) return;


    let requestsHtml = "";


    if (items.length === 0) {

        requestsHtml = `

            <div class="info-card">

                <h3>
                    ${escapeHtml(
                        T("noRequests")
                    )}
                </h3>

            </div>

        `;

    } else {

        requestsHtml =
            items.map(item => {

                const id =
                    item.telegram_id;


                const name =
                    item.full_name ||
                    item.name ||
                    "Без имени";


                return `

                    <div
                        class="info-card"
                        data-request-id="${escapeHtml(id)}"
                    >

                        <h3>
                            👨‍🏫
                            ${escapeHtml(name)}
                        </h3>

                        <p>
                            Telegram ID:
                            ${escapeHtml(id)}
                        </p>


                        <button
                            type="button"
                            class="role-button approve-teacher"
                            data-id="${escapeHtml(id)}"
                        >
                            ${escapeHtml(T("approve"))}
                        </button>


                        <button
                            type="button"
                            class="role-button teacher reject-teacher"
                            data-id="${escapeHtml(id)}"
                        >
                            ${escapeHtml(T("reject"))}
                        </button>

                    </div>

                `;
            }).join("");
    }


    screen.innerHTML = `

        <section class="page">

            <div class="page-header">

                <h1>
                    🔐 ${escapeHtml(
                        T("adminTitle")
                    )}
                </h1>

            </div>


            ${requestsHtml}


            <button
                type="button"
                id="refreshAdmin"
                class="role-button"
            >
                ${escapeHtml(T("refresh"))}
            </button>


            <button
                type="button"
                id="backAdmin"
                class="role-button"
            >
                ${escapeHtml(T("back"))}
            </button>

        </section>

    `;


    document
        .querySelectorAll(
            ".approve-teacher"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await approveTeacher(
                        button.dataset.id
                    );
                }
            );
        });


    document
        .querySelectorAll(
            ".reject-teacher"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await rejectTeacher(
                        button.dataset.id
                    );
                }
            );
        });


    document
        .getElementById("refreshAdmin")
        ?.addEventListener(
            "click",
            async () => {

                await openAdminPanel();
            }
        );


    document
        .getElementById("backAdmin")
        ?.addEventListener(
            "click",
            () => {

                showRoleScreen();
            }
        );
}


// =====================================================
// APPROVE TEACHER
// =====================================================

async function approveTeacher(id) {

    try {

        await apiRequest(
            `/api/admin/teacher/${encodeURIComponent(id)}/approve`,
            {
                method: "POST"
            }
        );


        await openAdminPanel();

    } catch (error) {

        showError(
            error.message
        );
    }
}


// =====================================================
// REJECT TEACHER
// =====================================================

async function rejectTeacher(id) {

    try {

        await apiRequest(
            `/api/admin/teacher/${encodeURIComponent(id)}/reject`,
            {
                method: "POST"
            }
        );


        await openAdminPanel();

    } catch (error) {

        showError(
            error.message
        );
    }
}


// =====================================================
// ERROR SCREEN
// =====================================================

function showError(text) {

    const screen =
        getScreen();

    if (!screen) return;


    screen.innerHTML = `

        <section class="page">

            <div class="info-card">

                <h2>
                    ⚠️ Ошибка
                </h2>

                <p>
                    ${escapeHtml(
                        text || "Неизвестная ошибка"
                    )}
                </p>


                <button
                    type="button"
                    id="errorBack"
                    class="role-button"
                >
                    ⬅️ Назад
                </button>

            </div>

        </section>

    `;


    document
        .getElementById("errorBack")
        ?.addEventListener(
            "click",
            () => {

                if (currentLanguage) {

                    showRoleScreen();

                } else {

                    const languageScreen =
                        document.getElementById(
                            "languageScreen"
                        );

                    if (languageScreen) {

                        languageScreen.style.display =
                            "flex";
                    }
                }
            }
        );
}


// =====================================================
// INITIALIZE
// =====================================================

async function initializeUniUZ() {

    // Скрываем нижнюю навигацию
    // пока пользователь не выбрал роль.

    setNav(false);


    // Проверяем API,
    // но НЕ блокируем экран языка,
    // если API временно недоступно.

    const online =
        await checkApi();


    if (!online) {

        console.warn(
            "UniUZ API is offline"
        );
    }


    // ВАЖНО:
    // Здесь НЕ вызывается loadProfile().
    //
    // Пользователь должен сначала:
    // язык → роль
}


async function startUniUZ() {

    try {

        setNav(false);

        bindLanguageButtons();

        await initializeUniUZ();

    } catch (error) {

        console.error(
            "UniUZ initialization error:",
            error
        );

        showError(
            error.message
        );
    }
}


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startUniUZ();

    }
);

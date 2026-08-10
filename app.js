// ============================================================
// UniUZ Mini App
// ============================================================

const API_URL = "https://uniuz-production.up.railway.app";

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

const initData = tg?.initData || "";


// ============================================================
// LANGUAGE
// ============================================================

const translations = {

    ru: {
        loading: "Загрузка...",
        error: "⚠️ Не удалось загрузить данные UniUZ.",

        student: "Студент",
        university: "Университет",
        department: "Факультет",
        group: "Группа",
        language: "Язык",
        telegramId: "Telegram ID",
        notSelected: "Не выбрано",

        home: "Главная",
        schedule: "Расписание",
        homework: "Задания",
        ai: "ИИ",
        profile: "Профиль",

        noHomework: "📚 Нет заданий",
        noAnnouncements: "📢 Нет объявлений"
    },

    en: {
        loading: "Loading...",
        error: "⚠️ Failed to load UniUZ data.",

        student: "Student",
        university: "University",
        department: "Department",
        group: "Group",
        language: "Language",
        telegramId: "Telegram ID",
        notSelected: "Not selected",

        home: "Home",
        schedule: "Schedule",
        homework: "Homework",
        ai: "AI",
        profile: "Profile",

        noHomework: "📚 No homework",
        noAnnouncements: "📢 No announcements"
    },

    ko: {
        loading: "로딩 중...",
        error: "⚠️ UniUZ 데이터를 불러오지 못했습니다.",

        student: "학생",
        university: "대학교",
        department: "학과",
        group: "그룹",
        language: "언어",
        telegramId: "Telegram ID",
        notSelected: "선택되지 않음",

        home: "홈",
        schedule: "시간표",
        homework: "과제",
        ai: "AI",
        profile: "프로필",

        noHomework: "📚 과제가 없습니다",
        noAnnouncements: "📢 공지가 없습니다"
    }

};


let currentLanguage =
    localStorage.getItem("uniuz_language") || null;


// ============================================================
// DATA
// ============================================================

let profileData = null;
let homeworkData = [];
let announcementsData = [];


// ============================================================
// LANGUAGE HELPERS
// ============================================================

function getLanguage() {
    return currentLanguage || "ru";
}


function t(key) {

    const lang =
        translations[getLanguage()] ||
        translations.ru;

    return lang[key] ?? key;
}


// ============================================================
// LANGUAGE SCREEN
// ============================================================

function findLanguageScreen() {

    const selectors = [
        "#languageScreen",
        "#language-screen",
        ".language-screen",
        "#language-selection",
        ".language-selection",
        "#language-container",
        ".language-container"
    ];

    for (const selector of selectors) {

        const element =
            document.querySelector(selector);

        if (element) {
            return element;
        }
    }

    return null;
}


function hideLanguageScreen() {

    const screen =
        findLanguageScreen();

    if (screen) {
        screen.style.display = "none";
    }
}


function showMainApplication() {

    const app =
        document.querySelector("#app");

    if (app) {
        app.classList.remove("hidden");
        app.style.display = "";
    }

    const main =
        document.querySelector("main");

    if (main) {
        main.style.display = "";
    }
}


async function selectLanguage(language) {

    if (!["ru", "en", "ko"].includes(language)) {
        return;
    }

    currentLanguage = language;

    localStorage.setItem(
        "uniuz_language",
        language
    );

    console.log(
        "UniUZ language:",
        language
    );

    hideLanguageScreen();
    showMainApplication();

    updateNavigationLanguage();

    await initializeUniUZ();

    renderHome();
}


window.selectLanguage = selectLanguage;


// ============================================================
// LANGUAGE BUTTONS
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest("button");

        if (!button) {
            return;
        }

        const lang =
            button.dataset.lang;

        if (lang) {
            selectLanguage(lang);
            return;
        }

        const text =
            (
                button.textContent || ""
            )
                .trim()
                .toLowerCase();

        if (text.includes("русский")) {
            selectLanguage("ru");
            return;
        }

        if (text.includes("english")) {
            selectLanguage("en");
            return;
        }

        if (
            text.includes("한국어") ||
            text.includes("korean")
        ) {
            selectLanguage("ko");
            return;
        }
    }
);


// ============================================================
// HELPERS
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


function setText(selector, value) {

    const element =
        document.querySelector(selector);

    if (element) {
        element.textContent =
            value ?? "";
    }
}


function getScreen() {

    return document.getElementById(
        "screen"
    );
}


// ============================================================
// API
// ============================================================

async function apiRequest(path) {

    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                method: "GET",

                headers: {
                    "X-Telegram-Init-Data":
                        initData
                }
            }
        );

    let data;

    try {
        data =
            await response.json();
    } catch {
        throw new Error(
            "API returned invalid JSON"
        );
    }

    if (!response.ok) {

        throw new Error(
            data.error ||
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

        return data.ok === true;

    } catch (error) {

        console.error(
            "UniUZ API unavailable:",
            error
        );

        return false;
    }
}


// ============================================================
// PROFILE DATA
// ============================================================

async function loadProfile() {

    const data =
        await apiRequest(
            "/api/me"
        );

    console.log(
        "UniUZ profile:",
        data
    );

    if (!data.ok) {
        throw new Error(
            "Profile loading failed"
        );
    }

    profileData = data;

    updateUserHeader();

    return data;
}


// ============================================================
// HEADER
// ============================================================

function updateUserHeader() {

    if (!profileData) {
        return;
    }

    const telegramUser =
        profileData.telegram_user || {};

    const profile =
        profileData.profile || {};

    const name =
        profile.full_name ||
        telegramUser.first_name ||
        telegramUser.username ||
        "Student";

    const avatar =
        document.querySelector(
            "#avatar"
        );

    if (avatar) {

        avatar.textContent =
            (
                name[0] ||
                "U"
            ).toUpperCase();
    }

    setText(
        "#welcome",
        `${t("student")} • ${name}`
    );

    setText(
        "#user-name",
        name
    );

    setText(
        "#profile-name",
        name
    );
}


// ============================================================
// HOMEWORK
// ============================================================

async function loadHomework() {

    const data =
        await apiRequest(
            "/api/homework"
        );

    console.log(
        "UniUZ homework:",
        data
    );

    homeworkData =
        Array.isArray(data.items)
            ? data.items
            : [];

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

    console.log(
        "UniUZ announcements:",
        data
    );

    announcementsData =
        Array.isArray(data.items)
            ? data.items
            : [];

    return data;
}


// ============================================================
// PROFILE PAGE
// ============================================================

function renderProfile() {

    const screen =
        getScreen();

    if (!screen) {
        return;
    }

    const telegramUser =
        profileData?.telegram_user || {};

    const profile =
        profileData?.profile || {};

    const name =
        profile.full_name ||
        telegramUser.first_name ||
        telegramUser.username ||
        "Student";

    const username =
        profile.username ||
        telegramUser.username ||
        "";

    const university =
        profile.university ||
        "Ajou University in Tashkent";

    const department =
        profile.department ||
        t("notSelected");

    const group =
        profile.group_name ||
        t("notSelected");

    const telegramId =
        telegramUser.id ||
        "—";

    const languageNames = {

        ru: "🇷🇺 Русский",
        en: "🇬🇧 English",
        ko: "🇰🇷 한국어"

    };

    const language =
        languageNames[
            getLanguage()
        ] ||
        languageNames.ru;

    const avatarLetter =
        (
            name.trim()[0] ||
            "U"
        ).toUpperCase();


    screen.innerHTML = `

        <div class="page profile-page">

            <div class="profile-hero">

                <div class="profile-avatar">
                    ${escapeHtml(
                        avatarLetter
                    )}
                </div>

                <h1>
                    ${escapeHtml(
                        name
                    )}
                </h1>

                ${
                    username
                        ? `
                            <div class="profile-username">
                                @${escapeHtml(
                                    username
                                )}
                            </div>
                        `
                        : ""
                }

                <div class="profile-role">
                    🎓 ${escapeHtml(
                        t("student")
                    )}
                </div>

            </div>


            <div class="profile-section">

                <div class="profile-section-title">
                    👤 ${getLanguage() === "ru"
                        ? "Личная информация"
                        : getLanguage() === "ko"
                            ? "개인 정보"
                            : "Personal information"}
                </div>


                <div class="profile-row">

                    <div class="profile-row-icon">
                        🏫
                    </div>

                    <div class="profile-row-content">

                        <small>
                            ${escapeHtml(
                                t("university")
                            )}
                        </small>

                        <strong>
                            ${escapeHtml(
                                university
                            )}
                        </strong>

                    </div>

                </div>


                <div class="profile-row">

                    <div class="profile-row-icon">
                        🎓
                    </div>

                    <div class="profile-row-content">

                        <small>
                            ${escapeHtml(
                                t("department")
                            )}
                        </small>

                        <strong>
                            ${escapeHtml(
                                department
                            )}
                        </strong>

                    </div>

                </div>


                <div class="profile-row">

                    <div class="profile-row-icon">
                        👥
                    </div>

                    <div class="profile-row-content">

                        <small>
                            ${escapeHtml(
                                t("group")
                            )}
                        </small>

                        <strong>
                            ${escapeHtml(
                                group
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <div class="profile-section">

                <div class="profile-section-title">
                    ⚙️ ${
                        getLanguage() === "ru"
                            ? "Настройки"
                            : getLanguage() === "ko"
                                ? "설정"
                                : "Settings"
                    }
                </div>


                <div class="profile-row">

                    <div class="profile-row-icon">
                        🌐
                    </div>

                    <div class="profile-row-content">

                        <small>
                            ${escapeHtml(
                                t("language")
                            )}
                        </small>

                        <strong>
                            ${escapeHtml(
                                language
                            )}
                        </strong>

                    </div>

                </div>


                <div class="profile-row">

                    <div class="profile-row-icon">
                        🆔
                    </div>

                    <div class="profile-row-content">

                        <small>
                            ${escapeHtml(
                                t("telegramId")
                            )}
                        </small>

                        <strong>
                            ${escapeHtml(
                                String(
                                    telegramId
                                )
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <div class="profile-status">

                <div class="profile-status-icon">
                    ✓
                </div>

                <div>

                    <strong>
                        UniUZ
                    </strong>

                    <small>
                        ${
                            getLanguage() === "ru"
                                ? "Профиль синхронизирован с базой"
                                : getLanguage() === "ko"
                                    ? "프로필이 데이터베이스와 동기화되었습니다"
                                    : "Profile synchronized with database"
                        }
                    </small>

                </div>

            </div>

        </div>
    `;
}


// ============================================================
// HOME PAGE
// ============================================================

function renderHome() {

    const screen =
        getScreen();

    if (!screen) {
        return;
    }

    const telegramUser =
        profileData?.telegram_user || {};

    const profile =
        profileData?.profile || {};

    const name =
        profile.full_name ||
        telegramUser.first_name ||
        telegramUser.username ||
        "Student";

    const homeworkCount =
        homeworkData.length;

    const announcementCount =
        announcementsData.length;


    screen.innerHTML = `

        <div class="page home-page">

            <div class="home-header">

                <div class="home-label">
                    ${escapeHtml(
                        t("student")
                    )}
                </div>

                <h1>
                    ${escapeHtml(
                        name
                    )}
                </h1>

                <p>
                    ${
                        getLanguage() === "ru"
                            ? "Добро пожаловать 👋"
                            : getLanguage() === "ko"
                                ? "환영합니다 👋"
                                : "Welcome 👋"
                    }
                </p>

            </div>


            <div class="home-stats">

                <button
                    class="stat-card"
                    data-page="schedule"
                >
                    <span>📅</span>
                    <strong>
                        ${getLanguage() === "ru"
                            ? "Расписание"
                            : getLanguage() === "ko"
                                ? "시간표"
                                : "Schedule"}
                    </strong>
                    <small>
                        ${
                            getLanguage() === "ru"
                                ? "Сегодня"
                                : getLanguage() === "ko"
                                    ? "오늘"
                                    : "Today"
                        }
                    </small>
                </button>


                <button
                    class="stat-card"
                    data-page="homework"
                >
                    <span>📝</span>
                    <strong>
                        ${getLanguage() === "ru"
                            ? "Задания"
                            : getLanguage() === "ko"
                                ? "과제"
                                : "Homework"}
                    </strong>
                    <small>
                        ${homeworkCount}
                    </small>
                </button>


                <button
                    class="stat-card"
                    data-page="announcements"
                >
                    <span>📢</span>
                    <strong>
                        ${getLanguage() === "ru"
                            ? "Объявления"
                            : getLanguage() === "ko"
                                ? "공지사항"
                                : "Announcements"}
                    </strong>
                    <small>
                        ${announcementCount}
                    </small>
                </button>

            </div>


            <div class="home-card">

                <h2>
                    ${
                        getLanguage() === "ru"
                            ? "Следующая пара"
                            : getLanguage() === "ko"
                                ? "다음 수업"
                                : "Next class"
                    }
                </h2>

                <p>
                    ${
                        getLanguage() === "ru"
                            ? "Расписание будет подключено"
                            : getLanguage() === "ko"
                                ? "시간표가 연결됩니다"
                                : "Schedule will be connected"
                    }
                </p>

            </div>


            <div class="home-card">

                <h2>
                    ${
                        getLanguage() === "ru"
                            ? "Быстрые действия"
                            : getLanguage() === "ko"
                                ? "빠른 실행"
                                : "Quick actions"
                    }
                </h2>

                <div class="quick-actions">

                    <button
                        class="quick-action"
                        data-page="schedule"
                    >
                        📅
                        ${
                            getLanguage() === "ru"
                                ? "Сегодня"
                                : getLanguage() === "ko"
                                    ? "오늘"
                                    : "Today"
                        }
                    </button>

                    <button
                        class="quick-action"
                        data-page="homework"
                    >
                        📝
                        ${
                            getLanguage() === "ru"
                                ? "Дедлайны"
                                : getLanguage() === "ko"
                                    ? "마감일"
                                    : "Deadlines"
                        }
                    </button>

                    <button
                        class="quick-action"
                        data-page="announcements"
                    >
                        📢
                        ${
                            getLanguage() === "ru"
                                ? "Новости"
                                : getLanguage() === "ko"
                                    ? "공지"
                                    : "News"
                        }
                    </button>

                    <button
                        class="quick-action"
                        data-page="profile"
                    >
                        👤
                        ${
                            getLanguage() === "ru"
                                ? "Профиль"
                                : getLanguage() === "ko"
                                    ? "프로필"
                                    : "Profile"
                        }
                    </button>

                </div>

            </div>

        </div>
    `;
}


// ============================================================
// HOMEWORK PAGE
// ============================================================

function renderHomework() {

    const screen =
        getScreen();

    if (!screen) {
        return;
    }

    if (!homeworkData.length) {

        screen.innerHTML = `

            <div class="page">

                <div class="page-title">
                    📝 ${escapeHtml(
                        t("homework")
                    )}
                </div>

                <div class="empty-state">
                    ${escapeHtml(
                        t("noHomework")
                    )}
                </div>

            </div>
        `;

        return;
    }


    screen.innerHTML = `

        <div class="page">

            <div class="page-title">
                📝 ${escapeHtml(
                    t("homework")
                )}
            </div>

            <div class="cards-list">

                ${
                    homeworkData
                        .map(item => `

                            <div class="data-card">

                                <div class="data-card-title">
                                    📚 ${escapeHtml(
                                        item.subject_name ||
                                        "Subject"
                                    )}
                                </div>

                                <div class="data-card-text">
                                    ${escapeHtml(
                                        item.task_text ||
                                        ""
                                    )}
                                </div>

                                <div class="data-card-meta">
                                    📅 ${escapeHtml(
                                        item.homework_date ||
                                        ""
                                    )}

                                    ${
                                        item.homework_time
                                            ? `
                                                ⏰ ${escapeHtml(
                                                    item.homework_time
                                                )}
                                            `
                                            : ""
                                    }
                                </div>

                            </div>

                        `)
                        .join("")
                }

            </div>

        </div>
    `;
}


// ============================================================
// ANNOUNCEMENTS PAGE
// ============================================================

function renderAnnouncements() {

    const screen =
        getScreen();

    if (!screen) {
        return;
    }

    if (!announcementsData.length) {

        screen.innerHTML = `

            <div class="page">

                <div class="page-title">
                    📢 ${
                        getLanguage() === "ru"
                            ? "Объявления"
                            : getLanguage() === "ko"
                                ? "공지사항"
                                : "Announcements"
                    }
                </div>

                <div class="empty-state">
                    ${escapeHtml(
                        t("noAnnouncements")
                    )}
                </div>

            </div>
        `;

        return;
    }


    screen.innerHTML = `

        <div class="page">

            <div class="page-title">
                📢 ${
                    getLanguage() === "ru"
                        ? "Объявления"
                        : getLanguage() === "ko"
                            ? "공지사항"
                            : "Announcements"
                }
            </div>

            <div class="cards-list">

                ${
                    announcementsData
                        .map(item => `

                            <div class="data-card">

                                <div class="data-card-title">
                                    📢 ${escapeHtml(
                                        item.title ||
                                        "Announcement"
                                    )}
                                </div>

                                <div class="data-card-text">
                                    ${escapeHtml(
                                        item.message ||
                                        ""
                                    )}
                                </div>

                            </div>

                        `)
                        .join("")
                }

            </div>

        </div>
    `;
}


// ============================================================
// SCHEDULE PAGE
// ============================================================

function renderSchedule() {

    const screen =
        getScreen();

    if (!screen) {
        return;
    }

    screen.innerHTML = `

        <div class="page">

            <div class="page-title">
                📅 ${escapeHtml(
                    t("schedule")
                )}
            </div>

            <div class="empty-state">

                📅

                <br><br>

                ${
                    getLanguage() === "ru"
                        ? "Расписание будет подключено"
                        : getLanguage() === "ko"
                            ? "시간표가 연결됩니다"
                            : "Schedule will be connected"
                }

            </div>

        </div>
    `;
}


// ============================================================
// AI PAGE
// ============================================================

function renderAI() {

    const screen =
        getScreen();

    if (!screen) {
        return;
    }

    screen.innerHTML = `

        <div class="page">

            <div class="page-title">
                🤖 ${escapeHtml(
                    t("ai")
                )}
            </div>

            <div class="home-card">

                <h2>
                    UniUZ AI
                </h2>

                <p>
                    ${
                        getLanguage() === "ru"
                            ? "ИИ-помощник скоро будет доступен в Mini App."
                            : getLanguage() === "ko"
                                ? "AI 도우미가 곧 Mini App에서 제공됩니다."
                                : "AI assistant will soon be available in the Mini App."
                    }
                </p>

            </div>

        </div>
    `;
}


// ============================================================
// NAVIGATION
// ============================================================

function updateNavigationLanguage() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            const page =
                button.dataset.page;

            const small =
                button.querySelector(
                    "small"
                );

            if (!small) {
                return;
            }

            if (
                page === "home"
            ) {
                small.textContent =
                    t("home");
            }

            if (
                page === "schedule"
            ) {
                small.textContent =
                    t("schedule");
            }

            if (
                page === "homework"
            ) {
                small.textContent =
                    t("homework");
            }

            if (
                page === "ai"
            ) {
                small.textContent =
                    t("ai");
            }

            if (
                page === "profile"
            ) {
                small.textContent =
                    t("profile");
            }

        });
}


async function navigate(page) {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    if (page === "home") {

        renderHome();
        return;
    }


    if (page === "schedule") {

        renderSchedule();
        return;
    }


    if (page === "homework") {

        renderHomework();
        return;
    }


    if (page === "ai") {

        renderAI();
        return;
    }


    if (page === "profile") {

        renderProfile();
        return;
    }


    if (page === "announcements") {

        renderAnnouncements();
        return;
    }
}


// ============================================================
// NAV CLICK HANDLER
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                "[data-page]"
            );

        if (!button) {
            return;
        }

        const page =
            button.dataset.page;

        if (!page) {
            return;
        }

        navigate(page);
    }
);


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

function showError(message) {

    console.error(
        message
    );

    const errorElement =
        document.querySelector(
            "#error"
        );

    if (errorElement) {

        errorElement.textContent =
            message;

        errorElement.style.display =
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

            throw new Error(
                "UniUZ API is unavailable."
            );
        }


        if (!initData) {

            console.warn(
                "Telegram initData is empty."
            );
        }


        await loadProfile();

        await loadHomework();

        await loadAnnouncements();


        updateUserHeader();

        updateNavigationLanguage();


        console.log(
            "UniUZ Mini App initialized successfully."
        );


    } catch (error) {

        console.error(
            "UniUZ initialization error:",
            error
        );

        showError(
            t("error")
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

        await loadProfile();

        await loadHomework();

        await loadAnnouncements();

        updateUserHeader();

        const active =
            document.querySelector(
                ".nav-item.active"
            );

        if (active) {

            navigate(
                active.dataset.page
            );

        } else {

            renderHome();

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

        updateNavigationLanguage();


        if (currentLanguage) {

            hideLanguageScreen();

            showMainApplication();

            await initializeUniUZ();

            renderHome();

        } else {

            console.log(
                "Waiting for language selection..."
            );
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

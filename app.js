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
        noHomework: "📚 Нет заданий",
        noAnnouncements: "📢 Нет объявлений"
    },

    en: {
        loading: "Loading...",
        error: "⚠️ Failed to load UniUZ data.",
        noHomework: "📚 No homework",
        noAnnouncements: "📢 No announcements"
    },

    ko: {
        loading: "로딩 중...",
        error: "⚠️ UniUZ 데이터를 불러오지 못했습니다.",
        noHomework: "📚 과제가 없습니다",
        noAnnouncements: "📢 공지가 없습니다"
    }
};


let currentLanguage =
    localStorage.getItem("uniuz_language") || null;


function getLanguage() {
    return currentLanguage || "ru";
}


// ============================================================
// LANGUAGE SELECTION
// ============================================================

function findLanguageScreen() {

    const selectors = [
        "#language-screen",
        ".language-screen",
        "#language-selection",
        ".language-selection",
        "#language-container",
        ".language-container"
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);

        if (element) {
            return element;
        }
    }

    // Fallback:
    // Find the container that contains the three language buttons.
    const buttons = [...document.querySelectorAll("button")];

    const languageButtons = buttons.filter(button => {
        const text = (
            button.textContent || ""
        ).toLowerCase();

        return (
            text.includes("рус") ||
            text.includes("english") ||
            text.includes("한국") ||
            text.includes("korean")
        );
    });

    if (languageButtons.length >= 3) {

        let parent = languageButtons[0].parentElement;

        for (let i = 0; i < 6 && parent; i++) {

            const count =
                parent.querySelectorAll("button").length;

            if (count >= 3) {
                return parent;
            }

            parent = parent.parentElement;
        }
    }

    return null;
}


function hideLanguageScreen() {

    const screen = findLanguageScreen();

    if (screen) {
        screen.style.display = "none";
    }
}


function showMainApplication() {
    const screen = document.querySelector("#screen");
    const nav = document.querySelector(".bottom-nav");

    if (screen) screen.style.display = "";
    if (nav) nav.style.display = "";
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

    openPage("home");

    await initializeUniUZ();
}


// Make available to HTML onclick=""
window.selectLanguage = selectLanguage;


// ============================================================
// EXACT LANGUAGE BUTTONS
// ============================================================

document.addEventListener("click", (event) => {
    const button = event.target.closest(".language-btn");

    if (!button) return;

    const language = button.dataset.lang;

    if (["ru", "en", "ko"].includes(language)) {
        event.preventDefault();
        event.stopPropagation();
        selectLanguage(language);
    }
}, true);


// ============================================================
// AUTOMATIC LANGUAGE BUTTON DETECTION
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest("button");

        if (!button) {
            return;
        }

        const text =
            (button.textContent || "")
                .trim()
                .toLowerCase();

        if (
            text.includes("русский") ||
            text === "ru"
        ) {
            selectLanguage("ru");
            return;
        }

        if (
            text.includes("english") ||
            text === "en"
        ) {
            selectLanguage("en");
            return;
        }

        if (
            text.includes("한국어") ||
            text.includes("korean") ||
            text === "ko"
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


// ============================================================
// API
// ============================================================

async function apiRequest(path) {

    const response = await fetch(
        `${API_URL}${path}`,
        {
            method: "GET",

            headers: {
                "X-Telegram-Init-Data":
                    initData
            }
        }
    );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.error || "API error"
        );
    }

    return data;
}


// ============================================================
// PROFILE
// ============================================================

async function loadProfile() {

    const data =
        await apiRequest("/api/me");

    cachedProfile = {
        telegramUser: data.telegram_user,
        profile: data.profile
    };

    console.log(
        "UniUZ profile:",
        data
    );

    if (!data.ok) {
        throw new Error(
            "Profile loading failed"
        );
    }

    const telegramUser =
        data.telegram_user;

    const profile =
        data.profile;


    if (telegramUser) {

        const name =
            telegramUser.first_name ||
            telegramUser.username ||
            "Student";

        setText(
            "#user-name",
            name
        );

        const avatar =
            document.querySelector(
                "#user-avatar"
            );

        if (avatar) {

            avatar.textContent =
                (
                    name[0] || "U"
                ).toUpperCase();
        }
    }


    if (profile) {

        setText(
            "#profile-name",
            profile.full_name ||
            "UniUZ"
        );

        setText(
            "#profile-username",
            profile.username
                ? `@${profile.username}`
                : ""
        );

        setText(
            "#profile-university",
            profile.university ||
            "Ajou University in Tashkent"
        );

        setText(
            "#profile-department",
            profile.department ||
            "Not selected"
        );

        setText(
            "#profile-group",
            profile.group_name ||
            "Not selected"
        );

        setText(
            "#department",
            profile.department ||
            "—"
        );

        setText(
            "#group",
            profile.group_name ||
            "—"
        );

    } else {

        setText(
            "#profile-name",
            telegramUser?.first_name ||
            "Student"
        );

        setText(
            "#profile-university",
            "Ajou University in Tashkent"
        );

        setText(
            "#profile-department",
            "Not selected"
        );

        setText(
            "#profile-group",
            "Not selected"
        );
    }

    return {
        telegramUser,
        profile
    };
}


// ============================================================
// HOMEWORK
// ============================================================

async function loadHomework() {

    const data =
        await apiRequest(
            "/api/homework"
        );

    cachedHomework = data.items || [];

    console.log(
        "UniUZ homework:",
        data
    );

    const container =
        document.querySelector(
            "#homework-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !data.items ||
        data.items.length === 0
    ) {

        const text =
            getLanguage() === "ko"
                ? translations.ko.noHomework
                : getLanguage() === "en"
                    ? translations.en.noHomework
                    : translations.ru.noHomework;

        container.innerHTML = `
            <div class="empty-state">
                ${text}
            </div>
        `;

        setText(
            "#homework-count",
            "0"
        );

        return;
    }

    setText(
        "#homework-count",
        String(data.items.length)
    );


    data.items.forEach(item => {

        const card =
            document.createElement("div");

        card.className =
            "homework-card";

        card.innerHTML = `
            <div class="homework-title">
                📚 ${escapeHtml(
                    item.subject_name
                )}
            </div>

            <div class="homework-task">
                ${escapeHtml(
                    item.task_text
                )}
            </div>

            <div class="homework-date">
                📅 ${escapeHtml(
                    item.homework_date
                )}
                &nbsp;
                ⏰ ${escapeHtml(
                    item.homework_time
                )}
            </div>
        `;

        container.appendChild(card);
    });
}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    const data =
        await apiRequest(
            "/api/announcements"
        );

    cachedAnnouncements = data.items || [];

    console.log(
        "UniUZ announcements:",
        data
    );

    const container =
        document.querySelector(
            "#announcement-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";


    if (
        !data.items ||
        data.items.length === 0
    ) {

        const text =
            getLanguage() === "ko"
                ? translations.ko.noAnnouncements
                : getLanguage() === "en"
                    ? translations.en.noAnnouncements
                    : translations.ru.noAnnouncements;

        container.innerHTML = `
            <div class="empty-state">
                ${text}
            </div>
        `;

        setText(
            "#announcement-count",
            "0"
        );

        return;
    }


    setText(
        "#announcement-count",
        String(data.items.length)
    );


    data.items.forEach(item => {

        const card =
            document.createElement("div");

        card.className =
            "announcement-card";

        card.innerHTML = `
            <div class="announcement-title">
                📢 ${escapeHtml(
                    item.title
                )}
            </div>

            <div class="announcement-message">
                ${escapeHtml(
                    item.message
                )}
            </div>
        `;

        container.appendChild(card);
    });
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

    console.error(message);

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
// ACTUAL MINI APP SCREEN
// ============================================================

const appText = {
    ru: {
        welcome: "Добро пожаловать 👋",
        student: "СТУДЕНТ",
        profileDb: "Профиль будет загружен из базы UniUZ",
        next: "📅 Следующая пара",
        scheduleConnect: "Расписание подключится к базе",
        schedule: "Расписание",
        today: "На сегодня",
        homework: "Задания",
        announcements: "Объявления",
        ai: "AI Assistant",
        quick: "⚡ Быстрые действия",
        deadlines: "Дедлайны",
        news: "Новости",
        profile: "Профиль"
    },
    en: {
        welcome: "Welcome 👋",
        student: "STUDENT",
        profileDb: "Profile will be loaded from UniUZ database",
        next: "📅 Next class",
        scheduleConnect: "Schedule will be connected to the database",
        schedule: "Schedule",
        today: "Today",
        homework: "Homework",
        announcements: "Announcements",
        ai: "AI Assistant",
        quick: "⚡ Quick actions",
        deadlines: "Deadlines",
        news: "News",
        profile: "Profile"
    },
    ko: {
        welcome: "환영합니다 👋",
        student: "학생",
        profileDb: "프로필은 UniUZ 데이터베이스에서 불러옵니다",
        next: "📅 다음 수업",
        scheduleConnect: "시간표가 데이터베이스에 연결됩니다",
        schedule: "시간표",
        today: "오늘",
        homework: "과제",
        announcements: "공지사항",
        ai: "AI Assistant",
        quick: "⚡ 빠른 실행",
        deadlines: "마감일",
        news: "뉴스",
        profile: "프로필"
    }
};

function U(key) {
    return (appText[getLanguage()] || appText.ru)[key];
}

let cachedProfile = null;
let cachedHomework = [];
let cachedAnnouncements = [];

function renderHomeScreen() {
    const screen = document.querySelector("#screen");
    if (!screen) return;

    const user = cachedProfile?.telegramUser;
    const profile = cachedProfile?.profile;

    const name =
        user?.first_name ||
        user?.username ||
        profile?.full_name ||
        "UniUZ";

    screen.innerHTML = `
        <section class="home-page">
            <div class="page-header">
                <div>
                    <h1>🎓 UniUZ</h1>
                    <p>${escapeHtml(U("welcome"))}</p>
                </div>
                <div class="avatar" id="user-avatar">
                    ${escapeHtml((name[0] || "U").toUpperCase())}
                </div>
            </div>

            <div class="profile-card">
                <div class="eyebrow">${escapeHtml(U("student"))}</div>
                <h2 id="profile-name">${escapeHtml(name)}</h2>
                <p>
                    ${
                        profile
                        ? `${escapeHtml(profile.department || "—")} · ${escapeHtml(profile.group_name || "—")}`
                        : escapeHtml(U("profileDb"))
                    }
                </p>
            </div>

            <div class="next-card">
                <div class="card-label">${escapeHtml(U("next"))}</div>
                <div class="next-time">09:00</div>
                <h3>${escapeHtml(U("scheduleConnect"))}</h3>
                <p>🏫 —</p>
            </div>

            <div class="dashboard-grid">
                <button class="dashboard-card" data-page="schedule">
                    <span>📅</span>
                    <strong>${escapeHtml(U("schedule"))}</strong>
                    <small>${escapeHtml(U("today"))}</small>
                </button>

                <button class="dashboard-card" data-page="homework">
                    <span>📝</span>
                    <strong>${escapeHtml(U("homework"))}</strong>
                    <small>${cachedHomework.length}</small>
                </button>

                <button class="dashboard-card" data-page="announcements">
                    <span>📢</span>
                    <strong>${escapeHtml(U("announcements"))}</strong>
                    <small>${cachedAnnouncements.length}</small>
                </button>

                <button class="dashboard-card" data-page="ai">
                    <span>🤖</span>
                    <strong>${escapeHtml(U("ai"))}</strong>
                    <small>7 / day</small>
                </button>
            </div>

            <div class="quick-card">
                <h3>${escapeHtml(U("quick"))}</h3>
                <div class="quick-grid">
                    <button data-page="schedule">${escapeHtml(U("today"))}</button>
                    <button data-page="homework">${escapeHtml(U("deadlines"))}</button>
                    <button data-page="announcements">${escapeHtml(U("news"))}</button>
                    <button data-page="profile">${escapeHtml(U("profile"))}</button>
                </div>
            </div>
        </section>
    `;

    bindScreenButtons();
}

function renderSimplePage(page) {
    const screen = document.querySelector("#screen");
    if (!screen) return;

    const data = {
        schedule: ["📅", U("schedule"), "Расписание подключится к базе"],
        homework: ["📝", U("homework"), `${cachedHomework.length} заданий`],
        announcements: ["📢", U("announcements"), `${cachedAnnouncements.length} новых`],
        ai: ["🤖", U("ai"), "7 запросов/день"],
        profile: ["👤", U("profile"),
            cachedProfile?.profile
                ? `${cachedProfile.profile.department || "—"} · ${cachedProfile.profile.group_name || "—"}`
                : U("profileDb")]
    };

    const item = data[page] || data.homework;

    screen.innerHTML = `
        <section class="page">
            <div class="page-title">
                <span>${item[0]}</span>
                <h1>${escapeHtml(item[1])}</h1>
            </div>

            <div class="info-card">
                <h3>${escapeHtml(item[2])}</h3>
            </div>
        </section>
    `;
}

function setActivePage(page) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.page === page);
    });
}

function openPage(page) {
    setActivePage(page);

    if (page === "home") {
        renderHomeScreen();
    } else {
        renderSimplePage(page);
    }
}

function bindScreenButtons() {
    document.querySelectorAll("#screen [data-page]").forEach(button => {
        button.addEventListener("click", () => {
            openPage(button.dataset.page);
        });
    });
}

function bindBottomNavigation() {
    document.querySelectorAll(".bottom-nav .nav-item").forEach(button => {
        button.onclick = () => openPage(button.dataset.page);
    });
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

        openPage("home");

        console.log(
            "UniUZ Mini App initialized successfully."
        );

    } catch (error) {

        console.error(
            "UniUZ initialization error:",
            error
        );

        showError(
            translations[
                getLanguage()
            ].error
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
    () => {

        // If language was already selected,
        // skip the language screen.

        if (currentLanguage) {

            hideLanguageScreen();

            showMainApplication();

            bindBottomNavigation();
            openPage("home");
            initializeUniUZ();

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

    tg.MainButton.setText(
        "Обновить"
    );

    tg.MainButton.onClick(
        refreshUniUZ
    );
}
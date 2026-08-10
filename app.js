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

    const possibleScreens = [
        "#app",
        "#main-app",
        ".app",
        ".main-app",
        "#main",
        "main"
    ];

    for (const selector of possibleScreens) {

        const element =
            document.querySelector(selector);

        if (element) {
            element.style.display = "";
        }
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

    await initializeUniUZ();
}


// Make available to HTML onclick=""
window.selectLanguage = selectLanguage;


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

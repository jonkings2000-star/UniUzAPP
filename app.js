// ============================================================
// UniUZ Mini App
// ============================================================

// ==========================
// API
// ==========================

const API_URL = "https://uniuz-production.up.railway.app";


// ==========================
// TELEGRAM WEB APP
// ==========================

const tg = window.Telegram?.WebApp || null;

if (tg) {
    try {
        tg.ready();
        tg.expand();

        // Цвета Telegram
        if (tg.setHeaderColor) {
            tg.setHeaderColor("#111827");
        }

        if (tg.setBackgroundColor) {
            tg.setBackgroundColor("#0b1120");
        }

        if (tg.setBottomBarColor) {
            tg.setBottomBarColor("#16202b");
        }

        console.log("Telegram WebApp initialized");
    } catch (error) {
        console.warn("Telegram WebApp init error:", error);
    }
}


// ==========================
// INIT DATA
// ==========================

const initData = tg?.initData || "";

console.log(
    "Telegram initData:",
    initData ? "available" : "empty"
);


// ============================================================
// LANGUAGE
// ============================================================

const translations = {

    ru: {
        loading: "Загрузка...",
        error: "⚠️ Не удалось загрузить данные UniUZ.",
        offline: "⚠️ API временно недоступно.",
        noHomework: "📚 Нет заданий",
        noAnnouncements: "📢 Нет объявлений",

        home: "Главная",
        schedule: "Расписание",
        homework: "Задания",
        ai: "ИИ",
        profile: "Профиль",

        refresh: "Обновить",

        student: "Студент",
        notSelected: "Не выбрано",
        university: "Ajou University in Tashkent"
    },

    en: {
        loading: "Loading...",
        error: "⚠️ Failed to load UniUZ data.",
        offline: "⚠️ API is temporarily unavailable.",
        noHomework: "📚 No homework",
        noAnnouncements: "📢 No announcements",

        home: "Home",
        schedule: "Schedule",
        homework: "Homework",
        ai: "AI",
        profile: "Profile",

        refresh: "Refresh",

        student: "Student",
        notSelected: "Not selected",
        university: "Ajou University in Tashkent"
    },

    ko: {
        loading: "로딩 중...",
        error: "⚠️ UniUZ 데이터를 불러오지 못했습니다.",
        offline: "⚠️ API를 일시적으로 사용할 수 없습니다.",
        noHomework: "📚 과제가 없습니다",
        noAnnouncements: "📢 공지가 없습니다",

        home: "홈",
        schedule: "시간표",
        homework: "과제",
        ai: "AI",
        profile: "프로필",

        refresh: "새로고침",

        student: "학생",
        notSelected: "선택되지 않음",
        university: "Ajou University in Tashkent"
    }
};


// ============================================================
// CURRENT LANGUAGE
// ============================================================

// ВАЖНО:
// Если язык ещё не выбран — используем русский.
// Благодаря этому приложение не зависает на пустом экране.

let currentLanguage =
    localStorage.getItem("uniuz_language") || "ru";


// Проверяем корректность языка
if (!["ru", "en", "ko"].includes(currentLanguage)) {
    currentLanguage = "ru";
    localStorage.setItem(
        "uniuz_language",
        "ru"
    );
}


function getLanguage() {
    return currentLanguage || "ru";
}


function t(key) {
    const language = getLanguage();

    return (
        translations[language]?.[key] ??
        translations.ru[key] ??
        key
    );
}


// ============================================================
// LANGUAGE SCREEN
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

        const element =
            document.querySelector(selector);

        if (element) {
            return element;
        }
    }


    // Если ID класса нет,
    // ищем блок с тремя языковыми кнопками.

    const buttons =
        [...document.querySelectorAll("button")];

    const languageButtons =
        buttons.filter(button => {

            const text =
                (button.textContent || "")
                    .toLowerCase();

            return (
                text.includes("рус") ||
                text.includes("english") ||
                text.includes("한국") ||
                text.includes("korean")
            );
        });


    if (languageButtons.length >= 3) {

        let parent =
            languageButtons[0].parentElement;

        for (
            let i = 0;
            i < 8 && parent;
            i++
        ) {

            const count =
                parent.querySelectorAll(
                    "button"
                ).length;

            if (count >= 3) {
                return parent;
            }

            parent =
                parent.parentElement;
        }
    }


    return null;
}


// ============================================================
// HIDE LANGUAGE SCREEN
// ============================================================

function hideLanguageScreen() {

    const screen =
        findLanguageScreen();

    if (screen) {

        screen.style.display = "none";

        console.log(
            "Language screen hidden"
        );
    }
}


// ============================================================
// SHOW MAIN APPLICATION
// ============================================================

function showMainApplication() {

    const possibleScreens = [

        "#app",
        "#main-app",
        ".app",
        ".main-app",
        "#main",
        "main"
    ];


    let found = false;


    for (
        const selector
        of possibleScreens
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {

            element.style.display = "";

            found = true;
        }
    }


    // Основной экран

    const screen =
        document.querySelector(
            "#screen"
        );

    if (screen) {
        screen.style.display = "";
        found = true;
    }


    // Нижняя навигация

    const nav =
        document.querySelector(
            ".bottom-nav"
        );

    if (nav) {
        nav.style.display = "";
    }


    console.log(
        "Main application:",
        found ? "shown" : "not found"
    );
}


// ============================================================
// SELECT LANGUAGE
// ============================================================

async function selectLanguage(language) {

    if (
        !["ru", "en", "ko"]
            .includes(language)
    ) {
        console.warn(
            "Unknown language:",
            language
        );

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


    hideLanguageScreen();

    showMainApplication();


    // Обновляем тексты навигации

    updateTranslations();


    // Загружаем приложение

    await initializeUniUZ();
}


// Доступно для HTML onclick=""
window.selectLanguage =
    selectLanguage;


// ============================================================
// LANGUAGE BUTTONS
// ============================================================

function setupLanguageButtons() {

    const buttons =
        document.querySelectorAll(
            ".language-btn"
        );


    buttons.forEach(button => {

        // Убираем старые обработчики
        // через cloneNode

        const newButton =
            button.cloneNode(true);

        button.replaceWith(
            newButton
        );
    });


    const newButtons =
        document.querySelectorAll(
            ".language-btn"
        );


    newButtons.forEach(button => {

        button.addEventListener(
            "click",
            async function() {

                const language =
                    this.dataset.lang;

                console.log(
                    "Language button:",
                    language
                );

                await selectLanguage(
                    language
                );
            }
        );
    });


    console.log(
        "Language buttons:",
        newButtons.length
    );
}


// ============================================================
// FALLBACK LANGUAGE BUTTON DETECTION
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                "button"
            );


        if (!button) {
            return;
        }


        // Если это обычная language-btn,
        // её уже обработал setupLanguageButtons.

        if (
            button.classList.contains(
                "language-btn"
            )
        ) {
            return;
        }


        const text =
            (
                button.textContent || ""
            )
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

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


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
// UPDATE TRANSLATIONS
// ============================================================

function updateTranslations() {

    // Все элементы с data-i18n

    const elements =
        document.querySelectorAll(
            "[data-i18n]"
        );


    elements.forEach(
        element => {

            const key =
                element.dataset.i18n;

            if (!key) {
                return;
            }

            element.textContent =
                t(key);
        }
    );


    // Main Button Telegram

    if (
        tg &&
        tg.MainButton
    ) {

        tg.MainButton.setText(
            t("refresh")
        );
    }
}


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(
    path
) {

    const headers = {
        "Accept":
            "application/json"
    };


    // Telegram initData
    // отправляем только если оно есть

    if (initData) {

        headers[
            "X-Telegram-Init-Data"
        ] = initData;
    }


    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                method: "GET",
                headers: headers
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            `API returned invalid JSON (${response.status})`
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            `API error: ${response.status}`
        );
    }


    return data;
}


// ============================================================
// PROFILE
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


    const telegramUser =
        data.telegram_user;


    const profile =
        data.profile;


    // Telegram user

    if (telegramUser) {

        const name =
            telegramUser.first_name ||
            telegramUser.username ||
            t("student");


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
                    name[0] ||
                    "U"
                ).toUpperCase();
        }
    }


    // Profile

    if (profile) {

        setText(
            "#profile-name",
            profile.full_name ||
            t("student")
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
            t("university")
        );


        setText(
            "#profile-department",
            profile.department ||
            t("notSelected")
        );


        setText(
            "#profile-group",
            profile.group_name ||
            t("notSelected")
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
            t("student")
        );


        setText(
            "#profile-university",
            t("university")
        );


        setText(
            "#profile-department",
            t("notSelected")
        );


        setText(
            "#profile-group",
            t("notSelected")
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

        container.innerHTML = `
            <div class="empty-state">
                ${t("noHomework")}
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
        String(
            data.items.length
        )
    );


    data.items.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


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


            container.appendChild(
                card
            );
        }
    );
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

        container.innerHTML = `
            <div class="empty-state">
                ${t("noAnnouncements")}
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
        String(
            data.items.length
        )
    );


    data.items.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


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


            container.appendChild(
                card
            );
        }
    );
}


// ============================================================
// API HEALTH
// ============================================================

async function checkApi() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/health`,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "UniUZ API:",
            data
        );


        return (
            response.ok &&
            data.ok === true
        );

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

function showError(
    message
) {

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
// NAVIGATION
// ============================================================

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                function() {

                    const page =
                        this.dataset.page;


                    console.log(
                        "Navigation:",
                        page
                    );


                    // Active button

                    navItems.forEach(
                        nav => {

                            nav.classList.remove(
                                "active"
                            );
                        }
                    );


                    this.classList.add(
                        "active"
                    );


                    // Если в HTML уже есть
                    // система страниц —
                    // переключаем классы.

                    document
                        .querySelectorAll(
                            "[data-page-content]"
                        )
                        .forEach(
                            screen => {

                                screen.style.display =
                                    screen.dataset.pageContent === page
                                        ? ""
                                        : "none";
                            }
                        );


                    // Если есть функция renderPage
                    // из другого JS — используем её.

                    if (
                        typeof window.renderPage ===
                        "function"
                    ) {

                        try {

                            window.renderPage(
                                page
                            );

                        } catch (error) {

                            console.error(
                                "renderPage error:",
                                error
                            );
                        }
                    }
                }
            );
        }
    );


    console.log(
        "Navigation items:",
        navItems.length
    );
}


// ============================================================
// INITIALIZE
// ============================================================

async function initializeUniUZ() {

    showLoading();


    // Сначала показываем интерфейс,
    // чтобы приложение никогда не оставалось
    // полностью пустым.

    hideLanguageScreen();

    showMainApplication();

    updateTranslations();


    try {

        console.log(
            "Starting UniUZ..."
        );


        // Проверяем API

        const apiOnline =
            await checkApi();


        if (!apiOnline) {

            console.warn(
                "UniUZ API is offline"
            );


            // Не блокируем интерфейс.
            // Пользователь всё равно может
            // открыть Mini App.

            showError(
                t("offline")
            );


            return;
        }


        // Telegram initData

        if (!initData) {

            console.warn(
                "Telegram initData is empty."
            );
        }


        // Загружаем профиль

        try {

            await loadProfile();

        } catch (error) {

            console.error(
                "Profile error:",
                error
            );
        }


        // Загружаем задания

        try {

            await loadHomework();

        } catch (error) {

            console.error(
                "Homework error:",
                error
            );
        }


        // Загружаем объявления

        try {

            await loadAnnouncements();

        } catch (error) {

            console.error(
                "Announcements error:",
                error
            );
        }


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

    console.log(
        "Refreshing UniUZ..."
    );


    try {

        hideError();


        const apiOnline =
            await checkApi();


        if (!apiOnline) {

            showError(
                t("offline")
            );

            return;
        }


        await loadProfile();

        await loadHomework();

        await loadAnnouncements();


        console.log(
            "UniUZ refreshed."
        );

    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );


        showError(
            t("error")
        );
    }
}


// ============================================================
// HIDE ERROR
// ============================================================

function hideError() {

    const errorElement =
        document.querySelector(
            "#error"
        );


    if (errorElement) {

        errorElement.style.display =
            "none";

        errorElement.textContent =
            "";
    }
}


// ============================================================
// TELEGRAM MAIN BUTTON
// ============================================================

function setupTelegramMainButton() {

    if (
        !tg ||
        !tg.MainButton
    ) {
        return;
    }


    try {

        tg.MainButton.setText(
            t("refresh")
        );


        tg.MainButton.onClick(
            refreshUniUZ
        );


        console.log(
            "Telegram MainButton ready"
        );

    } catch (error) {

        console.warn(
            "Telegram MainButton error:",
            error
        );
    }
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "UniUZ DOM loaded"
        );


        // Всегда используем русский,
        // если язык ранее не был сохранён.

        if (!currentLanguage) {

            currentLanguage =
                "ru";

            localStorage.setItem(
                "uniuz_language",
                "ru"
            );
        }


        // Подключаем кнопки языка

        setupLanguageButtons();


        // Навигация

        setupNavigation();


        // Переводы

        updateTranslations();


        // Показываем приложение

        hideLanguageScreen();

        showMainApplication();


        // Telegram Main Button

        setupTelegramMainButton();


        // Запускаем UniUZ

        await initializeUniUZ();
    }
);


// ============================================================
// PAGE VISIBILITY
// ============================================================

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.visibilityState ===
            "visible"
        ) {

            console.log(
                "UniUZ became visible"
            );
        }
    }
);


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.UniUZ = {

    API_URL,

    getLanguage,

    selectLanguage,

    refreshUniUZ,

    loadProfile,

    loadHomework,

    loadAnnouncements,

    checkApi
};


console.log(
    "UniUZ app.js loaded successfully"
);

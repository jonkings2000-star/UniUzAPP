const API_URL = "https://uniuz-production.up.railway.app";

const tg = window.Telegram?.WebApp || null;

if (tg) {
    tg.ready();
    tg.expand();
}


// ============================================================
// LANGUAGE
// ============================================================

const translations = {
    ru: {
        welcome: "Добро пожаловать 👋",
        home: "Главная",
        schedule: "Расписание",
        homework: "Задания",
        ai: "ИИ",
        profile: "Профиль",
        student: "Студент",
        nextLesson: "Следующая пара",
        scheduleSoon: "Расписание будет подключено",
        noHomework: "Нет заданий",
        noAnnouncements: "Нет объявлений",
        announcements: "Объявления",
        quickActions: "Быстрые действия",
        today: "Сегодня",
        deadlines: "Дедлайны",
        news: "Новости",
        university: "Университет",
        department: "Факультет",
        group: "Группа",
        notSelected: "Не выбрано",
        loading: "Загрузка...",
        apiError: "Не удалось загрузить данные"
    },

    en: {
        welcome: "Welcome 👋",
        home: "Home",
        schedule: "Schedule",
        homework: "Homework",
        ai: "AI",
        profile: "Profile",
        student: "Student",
        nextLesson: "Next class",
        scheduleSoon: "Schedule will be connected",
        noHomework: "No homework",
        noAnnouncements: "No announcements",
        announcements: "Announcements",
        quickActions: "Quick actions",
        today: "Today",
        deadlines: "Deadlines",
        news: "News",
        university: "University",
        department: "Department",
        group: "Group",
        notSelected: "Not selected",
        loading: "Loading...",
        apiError: "Failed to load data"
    },

    ko: {
        welcome: "환영합니다 👋",
        home: "홈",
        schedule: "시간표",
        homework: "과제",
        ai: "AI",
        profile: "프로필",
        student: "학생",
        nextLesson: "다음 수업",
        scheduleSoon: "시간표가 연결됩니다",
        noHomework: "과제가 없습니다",
        noAnnouncements: "공지가 없습니다",
        announcements: "공지사항",
        quickActions: "빠른 실행",
        today: "오늘",
        deadlines: "마감일",
        news: "뉴스",
        university: "대학교",
        department: "학과",
        group: "그룹",
        notSelected: "선택되지 않음",
        loading: "로딩 중...",
        apiError: "데이터를 불러오지 못했습니다"
    }
};


// ============================================================
// LANGUAGE STORAGE
// ============================================================

let currentLanguage =
    localStorage.getItem("uniuz_language");


// ============================================================
// DATA
// ============================================================

let profileData = null;
let homeworkData = [];
let announcementsData = [];


// ============================================================
// HELPERS
// ============================================================

function t(key) {
    return (
        translations[currentLanguage]?.[key] ||
        translations.ru[key] ||
        key
    );
}


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
// LANGUAGE
// ============================================================

function selectLanguage(language) {

    if (
        !["ru", "en", "ko"].includes(language)
    ) {
        return;
    }

    currentLanguage = language;

    localStorage.setItem(
        "uniuz_language",
        language
    );

    console.log(
        "Selected language:",
        language
    );

    const languageScreen =
        document.getElementById(
            "languageScreen"
        );

    const app =
        document.getElementById(
            "app"
        );


    // Скрываем выбор языка
    if (languageScreen) {
        languageScreen.classList.add("hidden");
        languageScreen.style.display = "none";
    }


    // ПОКАЗЫВАЕМ ПРИЛОЖЕНИЕ
    if (app) {

        // Главное исправление
        app.classList.remove("hidden");

        app.style.display = "flex";
    }


    updateNavigation();

    renderHome();

    initializeApp();
}


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

        button.addEventListener(
            "click",
            () => {

                const language =
                    button.dataset.lang;

                selectLanguage(
                    language
                );
            }
        );
    });


    console.log(
        "Language buttons:",
        buttons.length
    );
}


// ============================================================
// API
// ============================================================

async function apiRequest(path) {

    const headers = {
        "Accept":
            "application/json"
    };


    if (tg?.initData) {

        headers[
            "X-Telegram-Init-Data"
        ] = tg.initData;
    }


    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                method: "GET",
                headers
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.error ||
            `API error ${response.status}`
        );
    }


    return data;
}


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadProfile() {

    const data =
        await apiRequest(
            "/api/me"
        );


    console.log(
        "Profile:",
        data
    );


    if (!data.ok) {
        return;
    }


    profileData = data;


    const telegramUser =
        data.telegram_user;


    const profile =
        data.profile;


    const name =
        telegramUser?.first_name ||
        telegramUser?.username ||
        profile?.full_name ||
        "UniUZ";


    const avatar =
        document.getElementById(
            "avatar"
        );


    if (avatar) {

        avatar.textContent =
            (
                name[0] ||
                "U"
            ).toUpperCase();
    }
}


// ============================================================
// LOAD HOMEWORK
// ============================================================

async function loadHomework() {

    try {

        const data =
            await apiRequest(
                "/api/homework"
            );


        homeworkData =
            data.items || [];


    } catch (error) {

        console.error(
            "Homework error:",
            error
        );

        homeworkData = [];
    }
}


// ============================================================
// LOAD ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    try {

        const data =
            await apiRequest(
                "/api/announcements"
            );


        announcementsData =
            data.items || [];


    } catch (error) {

        console.error(
            "Announcements error:",
            error
        );

        announcementsData = [];
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function updateNavigation() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            const key =
                button.dataset.page;

            const text =
                button.querySelector(
                    "[data-i18n]"
                );


            if (text) {

                text.textContent =
                    t(key);
            }
        });


    const welcome =
        document.getElementById(
            "welcome"
        );


    if (welcome) {

        welcome.textContent =
            t("welcome");
    }
}


// ============================================================
// NAVIGATION CLICK
// ============================================================

function setupNavigation() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;


                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );
                        });


                    button.classList.add(
                        "active"
                    );


                    openPage(page);
                }
            );
        });
}


// ============================================================
// OPEN PAGE
// ============================================================

function openPage(page) {

    if (page === "home") {
        renderHome();
    }

    else if (
        page === "schedule"
    ) {
        renderSchedule();
    }

    else if (
        page === "homework"
    ) {
        renderHomework();
    }

    else if (
        page === "ai"
    ) {
        renderAI();
    }

    else if (
        page === "profile"
    ) {
        renderProfile();
    }
}


// ============================================================
// HOME
// ============================================================

function renderHome() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    const telegramUser =
        profileData?.telegram_user;


    const profile =
        profileData?.profile;


    const name =
        telegramUser?.first_name ||
        telegramUser?.username ||
        profile?.full_name ||
        t("student");


    screen.innerHTML = `

        <div class="page">

            <div class="welcome-card">

                <div>

                    <div class="eyebrow">
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
                        ${escapeHtml(
                            t("welcome")
                        )}
                    </p>

                </div>

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
                            t("schedule")
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            t("today")
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
                            t("homework")
                        )}
                    </strong>

                    <small>
                        ${homeworkData.length}
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
                            t("announcements")
                        )}
                    </strong>

                    <small>
                        ${announcementsData.length}
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
                            t("ai")
                        )}
                    </strong>

                    <small>
                        7 / day
                    </small>

                </button>

            </div>


            <div class="info-card">

                <h3>
                    ${escapeHtml(
                        t("nextLesson")
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        t("scheduleSoon")
                    )}
                </p>

            </div>


            <div class="quick-card">

                <h3>
                    ${escapeHtml(
                        t("quickActions")
                    )}
                </h3>


                <div class="quick-grid">

                    <button
                        data-page="schedule"
                    >
                        📅
                        ${escapeHtml(
                            t("today")
                        )}
                    </button>


                    <button
                        data-page="homework"
                    >
                        📝
                        ${escapeHtml(
                            t("deadlines")
                        )}
                    </button>


                    <button
                        data-page="announcements"
                    >
                        📢
                        ${escapeHtml(
                            t("news")
                        )}
                    </button>


                    <button
                        data-page="profile"
                    >
                        👤
                        ${escapeHtml(
                            t("profile")
                        )}
                    </button>

                </div>

            </div>

        </div>
    `;


    setupScreenButtons();
}


// ============================================================
// SCHEDULE
// ============================================================

function renderSchedule() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    screen.innerHTML = `

        <div class="page">

            <h1>
                📅
                ${escapeHtml(
                    t("schedule")
                )}
            </h1>


            <div class="info-card">

                <h3>
                    ${escapeHtml(
                        t("nextLesson")
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        t("scheduleSoon")
                    )}
                </p>

            </div>

        </div>
    `;
}


// ============================================================
// HOMEWORK
// ============================================================

function renderHomework() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    let html = "";


    if (
        homeworkData.length === 0
    ) {

        html = `

            <div class="empty-state">

                ${escapeHtml(
                    t("noHomework")
                )}

            </div>

        `;

    } else {

        html =
            homeworkData
                .map(item => `

                    <div class="info-card">

                        <h3>
                            📚
                            ${escapeHtml(
                                item.subject_name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                item.task_text
                            )}
                        </p>

                        <small>
                            📅
                            ${escapeHtml(
                                item.homework_date
                            )}

                            ${
                                item.homework_time
                                ? `
                                    ⏰
                                    ${escapeHtml(
                                        item.homework_time
                                    )}
                                `
                                : ""
                            }
                        </small>

                    </div>

                `)
                .join("");
    }


    screen.innerHTML = `

        <div class="page">

            <h1>
                📝
                ${escapeHtml(
                    t("homework")
                )}
            </h1>

            ${html}

        </div>
    `;
}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

function renderAnnouncements() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    let html = "";


    if (
        announcementsData.length === 0
    ) {

        html = `

            <div class="empty-state">

                ${escapeHtml(
                    t("noAnnouncements")
                )}

            </div>

        `;

    } else {

        html =
            announcementsData
                .map(item => `

                    <div class="info-card">

                        <h3>
                            📢
                            ${escapeHtml(
                                item.title
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                item.message
                            )}
                        </p>

                    </div>

                `)
                .join("");
    }


    screen.innerHTML = `

        <div class="page">

            <h1>
                📢
                ${escapeHtml(
                    t("announcements")
                )}
            </h1>

            ${html}

        </div>
    `;
}


// ============================================================
// AI
// ============================================================

function renderAI() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    screen.innerHTML = `

        <div class="page">

            <h1>
                🤖
                ${escapeHtml(
                    t("ai")
                )}
            </h1>


            <div class="info-card">

                <h3>
                    UniUZ AI Assistant
                </h3>

                <p>
                    ${
                        currentLanguage === "ko"
                        ? "학업에 관한 질문을 입력하세요."
                        : currentLanguage === "en"
                        ? "Ask your study-related question."
                        : "Задайте вопрос по учебе."
                    }
                </p>

            </div>

        </div>
    `;
}


// ============================================================
// PROFILE
// ============================================================

function renderProfile() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    const telegramUser =
        profileData?.telegram_user;


    const profile =
        profileData?.profile;


    const name =
        telegramUser?.first_name ||
        telegramUser?.username ||
        profile?.full_name ||
        t("student");


    screen.innerHTML = `

        <div class="page">

            <h1>
                👤
                ${escapeHtml(
                    t("profile")
                )}
            </h1>


            <div class="profile-card">

                <div class="avatar">

                    ${escapeHtml(
                        (
                            name[0] ||
                            "U"
                        ).toUpperCase()
                    )}

                </div>


                <h2>
                    ${escapeHtml(
                        name
                    )}
                </h2>


                <p>
                    ${
                        profile?.username
                        ? "@" +
                          escapeHtml(
                              profile.username
                          )
                        : ""
                    }
                </p>

            </div>


            <div class="info-card">

                <strong>
                    ${escapeHtml(
                        t("university")
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        profile?.university ||
                        "Ajou University in Tashkent"
                    )}
                </p>

            </div>


            <div class="info-card">

                <strong>
                    ${escapeHtml(
                        t("department")
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        profile?.department ||
                        t("notSelected")
                    )}
                </p>

            </div>


            <div class="info-card">

                <strong>
                    ${escapeHtml(
                        t("group")
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        profile?.group_name ||
                        t("notSelected")
                    )}
                </p>

            </div>

        </div>
    `;
}


// ============================================================
// SCREEN BUTTONS
// ============================================================

function setupScreenButtons() {

    document
        .querySelectorAll(
            "#screen [data-page]"
        )
        .forEach(button => {

            button.onclick = () => {

                openPage(
                    button.dataset.page
                );
            };
        });
}


// ============================================================
// API INITIALIZATION
// ============================================================

async function initializeApp() {

    try {

        console.log(
            "UniUZ API connecting..."
        );


        // Проверяем API

        const health =
            await fetch(
                `${API_URL}/api/health`
            );


        const healthData =
            await health.json();


        console.log(
            "API:",
            healthData
        );


        if (
            !health.ok ||
            !healthData.ok
        ) {

            throw new Error(
                "API unavailable"
            );
        }


        // Профиль

        try {

            await loadProfile();

        } catch (error) {

            console.warn(
                "Profile:",
                error
            );
        }


        // Задания

        await loadHomework();


        // Объявления

        await loadAnnouncements();


        // Обновляем главный экран

        renderHome();


        console.log(
            "UniUZ loaded successfully"
        );


    } catch (error) {

        console.error(
            "UniUZ initialization error:",
            error
        );


        // ВАЖНО:
        // Даже если API не загрузился,
        // интерфейс всё равно остаётся.

        renderHome();
    }
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "UniUZ DOM loaded"
        );


        setupLanguageButtons();

        setupNavigation();


        // ====================================================
        // ЕСЛИ ЯЗЫК УЖЕ ВЫБРАН
        // ====================================================

        if (currentLanguage) {

            const languageScreen =
                document.getElementById(
                    "languageScreen"
                );

            const app =
                document.getElementById(
                    "app"
                );


            if (languageScreen) {

                languageScreen.classList.add(
                    "hidden"
                );

                languageScreen.style.display =
                    "none";
            }


            if (app) {

                // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ
                app.classList.remove(
                    "hidden"
                );

                app.style.display =
                    "flex";
            }


            updateNavigation();


            renderHome();


            initializeApp();


        } else {

            // =================================================
            // ПЕРВЫЙ ЗАПУСК
            // =================================================

            const app =
                document.getElementById(
                    "app"
                );


            if (app) {

                app.classList.add(
                    "hidden"
                );

                app.style.display =
                    "none";
            }


            const languageScreen =
                document.getElementById(
                    "languageScreen"
                );


            if (languageScreen) {

                languageScreen.classList.remove(
                    "hidden"
                );

                languageScreen.style.display =
                    "flex";
            }
        }
    }
);

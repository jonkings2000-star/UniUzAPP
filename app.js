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
        welcome: "Добро пожаловать 👋",
        student: "СТУДЕНТ",
        profileDb: "Профиль будет загружен из базы UniUZ",
        nextLesson: "📅 Следующая пара",
        scheduleConnect: "Расписание подключится к базе",
        schedule: "Расписание",
        today: "На сегодня",
        homework: "Задания",
        announcements: "Объявления",
        ai: "AI Assistant",
        quick: "⚡ Быстрые действия",
        deadlines: "Дедлайны",
        news: "Новости",
        profile: "Профиль",
        university: "Университет",
        department: "Факультет",
        group: "Группа",
        noData: "Нет данных",
        apiError: "⚠️ Не удалось загрузить данные UniUZ.",
        aiText: "Задайте вопрос по учебе"
    },

    en: {
        welcome: "Welcome 👋",
        student: "STUDENT",
        profileDb: "Profile will be loaded from UniUZ database",
        nextLesson: "📅 Next class",
        scheduleConnect: "Schedule will be connected to the database",
        schedule: "Schedule",
        today: "Today",
        homework: "Homework",
        announcements: "Announcements",
        ai: "AI Assistant",
        quick: "⚡ Quick actions",
        deadlines: "Deadlines",
        news: "News",
        profile: "Profile",
        university: "University",
        department: "Department",
        group: "Group",
        noData: "No data",
        apiError: "⚠️ Failed to load UniUZ data.",
        aiText: "Ask your study-related question"
    },

    ko: {
        welcome: "환영합니다 👋",
        student: "학생",
        profileDb: "프로필은 UniUZ 데이터베이스에서 불러옵니다",
        nextLesson: "📅 다음 수업",
        scheduleConnect: "시간표가 데이터베이스에 연결됩니다",
        schedule: "시간표",
        today: "오늘",
        homework: "과제",
        announcements: "공지사항",
        ai: "AI Assistant",
        quick: "⚡ 빠른 실행",
        deadlines: "마감일",
        news: "뉴스",
        profile: "프로필",
        university: "대학교",
        department: "학과",
        group: "그룹",
        noData: "데이터가 없습니다",
        apiError: "⚠️ UniUZ 데이터를 불러오지 못했습니다.",
        aiText: "학업에 관한 질문을 입력하세요"
    }
};


let currentLanguage =
    localStorage.getItem("uniuz_language") || null;


// ============================================================
// CACHE
// ============================================================

let userData = null;
let homeworkData = [];
let announcementsData = [];


// ============================================================
// LANGUAGE HELPERS
// ============================================================

function getLanguage() {
    return currentLanguage || "ru";
}


function t(key) {
    return translations[getLanguage()][key] || key;
}


// ============================================================
// HTML SECURITY
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
// LANGUAGE SCREEN
// ============================================================

function getLanguageContainer() {

    const buttons =
        document.querySelectorAll(
            ".language-btn"
        );

    if (!buttons.length) {
        return null;
    }

    let parent = buttons[0].parentElement;

    for (
        let i = 0;
        i < 8 && parent;
        i++
    ) {

        const count =
            parent.querySelectorAll(
                ".language-btn"
            ).length;

        if (count >= 3) {
            return parent;
        }

        parent = parent.parentElement;
    }

    return buttons[0].parentElement;
}


function hideLanguageScreen() {

    const container =
        getLanguageContainer();

    if (container) {
        container.style.display = "none";
    }
}


function showMainApplication() {

    const screen =
        document.querySelector("#screen");

    const navigation =
        document.querySelector(".bottom-nav");

    if (screen) {
        screen.style.display = "block";
    }

    if (navigation) {
        navigation.style.display = "flex";
    }
}


// ============================================================
// SELECT LANGUAGE
// ============================================================

async function selectLanguage(language) {

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

    hideLanguageScreen();

    showMainApplication();

    // Immediately show the application
    // while API data is loading.
    renderHome();

    await initializeUniUZ();
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
            ["ru", "en", "ko"].includes(
                language
            )
        ) {

            event.preventDefault();
            event.stopPropagation();

            selectLanguage(language);
        }
    },
    true
);


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

    const data =
        await response.json();

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
            "API:",
            data
        );

        return data.ok === true;

    } catch (error) {

        console.error(
            "API unavailable:",
            error
        );

        return false;
    }
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
        "PROFILE:",
        data
    );

    if (!data.ok) {
        throw new Error(
            "Profile loading failed"
        );
    }

    userData = {
        telegramUser:
            data.telegram_user,

        profile:
            data.profile
    };
}


// ============================================================
// LOAD HOMEWORK
// ============================================================

async function loadHomework() {

    const data =
        await apiRequest(
            "/api/homework"
        );

    console.log(
        "HOMEWORK:",
        data
    );

    homeworkData =
        data.items || [];
}


// ============================================================
// LOAD ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    const data =
        await apiRequest(
            "/api/announcements"
        );

    console.log(
        "ANNOUNCEMENTS:",
        data
    );

    announcementsData =
        data.items || [];
}


// ============================================================
// GET USER NAME
// ============================================================

function getUserName() {

    return (
        userData?.telegramUser?.first_name ||

        userData?.telegramUser?.username ||

        userData?.profile?.full_name ||

        "UniUZ"
    );
}


// ============================================================
// HOME
// ============================================================

function renderHome() {

    const screen =
        document.querySelector(
            "#screen"
        );

    if (!screen) {
        console.error(
            "#screen not found"
        );

        return;
    }

    const name =
        getUserName();

    const profile =
        userData?.profile;

    const department =
        profile?.department ||
        "—";

    const group =
        profile?.group_name ||
        "—";


    screen.innerHTML = `

        <div class="home-page">

            <div class="page-header">

                <div>

                    <h1>
                        🎓 UniUZ
                    </h1>

                    <p>
                        ${escapeHtml(
                            t("welcome")
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
                        t("student")
                    )}
                </div>

                <h2 id="profile-name">
                    ${escapeHtml(name)}
                </h2>

                <p>

                    ${
                        profile
                        ? `
                            ${escapeHtml(
                                department
                            )}
                            ·
                            ${escapeHtml(
                                group
                            )}
                        `
                        : escapeHtml(
                            t("profileDb")
                        )
                    }

                </p>

            </div>


            <div class="next-card">

                <div class="card-label">
                    ${escapeHtml(
                        t("nextLesson")
                    )}
                </div>

                <div class="next-time">
                    09:00
                </div>

                <h3>
                    ${escapeHtml(
                        t("scheduleConnect")
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


            <div class="quick-card">

                <h3>
                    ${escapeHtml(
                        t("quick")
                    )}
                </h3>


                <div class="quick-grid">

                    <button
                        data-page="schedule"
                    >
                        ${escapeHtml(
                            t("today")
                        )}
                    </button>


                    <button
                        data-page="homework"
                    >
                        ${escapeHtml(
                            t("deadlines")
                        )}
                    </button>


                    <button
                        data-page="announcements"
                    >
                        ${escapeHtml(
                            t("news")
                        )}
                    </button>


                    <button
                        data-page="profile"
                    >
                        ${escapeHtml(
                            t("profile")
                        )}
                    </button>

                </div>

            </div>

        </div>
    `;

    bindScreenButtons();

    setActiveNavigation(
        "home"
    );
}


// ============================================================
// SCHEDULE
// ============================================================

function renderSchedule() {

    const screen =
        document.querySelector(
            "#screen"
        );

    if (!screen) {
        return;
    }

    screen.innerHTML = `

        <div class="page">

            <div class="page-title">

                <span>
                    📅
                </span>

                <h1>
                    ${escapeHtml(
                        t("schedule")
                    )}
                </h1>

            </div>


            <div class="info-card">

                <h3>
                    ${escapeHtml(
                        t("scheduleConnect")
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        userData?.profile?.group_name ||
                        "—"
                    )}
                </p>

            </div>

        </div>
    `;

    setActiveNavigation(
        "schedule"
    );
}


// ============================================================
// HOMEWORK
// ============================================================

function renderHomework() {

    const screen =
        document.querySelector(
            "#screen"
        );

    if (!screen) {
        return;
    }


    let content = "";


    if (
        homeworkData.length === 0
    ) {

        content = `
            <div class="empty-state">
                📚 ${escapeHtml(
                    t("noData")
                )}
            </div>
        `;

    } else {

        content =
            homeworkData
                .map(item => {

                    return `

                        <div class="info-card">

                            <h3>
                                📚 ${escapeHtml(
                                    item.subject_name
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    item.task_text
                                )}
                            </p>

                            <small>
                                📅 ${escapeHtml(
                                    item.homework_date
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

                            </small>

                        </div>
                    `;

                })
                .join("");
    }


    screen.innerHTML = `

        <div class="page">

            <div class="page-title">

                <span>
                    📝
                </span>

                <h1>
                    ${escapeHtml(
                        t("homework")
                    )}
                </h1>

            </div>

            ${content}

        </div>
    `;

    setActiveNavigation(
        "homework"
    );
}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

function renderAnnouncements() {

    const screen =
        document.querySelector(
            "#screen"
        );

    if (!screen) {
        return;
    }


    let content = "";


    if (
        announcementsData.length === 0
    ) {

        content = `
            <div class="empty-state">
                📢 ${escapeHtml(
                    t("noData")
                )}
            </div>
        `;

    } else {

        content =
            announcementsData
                .map(item => {

                    return `

                        <div class="info-card">

                            <h3>
                                📢 ${escapeHtml(
                                    item.title
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    item.message
                                )}
                            </p>

                        </div>

                    `;

                })
                .join("");
    }


    screen.innerHTML = `

        <div class="page">

            <div class="page-title">

                <span>
                    📢
                </span>

                <h1>
                    ${escapeHtml(
                        t("announcements")
                    )}
                </h1>

            </div>

            ${content}

        </div>
    `;


    setActiveNavigation(
        "announcements"
    );
}


// ============================================================
// AI
// ============================================================

function renderAI() {

    const screen =
        document.querySelector(
            "#screen"
        );

    if (!screen) {
        return;
    }


    screen.innerHTML = `

        <div class="page">

            <div class="page-title">

                <span>
                    🤖
                </span>

                <h1>
                    ${escapeHtml(
                        t("ai")
                    )}
                </h1>

            </div>


            <div class="info-card">

                <h3>
                    🤖 UniUZ AI Assistant
                </h3>

                <p>
                    ${escapeHtml(
                        t("aiText")
                    )}
                </p>

            </div>

        </div>
    `;


    setActiveNavigation(
        "ai"
    );
}


// ============================================================
// PROFILE
// ============================================================

function renderProfile() {

    const screen =
        document.querySelector(
            "#screen"
        );

    if (!screen) {
        return;
    }


    const name =
        getUserName();

    const profile =
        userData?.profile;


    screen.innerHTML = `

        <div class="page">

            <div class="page-title">

                <span>
                    👤
                </span>

                <h1>
                    ${escapeHtml(
                        t("profile")
                    )}
                </h1>

            </div>


            <div class="profile-card">

                <div class="avatar large">

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
                        "—"
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
                        "—"
                    )}
                </p>

            </div>

        </div>
    `;


    setActiveNavigation(
        "profile"
    );
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function openPage(page) {

    if (page === "home") {
        renderHome();
    }

    else if (page === "schedule") {
        renderSchedule();
    }

    else if (page === "homework") {
        renderHomework();
    }

    else if (
        page === "announcements"
    ) {
        renderAnnouncements();
    }

    else if (page === "ai") {
        renderAI();
    }

    else if (page === "profile") {
        renderProfile();
    }
}


function setActiveNavigation(page) {

    document
        .querySelectorAll(
            ".bottom-nav .nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });
}


function bindNavigation() {

    document
        .querySelectorAll(
            ".bottom-nav .nav-item"
        )
        .forEach(button => {

            button.onclick = function() {

                openPage(
                    button.dataset.page
                );

            };

        });
}


function bindScreenButtons() {

    document
        .querySelectorAll(
            "#screen [data-page]"
        )
        .forEach(button => {

            button.onclick = function() {

                openPage(
                    button.dataset.page
                );

            };

        });
}


// ============================================================
// INITIALIZE
// ============================================================

async function initializeUniUZ() {

    try {

        console.log(
            "Starting UniUZ..."
        );


        const apiOnline =
            await checkApi();


        if (!apiOnline) {

            console.error(
                "UniUZ API is offline"
            );

            return;
        }


        await loadProfile();

        await loadHomework();

        await loadAnnouncements();


        // Re-render home with real data
        renderHome();


        console.log(
            "UniUZ initialized successfully"
        );


    } catch (error) {

        console.error(
            "UniUZ initialization error:",
            error
        );

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


        renderHome();

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
    function() {

        // Bind bottom navigation
        bindNavigation();


        // If language was already selected
        if (currentLanguage) {

            hideLanguageScreen();

            showMainApplication();

            renderHome();

            initializeUniUZ();

        } else {

            // First launch:
            // show language selection.

            const screen =
                document.querySelector(
                    "#screen"
                );

            const navigation =
                document.querySelector(
                    ".bottom-nav"
                );

            if (screen) {
                screen.style.display =
                    "none";
            }

            if (navigation) {
                navigation.style.display =
                    "none";
            }

            console.log(
                "Waiting for language selection..."
            );
        }

    }
);


// ============================================================
// TELEGRAM
// ============================================================

if (tg) {

    tg.MainButton.setText(
        "Обновить"
    );

    tg.MainButton.onClick(
        refreshUniUZ
    );
}

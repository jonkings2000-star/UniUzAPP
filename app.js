// ============================================================
// UniUZ Mini App
// app.js
// ============================================================


// ============================================================
// CONFIG
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
// TRANSLATIONS
// ============================================================

const translations = {

    ru: {

        loading: "Загрузка...",

        error:
            "⚠️ Не удалось загрузить данные UniUZ.",

        noHomework:
            "📚 Нет заданий",

        noAnnouncements:
            "📢 Нет объявлений",

        chooseRole:
            "Выберите вашу роль",

        student:
            "Студент",

        teacher:
            "Преподаватель",

        home:
            "Главная",

        schedule:
            "Расписание",

        homework:
            "Задания",

        ai:
            "ИИ",

        profile:
            "Профиль",

        welcome:
            "Добро пожаловать 👋",

        studentShort:
            "🎓 Студент",

        teacherShort:
            "👨‍🏫 Преподаватель",

        apiOffline:
            "⚠️ API временно недоступен"
    },


    en: {

        loading:
            "Loading...",

        error:
            "⚠️ Failed to load UniUZ data.",

        noHomework:
            "📚 No homework",

        noAnnouncements:
            "📢 No announcements",

        chooseRole:
            "Choose your role",

        student:
            "Student",

        teacher:
            "Professor",

        home:
            "Home",

        schedule:
            "Schedule",

        homework:
            "Homework",

        ai:
            "AI",

        profile:
            "Profile",

        welcome:
            "Welcome 👋",

        studentShort:
            "🎓 Student",

        teacherShort:
            "👨‍🏫 Professor",

        apiOffline:
            "⚠️ API is temporarily unavailable"
    },


    ko: {

        loading:
            "로딩 중...",

        error:
            "⚠️ UniUZ 데이터를 불러오지 못했습니다.",

        noHomework:
            "📚 과제가 없습니다",

        noAnnouncements:
            "📢 공지가 없습니다",

        chooseRole:
            "역할을 선택하세요",

        student:
            "학생",

        teacher:
            "교수님",

        home:
            "홈",

        schedule:
            "시간표",

        homework:
            "과제",

        ai:
            "AI",

        profile:
            "프로필",

        welcome:
            "환영합니다 👋",

        studentShort:
            "🎓 학생",

        teacherShort:
            "👨‍🏫 교수님",

        apiOffline:
            "⚠️ API를 사용할 수 없습니다"
    }

};


// ============================================================
// ROLE TRANSLATIONS
// ============================================================

const roleTranslations = {

    ru: {
        subtitle: "Выберите вашу роль",
        student: "Студент",
        teacher: "Преподаватель"
    },

    en: {
        subtitle: "Choose your role",
        student: "Student",
        teacher: "Professor"
    },

    ko: {
        subtitle: "역할을 선택하세요",
        student: "학생",
        teacher: "교수님"
    }

};


// ============================================================
// LOCAL STORAGE
// ============================================================

let currentLanguage =
    localStorage.getItem(
        "uniuz_language"
    ) || null;


let currentRole =
    localStorage.getItem(
        "uniuz_role"
    ) || null;


// ============================================================
// LANGUAGE
// ============================================================

function getLanguage() {

    return (
        currentLanguage || "ru"
    );
}


// ============================================================
// ROLE
// ============================================================

function getRole() {

    return (
        currentRole || "student"
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
// SET TEXT
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
// LANGUAGE SCREEN
// ============================================================

function getLanguageScreen() {

    return document.getElementById(
        "languageScreen"
    );
}


function getRoleScreen() {

    return document.getElementById(
        "roleScreen"
    );
}


function getApp() {

    return document.getElementById(
        "app"
    );
}


// ============================================================
// SHOW LANGUAGE SCREEN
// ============================================================

function showLanguageScreen() {

    const languageScreen =
        getLanguageScreen();

    const roleScreen =
        getRoleScreen();

    const app =
        getApp();


    if (languageScreen) {

        languageScreen.classList.remove(
            "hidden"
        );

        languageScreen.style.display =
            "flex";
    }


    if (roleScreen) {

        roleScreen.classList.add(
            "hidden"
        );

        roleScreen.style.display =
            "none";
    }


    if (app) {

        app.classList.add(
            "hidden"
        );

        app.style.display =
            "none";
    }
}


// ============================================================
// HIDE LANGUAGE SCREEN
// ============================================================

function hideLanguageScreen() {

    const languageScreen =
        getLanguageScreen();

    if (languageScreen) {

        languageScreen.classList.add(
            "hidden"
        );

        languageScreen.style.display =
            "none";
    }
}


// ============================================================
// SHOW ROLE SCREEN
// ============================================================

function showRoleScreen() {

    const languageScreen =
        getLanguageScreen();

    const roleScreen =
        getRoleScreen();

    const app =
        getApp();


    if (languageScreen) {

        languageScreen.classList.add(
            "hidden"
        );

        languageScreen.style.display =
            "none";
    }


    if (app) {

        app.classList.add(
            "hidden"
        );

        app.style.display =
            "none";
    }


    if (roleScreen) {

        roleScreen.classList.remove(
            "hidden"
        );

        roleScreen.style.display =
            "flex";
    }


    updateRoleLanguage();
}


// ============================================================
// HIDE ROLE SCREEN
// ============================================================

function hideRoleScreen() {

    const roleScreen =
        getRoleScreen();

    if (roleScreen) {

        roleScreen.classList.add(
            "hidden"
        );

        roleScreen.style.display =
            "none";
    }
}


// ============================================================
// SHOW MAIN APPLICATION
// ============================================================

function showMainApplication() {

    const app =
        getApp();

    if (app) {

        app.classList.remove(
            "hidden"
        );

        app.style.display =
            "";
    }
}


// ============================================================
// UPDATE ROLE LANGUAGE
// ============================================================

function updateRoleLanguage() {

    const lang =
        getLanguage();

    const data =
        roleTranslations[lang] ||
        roleTranslations.ru;


    const subtitle =
        document.getElementById(
            "roleSubtitle"
        );

    const student =
        document.getElementById(
            "studentRoleText"
        );

    const teacher =
        document.getElementById(
            "teacherRoleText"
        );


    if (subtitle) {

        subtitle.textContent =
            data.subtitle;
    }


    if (student) {

        student.textContent =
            data.student;
    }


    if (teacher) {

        teacher.textContent =
            data.teacher;
    }
}


// ============================================================
// UPDATE NAVIGATION
// ============================================================

function updateNavigationLanguage() {

    const lang =
        getLanguage();

    const t =
        translations[lang] ||
        translations.ru;


    const items = {

        home: t.home,

        schedule: t.schedule,

        homework: t.homework,

        ai: t.ai,

        profile: t.profile

    };


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(element => {

            const key =
                element.dataset.i18n;

            if (
                items[key] !== undefined
            ) {

                element.textContent =
                    items[key];
            }

        });


    const welcome =
        document.getElementById(
            "welcome"
        );

    if (welcome) {

        welcome.textContent =
            t.welcome;
    }
}


// ============================================================
// SELECT LANGUAGE
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
        currentLanguage
    );


    // После выбора языка
    // НЕ запускаем приложение.
    // Показываем выбор роли.

    showRoleScreen();
}


window.selectLanguage =
    selectLanguage;


// ============================================================
// SELECT ROLE
// ============================================================

async function selectRole(
    role
) {

    if (
        !["student", "teacher"]
            .includes(role)
    ) {
        return;
    }


    currentRole =
        role;


    localStorage.setItem(
        "uniuz_role",
        role
    );


    console.log(
        "UniUZ role:",
        currentRole
    );


    hideRoleScreen();

    showMainApplication();

    updateNavigationLanguage();


    await initializeUniUZ();


    renderHome();
}


window.selectRole =
    selectRole;


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


        if (language) {

            selectLanguage(
                language
            );
        }
    }
);


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


        const role =
            button.dataset.role;


        if (role) {

            selectRole(role);
        }
    }
);


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(
    path
) {

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
            "UniUZ API unavailable:",
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


    // Telegram name

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
                    name[0] ||
                    "U"
                ).toUpperCase();
        }


        // Header avatar

        const headerAvatar =
            document.querySelector(
                "#avatar"
            );


        if (headerAvatar) {

            headerAvatar.textContent =
                (
                    name[0] ||
                    "U"
                ).toUpperCase();
        }
    }


    // Profile data

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


    container.innerHTML =
        "";


    if (
        !data.items ||
        data.items.length === 0
    ) {

        const text =
            translations[
                getLanguage()
            ].noHomework;


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


    container.innerHTML =
        "";


    if (
        !data.items ||
        data.items.length === 0
    ) {

        const text =
            translations[
                getLanguage()
            ].noAnnouncements;


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


    const lang =
        getLanguage();


    const t =
        translations[lang] ||
        translations.ru;


    const role =
        getRole();


    const roleText =
        role === "teacher"
            ? t.teacherShort
            : t.studentShort;


    screen.innerHTML = `

        <section class="home-screen">

            <div class="home-role">

                ${roleText}

            </div>


            <h1>

                UniUZ

            </h1>


            <p>

                ${t.welcome}

            </p>


            <div class="quick-actions">

                <button
                    class="quick-action"
                    data-page="schedule"
                >

                    📅
                    ${t.schedule}

                </button>


                <button
                    class="quick-action"
                    data-page="homework"
                >

                    📝
                    ${t.homework}

                </button>


                <button
                    class="quick-action"
                    data-page="ai"
                >

                    🤖
                    ${t.ai}

                </button>


                <button
                    class="quick-action"
                    data-page="profile"
                >

                    👤
                    ${t.profile}

                </button>

            </div>


            <div class="home-info">

                <h2>

                    ${role === "teacher"
                        ? t.teacherShort
                        : t.studentShort}

                </h2>


                <p>

                    ${
                        role === "teacher"
                            ? (
                                lang === "ru"
                                    ? "Панель преподавателя будет доступна здесь."
                                    : lang === "en"
                                        ? "The teacher dashboard will be available here."
                                        : "교수님 대시보드가 여기에 표시됩니다."
                              )
                            : (
                                lang === "ru"
                                    ? "Ваш университетский помощник."
                                    : lang === "en"
                                        ? "Your university assistant."
                                        : "나만의 대학 도우미입니다."
                              )
                    }

                </p>

            </div>

        </section>

    `;


    attachPageButtons();
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


    const lang =
        getLanguage();


    const title =
        lang === "ru"
            ? "📅 Расписание"
            : lang === "en"
                ? "📅 Schedule"
                : "📅 시간표";


    const message =
        lang === "ru"
            ? "Расписание будет подключено после получения реальных данных."
            : lang === "en"
                ? "The schedule will be connected after real data is received."
                : "실제 데이터를 받은 후 시간표가 연결됩니다.";


    screen.innerHTML = `

        <section class="page-screen">

            <h1>
                ${title}
            </h1>


            <div class="empty-state">

                ${message}

            </div>

        </section>

    `;
}


// ============================================================
// HOMEWORK PAGE
// ============================================================

function renderHomeworkPage() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    const lang =
        getLanguage();


    const title =
        lang === "ru"
            ? "📝 Задания"
            : lang === "en"
                ? "📝 Homework"
                : "📝 과제";


    screen.innerHTML = `

        <section class="page-screen">

            <h1>
                ${title}
            </h1>


            <div
                id="homework-list"
                class="homework-list"
            ></div>

        </section>

    `;


    loadHomework()
        .catch(error => {

            console.error(
                "Homework page error:",
                error
            );
        });
}


// ============================================================
// AI PAGE
// ============================================================

function renderAI() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    const lang =
        getLanguage();


    const title =
        lang === "ru"
            ? "🤖 UniUZ AI"
            : lang === "en"
                ? "🤖 UniUZ AI"
                : "🤖 UniUZ AI";


    const message =
        lang === "ru"
            ? "AI-помощник скоро будет доступен в Mini App."
            : lang === "en"
                ? "The AI assistant will soon be available in the Mini App."
                : "Mini App에서 AI 도우미를 곧 사용할 수 있습니다.";


    screen.innerHTML = `

        <section class="page-screen">

            <h1>
                ${title}
            </h1>


            <div class="empty-state">

                ${message}

            </div>

        </section>

    `;
}


// ============================================================
// PROFILE PAGE
// ============================================================

function renderProfile() {

    const screen =
        document.getElementById(
            "screen"
        );


    if (!screen) {
        return;
    }


    const lang =
        getLanguage();


    const role =
        getRole();


    const t =
        translations[lang] ||
        translations.ru;


    const roleText =
        role === "teacher"
            ? t.teacherShort
            : t.studentShort;


    screen.innerHTML = `

        <section class="profile-screen">

            <div class="profile-header">

                <div
                    class="profile-avatar"
                    id="user-avatar"
                >
                    U
                </div>


                <h1
                    id="profile-name"
                >
                    UniUZ
                </h1>


                <div
                    id="profile-username"
                    class="profile-username"
                ></div>


                <div class="profile-role">

                    ${roleText}

                </div>

            </div>


            <div class="profile-card">

                <h3>
                    👤 ${lang === "ru"
                        ? "Личная информация"
                        : lang === "en"
                            ? "Personal information"
                            : "개인 정보"}
                </h3>


                <div class="profile-row">

                    <span>
                        🏫
                    </span>

                    <div>

                        <small>
                            ${lang === "ru"
                                ? "Университет"
                                : lang === "en"
                                    ? "University"
                                    : "대학교"}
                        </small>

                        <strong
                            id="profile-university"
                        >
                            Ajou University in Tashkent
                        </strong>

                    </div>

                </div>


                <div class="profile-row">

                    <span>
                        🎓
                    </span>

                    <div>

                        <small>
                            ${lang === "ru"
                                ? "Факультет"
                                : lang === "en"
                                    ? "Faculty"
                                    : "학부"}
                        </small>

                        <strong
                            id="profile-department"
                        >
                            —
                        </strong>

                    </div>

                </div>


                <div class="profile-row">

                    <span>
                        👥
                    </span>

                    <div>

                        <small>
                            ${lang === "ru"
                                ? "Группа"
                                : lang === "en"
                                    ? "Group"
                                    : "그룹"}
                        </small>

                        <strong
                            id="profile-group"
                        >
                            —
                        </strong>

                    </div>

                </div>

            </div>


            <div class="profile-card">

                <h3>
                    ⚙️
                    ${lang === "ru"
                        ? "Настройки"
                        : lang === "en"
                            ? "Settings"
                            : "설정"}
                </h3>


                <div class="profile-row">

                    <span>
                        🌐
                    </span>

                    <div>

                        <small>
                            ${lang === "ru"
                                ? "Язык"
                                : lang === "en"
                                    ? "Language"
                                    : "언어"}
                        </small>

                        <strong>

                            ${
                                lang === "ru"
                                    ? "Русский"
                                    : lang === "en"
                                        ? "English"
                                        : "한국어"
                            }

                        </strong>

                    </div>

                </div>


                <div class="profile-row">

                    <span>
                        🎭
                    </span>

                    <div>

                        <small>
                            ${lang === "ru"
                                ? "Роль"
                                : lang === "en"
                                    ? "Role"
                                    : "역할"}
                        </small>

                        <strong>

                            ${roleText}

                        </strong>

                    </div>

                </div>

            </div>


            <button
                class="change-role-btn"
                id="changeRoleButton"
            >

                🔄
                ${
                    lang === "ru"
                        ? "Сменить роль"
                        : lang === "en"
                            ? "Change role"
                            : "역할 변경"
                }

            </button>


            <button
                class="change-language-btn"
                id="changeLanguageButton"
            >

                🌐
                ${
                    lang === "ru"
                        ? "Сменить язык"
                        : lang === "en"
                            ? "Change language"
                            : "언어 변경"
                }

            </button>

        </section>

    `;


    loadProfile()
        .catch(error => {

            console.error(
                "Profile page error:",
                error
            );
        });


    const changeRole =
        document.getElementById(
            "changeRoleButton"
        );


    if (changeRole) {

        changeRole.addEventListener(
            "click",
            function() {

                currentRole =
                    null;

                localStorage.removeItem(
                    "uniuz_role"
                );

                showRoleScreen();
            }
        );
    }


    const changeLanguage =
        document.getElementById(
            "changeLanguageButton"
        );


    if (changeLanguage) {

        changeLanguage.addEventListener(
            "click",
            function() {

                currentLanguage =
                    null;

                currentRole =
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
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function openPage(page) {

    switch (page) {

        case "home":

            renderHome();

            break;


        case "schedule":

            renderSchedule();

            break;


        case "homework":

            renderHomeworkPage();

            break;


        case "ai":

            renderAI();

            break;


        case "profile":

            renderProfile();

            break;


        default:

            renderHome();
    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page ===
                page
            );
        });
}


// ============================================================
// NAVIGATION BUTTONS
// ============================================================

function attachPageButtons() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(button => {

            if (
                button.dataset.page &&
                button.classList.contains(
                    "nav-item"
                )
            ) {
                return;
            }


            button.addEventListener(
                "click",
                function() {

                    openPage(
                        this.dataset.page
                    );
                }
            );
        });
}


// ============================================================
// NAVIGATION CLICK
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".nav-item"
            );


        if (!button) {
            return;
        }


        const page =
            button.dataset.page;


        if (page) {

            openPage(page);
        }
    }
);


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const loading =
        document.getElementById(
            "loading"
        );


    if (loading) {

        loading.style.display =
            "flex";
    }
}


function hideLoading() {

    const loading =
        document.getElementById(
            "loading"
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
        document.getElementById(
            "error"
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

            console.warn(
                "UniUZ API is offline."
            );

            // Не блокируем приложение.
            // Главная страница всё равно откроется.
            return;
        }


        if (!initData) {

            console.warn(
                "Telegram initData is empty."
            );
        }


        try {

            await loadProfile();

        } catch (error) {

            console.warn(
                "Profile loading failed:",
                error
            );
        }


        try {

            await loadHomework();

        } catch (error) {

            console.warn(
                "Homework loading failed:",
                error
            );
        }


        try {

            await loadAnnouncements();

        } catch (error) {

            console.warn(
                "Announcements loading failed:",
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


        console.log(
            "UniUZ refreshed."
        );

    } catch (error) {

        console.error(
            "Refresh error:",
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
            "Starting UniUZ..."
        );


        updateNavigationLanguage();


        // ====================================================
        // LANGUAGE + ROLE ALREADY SELECTED
        // ====================================================

        if (
            currentLanguage &&
            currentRole
        ) {

            console.log(
                "Language:",
                currentLanguage
            );

            console.log(
                "Role:",
                currentRole
            );


            hideLanguageScreen();

            hideRoleScreen();

            showMainApplication();

            updateNavigationLanguage();


            await initializeUniUZ();


            renderHome();


            return;
        }


        // ====================================================
        // LANGUAGE SELECTED
        // ROLE NOT SELECTED
        // ====================================================

        if (
            currentLanguage &&
            !currentRole
        ) {

            console.log(
                "Language selected, waiting for role..."
            );


            showRoleScreen();


            return;
        }


        // ====================================================
        // NOTHING SELECTED
        // ====================================================

        console.log(
            "Waiting for language selection..."
        );


        showLanguageScreen();
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
// DEBUG HELPERS
// ============================================================

window.UniUZ = {

    getLanguage:
        getLanguage,

    getRole:
        getRole,

    selectLanguage:
        selectLanguage,

    selectRole:
        selectRole,

    openPage:
        openPage,

    refresh:
        refreshUniUZ,

    resetSelection:
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

            showLanguageScreen();
        }

};

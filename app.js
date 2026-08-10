// ============================================================
// UniUZ Mini App
// app.js
// ============================================================

const API_URL = "https://uniuz-production.up.railway.app";


// ============================================================
// TELEGRAM
// ============================================================

const tg = window.Telegram?.WebApp || null;

if (tg) {
    try {
        tg.ready();
        tg.expand();
    } catch (error) {
        console.warn("Telegram WebApp init error:", error);
    }
}

const initData = tg?.initData || "";


// ============================================================
// STATE
// ============================================================

let currentLanguage =
    localStorage.getItem("uniuz_language") || null;

let currentRole =
    localStorage.getItem("uniuz_role") || null;

let teacherStatus = null;


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

        studentRole:
            "Студент",

        teacherRole:
            "Преподаватель",

        pendingTitle:
            "Заявка отправлена",

        pendingText:
            "Ваша заявка на регистрацию преподавателя отправлена администратору. Дождитесь одобрения.",

        sendRequest:
            "📨 Отправить заявку",

        checkStatus:
            "🔄 Проверить статус",

        approvedTitle:
            "✅ Вы одобрены как преподаватель",

        rejectedTitle:
            "❌ Заявка отклонена",

        rejectedText:
            "Администратор отклонил вашу заявку. Вы можете отправить её повторно.",

        requestSent:
            "✅ Заявка отправлена администратору.",

        requestError:
            "⚠️ Не удалось отправить заявку.",

        browserTeacher:
            "Откройте UniUZ внутри Telegram, чтобы отправить заявку преподавателя.",

        studentWelcome:
            "Добро пожаловать в UniUZ 🎓",

        teacherWelcome:
            "Добро пожаловать, преподаватель 👨‍🏫"
    },


    en: {

        loading: "Loading...",

        error:
            "⚠️ Failed to load UniUZ data.",

        noHomework:
            "📚 No homework",

        noAnnouncements:
            "📢 No announcements",

        chooseRole:
            "Choose your role",

        studentRole:
            "Student",

        teacherRole:
            "Teacher",

        pendingTitle:
            "Request submitted",

        pendingText:
            "Your teacher registration request has been sent to the administrator. Please wait for approval.",

        sendRequest:
            "📨 Send request",

        checkStatus:
            "🔄 Check status",

        approvedTitle:
            "✅ You are approved as a teacher",

        rejectedTitle:
            "❌ Request rejected",

        rejectedText:
            "The administrator rejected your request. You can submit it again.",

        requestSent:
            "✅ Request sent to the administrator.",

        requestError:
            "⚠️ Failed to send the request.",

        browserTeacher:
            "Open UniUZ inside Telegram to send a teacher request.",

        studentWelcome:
            "Welcome to UniUZ 🎓",

        teacherWelcome:
            "Welcome, teacher 👨‍🏫"
    },


    ko: {

        loading: "로딩 중...",

        error:
            "⚠️ UniUZ 데이터를 불러오지 못했습니다.",

        noHomework:
            "📚 과제가 없습니다",

        noAnnouncements:
            "📢 공지가 없습니다",

        chooseRole:
            "역할을 선택하세요",

        studentRole:
            "학생",

        teacherRole:
            "교수님",

        pendingTitle:
            "신청이 전송되었습니다",

        pendingText:
            "교수 등록 신청이 관리자에게 전송되었습니다. 승인을 기다려 주세요.",

        sendRequest:
            "📨 신청 보내기",

        checkStatus:
            "🔄 상태 확인",

        approvedTitle:
            "✅ 교수님으로 승인되었습니다",

        rejectedTitle:
            "❌ 신청이 거절되었습니다",

        rejectedText:
            "관리자가 신청을 거절했습니다. 다시 신청할 수 있습니다.",

        requestSent:
            "✅ 관리자에게 신청을 보냈습니다.",

        requestError:
            "⚠️ 신청을 보내지 못했습니다.",

        browserTeacher:
            "교수 신청을 보내려면 Telegram에서 UniUZ를 열어 주세요.",

        studentWelcome:
            "UniUZ에 오신 것을 환영합니다 🎓",

        teacherWelcome:
            "교수님, UniUZ에 오신 것을 환영합니다 👨‍🏫"
    }

};


// ============================================================
// TRANSLATION HELPER
// ============================================================

function getLanguage() {

    return (
        currentLanguage &&
        translations[currentLanguage]
    )
        ? currentLanguage
        : "ru";
}


function T(key) {

    const lang = getLanguage();

    return (
        translations[lang]?.[key] ??
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
// SET TEXT
// ============================================================

function setText(selector, value) {

    const element =
        document.querySelector(selector);

    if (element) {
        element.textContent =
            value ?? "";
    }
}


// ============================================================
// FIND LANGUAGE SCREEN
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


    // Fallback

    const buttons =
        [...document.querySelectorAll("button")];


    const languageButtons =
        buttons.filter(button => {

            const text =
                (
                    button.textContent ||
                    ""
                ).toLowerCase();

            return (

                text.includes("рус") ||

                text.includes("english") ||

                text.includes("한국") ||

                text.includes("korean")

            );
        });


    if (
        languageButtons.length >= 3
    ) {

        let parent =
            languageButtons[0]
                .parentElement;


        for (
            let i = 0;
            i < 6 && parent;
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

        screen.style.display =
            "none";
    }
}


// ============================================================
// SHOW MAIN APP
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


    for (
        const selector
        of possibleScreens
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            element.style.display =
                "";
        }
    }
}


// ============================================================
// HIDE MAIN APP
// ============================================================

function hideMainApplication() {

    const possibleScreens = [

        "#app",

        "#main-app",

        ".app",

        ".main-app",

        "#main",

        "main"

    ];


    for (
        const selector
        of possibleScreens
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            element.style.display =
                "none";
        }
    }
}


// ============================================================
// LANGUAGE SELECTION
// ============================================================

async function selectLanguage(language) {

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


    hideLanguageScreen();


    // IMPORTANT:
    // After language we DO NOT
    // open the application yet.
    // First we choose role.

    showRoleScreen();
}


// Make available to HTML onclick

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
            function(event) {

                event.preventDefault();
                event.stopPropagation();


                const language =
                    button.dataset.lang;


                if (language) {

                    selectLanguage(
                        language
                    );
                }

            }
        );

    });
}


// ============================================================
// ROLE SCREEN STYLES
// ============================================================

function injectRoleStyles() {

    if (
        document.getElementById(
            "uniuz-role-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "uniuz-role-styles";


    style.textContent = `

        #uniuzRoleScreen {

            position: fixed;

            inset: 0;

            z-index: 999999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            box-sizing: border-box;

            background:
                radial-gradient(
                    circle at 50% 0%,
                    #1b2b49 0%,
                    #0e1728 42%,
                    #080e19 100%
                );

            color: #ffffff;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Roboto,
                Arial,
                sans-serif;

            overflow-y: auto;

        }


        #uniuzRoleScreen.hidden {

            display: none !important;

        }


        .uniuz-role-card {

            width: 100%;

            max-width: 390px;

            padding: 30px 22px;

            box-sizing: border-box;

            border-radius: 26px;

            background:
                rgba(
                    20,
                    32,
                    52,
                    .97
                );

            border:
                1px solid
                rgba(
                    104,
                    140,
                    194,
                    .34
                );

            box-shadow:
                0 25px 70px
                rgba(
                    0,
                    0,
                    0,
                    .5
                );

            text-align: center;

        }


        .uniuz-role-logo {

            width: 76px;

            height: 76px;

            margin:
                0 auto 18px;

            border-radius: 23px;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 38px;

            background:
                linear-gradient(
                    145deg,
                    #2a4169,
                    #182945
                );

            border:
                1px solid
                rgba(
                    130,
                    166,
                    220,
                    .38
                );

            box-shadow:
                0 12px 35px
                rgba(
                    0,
                    0,
                    0,
                    .3
                );

        }


        .uniuz-role-card h1 {

            margin: 0;

            font-size: 30px;

            font-weight: 800;

            letter-spacing:
                -.5px;

        }


        .uniuz-role-subtitle {

            margin:
                10px 0 25px;

            color:
                #9db0ce;

            font-size: 15px;

        }


        .uniuz-role-buttons {

            display: flex;

            flex-direction: column;

            gap: 12px;

        }


        .uniuz-role-btn {

            width: 100%;

            min-height: 58px;

            border-radius: 16px;

            border:
                1px solid
                rgba(
                    115,
                    150,
                    205,
                    .35
                );

            background:
                linear-gradient(
                    135deg,
                    #273f66,
                    #1b2f50
                );

            color: #ffffff;

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 10px;

            padding: 0 18px;

            font-size: 16px;

            font-weight: 700;

            cursor: pointer;

            -webkit-tap-highlight-color:
                transparent;

            transition:
                transform .12s ease,
                background .15s ease,
                border-color .15s ease;

        }


        .uniuz-role-btn.teacher {

            background:
                linear-gradient(
                    135deg,
                    #30466f,
                    #3b2d61
                );

        }


        .uniuz-role-btn:hover {

            border-color:
                rgba(
                    150,
                    185,
                    235,
                    .65
                );

        }


        .uniuz-role-btn:active {

            transform:
                scale(.97);

        }


        .uniuz-role-btn:disabled {

            opacity: .55;

            cursor:
                not-allowed;

        }


        .uniuz-role-icon {

            width: 28px;

            font-size: 22px;

            text-align: center;

        }


        .uniuz-teacher-status {

            margin-top: 18px;

            padding: 16px;

            box-sizing: border-box;

            border-radius: 16px;

            background:
                rgba(
                    7,
                    14,
                    26,
                    .55
                );

            border:
                1px solid
                rgba(
                    100,
                    130,
                    175,
                    .25
                );

            color:
                #c9d5e8;

            font-size: 14px;

            line-height: 1.5;

        }


        .uniuz-status-title {

            color: #ffffff;

            font-size: 16px;

            font-weight: 700;

            margin-bottom: 8px;

        }


        .uniuz-status-button {

            width: 100%;

            min-height: 48px;

            margin-top: 12px;

            border: 0;

            border-radius: 13px;

            background:
                linear-gradient(
                    135deg,
                    #2b4775,
                    #27365e
                );

            color: #ffffff;

            font-size: 14px;

            font-weight: 700;

            cursor: pointer;

        }


        .uniuz-status-button:active {

            transform:
                scale(.98);

        }

    `;


    document.head.appendChild(
        style
    );
}


// ============================================================
// CREATE ROLE SCREEN
// ============================================================

function ensureRoleScreen() {

    injectRoleStyles();


    let screen =
        document.getElementById(
            "uniuzRoleScreen"
        );


    if (!screen) {

        screen =
            document.createElement(
                "div"
            );


        screen.id =
            "uniuzRoleScreen";


        document.body.appendChild(
            screen
        );
    }


    screen.innerHTML = `

        <div class="uniuz-role-card">

            <div class="uniuz-role-logo">
                🎓
            </div>


            <h1>
                UniUZ
            </h1>


            <div
                class="uniuz-role-subtitle"
                id="uniuzRoleSubtitle"
            ></div>


            <div
                class="uniuz-role-buttons"
            >

                <button
                    type="button"
                    class="uniuz-role-btn"
                    id="uniuzStudentButton"
                >

                    <span
                        class="uniuz-role-icon"
                    >
                        🎓
                    </span>

                    <span
                        id="uniuzStudentText"
                    ></span>

                </button>


                <button
                    type="button"
                    class="uniuz-role-btn teacher"
                    id="uniuzTeacherButton"
                >

                    <span
                        class="uniuz-role-icon"
                    >
                        👨‍🏫
                    </span>

                    <span
                        id="uniuzTeacherText"
                    ></span>

                </button>

            </div>


            <div
                id="uniuzTeacherArea"
            ></div>

        </div>

    `;


    updateRoleScreen();


    const studentButton =
        document.getElementById(
            "uniuzStudentButton"
        );


    const teacherButton =
        document.getElementById(
            "uniuzTeacherButton"
        );


    if (studentButton) {

        studentButton.onclick =
            async function(event) {

                event.preventDefault();
                event.stopPropagation();

                await selectStudent();

            };
    }


    if (teacherButton) {

        teacherButton.onclick =
            async function(event) {

                event.preventDefault();
                event.stopPropagation();

                await handleTeacherRole();

            };
    }


    return screen;
}


// ============================================================
// UPDATE ROLE SCREEN
// ============================================================

function updateRoleScreen() {

    const subtitle =
        document.getElementById(
            "uniuzRoleSubtitle"
        );


    const student =
        document.getElementById(
            "uniuzStudentText"
        );


    const teacher =
        document.getElementById(
            "uniuzTeacherText"
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


    updateTeacherArea();
}


// ============================================================
// SHOW ROLE SCREEN
// ============================================================

function showRoleScreen() {

    const screen =
        ensureRoleScreen();


    hideLanguageScreen();

    hideMainApplication();


    screen.style.display =
        "flex";


    screen.classList.remove(
        "hidden"
    );


    updateRoleScreen();

}


// ============================================================
// HIDE ROLE SCREEN
// ============================================================

function hideRoleScreen() {

    const screen =
        document.getElementById(
            "uniuzRoleScreen"
        );


    if (screen) {

        screen.style.display =
            "none";

        screen.classList.add(
            "hidden"
        );
    }
}


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(
    path,
    options = {}
) {

    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                method:
                    options.method ||
                    "GET",

                headers: {

                    "X-Telegram-Init-Data":
                        initData,

                    ...(options.headers || {})

                },

                body:
                    options.body
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            `API error ${response.status}`
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
// TEACHER STATUS
// ============================================================

async function getTeacherStatus() {

    // First try the Mini App API.

    try {

        const data =
            await apiRequest(
                "/api/teacher/status"
            );


        if (
            data &&
            data.status
        ) {

            return data;
        }


        if (
            data &&
            data.teacher &&
            data.teacher.status
        ) {

            return {

                status:
                    data.teacher.status

            };
        }


    } catch (error) {

        console.warn(
            "Teacher status API unavailable:",
            error
        );

    }


    // No API endpoint yet.
    // Return local state.

    return {

        status:
            teacherStatus

    };
}


// ============================================================
// TEACHER REQUEST
// ============================================================

async function sendTeacherRequest() {

    const button =
        document.getElementById(
            "uniuzTeacherRequestButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            T("loading");
    }


    // --------------------------------------------------------
    // Try backend API first
    // --------------------------------------------------------

    try {

        const data =
            await apiRequest(
                "/api/teacher/request",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            initData:
                                initData

                        })

                }
            );


        teacherStatus =
            data.status ||
            "pending";


        updateTeacherArea();


        showTeacherMessage(
            T("requestSent")
        );


        return;

    } catch (error) {

        console.warn(
            "Teacher API request unavailable:",
            error
        );

    }


    // --------------------------------------------------------
    // Telegram fallback
    // --------------------------------------------------------

    if (tg) {

        try {

            const user =
                tg.initDataUnsafe?.user;


            const payload = {

                action:
                    "teacher_request",

                user_id:
                    user?.id || null,

                username:
                    user?.username || null,

                first_name:
                    user?.first_name || null,

                last_name:
                    user?.last_name || null,

                language:
                    currentLanguage || "ru"

            };


            tg.sendData(
                JSON.stringify(
                    payload
                )
            );


            teacherStatus =
                "pending";


            updateTeacherArea();


            showTeacherMessage(
                T("requestSent")
            );


            return;

        } catch (error) {

            console.error(
                "Telegram sendData error:",
                error
            );

        }

    }


    // --------------------------------------------------------
    // Browser
    // --------------------------------------------------------

    if (button) {

        button.disabled =
            false;

        button.textContent =
            T("sendRequest");
    }


    showTeacherMessage(
        tg
            ? T("requestError")
            : T("browserTeacher")
    );
}


// ============================================================
// CHECK TEACHER APPROVAL
// ============================================================

async function checkTeacherApproval() {

    const button =
        document.getElementById(
            "uniuzCheckTeacherButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            T("loading");
    }


    try {

        const data =
            await getTeacherStatus();


        if (
            data.status ===
            "approved"
        ) {

            teacherStatus =
                "approved";


            currentRole =
                "teacher";


            localStorage.setItem(
                "uniuz_role",
                "teacher"
            );


            hideRoleScreen();

            showMainApplication();


            await initializeUniUZ();


            return;
        }


        teacherStatus =
            data.status ||
            "pending";


        updateTeacherArea();


    } catch (error) {

        console.error(
            "Teacher approval check:",
            error
        );


        teacherStatus =
            "pending";


        updateTeacherArea();
    }
}


// ============================================================
// TEACHER ROLE BUTTON
// ============================================================

async function handleTeacherRole() {

    const teacherButton =
        document.getElementById(
            "uniuzTeacherButton"
        );


    if (teacherButton) {

        teacherButton.disabled =
            true;
    }


    try {

        const data =
            await getTeacherStatus();


        // ----------------------------------------------------
        // APPROVED
        // ----------------------------------------------------

        if (
            data.status ===
            "approved"
        ) {

            teacherStatus =
                "approved";


            currentRole =
                "teacher";


            localStorage.setItem(
                "uniuz_role",
                "teacher"
            );


            hideRoleScreen();

            showMainApplication();


            await initializeUniUZ();


            return;
        }


        // ----------------------------------------------------
        // PENDING
        // ----------------------------------------------------

        if (
            data.status ===
            "pending"
        ) {

            teacherStatus =
                "pending";


            updateTeacherArea();

            return;
        }


        // ----------------------------------------------------
        // REJECTED
        // ----------------------------------------------------

        if (
            data.status ===
            "rejected"
        ) {

            teacherStatus =
                "rejected";


            updateTeacherArea();

            return;
        }


        // ----------------------------------------------------
        // NO APPLICATION
        // ----------------------------------------------------

        teacherStatus =
            null;


        updateTeacherArea();

    } catch (error) {

        console.warn(
            "Teacher role status error:",
            error
        );


        teacherStatus =
            null;


        updateTeacherArea();

    } finally {

        if (teacherButton) {

            teacherButton.disabled =
                false;
        }
    }
}


// ============================================================
// TEACHER AREA
// ============================================================

function updateTeacherArea() {

    const area =
        document.getElementById(
            "uniuzTeacherArea"
        );


    if (!area) {
        return;
    }


    // --------------------------------------------------------
    // PENDING
    // --------------------------------------------------------

    if (
        teacherStatus ===
        "pending"
    ) {

        area.innerHTML = `

            <div
                class="uniuz-teacher-status"
            >

                <div
                    class="uniuz-status-title"
                >
                    ⏳ ${escapeHtml(
                        T("pendingTitle")
                    )}
                </div>

                <div>
                    ${escapeHtml(
                        T("pendingText")
                    )}
                </div>


                <button
                    type="button"
                    class="uniuz-status-button"
                    id="uniuzCheckTeacherButton"
                >
                    ${escapeHtml(
                        T("checkStatus")
                    )}
                </button>

            </div>

        `;


        document
            .getElementById(
                "uniuzCheckTeacherButton"
            )
            ?.addEventListener(
                "click",
                checkTeacherApproval
            );


        return;
    }


    // --------------------------------------------------------
    // REJECTED
    // --------------------------------------------------------

    if (
        teacherStatus ===
        "rejected"
    ) {

        area.innerHTML = `

            <div
                class="uniuz-teacher-status"
            >

                <div
                    class="uniuz-status-title"
                >
                    ❌ ${escapeHtml(
                        T("rejectedTitle")
                    )}
                </div>

                <div>
                    ${escapeHtml(
                        T("rejectedText")
                    )}
                </div>


                <button
                    type="button"
                    class="uniuz-status-button"
                    id="uniuzTeacherRequestButton"
                >
                    ${escapeHtml(
                        T("sendRequest")
                    )}
                </button>

            </div>

        `;


        document
            .getElementById(
                "uniuzTeacherRequestButton"
            )
            ?.addEventListener(
                "click",
                sendTeacherRequest
            );


        return;
    }


    // --------------------------------------------------------
    // APPROVED
    // --------------------------------------------------------

    if (
        teacherStatus ===
        "approved"
    ) {

        area.innerHTML = `

            <div
                class="uniuz-teacher-status"
            >

                <div
                    class="uniuz-status-title"
                >
                    ${escapeHtml(
                        T("approvedTitle")
                    )}
                </div>

            </div>

        `;


        return;
    }


    // --------------------------------------------------------
    // NO APPLICATION
    // --------------------------------------------------------

    area.innerHTML = `

        <div
            class="uniuz-teacher-status"
        >

            <div
                class="uniuz-status-title"
            >
                👨‍🏫 ${escapeHtml(
                    T("teacherRole")
                )}
            </div>


            <div>
                ${escapeHtml(
                    T("pendingText")
                )}
            </div>


            <button
                type="button"
                class="uniuz-status-button"
                id="uniuzTeacherRequestButton"
            >
                ${escapeHtml(
                    T("sendRequest")
                )}
            </button>

        </div>

    `;


    document
        .getElementById(
            "uniuzTeacherRequestButton"
        )
        ?.addEventListener(
            "click",
            sendTeacherRequest
        );
}


// ============================================================
// TEACHER MESSAGE
// ============================================================

function showTeacherMessage(message) {

    const area =
        document.getElementById(
            "uniuzTeacherArea"
        );


    if (!area) {
        return;
    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "uniuz-teacher-status";


    messageElement.innerHTML = `

        <div
            class="uniuz-status-title"
        >
            ${escapeHtml(message)}
        </div>

    `;


    area.innerHTML = "";

    area.appendChild(
        messageElement
    );
}


// ============================================================
// STUDENT
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


    console.log(
        "UniUZ role: student"
    );


    await initializeUniUZ();
}


// Make available globally

window.selectStudent =
    selectStudent;


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


    container.innerHTML =
        "";


    if (
        !data.items ||
        data.items.length === 0
    ) {

        container.innerHTML = `

            <div
                class="empty-state"
            >
                ${escapeHtml(
                    T("noHomework")
                )}
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

                <div
                    class="homework-title"
                >
                    📚 ${escapeHtml(
                        item.subject_name
                    )}
                </div>


                <div
                    class="homework-task"
                >
                    ${escapeHtml(
                        item.task_text
                    )}
                </div>


                <div
                    class="homework-date"
                >
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

        container.innerHTML = `

            <div
                class="empty-state"
            >
                ${escapeHtml(
                    T("noAnnouncements")
                )}
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

                <div
                    class="announcement-title"
                >
                    📢 ${escapeHtml(
                        item.title
                    )}
                </div>


                <div
                    class="announcement-message"
                >
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
// INITIALIZE APP
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
// PAGE NAVIGATION
// ============================================================

function openPage(page) {

    try {

        const event =
            new CustomEvent(
                "uniuz:openPage",
                {
                    detail: {
                        page
                    }
                }
            );


        document.dispatchEvent(
            event
        );

    } catch (error) {

        console.warn(
            "openPage:",
            error
        );
    }
}


// Make available globally

window.openPage =
    openPage;


// ============================================================
// MAIN START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Starting UniUZ..."
        );


        setupLanguageButtons();


        // ----------------------------------------------------
        // Existing language
        // ----------------------------------------------------

        if (!currentLanguage) {

            console.log(
                "Waiting for language selection..."
            );


            return;
        }


        hideLanguageScreen();


        // ----------------------------------------------------
        // Existing role
        // ----------------------------------------------------

        if (
            currentRole ===
            "student"
        ) {

            showMainApplication();

            initializeUniUZ();

            return;
        }


        if (
            currentRole ===
            "teacher"
        ) {

            // Teacher must be checked
            // again after approval.

            showRoleScreen();

            handleTeacherRole();

            return;
        }


        // ----------------------------------------------------
        // Language exists but role doesn't
        // ----------------------------------------------------

        showRoleScreen();

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
            "Telegram MainButton error:",
            error
        );
    }
}


// ============================================================
// TELEGRAM THEME
// ============================================================

if (tg) {

    try {

        tg.onEvent(
            "themeChanged",
            function() {

                console.log(
                    "Telegram theme changed"
                );

            }
        );

    } catch (error) {

        console.warn(
            "Telegram theme listener error:",
            error
        );
    }
}


// ============================================================
// DEBUG
// ============================================================

console.log(
    "UniUZ app.js loaded",
    {
        language:
            currentLanguage,

        role:
            currentRole,

        telegram:
            !!tg
    }
);

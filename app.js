// =====================================================
// UniUZ Mini App
// app.js
// CLEAN VERSION
// =====================================================

"use strict";


// =====================================================
// CONFIG
// =====================================================

const API_URL = "https://uniuz-production.up.railway.app";

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

        chooseDepartment: "Выберите факультет",
        chooseGroup: "Выберите группу",
        saveProfile: "Сохранить профиль",
        department: "Факультет",
        group: "Группа",
        profileSaved: "Профиль сохранён ✅",
        profileRequired: "Сначала выберите факультет и группу.",
        noGroups: "Для этого факультета группы не найдены.",
        loading: "Загрузка...",

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

        chooseDepartment: "Choose faculty",
        chooseGroup: "Choose group",
        saveProfile: "Save profile",
        department: "Faculty",
        group: "Group",
        profileSaved: "Profile saved ✅",
        profileRequired: "Choose your faculty and group first.",
        noGroups: "No groups found for this faculty.",
        loading: "Loading...",

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

        chooseDepartment: "학부를 선택하세요",
        chooseGroup: "그룹을 선택하세요",
        saveProfile: "프로필 저장",
        department: "학부",
        group: "그룹",
        profileSaved: "프로필이 저장되었습니다 ✅",
        profileRequired: "먼저 학부와 그룹을 선택하세요.",
        noGroups: "선택한 학부의 그룹이 없습니다.",
        loading: "로딩 중...",

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
                localStorage.setItem(
                    "uniuz_role",
                    "student"
                );

                try {
                    await loadProfile();

                    const profile =
                        cachedProfile?.profile;

                    if (
                        !profile?.department ||
                        !profile?.group_name
                    ) {
                        await showStudentProfileSetup();
                        return;
                    }

                    await openStudentApp();

                } catch (error) {

                    showError(
                        error.message ||
                        "Не удалось открыть профиль студента."
                    );
                }
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



            <button 
class="dashboard-card"
id="createHomeworkBtn"
>

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

document
.getElementById("createHomeworkBtn")
.onclick = ()=>{

    showCreateHomework();

};


}
// ==========================================================
// CREATE HOMEWORK PAGE
// ==========================================================


function showCreateHomework(){


const s = getScreen();



s.innerHTML = `


<div class="page">


<div class="info-card">


<h2>
📝 Создать задание
</h2>



<input

id="hwTitle"

placeholder="Название задания"

class="input"

/>



<textarea

id="hwDescription"

placeholder="Описание"

class="input"

></textarea>



<input

id="hwGroup"

placeholder="Группа"

class="input"

/>



<input

id="hwDeadline"

placeholder="Дата сдачи"

class="input"

/>



<button

class="role-button"

id="sendHomework"

>

✅ Опубликовать

</button>



<button

class="role-button"

id="backTeacher"

>

⬅️ Назад

</button>



</div>


</div>


`;





document
.getElementById("sendHomework")
.onclick = async()=>{


const homework = {


title:

document
.getElementById("hwTitle")
.value,


description:

document
.getElementById("hwDescription")
.value,


group_name:

document
.getElementById("hwGroup")
.value,


deadline:

document
.getElementById("hwDeadline")
.value


};



try{


await apiRequest(

"/api/teacher/homework/create",

{

method:"POST",

body: homework

}

);



alert(
"Задание опубликовано ✅"
);



showTeacherHome();



}

catch(error){


alert(
error.message
);


}



};





document
.getElementById("backTeacher")
.onclick = ()=>{


showTeacherHome();


};


}


// =====================================================
// STUDENT PROFILE SETUP
// =====================================================

async function showStudentProfileSetup() {

    setNav(false);

    const s = getScreen();
    if (!s) return;

    s.innerHTML = `
        <section class="page" style="padding:18px 16px">

            <div class="page-header">
                <div>
                    <h1>🎓 UniUZ</h1>
                    <p>${escapeHtml(T("profileRequired"))}</p>
                </div>
            </div>

            <div class="info-card">

                <h2>${escapeHtml(T("chooseDepartment"))}</h2>

                <select
                    id="studentDepartment"
                    class="input"
                    style="width:100%;box-sizing:border-box;margin-top:12px"
                >
                    <option value="">${escapeHtml(T("chooseDepartment"))}</option>
                </select>

                <div id="groupBlock" style="display:none;margin-top:18px">
                    <h2>${escapeHtml(T("chooseGroup"))}</h2>

                    <select
                        id="studentGroup"
                        class="input"
                        style="width:100%;box-sizing:border-box;margin-top:12px"
                        disabled
                    >
                        <option value="">${escapeHtml(T("chooseGroup"))}</option>
                    </select>
                </div>

                <button
                    type="button"
                    id="saveStudentProfile"
                    class="role-button"
                    style="margin-top:18px"
                    disabled
                >
                    ${escapeHtml(T("saveProfile"))}
                </button>

                <button
                    type="button"
                    id="studentProfileBack"
                    class="role-button teacher"
                    style="margin-top:10px"
                >
                    ${escapeHtml(T("back"))}
                </button>

                <p
                    id="profileSetupMessage"
                    style="margin-top:12px;opacity:.75"
                ></p>

            </div>
        </section>
    `;

    const departmentSelect =
        document.getElementById("studentDepartment");
    const groupSelect =
        document.getElementById("studentGroup");
    const groupBlock =
        document.getElementById("groupBlock");
    const saveButton =
        document.getElementById("saveStudentProfile");
    const message =
        document.getElementById("profileSetupMessage");

    try {

        message.textContent = T("loading");

        const data =
            await apiRequest("/api/departments");

        const departments =
            Array.isArray(data.items)
                ? data.items
                : [];

        departmentSelect.innerHTML = `
            <option value="">${escapeHtml(T("chooseDepartment"))}</option>
            ${departments.map(department => `
                <option value="${escapeHtml(department)}">
                    ${escapeHtml(department)}
                </option>
            `).join("")}
        `;

        message.textContent = "";

        if (!departments.length) {
            message.textContent = T("noGroups");
        }

    } catch (error) {

        message.textContent = error.message;
        return;
    }

    departmentSelect.addEventListener(
        "change",
        async () => {

            const department =
                departmentSelect.value;

            groupSelect.innerHTML = `
                <option value="">${escapeHtml(T("loading"))}</option>
            `;

            groupSelect.disabled = true;
            saveButton.disabled = true;
            groupBlock.style.display =
                department ? "block" : "none";

            if (!department) {
                return;
            }

            try {

                const data =
                    await apiRequest(
                        `/api/groups?department=${encodeURIComponent(department)}`
                    );

                const groups =
                    Array.isArray(data.items)
                        ? data.items
                        : [];

                groupSelect.innerHTML = `
                    <option value="">${escapeHtml(T("chooseGroup"))}</option>
                    ${groups.map(group => `
                        <option value="${escapeHtml(group)}">
                            ${escapeHtml(group)}
                        </option>
                    `).join("")}
                `;

                groupSelect.disabled =
                    groups.length === 0;

                if (!groups.length) {
                    message.textContent = T("noGroups");
                } else {
                    message.textContent = "";
                }

            } catch (error) {

                groupSelect.innerHTML = `
                    <option value="">${escapeHtml(T("chooseGroup"))}</option>
                `;
                groupSelect.disabled = true;
                message.textContent = error.message;
            }
        }
    );

    groupSelect.addEventListener(
        "change",
        () => {
            saveButton.disabled =
                !groupSelect.value;
        }
    );

    saveButton.addEventListener(
        "click",
        async () => {

            const department =
                departmentSelect.value;

            const group_name =
                groupSelect.value;

            if (!department || !group_name) {
                message.textContent =
                    T("profileRequired");
                return;
            }

            saveButton.disabled = true;
            message.textContent = T("loading");

            try {

                const data =
                    await apiRequest(
                        "/api/profile",
                        {
                            method: "POST",
                            body: {
                                university:
                                    "Ajou University in Tashkent",
                                department,
                                group_name,
                                role: "student"
                            }
                        }
                    );

                if (!data.ok) {
                    throw new Error(
                        data.error ||
                        "Не удалось сохранить профиль"
                    );
                }

                await loadProfile();

                message.textContent =
                    T("profileSaved");

                await openStudentApp();

            } catch (error) {

                saveButton.disabled = false;
                message.textContent =
                    error.message;
            }
        }
    );

    document
        .getElementById("studentProfileBack")
        ?.addEventListener(
            "click",
            showRoleScreen
        );
}


// =====================================================
// STUDENT APP
// =====================================================

async function openStudentApp() {

    await loadProfile();

    const profile =
        cachedProfile?.profile;

    if (
        !profile?.department ||
        !profile?.group_name
    ) {
        await showStudentProfileSetup();
        return;
    }

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
// HOMEWORK PAGE
// =====================================================

function renderHomeworkPage() {

    const screen = getScreen();
    if (!screen) return;

    const profile = cachedProfile?.profile;
    const groupName = profile?.group_name || "";

    const cards = cachedHomework.length
        ? cachedHomework.map(item => `
            <div class="info-card" style="margin-top:14px">
                <h2>
                    📝 ${escapeHtml(
                        item.subject_name ||
                        item.title ||
                        "Задание"
                    )}
                </h2>

                <p>
                    ${escapeHtml(
                        item.task_text ||
                        item.description ||
                        ""
                    )}
                </p>

                <p>
                    👥 ${escapeHtml(
                        item.group_name || groupName || "—"
                    )}
                </p>

                <p>
                    📅 ${escapeHtml(
                        item.homework_date ||
                        item.deadline ||
                        "Не указано"
                    )}
                </p>

                ${item.homework_time ? `
                    <p>⏰ ${escapeHtml(item.homework_time)}</p>
                ` : ""}
            </div>
        `).join("")
        : `
            <div class="info-card" style="margin-top:14px">
                <h3>📭 Пока нет заданий</h3>
                <p>
                    ${escapeHtml(
                        groupName
                            ? `Для группы ${groupName} пока нет опубликованных заданий.`
                            : T("profileRequired")
                    )}
                </p>
            </div>
        `;

    screen.innerHTML = `
        <section class="page">

            <div class="page-title">
                <span>📝</span>
                <h1>${escapeHtml(T("homework"))}</h1>
            </div>

            ${profile?.department || profile?.group_name ? `
                <div class="info-card">
                    <p>
                        🏛 ${escapeHtml(profile?.department || "—")}
                    </p>
                    <p>
                        👥 ${escapeHtml(profile?.group_name || "—")}
                    </p>
                </div>
            ` : ""}

            ${cards}

        </section>
    `;
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

        renderHomeworkPage();
        return;
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

                ${currentRole === "student" ? `
                    <p>🏛 ${escapeHtml(cachedProfile?.profile?.department || "—")}</p>
                    <p>👥 ${escapeHtml(cachedProfile?.profile?.group_name || "—")}</p>

                    <button
                        type="button"
                        id="editStudentProfile"
                        class="role-button"
                    >
                        ✏️ ${escapeHtml(T("department"))} / ${escapeHtml(T("group"))}
                    </button>
                ` : ""}

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
        .getElementById("editStudentProfile")
        ?.addEventListener(
            "click",
            () => showStudentProfileSetup()
        );


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

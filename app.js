// ==========================================================
// UniUZ Mini App
// Complete unified client
// ==========================================================

"use strict";

const API_URL = "https://uniuz-production.up.railway.app";
const tg = window.Telegram?.WebApp || null;
const initData = tg?.initData || "";

if (tg) {
    try {
        tg.ready();
        tg.expand();
    } catch (_) {}
}

let currentLanguage = localStorage.getItem("uniuz_language") || null;
let currentRole = null;
let teacherStatus = null;
let isAdmin = false;

let cachedProfile = null;
let cachedHomework = [];
let cachedAnnouncements = [];
let cachedTeacherHomework = [];
let cachedTeacherAnnouncements = [];
let cachedDepartments = [];
let cachedGroups = [];
let currentPage = "home";

const translations = {
    ru: {
        chooseLanguage:"Выберите язык", chooseRole:"Выберите вашу роль",
        roleSub:"Как вы будете использовать UniUZ?",
        student:"🎓 Студент", teacher:"👨‍🏫 Преподаватель", admin:"🔐 Администратор",
        pending:"⏳ Заявка отправлена", pendingText:"Заявка отправлена администратору. Дождитесь одобрения.",
        approved:"✅ Преподаватель одобрен", rejected:"❌ Заявка отклонена",
        sendRequest:"📨 Отправить заявку", check:"🔄 Проверить статус",
        approve:"✅ Одобрить", reject:"❌ Отклонить", refresh:"🔄 Обновить",
        back:"⬅️ Назад", noRequests:"📭 Новых заявок нет", adminTitle:"Панель администратора",
        welcome:"Добро пожаловать 👋", schedule:"Расписание", homework:"Задания",
        announcements:"Объявления", ai:"ИИ", profile:"Профиль", today:"Сегодня", quick:"Быстрые действия",
        selectDepartment:"Выберите факультет", selectGroup:"Выберите группу", save:"Сохранить",
        continue:"Продолжить", change:"Изменить", loading:"Загрузка...", noData:"Пока ничего нет",
        department:"Факультет", group:"Группа", name:"Имя", username:"Username",
        setupStudent:"Настройка профиля студента", setupTeacher:"Настройка профиля преподавателя",
        title:"Название", description:"Описание", deadline:"Срок сдачи", create:"Создать",
        myHomework:"Мои задания", createHomework:"Создать задание", createAnnouncement:"Создать объявление",
        targetGroups:"Группы получателей", message:"Текст объявления", publish:"Опубликовать",
        notificationSent:"Уведомление отправлено", users:"Пользователи", statistics:"Статистика",
        admins:"Администраторы", addAdmin:"Добавить администратора", telegramId:"Telegram ID",
        requests:"Заявки преподавателей", role:"Роль", delete:"Удалить", studentRole:"Студент",
        teacherRole:"Преподаватель", adminRole:"Администратор", send:"Отправить", logoutRole:"Сменить роль",
        language:"Язык", noHomework:"Нет заданий", noAnnouncements:"Нет объявлений",
        scheduleNotFound:"Расписание ещё не загружено", aiPlaceholder:"Напишите вопрос...",
        aiSend:"Отправить", apiError:"Ошибка API", saved:"Сохранено ✅",
        teacherPanel:"Панель преподавателя", studentPanel:"Профиль студента",
        myAnnouncements:"Мои объявления", recipients:"Получатели", studentCount:"Студентов уведомлено",
        invalid:"Заполните все обязательные поля", forbidden:"Недостаточно прав",
        roleUpdated:"Роль обновлена", adminAdded:"Администратор добавлен"
    },
    en: {
        chooseLanguage:"Choose language", chooseRole:"Choose your role",
        roleSub:"How will you use UniUZ?", student:"🎓 Student", teacher:"👨‍🏫 Teacher",
        admin:"🔐 Administrator", pending:"⏳ Request submitted",
        pendingText:"Your request was sent to the administrator. Please wait for approval.",
        approved:"✅ Teacher approved", rejected:"❌ Request rejected",
        sendRequest:"📨 Send request", check:"🔄 Check status", approve:"✅ Approve",
        reject:"❌ Reject", refresh:"🔄 Refresh", back:"⬅️ Back", noRequests:"📭 No new requests",
        adminTitle:"Administrator Panel", welcome:"Welcome 👋", schedule:"Schedule",
        homework:"Homework", announcements:"Announcements", ai:"AI", profile:"Profile",
        today:"Today", quick:"Quick actions", selectDepartment:"Select department",
        selectGroup:"Select group", save:"Save", continue:"Continue", change:"Change",
        loading:"Loading...", noData:"Nothing here yet", department:"Department", group:"Group",
        name:"Name", username:"Username", setupStudent:"Student profile setup",
        setupTeacher:"Teacher profile setup", title:"Title", description:"Description",
        deadline:"Deadline", create:"Create", myHomework:"My homework",
        createHomework:"Create homework", createAnnouncement:"Create announcement",
        targetGroups:"Recipient groups", message:"Announcement text", publish:"Publish",
        notificationSent:"Notification sent", users:"Users", statistics:"Statistics",
        admins:"Administrators", addAdmin:"Add administrator", telegramId:"Telegram ID",
        requests:"Teacher requests", role:"Role", delete:"Delete", studentRole:"Student",
        teacherRole:"Teacher", adminRole:"Administrator", send:"Send", logoutRole:"Change role",
        language:"Language", noHomework:"No homework", noAnnouncements:"No announcements",
        scheduleNotFound:"Schedule has not been uploaded yet", aiPlaceholder:"Ask a question...",
        aiSend:"Send", apiError:"API error", saved:"Saved ✅", teacherPanel:"Teacher panel",
        studentPanel:"Student profile", myAnnouncements:"My announcements", recipients:"Recipients",
        studentCount:"Students notified", invalid:"Please fill all required fields",
        forbidden:"Not enough permissions", roleUpdated:"Role updated", adminAdded:"Administrator added"
    },
    ko: {
        chooseLanguage:"언어를 선택하세요", chooseRole:"역할을 선택하세요",
        roleSub:"UniUZ를 어떻게 사용하시겠습니까?", student:"🎓 학생", teacher:"👨‍🏫 교수",
        admin:"🔐 관리자", pending:"⏳ 승인 요청 전송", pendingText:"관리자에게 신청을 보냈습니다. 승인을 기다려 주세요.",
        approved:"✅ 교수 승인 완료", rejected:"❌ 신청 거절", sendRequest:"📨 신청 보내기",
        check:"🔄 상태 확인", approve:"✅ 승인", reject:"❌ 거절", refresh:"🔄 새로고침",
        back:"⬅️ 뒤로", noRequests:"📭 새로운 신청이 없습니다", adminTitle:"관리자 패널",
        welcome:"환영합니다 👋", schedule:"시간표", homework:"과제", announcements:"공지사항",
        ai:"AI", profile:"프로필", today:"오늘", quick:"빠른 작업", selectDepartment:"학과 선택",
        selectGroup:"그룹 선택", save:"저장", continue:"계속", change:"변경", loading:"로딩 중...",
        noData:"아직 없습니다", department:"학과", group:"그룹", name:"이름", username:"사용자명",
        setupStudent:"학생 프로필 설정", setupTeacher:"교수 프로필 설정", title:"제목",
        description:"설명", deadline:"마감일", create:"생성", myHomework:"내 과제",
        createHomework:"과제 등록", createAnnouncement:"공지 작성", targetGroups:"공지 대상 그룹",
        message:"공지 내용", publish:"게시", notificationSent:"알림 전송", users:"사용자",
        statistics:"통계", admins:"관리자", addAdmin:"관리자 추가", telegramId:"Telegram ID",
        requests:"교수 신청", role:"역할", delete:"삭제", studentRole:"학생", teacherRole:"교수",
        adminRole:"관리자", send:"보내기", logoutRole:"역할 변경", language:"언어",
        noHomework:"과제가 없습니다", noAnnouncements:"공지사항이 없습니다",
        scheduleNotFound:"아직 시간표가 업로드되지 않았습니다", aiPlaceholder:"질문을 입력하세요...",
        aiSend:"보내기", apiError:"API 오류", saved:"저장 완료 ✅", teacherPanel:"교수 패널",
        studentPanel:"학생 프로필", myAnnouncements:"내 공지", recipients:"대상",
        studentCount:"알림을 받은 학생", invalid:"필수 항목을 입력하세요",
        forbidden:"권한이 없습니다", roleUpdated:"역할이 변경되었습니다", adminAdded:"관리자가 추가되었습니다"
    }
};

const departmentLabels = {
    "Architecture": {ru:"Архитектура", en:"Architecture", ko:"건축학과"},
    "Interior Design": {ru:"Дизайн интерьера", en:"Interior Design", ko:"실내디자인학과"},
    "Civil Systems Engineering": {ru:"Строительные системы", en:"Civil Systems Engineering", ko:"건설시스템공학과"},
    "Electrical & Computer Engineering": {ru:"Электроника и компьютерная инженерия", en:"Electrical & Computer Engineering", ko:"전자공학과"},
    "AI Software": {ru:"AI Software", en:"AI Software", ko:"AI 소프트웨어"},
    "IT Business": {ru:"IT Business", en:"IT Business", ko:"IT 비즈니스"},
    "Business Administration": {ru:"Бизнес-администрирование", en:"Business Administration", ko:"경영학과"},
    "English Philology & Management": {ru:"Английская филология и менеджмент", en:"English Philology & Management", ko:"영어영문학과"},
    "Korean Philology & Management": {ru:"Корейская филология и менеджмент", en:"Korean Philology & Management", ko:"한국어문학과"}
};

function T(key) {
    return (translations[currentLanguage] || translations.ru)[key] || key;
}

function getScreen() { return document.getElementById("screen"); }

function setNav(show) {
    const nav = document.querySelector(".bottom-nav");
    if (nav) nav.style.display = show ? "flex" : "none";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&","&amp;").replaceAll("<","&lt;")
        .replaceAll(">","&gt;").replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function deptLabel(name) {
    return departmentLabels[name]?.[currentLanguage] || name;
}

function showLoading(show=true) {
    const el = document.getElementById("loading");
    if (el) el.style.display = show ? "flex" : "none";
}

function showToast(text) {
    let toast = document.getElementById("uniuz-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "uniuz-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2400);
}

async function apiRequest(path, options={}) {
    const headers = {};
    if (initData) headers["X-Telegram-Init-Data"] = initData;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    let response;
    try {
        response = await fetch(API_URL + path, {
            method: options.method || "GET",
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined
        });
    } catch (_) {
        throw new Error(T("apiError"));
    }

    let data = {};
    try { data = await response.json(); } catch (_) {}

    if (!response.ok) {
        throw new Error(data.error || `${T("apiError")} ${response.status}`);
    }
    return data;
}

async function loadProfile() {
    const data = await apiRequest("/api/me");
    cachedProfile = data;
    isAdmin = data.is_admin === true;
    teacherStatus = data.teacher_status || null;
    return data;
}

async function loadDepartments() {
    const data = await apiRequest("/api/departments");
    cachedDepartments = Array.isArray(data.items) ? data.items : [];
    return cachedDepartments;
}

async function loadGroups(department) {
    const data = await apiRequest("/api/groups?department=" + encodeURIComponent(department));
    cachedGroups = Array.isArray(data.items) ? data.items : [];
    return cachedGroups;
}

function updateStaticTexts() {
    const navMap = {
        home: currentLanguage==="ru"?"Главная":currentLanguage==="en"?"Home":"홈",
        schedule:T("schedule"), homework:T("homework"), ai:T("ai"), profile:T("profile")
    };
    document.querySelectorAll(".nav-item").forEach(btn => {
        const page=btn.dataset.page;
        const small=btn.querySelector("small");
        if (small) small.textContent=navMap[page] || page;
    });
    const p=document.querySelector(".language-card > p");
    if(p) p.textContent=T("chooseLanguage");
}

function bindLanguageButtons() {
    document.querySelectorAll(".language-btn").forEach(btn => {
        btn.onclick = () => selectLanguage(btn.dataset.lang);
    });
}

async function selectLanguage(lang) {
    currentLanguage = translations[lang] ? lang : "ru";
    localStorage.setItem("uniuz_language", currentLanguage);
    updateStaticTexts();
    const languageScreen = document.getElementById("languageScreen");
    if (languageScreen) languageScreen.style.display = "none";

    try {
        await loadProfile();
    } catch (_) {
        cachedProfile = null;
        isAdmin = false;
        teacherStatus = null;
    }

    if (currentRole === "student") {
        await enterStudent();
        return;
    }
    if (currentRole === "teacher") {
        if (teacherStatus === "approved") {
            await ensureTeacherProfile();
        } else {
            showTeacherStatus();
        }
        return;
    }
    if (currentRole === "admin" && isAdmin) {
        await openAdminPanel();
        return;
    }

    showRoleScreen();
}

async function showRoleScreen() {
    setNav(false);
    const screen=getScreen();
    if(!screen) return;

    // Always refresh permissions before drawing the role buttons.
    try { await loadProfile(); } catch (_) {}

    screen.innerHTML=`
        <div class="role-container">
            <div class="role-card">
                <div class="role-logo">🎓</div>
                <h1>UniUZ</h1>
                <p>${escapeHtml(T("chooseRole"))}</p>
                <p class="muted">${escapeHtml(T("roleSub"))}</p>
                <button id="studentBtn" class="role-button">${escapeHtml(T("student"))}</button>
                <button id="teacherBtn" class="role-button teacher">${escapeHtml(T("teacher"))}</button>
                ${isAdmin ? `<button id="adminBtn" class="role-button admin">${escapeHtml(T("admin"))}</button>` : ""}
            </div>
        </div>`;

    document.getElementById("studentBtn").onclick=async()=>{
        currentRole="student";
        await enterStudent();
    };
    document.getElementById("teacherBtn").onclick=async()=>{
        currentRole="teacher";
        await requestTeacherAccess();
    };
    document.getElementById("adminBtn")?.addEventListener("click",openAdminPanel);
}

async function requestTeacherAccess() {
    try {
        const data=await apiRequest("/api/teacher/request",{method:"POST"});
        teacherStatus=data.status || "pending";
        if(teacherStatus==="approved") {
            await loadProfile();
            await ensureTeacherProfile();
            return;
        }
        showTeacherStatus();
    } catch(error) { showError(error.message); }
}

async function showTeacherStatus() {
    setNav(false);
    const screen=getScreen();
    const approved=teacherStatus==="approved";
    const rejected=teacherStatus==="rejected";

    screen.innerHTML=`
        <div class="role-container">
            <div class="role-card">
                <div class="role-logo">${approved?"✅":rejected?"❌":"⏳"}</div>
                <h1>${escapeHtml(approved?T("approved"):rejected?T("rejected"):T("pending"))}</h1>
                <p>${escapeHtml(rejected?T("rejected"):T("pendingText"))}</p>
                ${approved
                    ? `<button id="teacherOpen" class="role-button">${escapeHtml(T("teacher"))}</button>`
                    : `<button id="teacherCheck" class="role-button">${escapeHtml(T("check"))}</button>`
                }
                ${rejected?`<button id="teacherRetry" class="role-button teacher">${escapeHtml(T("sendRequest"))}</button>`:""}
                <button id="roleBack" class="role-button">${escapeHtml(T("back"))}</button>
            </div>
        </div>`;

    document.getElementById("teacherOpen")?.addEventListener("click",async()=>{
        await loadProfile();
        await ensureTeacherProfile();
    });
    document.getElementById("teacherCheck")?.addEventListener("click",async()=>{
        try {
            const d=await apiRequest("/api/teacher/status");
            teacherStatus=d.status;
            if(teacherStatus==="approved") {
                await loadProfile();
                await ensureTeacherProfile();
            } else showTeacherStatus();
        } catch(e) { showError(e.message); }
    });
    document.getElementById("teacherRetry")?.addEventListener("click",requestTeacherAccess);
    document.getElementById("roleBack")?.addEventListener("click",showRoleScreen);
}

async function ensureTeacherProfile() {
    const p=cachedProfile?.profile;
    if (!p?.department || !p?.group_name) {
        await showProfileSetup("teacher");
    } else {
        showTeacherHome();
    }
}

async function showProfileSetup(role) {
    setNav(false);
    try { await loadDepartments(); } catch(e) { showError(e.message); return; }

    const p=cachedProfile?.profile;
    const screen=getScreen();
    screen.innerHTML=`
        <section class="setup-page">
            <div class="setup-card">
                <div class="setup-icon">${role==="student"?"🎓":"👨‍🏫"}</div>
                <h1>${escapeHtml(role==="student"?T("setupStudent"):T("setupTeacher"))}</h1>
                <p class="muted">${escapeHtml(T("selectDepartment"))}</p>
                <div id="departmentList" class="choice-list"></div>
                <div id="groupStep" class="hidden">
                    <p class="muted">${escapeHtml(T("selectGroup"))}</p>
                    <div id="groupList" class="choice-list"></div>
                </div>
                <button id="saveProfile" class="primary-button" disabled>${escapeHtml(T("save"))}</button>
                <button id="setupBack" class="secondary-button">${escapeHtml(T("back"))}</button>
            </div>
        </section>`;

    let selectedDepartment=p?.department || null;
    let selectedGroup=p?.group_name || null;

    const depList=document.getElementById("departmentList");
    const groupStep=document.getElementById("groupStep");
    const groupList=document.getElementById("groupList");
    const saveBtn=document.getElementById("saveProfile");

    function drawDepartments() {
        depList.innerHTML=cachedDepartments.map(d=>`
            <button class="choice-button ${d===selectedDepartment?"selected":""}" data-value="${escapeHtml(d)}">
                🏛️ ${escapeHtml(deptLabel(d))}
            </button>`).join("");
        depList.querySelectorAll(".choice-button").forEach(b=>b.onclick=async()=>{
            selectedDepartment=b.dataset.value; selectedGroup=null;
            drawDepartments();
            groupStep.classList.remove("hidden");
            groupList.innerHTML=`<div class="muted">${escapeHtml(T("loading"))}</div>`;
            try {
                await loadGroups(selectedDepartment);
                groupList.innerHTML=cachedGroups.map(g=>`
                    <button class="choice-button ${g===selectedGroup?"selected":""}" data-value="${escapeHtml(g)}">
                        👥 ${escapeHtml(g)}
                    </button>`).join("");
                groupList.querySelectorAll(".choice-button").forEach(x=>x.onclick=()=>{
                    selectedGroup=x.dataset.value;
                    groupList.querySelectorAll(".choice-button").forEach(y=>y.classList.remove("selected"));
                    x.classList.add("selected");
                    saveBtn.disabled=false;
                });
            } catch(e) { groupList.innerHTML=`<div class="error-text">${escapeHtml(e.message)}</div>`; }
        });
    }
    drawDepartments();

    if(selectedDepartment) {
        groupStep.classList.remove("hidden");
        try {
            await loadGroups(selectedDepartment);
            groupList.innerHTML=cachedGroups.map(g=>`
                <button class="choice-button ${g===selectedGroup?"selected":""}" data-value="${escapeHtml(g)}">👥 ${escapeHtml(g)}</button>`).join("");
            groupList.querySelectorAll(".choice-button").forEach(x=>x.onclick=()=>{
                selectedGroup=x.dataset.value;
                groupList.querySelectorAll(".choice-button").forEach(y=>y.classList.remove("selected"));
                x.classList.add("selected"); saveBtn.disabled=false;
            });
            saveBtn.disabled=!selectedGroup;
        } catch (_) {}
    }

    saveBtn.onclick=async()=>{
        if(!selectedDepartment || !selectedGroup) return;
        try {
            const d=await apiRequest("/api/profile",{
                method:"POST",
                body:{
                    university:p?.university || "Ajou University in Tashkent",
                    department:selectedDepartment,
                    group_name:selectedGroup,
                    role
                }
            });
            cachedProfile.profile=d.profile;
            showToast(T("saved"));
            if(role==="student") await enterStudent();
            else showTeacherHome();
        } catch(e) { showError(e.message); }
    };

    document.getElementById("setupBack").onclick=showRoleScreen;
}

async function enterStudent() {
    setNav(true);
    try { await loadProfile(); } catch(e) { showError(e.message); return; }

    const p=cachedProfile?.profile;
    if(!p?.department || !p?.group_name) {
        await showProfileSetup("student");
        return;
    }

    await Promise.all([loadHomework(),loadAnnouncements()]);
    bindBottomNavigation();
    openPage("home");
}

async function loadHomework() {
    try { cachedHomework=(await apiRequest("/api/homework")).items || []; }
    catch(_) { cachedHomework=[]; }
}

async function loadAnnouncements() {
    try { cachedAnnouncements=(await apiRequest("/api/announcements")).items || []; }
    catch(_) { cachedAnnouncements=[]; }
}

function renderHome() {
    const s=getScreen();
    const first=cachedProfile?.telegram_user?.first_name || cachedProfile?.profile?.full_name || T("studentRole");
    s.innerHTML=`
        <section class="home-page">
            <div class="page-header">
                <div><span class="eyebrow">UniUZ</span><h1>${escapeHtml(T("welcome"))}</h1><p class="muted">${escapeHtml(first)}</p></div>
                <div class="avatar">👤</div>
            </div>
            <div class="hero-card"><div class="hero-icon">🎓</div><div><strong>${escapeHtml(first)}</strong><span>${escapeHtml(cachedProfile?.profile?.group_name || "")}</span></div></div>
            <div class="section-title">${escapeHtml(T("quick"))}</div>
            <div class="dashboard-grid">
                <button class="dashboard-card" data-page="schedule"><span>📅</span><b>${escapeHtml(T("schedule"))}</b></button>
                <button class="dashboard-card" data-page="homework"><span>📝</span><b>${escapeHtml(T("homework"))}</b></button>
                <button class="dashboard-card" data-page="announcements"><span>📢</span><b>${escapeHtml(T("announcements"))}</b></button>
                <button class="dashboard-card" data-page="ai"><span>🤖</span><b>${escapeHtml(T("ai"))}</b></button>
            </div>
        </section>`;
    bindScreenButtons();
}

async function openPage(page) {
    currentPage = page;
    document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
    if(page==="home"){renderHome();return;}
    if(page==="profile"){renderProfilePage();return;}
    if(page==="schedule"){await renderSchedule();return;}
    if(page==="homework"){renderHomework();return;}
    if(page==="announcements"){renderAnnouncements();return;}
    if(page==="ai"){renderAI();return;}
}

function renderHomework() {
    const s=getScreen();
    s.innerHTML=`
        <section class="page">
            <div class="page-header"><div><span class="eyebrow">${escapeHtml(T("homework"))}</span><h1>📝 ${escapeHtml(T("homework"))}</h1></div></div>
            ${cachedHomework.length?cachedHomework.map(h=>`
                <article class="content-card">
                    <div class="card-icon">📝</div>
                    <div class="card-body">
                        <h3>${escapeHtml(h.subject_name || h.title || "")}</h3>
                        <p>${escapeHtml(h.task_text || h.description || "")}</p>
                        <div class="meta-row"><span>👥 ${escapeHtml(h.group_name||"")}</span><span>📅 ${escapeHtml(h.homework_date||h.deadline||"")}</span></div>
                    </div>
                </article>`).join(""):`<div class="empty-card">📝<br>${escapeHtml(T("noHomework"))}</div>`}
        </section>`;
}

function renderAnnouncements() {
    const s=getScreen();
    s.innerHTML=`
        <section class="page">
            <div class="page-header"><div><span class="eyebrow">${escapeHtml(T("announcements"))}</span><h1>📢 ${escapeHtml(T("announcements"))}</h1></div></div>
            ${cachedAnnouncements.length?cachedAnnouncements.map(a=>`
                <article class="content-card">
                    <div class="card-icon">📢</div>
                    <div class="card-body">
                        <h3>${escapeHtml(a.title)}</h3>
                        <p>${escapeHtml(a.message)}</p>
                        <small>${escapeHtml(a.created_at||"")}</small>
                    </div>
                </article>`).join(""):`<div class="empty-card">📢<br>${escapeHtml(T("noAnnouncements"))}</div>`}
        </section>`;
}

async function renderSchedule() {
    const s=getScreen();
    s.innerHTML=`<section class="page"><div class="loading-card">${escapeHtml(T("loading"))}</div></section>`;
    try {
        const data=await apiRequest("/api/schedule");
        if(!data.available) {
            s.innerHTML=`<section class="page"><div class="empty-card">📅<br>${escapeHtml(T("scheduleNotFound"))}</div></section>`;
            return;
        }
        let fileResponse;
        try {
            fileResponse = await fetch(
                API_URL + "/api/schedule/file",
                {
                    headers: initData
                        ? {"X-Telegram-Init-Data": initData}
                        : {}
                }
            );
        } catch (_) {
            throw new Error(T("apiError"));
        }

        if (!fileResponse.ok) {
            let errorData = {};
            try { errorData = await fileResponse.json(); } catch (_) {}
            throw new Error(
                errorData.error || `${T("apiError")} ${fileResponse.status}`
            );
        }

        const blob = await fileResponse.blob();
        const imageUrl = URL.createObjectURL(blob);

        s.innerHTML=`
            <section class="page">
                <div class="page-header"><div><span class="eyebrow">${escapeHtml(T("schedule"))}</span><h1>📅 ${escapeHtml(T("schedule"))}</h1></div></div>
                <div class="schedule-card"><img src="${imageUrl}" alt="${escapeHtml(T("schedule"))}" /></div>
            </section>`;
    } catch(e) { showError(e.message); }
}

function renderAI() {
    const s=getScreen();
    s.innerHTML=`
        <section class="page">
            <div class="page-header"><div><span class="eyebrow">UniUZ</span><h1>🤖 ${escapeHtml(T("ai"))}</h1></div></div>
            <div id="aiMessages" class="ai-messages"></div>
            <div class="ai-form"><textarea id="aiInput" placeholder="${escapeHtml(T("aiPlaceholder"))}"></textarea><button id="aiSend" class="primary-button">${escapeHtml(T("aiSend"))}</button></div>
        </section>`;
    const send=async()=>{
        const input=document.getElementById("aiInput");
        const text=input.value.trim();
        if(!text)return;
        const box=document.getElementById("aiMessages");
        box.insertAdjacentHTML("beforeend",`<div class="ai-message user">${escapeHtml(text)}</div>`);
        input.value="";
        try {
            const d=await apiRequest("/api/ai",{method:"POST",body:{message:text}});
            box.insertAdjacentHTML("beforeend",`<div class="ai-message assistant">${escapeHtml(d.answer||"")}</div>`);
        } catch(e) { box.insertAdjacentHTML("beforeend",`<div class="ai-message assistant">${escapeHtml(e.message)}</div>`); }
        box.scrollTop=box.scrollHeight;
    };
    document.getElementById("aiSend").onclick=send;
    document.getElementById("aiInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}});
}

function renderProfilePage() {
    const s=getScreen(), p=cachedProfile?.profile||{}, u=cachedProfile?.telegram_user||{};
    s.innerHTML=`
        <section class="page">
            <div class="profile-card large"><div class="avatar">👤</div><h1>${escapeHtml(u.first_name||p.full_name||"")}</h1><p>${escapeHtml(u.username?"@"+u.username:"")}</p></div>
            <div class="info-grid">
                <div class="info-card"><span>${escapeHtml(T("department"))}</span><b>${escapeHtml(deptLabel(p.department||"—"))}</b></div>
                <div class="info-card"><span>${escapeHtml(T("group"))}</span><b>${escapeHtml(p.group_name||"—")}</b></div>
            </div>
            <button id="editProfile" class="primary-button">${escapeHtml(T("change"))}</button>
            <button id="changeLang" class="secondary-button">${escapeHtml(T("language"))}</button>
            <button id="changeRole" class="secondary-button">${escapeHtml(T("logoutRole"))}</button>
        </section>`;
    document.getElementById("editProfile").onclick=()=>showProfileSetup(currentRole==="teacher"?"teacher":"student");
    document.getElementById("changeLang").onclick=()=>{
        const languageScreen = document.getElementById("languageScreen");
        if (languageScreen) languageScreen.style.display = "flex";
        setNav(false);
    };
    document.getElementById("changeRole").onclick=async()=>{
        currentRole = null;
        setNav(false);
        await showRoleScreen();
    };
}

function showTeacherHome() {
    setNav(false);
    const s=getScreen();
    const p=cachedProfile?.profile||{};
    s.innerHTML=`
        <section class="page">
            <div class="page-header"><div><span class="eyebrow">${escapeHtml(T("teacherPanel"))}</span><h1>👨‍🏫 UniUZ</h1><p class="muted">${escapeHtml(p.group_name||"")}</p></div><div class="avatar">👨‍🏫</div></div>
            <div class="dashboard-grid">
                <button class="dashboard-card" id="teacherHomework"><span>📝</span><b>${escapeHtml(T("createHomework"))}</b></button>
                <button class="dashboard-card" id="teacherAnnouncement"><span>📢</span><b>${escapeHtml(T("createAnnouncement"))}</b></button>
                <button class="dashboard-card" id="teacherMyHomework"><span>📚</span><b>${escapeHtml(T("myHomework"))}</b></button>
                <button class="dashboard-card" id="teacherMyAnnouncements"><span>📢</span><b>${escapeHtml(T("myAnnouncements"))}</b></button>
                <button class="dashboard-card" id="teacherProfile"><span>👤</span><b>${escapeHtml(T("profile"))}</b></button>
            </div>
            <button id="teacherBack" class="secondary-button">${escapeHtml(T("back"))}</button>
        </section>`;
    document.getElementById("teacherHomework").onclick=showCreateHomework;
    document.getElementById("teacherAnnouncement").onclick=showCreateAnnouncement;
    document.getElementById("teacherMyHomework").onclick=showTeacherHomework;
    document.getElementById("teacherMyAnnouncements").onclick=showTeacherAnnouncements;
    document.getElementById("teacherProfile").onclick=()=>showProfileSetup("teacher");
    document.getElementById("teacherBack").onclick=showRoleScreen;
}

async function showCreateHomework() {
    try { await loadDepartments(); } catch(e) { showError(e.message); return; }
    const p=cachedProfile?.profile||{};
    const s=getScreen();
    s.innerHTML=`
        <section class="page"><div class="form-card">
            <h1>📝 ${escapeHtml(T("createHomework"))}</h1>
            <label>${escapeHtml(T("department"))}<select id="hwDepartment">${cachedDepartments.map(d=>`<option value="${escapeHtml(d)}" ${d===(p.department||"")?"selected":""}>${escapeHtml(deptLabel(d))}</option>`).join("")}</select></label>
            <label>${escapeHtml(T("group"))}<select id="hwGroup"></select></label>
            <label>${escapeHtml(T("title"))}<input id="hwTitle"></label>
            <label>${escapeHtml(T("description"))}<textarea id="hwDescription"></textarea></label>
            <label>${escapeHtml(T("deadline"))}<input id="hwDeadline" type="date"></label>
            <button id="hwCreate" class="primary-button">${escapeHtml(T("create"))}</button>
            <button id="hwBack" class="secondary-button">${escapeHtml(T("back"))}</button>
        </div></section>`;
    const dep=document.getElementById("hwDepartment"), group=document.getElementById("hwGroup");
    async function fillGroups(){
        try {
            const groups=await loadGroups(dep.value);
            group.innerHTML=groups.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
        } catch(e){group.innerHTML="";}
    }
    dep.onchange=fillGroups; await fillGroups();
    document.getElementById("hwCreate").onclick=async()=>{
        const body={department:dep.value,group_name:group.value,title:document.getElementById("hwTitle").value.trim(),description:document.getElementById("hwDescription").value.trim(),deadline:document.getElementById("hwDeadline").value};
        if(!body.title||!body.group_name){showToast(T("invalid"));return;}
        try { await apiRequest("/api/teacher/homework/create",{method:"POST",body}); showToast(T("saved")); showTeacherHome(); }
        catch(e){showError(e.message);}
    };
    document.getElementById("hwBack").onclick=showTeacherHome;
}

async function showTeacherHomework() {
    try { cachedTeacherHomework=(await apiRequest("/api/teacher/homework")).items||[]; } catch(e){showError(e.message);return;}
    const s=getScreen();
    s.innerHTML=`<section class="page"><div class="page-header"><h1>📚 ${escapeHtml(T("myHomework"))}</h1></div>
        ${cachedTeacherHomework.length?cachedTeacherHomework.map(h=>`<article class="content-card"><div class="card-body"><h3>${escapeHtml(h.subject_name)}</h3><p>${escapeHtml(h.task_text)}</p><div class="meta-row"><span>👥 ${escapeHtml(h.group_name)}</span><span>📅 ${escapeHtml(h.homework_date)}</span></div><button class="danger-button delete-hw" data-id="${h.id}">${escapeHtml(T("delete"))}</button></div></article>`).join(""):`<div class="empty-card">${escapeHtml(T("noData"))}</div>`}
        <button id="thBack" class="secondary-button">${escapeHtml(T("back"))}</button></section>`;
    document.querySelectorAll(".delete-hw").forEach(b=>b.onclick=async()=>{await apiRequest("/api/teacher/homework/"+b.dataset.id,{method:"DELETE"});showTeacherHomework();});
    document.getElementById("thBack").onclick=showTeacherHome;
}

async function showCreateAnnouncement() {
    try { await loadDepartments(); } catch(e){showError(e.message);return;}
    const p=cachedProfile?.profile||{};
    const s=getScreen();
    s.innerHTML=`
        <section class="page"><div class="form-card">
            <h1>📢 ${escapeHtml(T("createAnnouncement"))}</h1>
            <label>${escapeHtml(T("department"))}<select id="anDepartment">${cachedDepartments.map(d=>`<option value="${escapeHtml(d)}" ${d===(p.department||"")?"selected":""}>${escapeHtml(deptLabel(d))}</option>`).join("")}</select></label>
            <label>${escapeHtml(T("title"))}<input id="anTitle"></label>
            <label>${escapeHtml(T("message"))}<textarea id="anMessage"></textarea></label>
            <div class="form-label">${escapeHtml(T("targetGroups"))}</div>
            <div id="anGroups" class="check-list"></div>
            <button id="anPublish" class="primary-button">${escapeHtml(T("publish"))}</button>
            <button id="anBack" class="secondary-button">${escapeHtml(T("back"))}</button>
        </div></section>`;
    const dep=document.getElementById("anDepartment"), list=document.getElementById("anGroups");
    async function fill(){
        try {
            const groups=await loadGroups(dep.value);
            list.innerHTML=groups.map(g=>`<label class="check-row"><input type="checkbox" value="${escapeHtml(g)}"><span>👥 ${escapeHtml(g)}</span></label>`).join("");
        } catch(e){list.innerHTML="";}
    }
    dep.onchange=fill; await fill();
    document.getElementById("anPublish").onclick=async()=>{
        const groups=[...list.querySelectorAll("input:checked")].map(x=>x.value);
        const title=document.getElementById("anTitle").value.trim(), message=document.getElementById("anMessage").value.trim();
        if(!title||!message||!groups.length){showToast(T("invalid"));return;}
        try {
            const d=await apiRequest("/api/teacher/announcements/create",{method:"POST",body:{department:dep.value,group_names:groups,title,message}});
            showToast(`${T("saved")} ${T("notificationSent")}: ${d.notification?.sent||0}`);
            showTeacherHome();
        } catch(e){showError(e.message);}
    };
    document.getElementById("anBack").onclick=showTeacherHome;
}

async function showTeacherAnnouncements() {
    try { cachedTeacherAnnouncements=(await apiRequest("/api/teacher/announcements")).items||[]; } catch(e){showError(e.message);return;}
    const s=getScreen();
    s.innerHTML=`<section class="page"><div class="page-header"><h1>📢 ${escapeHtml(T("myAnnouncements"))}</h1></div>
        ${cachedTeacherAnnouncements.length?cachedTeacherAnnouncements.map(a=>`<article class="content-card"><div class="card-body"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.message)}</p><div class="meta-row"><span>👥 ${escapeHtml((a.target_groups||[]).join(", "))}</span><span>${escapeHtml(a.created_at||"")}</span></div><button class="danger-button delete-an" data-id="${a.id}">${escapeHtml(T("delete"))}</button></div></article>`).join(""):`<div class="empty-card">${escapeHtml(T("noData"))}</div>`}
        <button id="taBack" class="secondary-button">${escapeHtml(T("back"))}</button></section>`;
    document.querySelectorAll(".delete-an").forEach(b=>b.onclick=async()=>{await apiRequest("/api/teacher/announcements/"+b.dataset.id,{method:"DELETE"});showTeacherAnnouncements();});
    document.getElementById("taBack").onclick=showTeacherHome;
}

async function openAdminPanel() {
    setNav(false);
    try { await loadProfile(); } catch(e){}
    if(!isAdmin){showError(T("forbidden"));return;}
    renderAdminDashboard("requests");
}

async function renderAdminDashboard(tab="requests") {
    const s=getScreen();
    s.innerHTML=`
        <section class="page">
            <div class="page-header"><div><span class="eyebrow">UniUZ</span><h1>🔐 ${escapeHtml(T("adminTitle"))}</h1></div></div>
            <div class="admin-tabs">
                <button data-admin-tab="requests">${escapeHtml(T("requests"))}</button>
                <button data-admin-tab="users">${escapeHtml(T("users"))}</button>
                <button data-admin-tab="statistics">${escapeHtml(T("statistics"))}</button>
                <button data-admin-tab="admins">${escapeHtml(T("admins"))}</button>
            </div>
            <div id="adminContent"></div>
            <button id="adminBack" class="secondary-button">${escapeHtml(T("back"))}</button>
        </section>`;
    document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>renderAdminTab(b.dataset.adminTab));
    document.getElementById("adminBack").onclick=showRoleScreen;
    await renderAdminTab(tab);
}

async function renderAdminTab(tab) {
    const box=document.getElementById("adminContent");
    if(!box)return;
    box.innerHTML=`<div class="loading-card">${escapeHtml(T("loading"))}</div>`;
    try {
        if(tab==="requests"){
            const d=await apiRequest("/api/admin/teacher-requests");
            box.innerHTML=d.items?.length?d.items.map(x=>`<div class="content-card"><div class="card-body"><h3>👨‍🏫 ${escapeHtml(x.full_name)}</h3><p>ID: ${x.telegram_id}</p><div class="button-row"><button class="primary-button approve" data-id="${x.telegram_id}">${escapeHtml(T("approve"))}</button><button class="danger-button reject" data-id="${x.telegram_id}">${escapeHtml(T("reject"))}</button></div></div></div>`).join(""):`<div class="empty-card">${escapeHtml(T("noRequests"))}</div>`;
            box.querySelectorAll(".approve").forEach(b=>b.onclick=async()=>{await apiRequest(`/api/admin/teacher/${b.dataset.id}/approve`,{method:"POST"});renderAdminTab("requests");});
            box.querySelectorAll(".reject").forEach(b=>b.onclick=async()=>{await apiRequest(`/api/admin/teacher/${b.dataset.id}/reject`,{method:"POST"});renderAdminTab("requests");});
        } else if(tab==="statistics"){
            const d=await apiRequest("/api/admin/statistics"), st=d.stats||{};
            box.innerHTML=`<div class="stats-grid">${Object.entries(st).map(([k,v])=>`<div class="stat-card"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("")}</div>`;
        } else if(tab==="users"){
            const d=await apiRequest("/api/admin/users");
            box.innerHTML=d.items?.length?d.items.map(u=>`<div class="content-card"><div class="card-body"><h3>${escapeHtml(u.full_name||"—")}</h3><p>ID: ${u.id} · ${escapeHtml(u.group_name||"—")}</p><select class="user-role" data-id="${u.id}"><option value="student" ${u.role==="student"?"selected":""}>${escapeHtml(T("studentRole"))}</option><option value="teacher" ${u.role==="teacher"?"selected":""}>${escapeHtml(T("teacherRole"))}</option><option value="admin" ${u.role==="admin"?"selected":""}>${escapeHtml(T("adminRole"))}</option></select> <button class="danger-button user-delete" data-id="${u.id}">${escapeHtml(T("delete"))}</button></div></div>`).join(""):`<div class="empty-card">${escapeHtml(T("noData"))}</div>`;
            box.querySelectorAll(".user-role").forEach(sel=>sel.onchange=async()=>{await apiRequest(`/api/admin/users/${sel.dataset.id}/role`,{method:"POST",body:{role:sel.value}});showToast(T("roleUpdated"));});
            box.querySelectorAll(".user-delete").forEach(b=>b.onclick=async()=>{if(confirm(T("delete")+"?")){await apiRequest(`/api/admin/users/${b.dataset.id}`,{method:"DELETE"});renderAdminTab("users");}});
        } else if(tab==="admins"){
            const d=await apiRequest("/api/admin/admins");
            box.innerHTML=`<div class="form-card"><h3>${escapeHtml(T("addAdmin"))}</h3><input id="newAdminId" type="number" placeholder="${escapeHtml(T("telegramId"))}"><button id="addAdminBtn" class="primary-button">${escapeHtml(T("addAdmin"))}</button></div>${d.items?.map(a=>`<div class="content-card"><div class="card-body"><b>${a.telegram_id}</b><button class="danger-button remove-admin" data-id="${a.telegram_id}">${escapeHtml(T("delete"))}</button></div></div>`).join("")||""}`;
            document.getElementById("addAdminBtn").onclick=async()=>{const id=Number(document.getElementById("newAdminId").value);if(!id)return;await apiRequest("/api/admin/admins",{method:"POST",body:{telegram_id:id}});showToast(T("adminAdded"));renderAdminTab("admins");};
            box.querySelectorAll(".remove-admin").forEach(b=>b.onclick=async()=>{await apiRequest(`/api/admin/admins/${b.dataset.id}`,{method:"DELETE"});renderAdminTab("admins");});
        }
    } catch(e){box.innerHTML=`<div class="empty-card error-text">${escapeHtml(e.message)}</div>`;}
}

function bindBottomNavigation() {
    document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>openPage(b.dataset.page));
}

function bindScreenButtons() {
    document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>openPage(b.dataset.page));
}

function showError(text) {
    const s=getScreen();
    if(!s)return;
    s.innerHTML=`<section class="page"><div class="empty-card error-text">⚠️ ${escapeHtml(text)}</div><button id="errorBack" class="secondary-button">${escapeHtml(T("back"))}</button></section>`;
    document.getElementById("errorBack").onclick=showRoleScreen;
}

async function initializeUniUZ() {
    setNav(false);
    updateStaticTexts();

    const languageScreen = document.getElementById("languageScreen");
    if (!currentLanguage) {
        if (languageScreen) languageScreen.style.display = "flex";
        return;
    }

    if (languageScreen) languageScreen.style.display = "none";

    try {
        await loadProfile();

        if (currentRole === "student") {
            await enterStudent();
            return;
        }

        if (currentRole === "teacher") {
            if (teacherStatus === "approved") {
                await ensureTeacherProfile();
            } else {
                showTeacherStatus();
            }
            return;
        }

        // Every new session starts at the role selector.
        await showRoleScreen();
    } catch (error) {
        // A new Telegram user may not exist in the database yet.
        // They can still choose a role and complete their profile.
        cachedProfile = null;
        isAdmin = false;
        teacherStatus = null;
        await showRoleScreen();
    }
}

document.addEventListener("DOMContentLoaded",async()=>{
    bindLanguageButtons();
    await initializeUniUZ();
});

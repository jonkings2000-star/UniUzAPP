const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const LANG_KEY = "uniuz_language_v2";

const state = {
  user: tg?.initDataUnsafe?.user || null,
  page: "home",
  lang: localStorage.getItem(LANG_KEY) || null
};

const demo = {
  homework: [
    ["Programming", "Лабораторная работа №3", "Сегодня, 18:00"],
    ["Korean", "Chapter 5 exercises", "Завтра, 12:00"]
  ],
  announcements: [
    ["📢 Midterm", "Информация о предстоящем midterm."],
    ["📢 University", "Новое объявление университета."]
  ]
};

const T = {
  ru: {
    welcome: "Добро пожаловать 👋",
    student: "СТУДЕНТ",
    profileLoading: "Профиль будет загружен из базы UniUZ",
    nextLesson: "Следующая пара",
    schedule: "Расписание",
    scheduleToday: "На сегодня",
    homework: "Задания",
    homeworkCount: "2 задания",
    announcements: "Объявления",
    announcementsCount: "2 новых",
    ai: "AI Assistant",
    aiLimit: "7 запросов/день",
    quick: "Быстрые действия",
    today: "Сегодня",
    deadlines: "Дедлайны",
    news: "Новости",
    profile: "Профиль",
    back: "← Назад",
    scheduleInfo: "Реальное расписание подключим после получения данных университета.",
    homeworkTitle: "Задания",
    announcementsTitle: "Объявления",
    profileTitle: "Профиль",
    profileInfo: "Данные профиля будут получены из UniUZ API.",
    aiTitle: "UniUZ AI",
    aiInfo: "AI Assistant подключим к существующему OpenAI API и лимиту 7 запросов в день.",
    aiPlaceholder: "Напишите вопрос...",
    aiAlert: "AI API будет подключён на следующем этапе.",
    nextSubject: "Расписание подключится к базе",
    room: "🏫 —"
  },
  en: {
    welcome: "Welcome 👋",
    student: "STUDENT",
    profileLoading: "Profile will be loaded from the UniUZ database",
    nextLesson: "Next class",
    schedule: "Schedule",
    scheduleToday: "Today",
    homework: "Homework",
    homeworkCount: "2 tasks",
    announcements: "Announcements",
    announcementsCount: "2 new",
    ai: "AI Assistant",
    aiLimit: "7 requests/day",
    quick: "Quick actions",
    today: "Today",
    deadlines: "Deadlines",
    news: "News",
    profile: "Profile",
    back: "← Back",
    scheduleInfo: "Real schedule will be connected after university data is received.",
    homeworkTitle: "Homework",
    announcementsTitle: "Announcements",
    profileTitle: "Profile",
    profileInfo: "Profile data will be received from the UniUZ API.",
    aiTitle: "UniUZ AI",
    aiInfo: "AI Assistant will be connected to the existing OpenAI API with a limit of 7 requests per day.",
    aiPlaceholder: "Write your question...",
    aiAlert: "AI API will be connected at the next stage.",
    nextSubject: "Schedule will be connected to the database",
    room: "🏫 —"
  },
  ko: {
    welcome: "환영합니다 👋",
    student: "학생",
    profileLoading: "프로필은 UniUZ 데이터베이스에서 불러옵니다",
    nextLesson: "다음 수업",
    schedule: "시간표",
    scheduleToday: "오늘",
    homework: "과제",
    homeworkCount: "과제 2개",
    announcements: "공지사항",
    announcementsCount: "새 공지 2개",
    ai: "AI 도우미",
    aiLimit: "하루 7회",
    quick: "빠른 메뉴",
    today: "오늘",
    deadlines: "마감일",
    news: "뉴스",
    profile: "프로필",
    back: "← 뒤로",
    scheduleInfo: "대학교 데이터를 받은 후 실제 시간표를 연결합니다.",
    homeworkTitle: "과제",
    announcementsTitle: "공지사항",
    profileTitle: "프로필",
    profileInfo: "프로필 정보는 UniUZ API에서 가져옵니다.",
    aiTitle: "UniUZ AI",
    aiInfo: "기존 OpenAI API와 하루 7회 제한으로 AI 도우미를 연결합니다.",
    aiPlaceholder: "질문을 입력하세요...",
    aiAlert: "AI API는 다음 단계에서 연결됩니다.",
    nextSubject: "시간표를 데이터베이스에 연결합니다",
    room: "🏫 —"
  }
};

function t(key) {
  return T[state.lang]?.[key] ?? T.ru[key] ?? key;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function showLanguageScreen() {
  document.getElementById("languageScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function startApp(lang) {
  state.lang = lang;
  localStorage.setItem(LANG_KEY, lang);

  document.getElementById("languageScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.documentElement.lang = lang === "ko" ? "ko" : lang;
  applyStaticTranslations();
  renderPage("home");
}

function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
}

function setActive(page) {
  document.querySelectorAll(".nav-item").forEach(x =>
    x.classList.toggle("active", x.dataset.page === page)
  );
}

function getUserName() {
  const u = state.user;
  return u ? [u.first_name, u.last_name].filter(Boolean).join(" ") : "UniUZ";
}

function renderHome() {
  const name = getUserName();

  document.getElementById("userName").textContent = name || "UniUZ";
  document.getElementById("welcome").textContent = t("welcome");
  document.getElementById("avatar").textContent = (name || "U").charAt(0).toUpperCase();
  document.getElementById("userGroup").textContent = t("profileLoading");
  document.getElementById("homeworkCount").textContent = t("homeworkCount");
  document.getElementById("announcementCount").textContent = t("announcementsCount");
}

function renderPage(page) {
  state.page = page;
  setActive(page);

  const main = document.getElementById("screen");

  if (page === "home") {
    main.innerHTML = `
      <section class="hero-card">
        <div class="eyebrow">${esc(t("student"))}</div>
        <h1 id="userName">UniUZ</h1>
        <p id="userGroup"></p>
      </section>

      <section class="next-card">
        <div class="section-title">📅 ${esc(t("nextLesson"))}</div>
        <div class="lesson-time">09:00</div>
        <div class="lesson-name">${esc(t("nextSubject"))}</div>
        <div class="lesson-room">${esc(t("room"))}</div>
      </section>

      <div class="stats-grid">
        <button class="stat-card" data-page="schedule">
          <span>📅</span><b>${esc(t("schedule"))}</b><small>${esc(t("scheduleToday"))}</small>
        </button>
        <button class="stat-card" data-page="homework">
          <span>📝</span><b>${esc(t("homework"))}</b><small id="homeworkCount"></small>
        </button>
        <button class="stat-card" data-page="announcements">
          <span>📢</span><b>${esc(t("announcements"))}</b><small id="announcementCount"></small>
        </button>
        <button class="stat-card ai-card" data-page="ai">
          <span>🤖</span><b>${esc(t("ai"))}</b><small>${esc(t("aiLimit"))}</small>
        </button>
      </div>

      <section class="quick-card">
        <div class="section-title">⚡ ${esc(t("quick"))}</div>
        <div class="quick-actions">
          <button data-page="schedule">${esc(t("today"))}</button>
          <button data-page="homework">${esc(t("deadlines"))}</button>
          <button data-page="announcements">${esc(t("news"))}</button>
          <button data-page="profile">${esc(t("profile"))}</button>
        </div>
      </section>
    `;

    renderHome();

  } else if (page === "schedule") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>📅 ${esc(t("schedule"))}</h2>
        <div class="item"><b>${esc(t("today"))}</b><p class="muted">${esc(t("scheduleInfo"))}</p></div>
      </section>
    `;

  } else if (page === "homework") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>📝 ${esc(t("homeworkTitle"))}</h2>
        ${demo.homework.map(x => `
          <div class="item">
            <b>📚 ${esc(x[0])}</b>
            <p>${esc(x[1])}</p>
            <span class="muted">⏰ ${esc(x[2])}</span>
          </div>
        `).join("")}
      </section>
    `;

  } else if (page === "announcements") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>📢 ${esc(t("announcementsTitle"))}</h2>
        ${demo.announcements.map(x => `
          <div class="item"><b>${esc(x[0])}</b><p>${esc(x[1])}</p></div>
        `).join("")}
      </section>
    `;

  } else if (page === "profile") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>👤 ${esc(t("profileTitle"))}</h2>
        <div class="item">
          <b>${esc(getUserName())}</b>
          <p class="muted">${esc(t("profileInfo"))}</p>
        </div>

        <div class="item language-settings">
          <b>🌐 ${esc(t("languageTitle"))}</b>
          <div class="language-options">
            <button class="${state.lang === "ru" ? "selected" : ""}" data-lang-change="ru">🇷🇺 Русский</button>
            <button class="${state.lang === "en" ? "selected" : ""}" data-lang-change="en">🇬🇧 English</button>
            <button class="${state.lang === "ko" ? "selected" : ""}" data-lang-change="ko">🇰🇷 한국어</button>
          </div>
        </div>
      </section>
    `;

    document.querySelectorAll("[data-lang-change]").forEach(btn => {
      btn.onclick = () => {
        startApp(btn.dataset.langChange);
        renderPage("profile");
      };
    });

  } else if (page === "ai") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>🤖 ${esc(t("aiTitle"))}</h2>
        <div class="item"><p>${esc(t("aiInfo"))}</p></div>
      </section>
      <div class="ai-input">
        <input id="aiText" placeholder="${esc(t("aiPlaceholder"))}">
        <button id="aiSend">➤</button>
      </div>
    `;

    document.getElementById("aiSend").onclick = () => {
      const input = document.getElementById("aiText");
      if (!input.value.trim()) return;
      if (tg) tg.showAlert(t("aiAlert"));
      input.value = "";
    };
  }

  bindNavigation();
}

function bindNavigation() {
  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.onclick = () => renderPage(btn.dataset.page);
  });
}

document.querySelectorAll(".language-btn").forEach(btn => {
  btn.addEventListener("click", () => startApp(btn.dataset.lang));
});

if (state.lang) {
  startApp(state.lang);
} else {
  showLanguageScreen();
}

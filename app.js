const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const LANG_KEY = "uniuz_language_v2";
const API_BASE = "https://uniuz-production.up.railway.app";

const state = {
  user: tg?.initDataUnsafe?.user || null,
  page: "home",
  lang: localStorage.getItem(LANG_KEY) || null,
  profile: null,
  homework: [],
  announcements: [],
  scheduleAvailable: false,
  apiError: null
};


async function apiGet(path) {
  if (!tg?.initData) {
    throw new Error("Mini App must be opened from Telegram.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "X-Telegram-Init-Data": tg.initData
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `API error ${response.status}`);
  }

  return data;
}

async function loadRealData() {
  try {
    const data = await apiGet("/api/home");

    state.profile = data.profile || null;
    state.homework = Array.isArray(data.homework) ? data.homework : [];
    state.announcements = Array.isArray(data.announcements)
      ? data.announcements
      : [];
    state.scheduleAvailable = Boolean(data.schedule_available);
    state.apiError = null;
  } catch (error) {
    console.error("UniUZ API error:", error);
    state.apiError = error.message;
  }
}

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
    homeworkCount: "0 заданий",
    announcements: "Объявления",
    announcementsCount: "0 новых",
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
    homeworkCount: "0 tasks",
    announcements: "Announcements",
    announcementsCount: "0 new",
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
    homeworkCount: "과제 0개",
    announcements: "공지사항",
    announcementsCount: "새 공지 0개",
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

async function startApp(lang) {
  state.lang = lang;
  localStorage.setItem(LANG_KEY, lang);

  document.getElementById("languageScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.documentElement.lang = lang === "ko" ? "ko" : lang;
  applyStaticTranslations();
  await loadRealData();
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
  document.getElementById("userGroup").textContent = state.profile ? [state.profile.department, state.profile.group_name].filter(Boolean).join(" • ") || t("profileLoading") : t("profileLoading");
  document.getElementById("homeworkCount").textContent = t("homeworkCount");
  document.getElementById("announcementCount").textContent = state.announcements.length + (state.lang === "ru" ? " новых" : state.lang === "ko" ? "개" : " new");
  document.getElementById("homeworkCount").textContent = state.homework.length + (state.lang === "ru" ? " заданий" : state.lang === "ko" ? "개" : " tasks");
}


async function loadScheduleImage() {
  const container = document.getElementById("scheduleContent");
  if (!container) return;

  try {
    if (!tg?.initData) throw new Error("Telegram authorization missing");

    const response = await fetch(`${API_BASE}/api/schedule/image`, {
      headers: {
        "X-Telegram-Init-Data": tg.initData
      }
    });

    if (!response.ok) {
      throw new Error("Schedule image unavailable");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    container.innerHTML = `
      <img class="schedule-image" src="${url}" alt="UniUZ schedule">
    `;
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <p class="muted">${esc(
        state.lang === "ru" ? "Не удалось загрузить расписание." :
        state.lang === "ko" ? "시간표를 불러오지 못했습니다." :
        "Could not load the schedule."
      )}</p>
    `;
  }
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
        <div id="scheduleContent" class="item">
          <p class="muted">${esc(
            state.scheduleAvailable
              ? (state.lang === "ru" ? "Загрузка расписания..." :
                 state.lang === "ko" ? "시간표를 불러오는 중..." :
                 "Loading schedule...")
              : t("scheduleInfo")
          )}</p>
        </div>
      </section>
    `;

    if (state.scheduleAvailable) {
      loadScheduleImage();
    }

  } else if (page === "homework") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>📝 ${esc(t("homeworkTitle"))}</h2>
        ${state.homework.length ? state.homework.map(x => `
          <div class="item">
            <b>📚 ${esc(x.subject_name)}</b>
            <p>${esc(x.task_text)}</p>
            <span class="muted">📅 ${esc(x.homework_date)} · ⏰ ${esc(x.homework_time)}</span>
          </div>
        `).join("") : `<div class="item"><p class="muted">${esc(
          state.lang === "ru" ? "Заданий пока нет." :
          state.lang === "ko" ? "등록된 과제가 없습니다." :
          "No homework yet."
        )}</p></div>`}
      </section>
    `;

  } else if (page === "announcements") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>📢 ${esc(t("announcementsTitle"))}</h2>
        ${state.announcements.length ? state.announcements.map(x => `
          <div class="item">
            <b>📢 ${esc(x.title)}</b>
            <p>${esc(x.message)}</p>
            <span class="muted">${esc(x.created_at || "")}</span>
          </div>
        `).join("") : `<div class="item"><p class="muted">${esc(
          state.lang === "ru" ? "Объявлений пока нет." :
          state.lang === "ko" ? "등록된 공지사항이 없습니다." :
          "No announcements yet."
        )}</p></div>`}
      </section>
    `;

  } else if (page === "profile") {
    main.innerHTML = `
      <section class="page">
        <button class="back" data-page="home">${esc(t("back"))}</button>
        <h2>👤 ${esc(t("profileTitle"))}</h2>
        <div class="item">
          <b>${esc(
            state.profile?.full_name || getUserName()
          )}</b>
          <p class="muted">${
            state.profile
              ? esc([
                  state.profile.university,
                  state.profile.department,
                  state.profile.group_name
                ].filter(Boolean).join(" • ") || t("profileInfo"))
              : esc(t("profileInfo"))
          }</p>
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
        startApp(btn.dataset.langChange).then(() => renderPage("profile"));
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
  startApp(state.lang).catch(console.error);
} else {
  showLanguageScreen();
}

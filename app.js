const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const state = {
  user: tg?.initDataUnsafe?.user || null,
  page: "home"
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

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function setActive(page) {
  document.querySelectorAll(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.page === page));
}

function renderHome() {
  const u = state.user;
  const name = u ? [u.first_name, u.last_name].filter(Boolean).join(" ") : "UniUZ";
  document.getElementById("userName").textContent = name || "UniUZ";
  document.getElementById("welcome").textContent = "Добро пожаловать 👋";
  document.getElementById("avatar").textContent = (name || "U").charAt(0).toUpperCase();
  document.getElementById("userGroup").textContent = "Профиль будет загружен из базы UniUZ";
  document.getElementById("homeworkCount").textContent = "2 задания";
  document.getElementById("announcementCount").textContent = "2 новых";
}

function renderPage(page) {
  state.page = page;
  setActive(page);
  const main = document.getElementById("screen");

  if (page === "home") {
    main.innerHTML = `
      <section class="hero-card"><div class="eyebrow">СТУДЕНТ</div>
      <h1 id="userName">UniUZ</h1><p id="userGroup">Профиль</p></section>
      <section class="next-card"><div class="section-title">📅 Следующая пара</div>
      <div class="lesson-time">09:00</div><div class="lesson-name">Расписание подключится к базе</div>
      <div class="lesson-room">🏫 —</div></section>
      <div class="stats-grid">
        <button class="stat-card" data-page="schedule"><span>📅</span><b>Расписание</b><small>На сегодня</small></button>
        <button class="stat-card" data-page="homework"><span>📝</span><b>Задания</b><small>2 задания</small></button>
        <button class="stat-card" data-page="announcements"><span>📢</span><b>Объявления</b><small>2 новых</small></button>
        <button class="stat-card ai-card" data-page="ai"><span>🤖</span><b>AI Assistant</b><small>7 запросов/день</small></button>
      </div>
      <section class="quick-card"><div class="section-title">⚡ Быстрые действия</div>
      <div class="quick-actions"><button data-page="schedule">Сегодня</button><button data-page="homework">Дедлайны</button>
      <button data-page="announcements">Новости</button><button data-page="profile">Профиль</button></div></section>`;
    renderHome();
  } else if (page === "schedule") {
    main.innerHTML = `<section class="page"><button class="back" data-page="home">← Назад</button>
      <h2>📅 Расписание</h2><div class="item"><b>Сегодня</b><p class="muted">Реальное расписание подключим после получения данных университета.</p></div></section>`;
  } else if (page === "homework") {
    main.innerHTML = `<section class="page"><button class="back" data-page="home">← Назад</button><h2>📝 Задания</h2>
      ${demo.homework.map(x => `<div class="item"><b>📚 ${esc(x[0])}</b><p>${esc(x[1])}</p><span class="muted">⏰ ${esc(x[2])}</span></div>`).join("")}</section>`;
  } else if (page === "announcements") {
    main.innerHTML = `<section class="page"><button class="back" data-page="home">← Назад</button><h2>📢 Объявления</h2>
      ${demo.announcements.map(x => `<div class="item"><b>${esc(x[0])}</b><p>${esc(x[1])}</p></div>`).join("")}</section>`;
  } else if (page === "profile") {
    const u = state.user;
    const name = u ? [u.first_name, u.last_name].filter(Boolean).join(" ") : "Telegram User";
    main.innerHTML = `<section class="page"><button class="back" data-page="home">← Назад</button><h2>👤 Профиль</h2>
      <div class="item"><b>${esc(name)}</b><p class="muted">Данные профиля будут получены из UniUZ API.</p></div></section>`;
  } else if (page === "ai") {
    main.innerHTML = `<section class="page"><button class="back" data-page="home">← Назад</button>
      <h2>🤖 UniUZ AI</h2><div class="item"><p>AI Assistant подключим к существующему OpenAI API и лимиту 7 запросов в день.</p></div></section>
      <div class="ai-input"><input id="aiText" placeholder="Напишите вопрос..."><button id="aiSend">➤</button></div>`;
    document.getElementById("aiSend").onclick = () => {
      const input = document.getElementById("aiText");
      if (!input.value.trim()) return;
      if (tg) tg.showAlert("AI API будет подключён на следующем этапе.");
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

renderPage("home");

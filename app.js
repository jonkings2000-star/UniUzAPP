const API_URL = "https://uniuz-production.up.railway.app";

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

const initData = tg?.initData || "";

async function apiRequest(path) {
    const response = await fetch(`${API_URL}${path}`, {
        method: "GET",
        headers: {
            "X-Telegram-Init-Data": initData
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "API error");
    }

    return data;
}


// =========================
// HELPERS
// =========================

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


function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value ?? "";
    }
}


// =========================
// PROFILE
// =========================

async function loadProfile() {
    const data = await apiRequest("/api/me");

    console.log("UniUZ profile:", data);

    if (!data.ok) {
        throw new Error("Profile loading failed");
    }

    const telegramUser = data.telegram_user;
    const profile = data.profile;

    // Telegram name
    if (telegramUser) {
        const name =
            telegramUser.first_name ||
            telegramUser.username ||
            "Student";

        setText("#user-name", name);

        const avatar = document.querySelector("#user-avatar");

        if (avatar) {
            avatar.textContent =
                (name[0] || "U").toUpperCase();
        }
    }

    // Database profile
    if (profile) {
        setText(
            "#profile-name",
            profile.full_name || "UniUZ"
        );

        setText(
            "#profile-username",
            profile.username
                ? `@${profile.username}`
                : ""
        );

        setText(
            "#profile-university",
            profile.university || "Ajou University in Tashkent"
        );

        setText(
            "#profile-department",
            profile.department || "Department not selected"
        );

        setText(
            "#profile-group",
            profile.group_name || "Group not selected"
        );

        setText(
            "#department",
            profile.department || "—"
        );

        setText(
            "#group",
            profile.group_name || "—"
        );
    } else {
        setText(
            "#profile-name",
            telegramUser?.first_name || "Student"
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


// =========================
// HOMEWORK
// =========================

async function loadHomework() {
    const data = await apiRequest("/api/homework");

    console.log("UniUZ homework:", data);

    const container =
        document.querySelector("#homework-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!data.items || data.items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                📚 No homework
            </div>
        `;

        setText("#homework-count", "0");
        return;
    }

    setText(
        "#homework-count",
        String(data.items.length)
    );

    data.items.forEach(item => {
        const card = document.createElement("div");

        card.className = "homework-card";

        card.innerHTML = `
            <div class="homework-title">
                📚 ${escapeHtml(item.subject_name)}
            </div>

            <div class="homework-task">
                ${escapeHtml(item.task_text)}
            </div>

            <div class="homework-date">
                📅 ${escapeHtml(item.homework_date)}
                &nbsp;
                ⏰ ${escapeHtml(item.homework_time)}
            </div>
        `;

        container.appendChild(card);
    });
}


// =========================
// ANNOUNCEMENTS
// =========================

async function loadAnnouncements() {
    const data = await apiRequest("/api/announcements");

    console.log("UniUZ announcements:", data);

    const container =
        document.querySelector("#announcement-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!data.items || data.items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                📢 No announcements
            </div>
        `;

        setText("#announcement-count", "0");
        return;
    }

    setText(
        "#announcement-count",
        String(data.items.length)
    );

    data.items.forEach(item => {
        const card = document.createElement("div");

        card.className = "announcement-card";

        card.innerHTML = `
            <div class="announcement-title">
                📢 ${escapeHtml(item.title)}
            </div>

            <div class="announcement-message">
                ${escapeHtml(item.message)}
            </div>
        `;

        container.appendChild(card);
    });
}


// =========================
// API TEST
// =========================

async function checkApi() {
    try {
        const response = await fetch(
            `${API_URL}/api/health`
        );

        const data = await response.json();

        console.log("UniUZ API:", data);

        return data.ok === true;

    } catch (error) {
        console.error(
            "UniUZ API unavailable:",
            error
        );

        return false;
    }
}


// =========================
// LOADING
// =========================

function showLoading() {
    const loading =
        document.querySelector("#loading");

    if (loading) {
        loading.style.display = "flex";
    }
}


function hideLoading() {
    const loading =
        document.querySelector("#loading");

    if (loading) {
        loading.style.display = "none";
    }
}


// =========================
// ERROR
// =========================

function showError(message) {
    console.error(message);

    const errorElement =
        document.querySelector("#error");

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
}


// =========================
// INITIALIZE
// =========================

async function initializeUniUZ() {
    showLoading();

    try {
        if (!tg) {
            console.warn(
                "Telegram WebApp object not found."
            );
        }

        const apiOnline = await checkApi();

        if (!apiOnline) {
            throw new Error(
                "UniUZ API is unavailable."
            );
        }

        if (!initData) {
            console.warn(
                "Telegram initData is empty."
            );

            // Application can still open in browser,
            // but real Telegram user authentication
            // requires opening the app from Telegram.
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
            "⚠️ Не удалось загрузить данные UniUZ."
        );

    } finally {
        hideLoading();
    }
}


// =========================
// REFRESH
// =========================

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


// =========================
// START
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeUniUZ();
    }
);


// Telegram Main Button
if (tg) {
    tg.MainButton.setText("Обновить");

    tg.MainButton.onClick(
        refreshUniUZ
    );
}

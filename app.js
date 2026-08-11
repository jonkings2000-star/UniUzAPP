const API_URL = "https://uniuz-production.up.railway.app";
const tg = window.Telegram?.WebApp || null;
if (tg) { try { tg.ready(); tg.expand(); } catch (_) {} }
const initData = tg?.initData || "";

const I18N = {
  ru: {
    chooseLanguage:"Выберите язык", next:"Далее", save:"Сохранить", back:"Назад", cancel:"Отмена", loading:"Загрузка…",
    university:"Университет", faculty:"Факультет", group:"Группа", fullName:"Имя и фамилия", groupPlaceholder:"Например, AI-101", namePlaceholder:"Например, Иван Иванов",
    home:"Главная", schedule:"Расписание", homework:"Мои домашние задания", ai:"ИИ", reminders:"Напоминания", profile:"Профиль", admin:"Админ-панель",
    welcome:"Добро пожаловать в UniUZ", setupTitle:"Настроим ваш профиль", setupText:"Выберите университет, факультет, введите группу и имя.",
    uploadSchedule:"Загрузить расписание", scheduleHint:"Фото или PDF — ИИ распознает его и сохранит пары.", noSchedule:"Расписание ещё не загружено.",
    addHomework:"Добавить ДЗ", title:"Название", description:"Описание", due:"Дата и время сдачи", noHomework:"Домашних заданий пока нет.", done:"Выполнено", delete:"Удалить",
    reminderTitle:"Напоминания", reminderText:"Получайте сообщения о ближайших парах и дедлайнах ДЗ в Telegram.", enabled:"Включены", disabled:"Выключены",
    aiTitle:"ИИ-помощник", aiHint:"Можно спросить о парах, домашнем задании или расписании.", send:"Отправить", aiLimit:"Лимит сегодня", unlimited:"Безлимит", remaining:"Осталось",
    profileTitle:"Профиль", change:"Изменить", editProfile:"Изменить профиль", adminStats:"Статистика", users:"Пользователи", unlimitedAI:"Безлимитный ИИ", addAdmin:"Добавить администратора", telegramId:"Telegram ID", grant:"Выдать", revoke:"Забрать", noUsers:"Пользователи не найдены",
    error:"Ошибка", saved:"Сохранено", scheduleSaved:"Расписание распознано", homeworkSaved:"ДЗ добавлено", confirmDelete:"Удалить это ДЗ?", profileRequired:"Сначала заполните профиль.", aiUnavailable:"ИИ временно недоступен.", limitReached:"Лимит 10 запросов на сегодня исчерпан.", adminOnly:"Доступ только для администратора."
  },
  en: {
    chooseLanguage:"Choose language", next:"Next", save:"Save", back:"Back", cancel:"Cancel", loading:"Loading…",
    university:"University", faculty:"Faculty", group:"Group", fullName:"First and last name", groupPlaceholder:"For example, AI-101", namePlaceholder:"For example, John Smith",
    home:"Home", schedule:"Schedule", homework:"My homework", ai:"AI", reminders:"Reminders", profile:"Profile", admin:"Admin panel",
    welcome:"Welcome to UniUZ", setupTitle:"Let's set up your profile", setupText:"Choose your university and faculty, then enter your group and name.",
    uploadSchedule:"Upload schedule", scheduleHint:"Photo or PDF — AI will read it and save your classes.", noSchedule:"No schedule uploaded yet.",
    addHomework:"Add homework", title:"Title", description:"Description", due:"Due date and time", noHomework:"No homework yet.", done:"Completed", delete:"Delete",
    reminderTitle:"Reminders", reminderText:"Get Telegram reminders about upcoming classes and homework deadlines.", enabled:"Enabled", disabled:"Disabled",
    aiTitle:"AI assistant", aiHint:"Ask about your classes, homework or schedule.", send:"Send", aiLimit:"Today's limit", unlimited:"Unlimited", remaining:"remaining",
    profileTitle:"Profile", change:"Change", editProfile:"Edit profile", adminStats:"Statistics", users:"Users", unlimitedAI:"Unlimited AI", addAdmin:"Add administrator", telegramId:"Telegram ID", grant:"Grant", revoke:"Revoke", noUsers:"No users found",
    error:"Error", saved:"Saved", scheduleSaved:"Schedule recognized", homeworkSaved:"Homework added", confirmDelete:"Delete this homework?", profileRequired:"Please complete your profile first.", aiUnavailable:"AI is temporarily unavailable.", limitReached:"Today's 10-request limit has been reached.", adminOnly:"Admin access only."
  }
};

let lang = "ru";
let me = null;
let setupData = null;
let page = "home";
let aiMessages = [];
let aiUsage = null;

const t = k => (I18N[lang] || I18N.ru)[k] || k;
const app = () => document.getElementById("app");

function toast(text){ const el=document.createElement("div"); el.className="toast"; el.textContent=text; document.body.appendChild(el); setTimeout(()=>el.remove(),2600); }
function esc(s){ return String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }
function headers(json=true){ const h={"X-Telegram-Init-Data":initData}; if(json) h["Content-Type"]="application/json"; return h; }
async function api(path, opts={}){
  const res=await fetch(API_URL+path,{...opts,headers:{...headers(!(opts.body instanceof FormData)),...(opts.headers||{})}});
  let data={}; try{data=await res.json()}catch(_){ }
  if(!res.ok) throw new Error(data.error||`API ${res.status}`);
  return data;
}

async function boot(){
  if(!initData){ renderMessage("Откройте UniUZ через Telegram Mini App."); return; }
  try{
    const data=await api("/api/me");
    me=data.user; aiUsage=data.ai; window.__isAdmin=!!data.is_admin;
    lang=me.language||"ru";
    if(!me.university || !me.department || !me.group_name || !me.full_name){
      await loadSetup(); renderLanguage();
    } else renderApp();
  }catch(e){ renderMessage(e.message); }
}
async function loadSetup(){ setupData=await api("/api/setup"); }
function renderMessage(text){ app().innerHTML=`<div class="setup"><div class="setup-card"><div class="brand"><div class="brand-icon">🎓</div><div><h1>UniUZ</h1><small>Student assistant</small></div></div><p>${esc(text)}</p></div></div>`; }

function renderLanguage(){
  app().innerHTML=`<div class="setup"><div class="setup-card">
    <div class="brand"><div class="brand-icon">🎓</div><div><h1>UniUZ</h1><small>Student assistant</small></div></div>
    <h2>${t("chooseLanguage")}</h2><div class="lang-grid"><button class="lang-btn" data-lang="ru">🇷🇺 Русский</button><button class="lang-btn" data-lang="en">🇬🇧 English</button></div>
  </div></div>`;
  document.querySelectorAll(".lang-btn").forEach(b=>b.onclick=async()=>{lang=b.dataset.lang; try{await api("/api/language",{method:"POST",body:JSON.stringify({language:lang})});}catch(_){} renderUniversity();});
}
function setupHeader(step,title){return `<div class="brand"><div class="brand-icon">🎓</div><div><h1>UniUZ</h1><small>${step}/4</small></div></div><h2>${title}</h2>`;}
function renderUniversity(){
  app().innerHTML=`<div class="setup"><div class="setup-card">${setupHeader(1,t("university"))}<p>${t("setupText")}</p>${setupData.universities.map(u=>`<button class="btn secondary uni" data-id="${u.id}">${esc(u.name)}<br><small>${esc(u.full_name)}</small></button>`).join("")}</div></div>`;
  document.querySelectorAll(".uni").forEach(b=>b.onclick=()=>{me._university=b.dataset.id;renderFaculty();});
}
function renderFaculty(){
  app().innerHTML=`<div class="setup"><div class="setup-card">${setupHeader(2,t("faculty"))}<select id="faculty" class="select"><option value="">${esc(t("faculty"))}</option>${setupData.faculties.map(x=>`<option>${esc(x)}</option>`).join("")}</select><button class="btn" id="next">${t("next")}</button></div></div>`;
  document.getElementById("next").onclick=()=>{const v=document.getElementById("faculty").value;if(!v)return toast(t("faculty"));me._department=v;renderGroup();};
}
function renderGroup(){
  app().innerHTML=`<div class="setup"><div class="setup-card">${setupHeader(3,t("group"))}<input id="group" class="input" placeholder="${esc(t("groupPlaceholder"))}"><button class="btn" id="next">${t("next")}</button></div></div>`;
  document.getElementById("next").onclick=()=>{const v=document.getElementById("group").value.trim();if(!v)return toast(t("group"));me._group=v;renderName();};
}
function renderName(){
  app().innerHTML=`<div class="setup"><div class="setup-card">${setupHeader(4,t("fullName"))}<input id="name" class="input" placeholder="${esc(t("namePlaceholder"))}"><button class="btn" id="save">${t("save")}</button></div></div>`;
  document.getElementById("save").onclick=async()=>{const name=document.getElementById("name").value.trim();if(name.split(/\s+/).length<2)return toast(t("fullName"));try{const d=await api("/api/profile",{method:"POST",body:JSON.stringify({university:me._university,department:me._department,group_name:me._group,full_name:name,language:lang})});me=d.user;renderApp();toast(t("saved"));}catch(e){toast(e.message)}};
}

function renderApp(){
  app().innerHTML=`<div class="container" id="screen"></div><div class="bottom"><div class="bottom-inner"><button class="nav" data-page="home"><div>🏠</div>${t("home")}</button><button class="nav" data-page="schedule"><div>🗓️</div>${t("schedule")}</button><button class="nav" data-page="homework"><div>📝</div>${t("homework")}</button><button class="nav" data-page="ai"><div>🤖</div>${t("ai")}</button><button class="nav" data-page="profile"><div>👤</div>${t("profile")}</button></div></div>`;
  document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>openPage(b.dataset.page)); openPage(page);
}
function top(title,sub=""){return `<div class="topbar"><button class="back" onclick="openPage('home')">← ${t("home")}</button><span class="badge">${esc(title)}</span></div>${sub?`<p class="muted">${esc(sub)}</p>`:""}`}
function navActive(p){document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));}
async function openPage(p){page=p;navActive(p);const s=document.getElementById("screen"); if(!s)return; if(p==="home")return renderHome(); if(p==="schedule")return renderSchedule(s); if(p==="homework")return renderHomework(s); if(p==="ai")return renderAI(s); if(p==="profile")return renderProfile(s);}
function renderHome(){const s=document.getElementById("screen");const admin=me?.id && window.__isAdmin; s.innerHTML=`<div class="brand"><div class="brand-icon">🎓</div><div><h1>UniUZ</h1><small>${esc(me.full_name||"")}</small></div></div><div class="card hero"><h2>${t("welcome")}</h2><p>${esc(me.university||"")} · ${esc(me.department||"")} · ${esc(me.group_name||"")}</p></div><div class="grid"><button class="tile" data-go="schedule"><div class="ico">🗓️</div><b>${t("schedule")}</b><span>${t("uploadSchedule")}</span></button><button class="tile" data-go="homework"><div class="ico">📝</div><b>${t("homework")}</b><span>${t("addHomework")}</span></button><button class="tile" data-go="ai"><div class="ico">🤖</div><b>${t("ai")}</b><span>${aiUsage?.unlimited?t("unlimited"):`${t("remaining")}: ${aiUsage?.remaining??10}`}</span></button><button class="tile" data-go="reminders"><div class="ico">🔔</div><b>${t("reminders")}</b><span>${me.reminders_enabled?t("enabled"):t("disabled")}</span></button>${admin?`<button class="tile" data-go="admin"><div class="ico">🔐</div><b>${t("admin")}</b><span>${t("adminStats")}</span></button>`:""}</div>`;s.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>b.dataset.go==="reminders"?renderReminders():b.dataset.go==="admin"?renderAdmin():openPage(b.dataset.go));}

async function renderSchedule(s){s.innerHTML=top(t("schedule"))+`<div class="card"><p class="muted">${t("scheduleHint")}</p><input id="scheduleFile" type="file" accept="image/*,.pdf" class="input"><button class="btn" id="upload">${t("uploadSchedule")}</button></div><div id="scheduleList"><div class="empty">${t("loading")}</div></div>`;document.getElementById("upload").onclick=async()=>{const f=document.getElementById("scheduleFile").files[0];if(!f)return toast(t("uploadSchedule"));const fd=new FormData();fd.append("file",f);try{document.getElementById("upload").disabled=true;await api("/api/schedule/upload",{method:"POST",body:fd});toast(t("scheduleSaved"));await renderSchedule(s);}catch(e){toast(e.message)}finally{document.getElementById("upload").disabled=false}};try{const d=await api("/api/schedule");const list=document.getElementById("scheduleList");if(!d.items.length){list.innerHTML=`<div class="empty">${t("noSchedule")}</div>`;return;}const days={1:"Monday",2:"Tuesday",3:"Wednesday",4:"Thursday",5:"Friday",6:"Saturday",7:"Sunday"};list.innerHTML=[1,2,3,4,5,6,7].map(day=>{const items=d.items.filter(x=>x.day_of_week===day);if(!items.length)return"";return `<div class="day"><div class="day-title">${days[day]}</div>${items.map(x=>`<div class="item"><div class="item-head"><h3>${esc(x.subject)}</h3><b>${esc(x.start_time)}${x.end_time?`–${esc(x.end_time)}`:""}</b></div><p>${esc(x.room||"")}${x.teacher?` · ${esc(x.teacher)}`:""}</p></div>`).join("")}</div>`}).join("");}catch(e){document.getElementById("scheduleList").innerHTML=`<div class="empty">${esc(e.message)}</div>`;}}

async function renderHomework(s){s.innerHTML=top(t("homework"))+`<div class="card"><h3>${t("addHomework")}</h3><input id="hwTitle" class="input" placeholder="${esc(t("title"))}"><textarea id="hwDesc" class="textarea" placeholder="${esc(t("description"))}"></textarea><label class="label">${t("due")}</label><input id="hwDue" type="datetime-local" class="input"><input id="hwFile" type="file" class="input"><button class="btn" id="addHw">${t("addHomework")}</button></div><div id="hwList"><div class="empty">${t("loading")}</div></div>`;document.getElementById("addHw").onclick=async()=>{const fd=new FormData();fd.append("title",document.getElementById("hwTitle").value.trim());fd.append("description",document.getElementById("hwDesc").value.trim());fd.append("due_at",document.getElementById("hwDue").value);const f=document.getElementById("hwFile").files[0];if(f)fd.append("file",f);try{await api("/api/homework",{method:"POST",body:fd});toast(t("homeworkSaved"));await renderHomework(s);}catch(e){toast(e.message)}};try{const d=await api("/api/homework");const list=document.getElementById("hwList");if(!d.items.length){list.innerHTML=`<div class="empty">${t("noHomework")}</div>`;return;}list.innerHTML=d.items.map(x=>`<div class="item"><div class="item-head"><div><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p></div><button class="back" data-del="${x.id}">✕</button></div><small>⏰ ${esc(x.due_at)}</small><button class="btn success" data-done="${x.id}">${t("done")}</button></div>`).join("");list.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(!confirm(t("confirmDelete")))return;await api(`/api/homework/${b.dataset.del}`,{method:"DELETE"});renderHomework(s)});list.querySelectorAll("[data-done]").forEach(b=>b.onclick=async()=>{await api(`/api/homework/${b.dataset.done}`,{method:"PATCH",body:JSON.stringify({completed:true})});renderHomework(s)});}catch(e){document.getElementById("hwList").innerHTML=`<div class="empty">${esc(e.message)}</div>`;}}

async function renderAI(s){try{aiUsage=await api("/api/ai/usage")}catch(_){}s.innerHTML=top(t("aiTitle"))+`<div class="card"><p class="muted">${t("aiHint")}</p><span class="badge ${aiUsage?.unlimited?'ok':'warn'}">${aiUsage?.unlimited?t("unlimited"):`${t("aiLimit")}: ${aiUsage?.used??0}/10`}</span></div><div class="card"><div class="chat" id="chat">${aiMessages.length?aiMessages.map(m=>`<div class="msg ${m.role}">${esc(m.text)}</div>`).join(""): `<div class="empty">${t("aiHint")}</div>`}</div><div class="chat-row"><input id="aiInput" class="input" placeholder="…"><button id="sendAI" class="send">➤</button></div></div>`;const send=async()=>{const input=document.getElementById("aiInput");const text=input.value.trim();if(!text)return;aiMessages.push({role:"user",text});renderAI(s);try{const d=await api("/api/ai",{method:"POST",body:JSON.stringify({message:text})});aiMessages.push({role:"ai",text:d.answer});aiUsage=d.usage;renderAI(s);}catch(e){aiMessages.push({role:"ai",text:e.message.includes("limit")?t("limitReached"):t("aiUnavailable")});renderAI(s)}};document.getElementById("sendAI").onclick=send;document.getElementById("aiInput").onkeydown=e=>{if(e.key==="Enter")send()};}

async function renderReminders(){const s=document.getElementById("screen");s.innerHTML=top(t("reminders"))+`<div class="card"><div class="toggle"><div><b>${t("reminderTitle")}</b><p class="muted">${t("reminderText")}</p></div><button id="toggle" class="switch ${me.reminders_enabled?'on':''}"><i></i></button></div></div>`;document.getElementById("toggle").onclick=async()=>{const enabled=!me.reminders_enabled;await api("/api/reminders",{method:"POST",body:JSON.stringify({enabled})});me.reminders_enabled=enabled;renderReminders();}}

async function renderProfile(s){s.innerHTML=top(t("profileTitle"))+`<div class="card"><label class="label">${t("university")}</label><input class="input" value="${esc(me.university)}" disabled><label class="label">${t("faculty")}</label><input class="input" value="${esc(me.department)}" disabled><label class="label">${t("group")}</label><input class="input" value="${esc(me.group_name)}" disabled><label class="label">${t("fullName")}</label><input class="input" value="${esc(me.full_name)}" disabled><button class="btn" id="edit">${t("change")}</button>${window.__isAdmin?`<button class="btn secondary" id="adminBtn">🔐 ${t("admin")}</button>`:""}</div>`;document.getElementById("edit").onclick=()=>renderEditProfile(s);document.getElementById("adminBtn")?.addEventListener("click",renderAdmin)}
function renderEditProfile(s){s.innerHTML=top(t("editProfile"))+`<div class="card"><label class="label">${t("university")}</label><select id="uni" class="select">${setupData.universities.map(u=>`<option value="${u.id}" ${u.id===me.university?'selected':''}>${esc(u.name)}</option>`).join("")}</select><label class="label">${t("faculty")}</label><select id="fac" class="select">${setupData.faculties.map(f=>`<option ${f===me.department?'selected':''}>${esc(f)}</option>`).join("")}</select><label class="label">${t("group")}</label><input id="grp" class="input" value="${esc(me.group_name)}"><label class="label">${t("fullName")}</label><input id="nm" class="input" value="${esc(me.full_name)}"><button class="btn" id="save">${t("save")}</button></div>`;document.getElementById("save").onclick=async()=>{try{const d=await api("/api/profile",{method:"POST",body:JSON.stringify({university:document.getElementById("uni").value,department:document.getElementById("fac").value,group_name:document.getElementById("grp").value,full_name:document.getElementById("nm").value,language:lang})});me=d.user;renderProfile(s);toast(t("saved"))}catch(e){toast(e.message)}}}

async function renderAdmin(){
  const s=document.getElementById("screen");
  s.innerHTML=top(t("admin"))+`<div id="adminContent"><div class="empty">${t("loading")}</div></div>`;
  try{
    const [stats,users,admins]=await Promise.all([
      api("/api/admin/stats"),
      api("/api/admin/users"),
      api("/api/admin/admins")
    ]);
    const statsHtml=Object.entries(stats).map(([k,v])=>`<div class="stat"><strong>${v}</strong><span>${esc(k)}</span></div>`).join("");
    const usersHtml=users.items.length?users.items.map(u=>`<div class="item"><div class="item-head"><div><h3>${esc(u.full_name||u.username||u.id)}</h3><small>${u.id} · ${esc(u.group_name||"")}</small></div><button class="btn secondary" style="width:auto;margin:0" data-ai="${u.id}" data-enabled="${u.ai_unlimited?0:1}">${u.ai_unlimited?t("revoke"):t("grant")}</button></div></div>`).join(""):`<div class="empty">${t("noUsers")}</div>`;
    const adminsHtml=admins.items.map(a=>`<div class="item"><div>${a.telegram_id}</div></div>`).join("");
    document.getElementById("adminContent").innerHTML=`<div class="stats">${statsHtml}</div><div class="section-title"><h2>${t("users")}</h2></div><div class="card">${usersHtml}</div><div class="card"><h3>${t("addAdmin")}</h3><input id="adminId" class="input" placeholder="${t("telegramId")}"><button class="btn" id="addAdmin">${t("addAdmin")}</button><h3 style="margin-top:20px">Admins</h3>${adminsHtml}</div>`;
    document.querySelectorAll("[data-ai]").forEach(b=>b.onclick=async()=>{
      try{
        await api(`/api/admin/users/${b.dataset.ai}/unlimited-ai`,{method:"POST",body:JSON.stringify({enabled:b.dataset.enabled==="1"})});
        renderAdmin();
      }catch(e){toast(e.message)}
    });
    document.getElementById("addAdmin").onclick=async()=>{
      const id=Number(document.getElementById("adminId").value);
      if(!id)return;
      try{await api("/api/admin/admins",{method:"POST",body:JSON.stringify({telegram_id:id})});renderAdmin();}catch(e){toast(e.message)}
    };
  }catch(e){
    document.getElementById("adminContent").innerHTML=`<div class="card"><b>${t("error")}</b><p class="muted">${esc(e.message)}</p></div>`;
  }
}

// Load setup for profile editing after a completed profile.
(async()=>{try{const d=await api("/api/setup");setupData=d;}catch(_){}})();
window.openPage=openPage;
boot();

const tg=window.Telegram?.WebApp||null;
if(tg){try{tg.ready();tg.expand();}catch(e){}}
const API="/api";
const app=document.getElementById("app");
let profile=null, lang="ru";

const T={
ru:{
chooseLanguage:"Выберите язык",university:"Выберите университет",faculty:"Выберите факультет",
group:"Введите вашу группу",name:"Имя и фамилия",continue:"Продолжить",home:"Главная",
schedule:"Расписание",homework:"Мои домашние задания",ai:"ИИ",reminders:"Напоминания",
profile:"Профиль",save:"Сохранить",upload:"Загрузить расписание",add:"Добавить",
enabled:"Напоминания включены",disabled:"Напоминания выключены",logout:"Сменить профиль",
admin:"Админ-панель",stats:"Статистика",users:"Пользователи",unlimited:"Безлимитный ИИ",
question:"Напишите вопрос...",send:"Отправить",title:"Название",description:"Описание",
due:"Дата и время сдачи",done:"Выполнено",delete:"Удалить",noData:"Пока ничего нет",
back:"Назад",language:"Язык",facultyPlaceholder:"Например: AI Software"
},
en:{
chooseLanguage:"Choose language",university:"Choose university",faculty:"Choose faculty",
group:"Enter your group",name:"First and last name",continue:"Continue",home:"Home",
schedule:"Schedule",homework:"My homework",ai:"AI",reminders:"Reminders",profile:"Profile",
save:"Save",upload:"Upload schedule",add:"Add",enabled:"Reminders enabled",disabled:"Reminders disabled",
logout:"Change profile",admin:"Admin panel",stats:"Statistics",users:"Users",unlimited:"Unlimited AI",
question:"Write a question...",send:"Send",title:"Title",description:"Description",
due:"Due date and time",done:"Completed",delete:"Delete",noData:"Nothing yet",back:"Back",
language:"Language",facultyPlaceholder:"For example: AI Software"
}};
const tr=k=>T[lang][k]||T.ru[k]||k;

async function api(path,opts={}){
 const headers={"X-Telegram-Init-Data":tg?.initData||""};
 if(opts.body && !(opts.body instanceof FormData)) {headers["Content-Type"]="application/json";opts.body=JSON.stringify(opts.body)}
 const r=await fetch(API+path,{...opts,headers});
 let d={};try{d=await r.json()}catch{}
 if(!r.ok) throw new Error(d.error||`API ${r.status}`);
 return d;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function toast(m){const x=document.createElement("div");x.className="toast";x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
function layout(content,active="home"){app.innerHTML=`<div class="wrap">${content}</div><div class="nav">
<button class="${active==="home"?"active":""}" onclick="home()">🏠<br>${tr("home")}</button>
<button class="${active==="schedule"?"active":""}" onclick="showSchedule()">🗓️<br>${tr("schedule")}</button>
<button class="${active==="homework"?"active":""}" onclick="showHomework()">📝<br>${tr("homework")}</button>
<button class="${active==="ai"?"active":""}" onclick="showAI()">🤖<br>${tr("ai")}</button>
</div>`}
function brand(){return `<div class="brand"><div class="logo">🎓</div><h1>UniUZ</h1><div class="muted">${profile?.university||""}</div></div>`}

async function start(){
 try{const d=await api("/me");profile={...d.profile,is_admin:d.is_admin};lang=profile.language||"ru";if(profile.university&&profile.department&&profile.group_name&&profile.first_name) return home()}
 catch(e){}
 chooseLanguage();
}
function chooseLanguage(){app.innerHTML=`<div class="wrap"><div class="brand"><div class="logo">🎓</div><h1>UniUZ</h1></div><div class="card"><h2>${tr("chooseLanguage")}</h2><div class="lang">
<button class="btn" onclick="setLang('ru')">🇷🇺 Русский</button><button class="btn" onclick="setLang('en')">🇬🇧 English</button>
</div></div></div>`}
async function setLang(x){
 lang=x;
 if(profile){
  try{const d=await api("/profile",{method:"PUT",body:{language:x}});profile=d.profile}catch(e){}
 }
 chooseUniversity();
}
function chooseUniversity(){app.innerHTML=`<div class="wrap">${brand()}<div class="card"><h2>${tr("university")}</h2><button class="btn primary" onclick="chooseFaculty('Ajou University in Tashkent')">🎓 Ajou University in Tashkent</button></div></div>`}
function chooseFaculty(uni){
 const faculties=[
  ["Architecture","🏛️"],["Interior Design","🏠"],["Business Administration","📊"],
  ["IT Business","💼"],["AI Software","🤖"],["Software","💻"],
  ["Civil Systems Engineering","🏗️"],["Electrical and Computer Engineering","⚡"],
  ["English Philology & Management","🇬🇧"],["Korean Philology & Management","🇰🇷"]
 ];
 app.innerHTML=`<div class="wrap">${brand()}<div class="card"><h2>${tr("faculty")}</h2><div class="lang">
 ${faculties.map(([name,icon])=>`<button class="btn" onclick="chooseGroup('${esc(uni)}','${esc(name)}')">${icon} ${esc(name)}</button>`).join("")}
 </div></div></div>`;
}
function chooseGroup(uni,fac){app.innerHTML=`<div class="wrap">${brand()}<div class="card"><h2>${tr("group")}</h2><input id="grp" class="input" placeholder="AI-101"><button class="btn primary" onclick="chooseName('${esc(uni)}','${esc(fac)}')">${tr("continue")}</button></div></div>`}
function chooseName(uni,fac){const g=document.getElementById("grp").value.trim();if(!g)return toast(tr("group"));app.innerHTML=`<div class="wrap">${brand()}<div class="card"><h2>${tr("name")}</h2><input id="nm" class="input" placeholder="Jakhongir Karimov"><button class="btn primary" onclick="finishSetup('${esc(uni)}','${esc(fac)}','${esc(g)}')">${tr("save")}</button></div></div>`}
async function finishSetup(uni,fac,g){const n=document.getElementById("nm").value.trim();if(!n)return toast(tr("name"));const parts=n.split(/\s+/);try{const d=await api("/setup",{method:"POST",body:{language:lang,university:uni,department:fac,group_name:g,first_name:parts[0],last_name:parts.slice(1).join(" ")}});profile={...d.profile};try{const m=await api("/me");profile={...m.profile,is_admin:m.is_admin}}catch(e){}home()}catch(e){toast(e.message)}}

function home(){layout(`${brand()}
<div class="hero">
 <div class="hero-row">
  <div>
   <div class="hello">Добрый день 👋</div>
   <h1>${esc(profile?.first_name||"Student")}</h1>
   <p class="muted">${esc(profile?.department||"")} · ${esc(profile?.group_name||"")}</p>
  </div>
  <div class="avatar">🎓</div>
 </div>
</div>

<div class="card dashboard-card">
 <div class="section-title">🗓️ Сегодня</div>
 <div class="empty">Здесь будут ваши ближайшие пары</div>
</div>

<div class="card dashboard-card">
 <div class="section-title">📝 Ближайшие задания</div>
 <div class="empty">Нет срочных дедлайнов</div>
</div>

<div class="ai-card">
 <div class="ai-title">🤖 UniUZ AI</div>
 <p>Ваш персональный помощник</p>
 <button class="btn primary" onclick="showAI()">Спросить ИИ →</button>
</div>

<div class="grid">
<button class="btn" onclick="showSchedule()">🗓️ ${tr("schedule")}</button>
<button class="btn" onclick="showHomework()">📝 ${tr("homework")}</button>
<button class="btn" onclick="showReminders()">🔔 ${tr("reminders")}</button>
<button class="btn" onclick="showProfile()">👤 ${tr("profile")}</button>
${profile?.is_admin?`<button class="btn" onclick="showAdmin()">🔐 ${tr("admin")}</button>`:""}
</div>`)}
async function showSchedule(){try{const d=await api("/schedule");const names=lang==="ru"?["Пн","Вт","Ср","Чт","Пт","Сб","Вс"]:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];layout(`${brand()}<div class="card"><div class="row"><h2>🗓️ ${tr("schedule")}</h2><label class="btn">📎 ${tr("upload")}<input id="sf" type="file" accept=".pdf,image/*" hidden></label></div><div id="sl">${d.items.length?d.items.map(x=>`<div class="list-item"><b>${names[x.day_of_week]} ${esc(x.start_time)} — ${esc(x.subject)}</b><div class="muted small">${esc(x.room||"")}</div></div>`).join(""):`<div class="empty">${tr("noData")}</div>`}</div></div>`,"schedule");document.getElementById("sf").onchange=uploadSchedule}catch(e){toast(e.message)}}
async function uploadSchedule(e){const f=e.target.files[0];if(!f)return;const fd=new FormData();fd.append("file",f);try{await api("/schedule/upload",{method:"POST",body:fd});showSchedule()}catch(e){toast(e.message)}}
async function showHomework(){try{const d=await api("/homework");layout(`${brand()}<div class="card"><h2>📝 ${tr("homework")}</h2><input id="ht" class="input" placeholder="${tr("title")}"><textarea id="hd" placeholder="${tr("description")}"></textarea><input id="hdate" class="input" type="datetime-local"><input id="hfile" class="input" type="file" accept=".pdf,image/*,.doc,.docx"><button class="btn primary" onclick="addHW()">${tr("add")}</button></div><div class="card">${d.items.length?d.items.map(x=>`<div class="list-item" style="${x.completed?"border:1px solid #3ccf7a;background:#10291d;border-radius:14px;padding:14px":""}"><div class="row"><b>${x.completed?"✅ ":""}${esc(x.title)}</b><span class="badge">${esc(x.due_at)}</span></div><p class="muted">${esc(x.description||"")}</p><div class="row"><button class="btn" onclick="toggleHW(${x.id},${x.completed?0:1})">${x.completed?"↩️ "+tr("done"):"✅ "+tr("done")}</button><button class="btn danger" onclick="deleteHW(${x.id})">${tr("delete")}</button></div></div>`).join(""):`<div class="empty">${tr("noData")}</div>`}</div>`,"homework")}catch(e){toast(e.message)}}
async function addHW(){
 const title=document.getElementById("ht").value.trim(),description=document.getElementById("hd").value.trim(),due=document.getElementById("hdate").value,file=document.getElementById("hfile").files[0];
 if(!title||!due)return;
 try{
  if(file){
   const fd=new FormData();fd.append("title",title);fd.append("description",description);fd.append("due_at",new Date(due).toISOString());fd.append("file",file);
   await api("/homework/upload",{method:"POST",body:fd});
  }else{
   await api("/homework",{method:"POST",body:{title,description,due_at:new Date(due).toISOString()}});
  }
  showHomework();
 }catch(e){toast(e.message)}
}
async function toggleHW(id,completed){try{await api(`/homework/${id}/complete`,{method:"POST",body:{completed:!!completed}});showHomework()}catch(e){toast(e.message)}}
async function deleteHW(id){try{await api(`/homework/${id}`,{method:"DELETE"});showHomework()}catch(e){toast(e.message)}}

function showAI(){layout(`${brand()}<div class="card"><h2>🤖 ${tr("ai")}</h2><div id="chat"></div><textarea id="q" class="input" placeholder="${tr("question")}"></textarea><button class="btn primary" onclick="askAI()">${tr("send")}</button></div>`,"ai")}
async function askAI(){const q=document.getElementById("q").value.trim();if(!q)return;try{const d=await api("/ai",{method:"POST",body:{message:q}});document.getElementById("chat").innerHTML+=`<div class="list-item"><b>${esc(q)}</b><p>${esc(d.answer)}</p><span class="badge">${d.limit===null?"∞":`${d.used}/10`}</span></div>`;document.getElementById("q").value=""}catch(e){toast(e.message)}}

async function showReminders(){try{const d=await api("/reminders");layout(`${brand()}<div class="card"><h2>🔔 ${tr("reminders")}</h2><p>${d.enabled?tr("enabled"):tr("disabled")}</p><button class="btn primary" onclick="toggleReminders(${!d.enabled})">${d.enabled?tr("disabled"):tr("enabled")}</button></div>`)}catch(e){toast(e.message)}}
async function toggleReminders(enabled){try{await api("/reminders",{method:"POST",body:{enabled}});showReminders()}catch(e){toast(e.message)}}

function showProfile(){layout(`${brand()}<div class="card"><h2>👤 ${tr("profile")}</h2><p><b>${esc(profile.first_name)} ${esc(profile.last_name)}</b></p><p>${esc(profile.university)}</p><p>${esc(profile.department)}</p><p>${esc(profile.group_name)}</p><button class="btn" onclick="chooseLanguage()">${tr("language")}</button><button class="btn danger" onclick="chooseUniversity()">${tr("logout")}</button></div>`)}
async function showAdmin(){
 try{
  const [st,u]=await Promise.all([api("/admin/stats"),api("/admin/users")]);
  layout(`${brand()}<div class="card"><h2>🔐 ${tr("admin")}</h2><p>${tr("stats")}: ${st.total_users}</p><p>🤖 AI today: ${st.ai_requests_today}</p><p>♾️ ${tr("unlimited")}: ${st.unlimited_ai}</p></div><div class="card"><h3>${tr("users")}</h3><input id="adminId" class="input" placeholder="Telegram ID"><button class="btn primary" onclick="addAdmin()">${tr("add")} admin</button>${u.items.map(x=>`<div class="list-item"><div><b>${esc(x.first_name)} ${esc(x.last_name)}</b><div class="muted">${x.telegram_id} · ${esc(x.group_name||"")}</div></div><button class="btn" onclick="grant(${x.telegram_id},${!x.unlimited_ai})">${x.unlimited_ai?"∞":"+"}</button></div>`).join("")}</div>`);
 }catch(e){toast(e.message)}
}
async function grant(id,enabled){try{await api("/admin/unlimited",{method:"POST",body:{telegram_id:id,enabled}});showAdmin()}catch(e){toast(e.message)}}

start();

async function addAdmin(){
 const id=document.getElementById("adminId").value.trim();
 if(!id)return;
 try{await api("/admin/add",{method:"POST",body:{telegram_id:id}});toast("Admin added");showAdmin()}catch(e){toast(e.message)}
}

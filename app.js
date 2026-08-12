
// UniUZ Home v6 FINAL
// UniUZ Home Dashboard v5 - schedule and homework cards
// UniUZ Home Dashboard v4
// UniUZ Home Dashboard v3
// UniUZ Home Dashboard v2
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
admin:"Админ-панель",stats:"Статистика",users:"Пользователи",unlimited:"Безлимитный ИИ",payments:"Платежи",pendingPayments:"Ожидают проверки",approve:"Одобрить",reject:"Отклонить",openReceipt:"Открыть чек",approved:"Одобрено",rejected:"Отклонено",pending:"На проверке",
question:"Напишите вопрос...",send:"Отправить",title:"Название",description:"Описание",
due:"Дата и время сдачи",done:"Выполнено",delete:"Удалить",noData:"Пока ничего нет",
back:"Назад",language:"Язык",facultyPlaceholder:"Например: AI Software"
},
en:{
chooseLanguage:"Choose language",university:"Choose university",faculty:"Choose faculty",
group:"Enter your group",name:"First and last name",continue:"Continue",home:"Home",
schedule:"Schedule",homework:"My homework",ai:"AI",reminders:"Reminders",profile:"Profile",
save:"Save",upload:"Upload schedule",add:"Add",enabled:"Reminders enabled",disabled:"Reminders disabled",
logout:"Change profile",admin:"Admin panel",stats:"Statistics",users:"Users",unlimited:"Unlimited AI",payments:"Payments",pendingPayments:"Pending review",approve:"Approve",reject:"Reject",openReceipt:"Open receipt",approved:"Approved",rejected:"Rejected",pending:"Pending",
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
 if(!r.ok){const err=new Error(d.error||`API ${r.status}`);err.status=r.status;err.data=d;throw err;}
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

async function home(){

let schedule=[];
let homework=[];

try{
 const s=await api("/schedule");
 schedule=s.items||[];
}catch(e){}

try{
 const h=await api("/homework");
 homework=h.items||[];
}catch(e){}


layout(`
<div class="brand">
 <div class="logo">🎓</div>
 <h1>UniUZ</h1>
 <div class="muted">${profile?.university||""}</div>
</div>

<div class="hero">
 <div class="hero-row">
  <div>
   <div class="hello">Добрый день 👋</div>
   <h1>${esc(profile?.first_name||"Student")}</h1>
   <div class="profile-badge">
    🏛 ${esc(profile?.department||"")}
   </div>
   <div class="profile-badge">
    👥 ${esc(profile?.group_name||"")}
   </div>
  </div>
  <div class="avatar">🎓</div>
 </div>
</div>


<div class="today-card">
 <div class="section-title">🗓 Сегодня</div>

 ${
 schedule.length
 ?
 schedule.slice(0,3).map(x=>`
 <div class="lesson">
   <div class="lesson-time">${esc(x.start_time||"")}</div>
   <div>
    <div class="lesson-title">${esc(x.subject||"")}</div>
    <div class="lesson-room">🏫 ${esc(x.room||"")}</div>
   </div>
 </div>
 `).join("")
 :
 `<div class="empty">🎉 Сегодня пар нет</div>`
 }

</div>


<div class="today-card">
 <div class="section-title">📝 Ближайшие задания</div>

 ${
 homework.length
 ?
 homework.slice(0,3).map(x=>`
 <div class="lesson">
   <div>
    <div class="lesson-title">📄 ${esc(x.title||"")}</div>
    <div class="lesson-room">⏰ ${esc(x.due_at||"")}</div>
   </div>
 </div>
 `).join("")
 :
 `<div class="empty">Нет активных заданий</div>`
 }

</div>


<div class="ai-card">
 <div class="ai-title">🤖 UniUZ AI</div>
 <p>Ваш персональный помощник</p>
 <div id="home-ai-usage" class="ai-usage">Загрузка...</div>
 <button class="btn primary" onclick="showAI()">
 Спросить ИИ →
 </button>
</div>


<div class="quick-grid-v2">
 <button class="quick-v2" onclick="showSchedule()">
  <span>🗓</span>${tr("schedule")}
 </button>

 <button class="quick-v2" onclick="showHomework()">
  <span>📝</span>${tr("homework")}
 </button>

 <button class="quick-v2" onclick="showAI()">
  <span>🤖</span>${tr("ai")}
 </button>

 <button class="quick-v2" onclick="showProfile()">
  <span>👤</span>${tr("profile")}
 </button>
 ${profile?.is_admin ? `
 <button class="quick-v2 admin-v2" onclick="showAdmin()">
  <span>🔐</span>${tr("admin")}
 </button>` : ""}
</div>

`)
 loadHomeAIUsage();
}
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

async function loadHomeAIUsage(){
 try{
  const d=await api("/ai/status");
  const el=document.getElementById("home-ai-usage");
  if(el){
   el.textContent=d.limit===null ? "∞ Безлимитный AI" : `${d.used}/10 запросов сегодня`;
  }
 }catch(e){
  const el=document.getElementById("home-ai-usage");
  if(el) el.textContent="0/10 запросов сегодня";
 }
}

function showAI(){
 layout(`${brand()}<div class="card"><h2>🤖 ${tr("ai")}</h2><div id="chat"></div><textarea id="q" class="input" placeholder="${tr("question")}"></textarea><button class="btn primary" onclick="askAI()">${tr("send")}</button></div>`,"ai");
 loadAIStatusInChat();
}

async function loadAIStatusInChat(){
 try{
  const d=await api("/ai/status");
  if(d.limit!==null && d.used>=10) showAILimitInChat();
 }catch(e){}
}

function showAILimitInChat(){
 const chat=document.getElementById("chat");
 if(!chat) return;
 if(document.getElementById("ai-limit-message")) return;
 chat.innerHTML += `
  <div class="list-item" id="ai-limit-message">
   <b>🤖 UniUZ AI</b>
   <p><b>Лимит AI на сегодня исчерпан.</b></p>
   <p>Вы использовали все <b>10 запросов</b> сегодня.</p>
   <p><b>Безлимитный UniUZ AI — 19 900 сум / месяц.</b></p>
   <p>Оплата помогает поддерживать работу ИИ и серверов, чтобы UniUZ работал <b>24/7</b> и оставался доступным для студентов.</p>
   <button class="btn primary" onclick="showPaymentInstructions()">💳 Оплатить 19 900 сум</button>
  </div>`;
}

async function showPaymentInstructions(){
 try{
  const d=await api("/ai/payment-info");
  const chat=document.getElementById("chat");
  if(!chat) return;
  const safeCard=esc(d.card_number||"Не указан");
  chat.innerHTML += `
   <div class="list-item" id="ai-payment-message">
    <b>💳 Оплата безлимитного AI</b>
    <p>Стоимость: <b>19 900 сум / месяц</b></p>
    <p>Номер карты:</p>
    <div class="badge" style="font-size:18px;word-break:break-all">${safeCard}</div>
    <p>После оплаты отправьте чек ниже. Администратор проверит оплату и включит безлимитный AI.</p>
    <input id="ai-receipt-file" type="file" accept="image/*,.pdf" class="input">
    <button class="btn primary" onclick="sendPaymentReceipt()">📤 Отправить чек</button>
   </div>`;
  const file=document.getElementById("ai-receipt-file");
  if(file) file.scrollIntoView({behavior:"smooth",block:"center"});
 }catch(e){toast(e.message)}
}

async function sendPaymentReceipt(){
 const input=document.getElementById("ai-receipt-file");
 const button=document.querySelector('#ai-payment-message button');
 const file=input?.files?.[0];
 if(!file){toast("Выберите чек.");return;}
 if(file.size>10*1024*1024){toast("Чек должен быть не больше 10 МБ.");return;}
 const form=new FormData();
 form.append("receipt",file,file.name);
 if(button){button.disabled=true;button.textContent="⏳ Отправка...";}
 try{
  const d=await api("/ai/payment-receipt",{method:"POST",body:form});
  const chat=document.getElementById("chat");
  if(chat){
   chat.innerHTML += `<div class="list-item"><b>✅ Чек отправлен</b><p>${esc(d.message||"Администратор получил чек. После проверки вам включат безлимитный AI.")}</p></div>`;
  }
  if(input) input.value="";
 }catch(e){
  if(button){button.disabled=false;button.textContent="📤 Отправить чек";}
  toast(e.message||"Не удалось отправить чек администратору");
 }
}

async function askAI(){
 const q=document.getElementById("q").value.trim();
 if(!q)return;
 try{
  const d=await api("/ai",{method:"POST",body:{message:q}});
  document.getElementById("chat").innerHTML+=`<div class="list-item"><b>${esc(q)}</b><p>${esc(d.answer)}</p><span class="badge">${d.limit===null?"∞":`${d.used}/10`}</span></div>`;
  document.getElementById("q").value="";
  loadHomeAIUsage();
  if(d.limit!==null && d.used>=10) showAILimitInChat();
 }catch(e){
  if(e.status===429) showAILimitInChat();
  else toast(e.message);
 }
}

async function showReminders(){try{const d=await api("/reminders");layout(`${brand()}<div class="card"><h2>🔔 ${tr("reminders")}</h2><p>${d.enabled?tr("enabled"):tr("disabled")}</p><button class="btn primary" onclick="toggleReminders(${!d.enabled})">${d.enabled?tr("disabled"):tr("enabled")}</button></div>`)}catch(e){toast(e.message)}}
async function toggleReminders(enabled){try{await api("/reminders",{method:"POST",body:{enabled}});showReminders()}catch(e){toast(e.message)}}

function showProfile(){layout(`${brand()}<div class="card"><h2>👤 ${tr("profile")}</h2><p><b>${esc(profile.first_name)} ${esc(profile.last_name)}</b></p><p>${esc(profile.university)}</p><p>${esc(profile.department)}</p><p>${esc(profile.group_name)}</p><button class="btn" onclick="chooseLanguage()">${tr("language")}</button><button class="btn danger" onclick="chooseUniversity()">${tr("logout")}</button></div>`)}
async function showAdmin(){
 try{
  const [st,u,p]=await Promise.all([api("/admin/stats"),api("/admin/users"),api("/admin/payments")]);
  const pending=(p.items||[]).filter(x=>x.status==="pending");
  const statusLabel=x=>x.status==="approved"?"✅ Одобрено":x.status==="rejected"?"❌ Отклонено":"⏳ На проверке";
  layout(`${brand()}
   <div class="card">
    <h2>🔐 ${tr("admin")}</h2>
    <div class="list-item"><b>👥 ${tr("users")}</b><span class="badge">${st.total_users||0}</span></div>
    <div class="list-item"><b>🤖 AI сегодня</b><span class="badge">${st.ai_requests_today||0}</span></div>
    <div class="list-item"><b>♾️ ${tr("unlimited")}</b><span class="badge">${st.unlimited_ai||0}</span></div>
    <div class="list-item"><b>💳 ${tr("pendingPayments")}</b><span class="badge">${pending.length}</span></div>
   </div>

   <div class="card">
    <h3>💳 ${tr("payments")}</h3>
    ${pending.length ? pending.map(x=>`
      <div class="list-item">
       <div>
        <b>${esc(x.first_name)} ${esc(x.last_name)}</b>
        <div class="muted">ID: ${x.telegram_id} · ${esc(x.group_name||"")}</div>
        <div class="muted">19 900 UZS · ${esc(x.created_at||"")}</div>
        <div class="muted">${esc(x.filename)}</div>
       </div>
       <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">
        <button class="btn" onclick="openPaymentReceipt(${x.id})">📄 ${tr("openReceipt")}</button>
        <button class="btn primary" onclick="approvePayment(${x.id})">✅ ${tr("approve")}</button>
        <button class="btn danger" onclick="rejectPayment(${x.id})">❌ ${tr("reject")}</button>
       </div>
      </div>`).join(""):`<div class="empty">Нет платежей на проверке</div>`}
   </div>

   <div class="card">
    <h3>👥 ${tr("users")}</h3>
    <input id="adminId" class="input" placeholder="Telegram ID">
    <button class="btn primary" onclick="addAdmin()">${tr("add")} admin</button>
    ${(u.items||[]).map(x=>`<div class="list-item"><div><b>${esc(x.first_name)} ${esc(x.last_name)}</b><div class="muted">${x.telegram_id} · ${esc(x.group_name||"")}</div></div><button class="btn" onclick="grant(${x.telegram_id},${!x.unlimited_ai})">${x.unlimited_ai?"∞":"+"}</button></div>`).join("")}
   </div>`,"home");
 }catch(e){toast(e.message)}
}

async function openPaymentReceipt(id){
 try{
  const r=await fetch(`${API}/admin/payments/${id}/receipt`,{headers:{"X-Telegram-Init-Data":tg?.initData||""}});
  if(!r.ok){let d={};try{d=await r.json()}catch{};throw new Error(d.error||`API ${r.status}`)}
  const blob=await r.blob();
  const url=URL.createObjectURL(blob);
  window.open(url,"_blank");
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(e){toast(e.message||"Не удалось открыть чек")}
}
async function approvePayment(id){
 if(!confirm("Подтвердить оплату и включить безлимитный AI на 30 дней?")) return;
 try{await api(`/admin/payments/${id}/approve`,{method:"POST",body:{}});toast("Оплата подтверждена. AI без ограничений активирован на 30 дней.");showAdmin()}catch(e){toast(e.message)}
}
async function rejectPayment(id){
 if(!confirm("Отклонить этот чек?")) return;
 try{await api(`/admin/payments/${id}/reject`,{method:"POST",body:{}});toast("Чек отклонён.");showAdmin()}catch(e){toast(e.message)}
}

async function grant(id,enabled){try{await api("/admin/unlimited",{method:"POST",body:{telegram_id:id,enabled}});showAdmin()}catch(e){toast(e.message)}}

start();

async function addAdmin(){
 const id=document.getElementById("adminId").value.trim();
 if(!id)return;
 try{await api("/admin/add",{method:"POST",body:{telegram_id:id}});toast("Admin added");showAdmin()}catch(e){toast(e.message)}
}

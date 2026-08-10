// =====================================
// UniUZ Mini App
// app.js
// Part 1/4
// =====================================


const API_URL =
    "https://uniuz-production.up.railway.app";



const tg =
    window.Telegram?.WebApp || null;



if(tg){

    try{

        tg.ready();

        tg.expand();

    }

    catch(e){}

}



const initData =
    tg?.initData || "";




// =====================================
// STATE
// =====================================


let currentLanguage = null;

let currentRole = null;


let teacherStatus = null;


let isAdmin = false;



let cachedProfile = null;

let cachedHomework = [];

let cachedAnnouncements = [];




// =====================================
// TRANSLATIONS
// =====================================


const translations = {


ru:{


chooseLanguage:
"Выберите язык",


chooseRole:
"Выберите вашу роль",


student:
"🎓 Студент",


teacher:
"👨‍🏫 Преподаватель",


admin:
"🔐 Администратор",


pending:
"⏳ Заявка отправлена",


pendingText:
"Ожидайте одобрения администратора",


approved:
"✅ Вы одобрены",


rejected:
"❌ Заявка отклонена",


check:
"🔄 Проверить статус",


schedule:
"📅 Расписание",


homework:
"📝 Задания",


announcements:
"📢 Объявления",


ai:
"🤖 ИИ",


profile:
"👤 Профиль",


welcome:
"Добро пожаловать"


},



en:{


chooseLanguage:
"Choose language",


chooseRole:
"Choose your role",


student:
"🎓 Student",


teacher:
"👨‍🏫 Teacher",


admin:
"🔐 Admin",


pending:
"⏳ Pending",


pendingText:
"Waiting for administrator approval",


approved:
"✅ Approved",


rejected:
"❌ Rejected",


check:
"🔄 Check status",


schedule:
"📅 Schedule",


homework:
"📝 Homework",


announcements:
"📢 Announcements",


ai:
"🤖 AI",


profile:
"👤 Profile",


welcome:
"Welcome"


},



ko:{


chooseLanguage:
"언어 선택",


chooseRole:
"역할 선택",


student:
"🎓 학생",


teacher:
"👨‍🏫 교수",


admin:
"🔐 관리자",


pending:
"⏳ 승인 대기",


pendingText:
"관리자 승인을 기다리고 있습니다",


approved:
"✅ 승인 완료",


rejected:
"❌ 거절됨",


check:
"🔄 상태 확인",


schedule:
"📅 시간표",


homework:
"📝 과제",


announcements:
"📢 공지",


ai:
"🤖 AI",


profile:
"👤 프로필",


welcome:
"환영합니다"


}


};





function T(key){


return (

translations[currentLanguage]
||
translations.ru

)[key] || key;


}




function getScreen(){


return document.getElementById(
"screen"
);


}



function setNav(show){


const nav =
document.querySelector(
".bottom-nav"
);



if(nav){

nav.style.display =
show ? "flex" : "none";

}


}





// =====================================
// API
// =====================================


async function apiRequest(
path,
options={}
){


const headers={


"X-Telegram-Init-Data":
initData


};



if(options.body){


headers[
"Content-Type"
]=
"application/json";

}




const response =
await fetch(

API_URL + path,

{

method:
options.method || "GET",

headers,

body:
options.body

?

JSON.stringify(
options.body
)

:

undefined

}

);




let data={};



try{

data =
await response.json();

}

catch(e){}




if(!response.ok){

throw new Error(
data.error ||
"API Error"
);

}



return data;


}






async function checkApi(){


try{


const res =
await fetch(
API_URL + "/api/health"
);


const data =
await res.json();



return data.ok === true;



}

catch(e){


return false;


}


}
// =====================================
// LOAD PROFILE
// =====================================


async function loadProfile(){


const data =
await apiRequest(
"/api/me"
);



cachedProfile =
data;



isAdmin =
data.is_admin === true;



teacherStatus =
data.teacher_status || null;



return data;


}






// =====================================
// LANGUAGE
// =====================================


function bindLanguageButtons(){


document
.querySelectorAll(
".language-btn"
)

.forEach(btn=>{


btn.onclick = ()=>{


selectLanguage(
btn.dataset.lang
);


};



});


}





async function selectLanguage(lang){


currentLanguage =
lang;



const languageScreen =
document.getElementById(
"languageScreen"
);



if(languageScreen){

languageScreen.style.display =
"none";

}



try{

    await loadProfile();

}
catch(e){

    console.log(
        "Новый пользователь"
    );

}


showRoleScreen();






// =====================================
// ROLE SCREEN
// =====================================


function showRoleScreen(){


setNav(false);



const s =
getScreen();



s.innerHTML = `


<div class="role-container">


<div class="role-card">



<div class="role-logo">

🎓

</div>



<h1>

UniUZ

</h1>



<p>

${T("chooseRole")}

</p>



<button

class="role-button"

id="studentBtn"

>

${T("student")}

</button>



<button

class="role-button teacher"

id="teacherBtn"

>

${T("teacher")}

</button>



${
isAdmin

?

`

<button

class="role-button admin"

id="adminBtn"

>

${T("admin")}

</button>

`

:

""

}



</div>


</div>


`;





document
.getElementById(
"studentBtn"
)

.onclick =
()=>{


currentRole =
"student";


openStudentApp();



};





document
.getElementById(
"teacherBtn"
)

.onclick =
()=>{


currentRole =
"teacher";


requestTeacherAccess();



};





document
.getElementById(
"adminBtn"
)

?.addEventListener(
"click",
()=>{


openAdminPanel();


}

);



}







// =====================================
// TEACHER REQUEST
// =====================================


async function requestTeacherAccess(){



try{


const data =
await apiRequest(

"/api/teacher/request",

{

method:"POST",

body:{


telegram_id:

tg
?.initDataUnsafe
?.user
?.id


}


}

);




teacherStatus =
data.status ||
"pending";



showTeacherStatus();



}

catch(error){



console.error(error);


alert(
error.message
);


}



}







// =====================================
// TEACHER STATUS
// =====================================


function showTeacherStatus(){


const s =
getScreen();



s.innerHTML = `


<div class="role-container">


<div class="role-card">


<div class="role-logo">

⏳

</div>



<h1>

${T("pending")}

</h1>



<p>

${T("pendingText")}

</p>



<button

class="role-button"

id="checkTeacher"

>

${T("check")}

</button>



</div>


</div>


`;




document
.getElementById(
"checkTeacher"
)

.onclick =
async()=>{



const data =
await apiRequest(
"/api/teacher/status"
);



teacherStatus =
data.status;



if(
teacherStatus ===
"approved"
){


showTeacherHome();


}

else{


showTeacherStatus();


}



};


}
// =====================================
// STUDENT APP
// =====================================


async function openStudentApp(){


try{


await loadHomework();

await loadAnnouncements();



setNav(true);



bindBottomNavigation();



openPage(
"home"
);



}

catch(error){


console.error(error);


alert(
error.message
);


}


}







// =====================================
// TEACHER HOME
// =====================================


function showTeacherHome(){


setNav(false);



const s =
getScreen();



s.innerHTML = `


<div class="page">


<div class="page-header">


<h1>

👨‍🏫 UniUZ

</h1>


</div>



<div class="info-card">


<h2>

${T("approved")}

</h2>



<p>

Режим преподавателя активирован.

</p>



</div>



</div>


`;



}








// =====================================
// LOAD DATA
// =====================================


async function loadHomework(){


try{


const data =
await apiRequest(
"/api/homework"
);



cachedHomework =
data.items || [];



}

catch(e){


cachedHomework=[];


}



}




async function loadAnnouncements(){


try{


const data =
await apiRequest(
"/api/announcements"
);



cachedAnnouncements =
data.items || [];



}

catch(e){


cachedAnnouncements=[];


}


}







// =====================================
// HOME PAGE
// =====================================


function renderHome(){


const s =
getScreen();



s.innerHTML = `


<div class="home-page">


<div class="page-header">


<div>


<h1>

🎓 UniUZ

</h1>


<p>

${T("welcome")}

</p>


</div>



<div class="avatar">

👤

</div>



</div>





<div class="profile-card">


<h2>

${
cachedProfile
?.telegram_user
?.first_name
||
"Студент"

}

</h2>


<p>

UniUZ Assistant

</p>


</div>





<div class="dashboard-grid">



<button

class="dashboard-card"

data-page="schedule"

>

📅

<br>

${T("schedule")}

</button>




<button

class="dashboard-card"

data-page="homework"

>

📝

<br>

${T("homework")}

</button>





<button

class="dashboard-card"

data-page="announcements"

>

📢

<br>

${T("announcements")}

</button>





<button

class="dashboard-card"

data-page="ai"

>

🤖

<br>

${T("ai")}

</button>



</div>



</div>


`;



bindScreenButtons();



}







// =====================================
// PAGES
// =====================================


function openPage(page){


document
.querySelectorAll(
".nav-item"
)

.forEach(item=>{


item.classList.toggle(

"active",

item.dataset.page === page

);



});





if(page==="home"){


renderHome();

return;


}



const s =
getScreen();




let content = "";




if(page==="homework"){


content = `


<div class="info-card">


<h2>

📝 ${T("homework")}

</h2>



<p>

${
cachedHomework.length

?

"Задания загружены"

:

"Нет заданий"

}

</p>


</div>


`;


}



else if(page==="announcements"){


content = `


<div class="info-card">


<h2>

📢 ${T("announcements")}

</h2>



<p>

${
cachedAnnouncements.length

?

"Есть объявления"

:

"Нет объявлений"

}

</p>


</div>


`;


}



else{


content = `


<div class="info-card">


<h2>

${page}

</h2>



<p>

Раздел будет подключён после получения данных.

</p>


</div>


`;


}



s.innerHTML = `


<div class="page">


${content}


</div>


`;



}
// =====================================
// ADMIN PANEL
// =====================================


async function openAdminPanel(){


try{


const data =
await apiRequest(
"/api/admin/teacher-requests"
);



renderAdminPanel(
data.items || []
);



}

catch(error){


console.error(error);


alert(
error.message
);


}



}




function renderAdminPanel(items){


const s =
getScreen();



let html = "";



if(items.length===0){


html = `


<div class="info-card">


<h3>

📭 Нет заявок

</h3>


</div>


`;



}

else{


html =
items.map(item=>`


<div class="info-card">


<h3>

👨‍🏫
${item.full_name || "Без имени"}

</h3>



<p>

ID:
${item.telegram_id}

</p>



<button

class="role-button"

onclick="approveTeacher('${item.telegram_id}')"

>

✅ Одобрить

</button>



<button

class="role-button teacher"

onclick="rejectTeacher('${item.telegram_id}')"

>

❌ Отклонить

</button>



</div>



`).join("");



}




s.innerHTML = `


<div class="page">


<h1>

🔐 Администратор

</h1>



${html}



<button

class="role-button"

onclick="showRoleScreen()"

>

⬅️ Назад

</button>



</div>


`;



}





async function approveTeacher(id){


await apiRequest(

`/api/admin/teacher/${id}/approve`,

{

method:"POST"

}

);



openAdminPanel();



}




async function rejectTeacher(id){


await apiRequest(

`/api/admin/teacher/${id}/reject`,

{

method:"POST"

}

);



openAdminPanel();



}






// =====================================
// NAVIGATION
// =====================================


function bindBottomNavigation(){


document
.querySelectorAll(
".nav-item"
)

.forEach(btn=>{


btn.onclick =
()=>{


openPage(
btn.dataset.page
);


};



});



}




function bindScreenButtons(){


document
.querySelectorAll(
"[data-page]"
)

.forEach(btn=>{


btn.onclick =
()=>{


openPage(
btn.dataset.page
);


};



});


}







// =====================================
// ERROR
// =====================================


function showError(text){


const s =
getScreen();



if(!s)
return;



s.innerHTML = `


<div class="page">


<div class="info-card">


<h2>

⚠️ Ошибка

</h2>


<p>

${text}

</p>


</div>


</div>


`;



}








// =====================================
// START
// =====================================


async function initializeUniUZ(){

    try{

        const online =
        await checkApi();


        if(!online){

            throw new Error(
            "API недоступен"
            );

        }


        // НЕ загружаем профиль сразу
        // ждём выбора языка


        return;


    }

    catch(error){

        console.error(error);

        showError(
            error.message
        );

    }

}



await loadProfile();



/*
НЕ показываем роль сразу.

Ждём выбора языка.
*/




}

catch(error){


showError(
error.message
);



}



}








document
.addEventListener(
"DOMContentLoaded",
()=>{


bindLanguageButtons();


initializeUniUZ();



});

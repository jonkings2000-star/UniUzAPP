const API_URL = "https://uniuz-production.up.railway.app";

const tg = window.Telegram?.WebApp || null;


if (tg) {

    try {

        tg.ready();

        tg.expand();

    } catch (_) {}

}


const initData =
    tg?.initData || "";


// =====================================
// RESET LOGIN
// =====================================
// Не сохраняем выбор роли.
// Каждый вход начинается заново:
// язык → роль


localStorage.removeItem(
    "uniuz_role"
);


localStorage.removeItem(
    "uniuz_language"
);


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


    ru: {

        chooseRole:
            "Выберите вашу роль",

        roleSub:
            "Как вы будете использовать UniUZ?",

        student:
            "🎓 Студент",

        teacher:
            "👨‍🏫 Преподаватель",

        admin:
            "🔐 Панель администратора",


        pending:
            "⏳ Заявка отправлена",

        pendingText:
            "Ваша заявка отправлена администратору. Дождитесь одобрения.",


        sendRequest:
            "📨 Отправить заявку",

        check:
            "🔄 Проверить статус",


        approved:
            "✅ Вы одобрены как преподаватель",


        rejected:
            "❌ Заявка отклонена",


        retry:
            "📨 Подать заявку снова",


        back:
            "⬅️ Назад к выбору роли",


        approve:
            "✅ Одобрить",


        reject:
            "❌ Отклонить",


        refresh:
            "🔄 Обновить",


        noRequests:
            "📭 Новых заявок нет",


        adminTitle:
            "Заявки преподавателей",


        welcome:
            "Добро пожаловать 👋",


        schedule:
            "Расписание",


        homework:
            "Задания",


        announcements:
            "Объявления",


        ai:
            "ИИ",


        profile:
            "Профиль",


        today:
            "Сегодня",


        quick:
            "Быстрые действия",


        apiError:
            "⚠️ API недоступен"

    },


    en: {

        chooseRole:
            "Choose your role",

        roleSub:
            "How will you use UniUZ?",

        student:
            "🎓 Student",

        teacher:
            "👨‍🏫 Professor",

        admin:
            "🔐 Administrator panel",


        pending:
            "⏳ Request submitted",


        pendingText:
            "Your request was sent to administrator.",


        sendRequest:
            "📨 Send request",


        check:
            "🔄 Check status",


        approved:
            "✅ Approved as professor",


        rejected:
            "❌ Request rejected",


        retry:
            "📨 Submit again",


        back:
            "⬅️ Back",


        approve:
            "✅ Approve",


        reject:
            "❌ Reject",


        refresh:
            "🔄 Refresh",


        noRequests:
            "📭 No requests",


        adminTitle:
            "Teacher requests",


        welcome:
            "Welcome 👋",


        schedule:
            "Schedule",


        homework:
            "Homework",


        announcements:
            "Announcements",


        ai:
            "AI",


        profile:
            "Profile",


        today:
            "Today",


        quick:
            "Quick actions",


        apiError:
            "⚠️ API unavailable"

    },


    ko: {

        chooseRole:
            "역할을 선택하세요",

        roleSub:
            "UniUZ 사용 방법을 선택하세요",


        student:
            "🎓 학생",


        teacher:
            "👨‍🏫 교수님",


        admin:
            "🔐 관리자",


        pending:
            "⏳ 신청 완료",


        pendingText:
            "관리자의 승인을 기다리고 있습니다.",


        sendRequest:
            "📨 신청 보내기",


        check:
            "🔄 상태 확인",


        approved:
            "✅ 교수님 승인 완료",


        rejected:
            "❌ 신청 거절",


        retry:
            "📨 다시 신청",


        back:
            "⬅️ 돌아가기",


        approve:
            "✅ 승인",


        reject:
            "❌ 거절",


        refresh:
            "🔄 새로고침",


        noRequests:
            "📭 신청 없음",


        adminTitle:
            "교수 신청",


        welcome:
            "환영합니다 👋",


        schedule:
            "시간표",


        homework:
            "과제",


        announcements:
            "공지사항",


        ai:
            "AI",


        profile:
            "프로필",


        today:
            "오늘",


        quick:
            "빠른 메뉴",


        apiError:
            "⚠️ API 오류"

    }

};



function T(key) {

    return (

        translations[currentLanguage]
        ||

        translations.ru

    )[key] || key;

}



function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}



function screen() {

    return document.querySelector(
        "#screen"
    );

}



function setNav(show) {

    const nav =
        document.querySelector(
            ".bottom-nav"
        );


    if (nav) {

        nav.style.display =
            show ? "" : "none";

    }

}
// =====================================
// API REQUEST
// =====================================

async function apiRequest(
    path,
    options = {}
) {

    const headers = {

        "X-Telegram-Init-Data":
            initData,

        ...(options.headers || {})

    };


    if (
        options.body !== undefined
    ) {

        headers[
            "Content-Type"
        ] =
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
                    options.body !== undefined

                        ?

                    JSON.stringify(
                        options.body
                    )

                        :

                    undefined

            }

        );



    let data = {};


    try {

        data =
            await response.json();

    }

    catch (_) {}



    if (
        !response.ok
    ) {

        throw new Error(
            data.error ||
            `API error ${response.status}`
        );

    }



    return data;

}



// =====================================
// CHECK API
// =====================================

async function checkApi(){

    try {


        const res =
            await fetch(
                API_URL +
                "/api/health"
            );


        const data =
            await res.json();



        return data.ok === true;


    }

    catch(e){


        console.error(e);


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


    if(
        !data.ok
    ){

        throw new Error(
            "Profile error"
        );

    }



    cachedProfile =
        data;



    isAdmin =
        data.is_admin === true;



    teacherStatus =
        data.teacher_status || null;



    return data;

}




// =====================================
// LOAD HOMEWORK
// =====================================

async function loadHomework(){

    const data =
        await apiRequest(
            "/api/homework"
        );


    cachedHomework =
        data.items || [];

}




// =====================================
// LOAD ANNOUNCEMENTS
// =====================================

async function loadAnnouncements(){

    const data =
        await apiRequest(
            "/api/announcements"
        );


    cachedAnnouncements =
        data.items || [];

}




// =====================================
// LANGUAGE BUTTONS
// =====================================

function bindLanguageButtons(){

    document
    .querySelectorAll(
        ".language-btn"
    )

    .forEach(
        btn => {


            btn.onclick =
            () => {


                selectLanguage(
                    btn.dataset.lang
                );


            };


        }
    );


}





// =====================================
// SELECT LANGUAGE
// =====================================

async function selectLanguage(lang){


    currentLanguage =
        lang;



    // сохраняем только пока открыто

    localStorage.setItem(
        "uniuz_language",
        lang
    );



    const language =
        document.getElementById(
            "languageScreen"
        );



    if(language){

        language.style.display =
            "none";

    }




    try{


        await loadProfile();



        showRoleScreen();



    }


    catch(error){


        showError(
            error.message
        );


    }


}






// =====================================
// ROLE SCREEN
// =====================================

function showRoleScreen() {

    setNav(false);

    const s = document.getElementById("screen");

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
                ${T("chooseRole") || "Выберите вашу роль"}
            </p>



            <button
                id="studentBtn"
                class="role-button"
            >

                🎓 Студент

            </button>




            <button
                id="teacherBtn"
                class="role-button teacher"
            >

                👨‍🏫 Преподаватель

            </button>


        </div>

    </div>

    `;



    const student =
        document.getElementById(
            "studentBtn"
        );


    const teacher =
        document.getElementById(
            "teacherBtn"
        );



    if(student){

        student.onclick = async function(){

            console.log(
                "Student selected"
            );


            currentRole =
                "student";


            await openStudentApp();

        };

    }



    if(teacher){

        teacher.onclick = async function(){

            console.log(
                "Teacher selected"
            );


            currentRole =
                "teacher";


            await requestTeacherAccess();

        };

    }


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
                    tg?.initDataUnsafe?.user?.id
                }
            }
        );


        teacherStatus =
        data.status || "pending";


        showTeacherStatus();


    }

    catch(error){

        console.error(error);

        showError(
            error.message
        );

    }

}






// =====================================
// TEACHER STATUS SCREEN
// =====================================

function showTeacherStatus(){


    const s =
        screen();



    s.innerHTML = `


    <div class="role-container">


        <div class="role-card">


            <h1>

            ${
                teacherStatus === "approved"

                ?

                T("approved")

                :

                teacherStatus === "rejected"

                ?

                T("rejected")

                :

                T("pending")

            }

            </h1>



            <p>

            ${
                teacherStatus === "pending"

                ?

                T("pendingText")

                :

                ""

            }

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

    ?.addEventListener(
        "click",
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


        }

    );



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


        showError(
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
        screen();



    s.innerHTML = `


    <section class="page">


        <div class="page-header">


            <h1>
                👨‍🏫 UniUZ
            </h1>


            <p>
                Панель преподавателя
            </p>


        </div>



        <div class="info-card">


            <h2>
                ✅ Преподаватель
            </h2>


            <p>
                Ваш аккаунт подтвержден.
            </p>


        </div>



    </section>


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


        showError(
            error.message
        );


    }


}






function renderAdminPanel(items){



    const s =
        screen();



    if(!s)
        return;



    let html = "";



    if(
        items.length === 0
    ){


        html = `

        <div class="info-card">

            <h3>
                ${T("noRequests")}
            </h3>

        </div>

        `;


    }


    else{


        html =
        items.map(
            teacher => `


            <div class="info-card">


                <h3>
                    👨‍🏫
                    ${escapeHtml(
                        teacher.full_name
                    )}
                </h3>



                <p>

                    ID:
                    ${teacher.telegram_id}

                </p>



                <button
                    class="approve-btn"
                    data-id="${teacher.telegram_id}"
                >

                    ${T("approve")}

                </button>




                <button
                    class="reject-btn"
                    data-id="${teacher.telegram_id}"
                >

                    ${T("reject")}

                </button>



            </div>


            `
        ).join("");

    }



    s.innerHTML = `


    <section class="page">


        <h1>
            🔐 Admin
        </h1>



        ${html}



        <button
            id="adminBack"
            class="role-button"
        >

            ${T("back")}

        </button>


    </section>


    `;



    document
    .querySelectorAll(
        ".approve-btn"
    )

    .forEach(
        btn=>{


            btn.onclick =
            ()=>changeTeacher(
                btn.dataset.id,
                "approve"
            );


        }

    );




    document
    .querySelectorAll(
        ".reject-btn"
    )

    .forEach(
        btn=>{


            btn.onclick =
            ()=>changeTeacher(
                btn.dataset.id,
                "reject"
            );


        }

    );




    document
    .getElementById(
        "adminBack"
    )

    ?.addEventListener(
        "click",
        showRoleScreen
    );


}






async function changeTeacher(
    id,
    action
){


    await apiRequest(

        `/api/admin/teacher/${id}/${action}`,

        {
            method:
                "POST"
        }

    );


    openAdminPanel();


}







// =====================================
// HOME PAGE
// =====================================

function renderHomeScreen(){


    const s =
        screen();



    s.innerHTML = `


    <section class="home-page">


        <div class="page-header">


            <h1>
                🎓 UniUZ
            </h1>


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
                Добро пожаловать в UniUZ
            </p>


        </div>





        <div class="dashboard-grid">


            <button
                class="dashboard-card"
                data-page="schedule"
            >

                📅
                Расписание

            </button>



            <button
                class="dashboard-card"
                data-page="homework"
            >

                📝
                Задания

            </button>



            <button
                class="dashboard-card"
                data-page="announcements"
            >

                📢
                Объявления

            </button>



            <button
                class="dashboard-card"
                data-page="ai"
            >

                🤖
                ИИ

            </button>



        </div>



    </section>


    `;



    bindScreenButtons();


}






// =====================================
// SIMPLE PAGES
// =====================================

function openPage(page){



    document
    .querySelectorAll(
        ".nav-item"
    )

    .forEach(
        item=>{

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );


        }
    );



    if(
        page === "home"
    ){

        renderHomeScreen();

        return;

    }




    const s =
        screen();



    s.innerHTML = `


    <section class="page">


        <div class="info-card">


            <h2>
                ${
                    page
                }
            </h2>


            <p>
                Раздел будет подключен после получения данных.
            </p>


        </div>


    </section>


    `;



}





function bindBottomNavigation(){


    document
    .querySelectorAll(
        ".nav-item"
    )

    .forEach(
        btn=>{


            btn.onclick =
            ()=>openPage(
                btn.dataset.page
            );


        }

    );


}




function bindScreenButtons(){


    document
    .querySelectorAll(
        "[data-page]"
    )

    .forEach(
        btn=>{


            btn.onclick =
            ()=>openPage(
                btn.dataset.page
            );


        }

    );


}






// =====================================
// START APP
// =====================================

async function initializeUniUZ(){

    try{


        if(
            !(await checkApi())
        ){

            throw new Error(
                "API недоступен"
            );

        }


        await loadProfile();


        // Ждём выбора языка
        // showRoleScreen() вызывается только после selectLanguage()


        return;


    }

    catch(error){


        console.error(error);


        showError(
            error.message
        );


    }

}






// =====================================
// LANGUAGE INIT
// =====================================

document
.addEventListener(
"DOMContentLoaded",
()=>{


    bindLanguageButtons();



    initializeUniUZ();



});

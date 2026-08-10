# UniUZ Mini App — этап 1

Это первый экран Telegram Mini App для UniUZ.

Сейчас:
- Telegram WebApp SDK подключён.
- Получается Telegram-пользователь из `initDataUnsafe.user` для отображения интерфейса.
- Есть главная, расписание, задания, объявления, AI и профиль.
- Интерфейс адаптирован под телефон и Telegram.
- Данные пока демонстрационные.

Следующий этап:
1. Развернуть Mini App на Railway по HTTPS.
2. Добавить FastAPI backend.
3. Проверять `Telegram.WebApp.initData` на сервере.
4. Подключить существующую SQLite-базу UniUZ.
5. Подключить реальный AI API.
6. Добавить кнопку открытия Mini App в Telegram-бот.

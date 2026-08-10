# UniUZ Railway deployment

This bundle runs the Telegram bot, Mini App API, and Mini App frontend from one Railway service.

URL:
https://uniuz-production.up.railway.app/

API health:
https://uniuz-production.up.railway.app/api/health

Required Railway variables:
BOT_TOKEN=your Telegram bot token
ADMIN_ID=your Telegram admin Telegram ID
OPENAI_API_KEY=your OpenAI API key

Start command:
python bot.py

Do not put secrets into miniapp files.

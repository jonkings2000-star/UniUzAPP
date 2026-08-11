# UniUZ — unified Mini App

## Files
- `index.html` — Mini App shell
- `style.css` — unified design
- `app.js` — student / teacher / admin UI and translations
- `web_api.py` — Flask API
- `database.py` — SQLite database and migrations
- `bot.py` — Telegram bot + Flask API server
- `server.py` — optional Flask-only server
- `requirements.txt` — Python dependencies
- `Procfile` — Railway start command

## Railway environment variables

Required:
- `BOT_TOKEN`
- `ADMIN_ID`

Optional AI:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)

## Important

The Mini App API URL is:
`https://uniuz-production.up.railway.app`

Teacher announcements can target multiple groups. After publishing, UniUZ:
1. stores the announcement;
2. shows it in the Mini App for matching groups;
3. sends a Telegram notification to students in those groups.

The Telegram notification requires students to have previously interacted with the bot so their Telegram ID is stored in the database.

## Deploy

Replace the project files, commit, and let Railway redeploy.

Recommended commit:
`Rebuild UniUZ Mini App with student teacher admin features`

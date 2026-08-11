# UniUZ — Simple Student Version

## Structure
- Student only. Teacher panel is removed.
- Start: Russian / English.
- Setup: University → Faculty → Group → First + Last name.
- AI: 10 successful requests per day for normal users.
- Admin can grant unlimited AI per user.
- Schedule: upload JPG/PNG/PDF; AI extracts classes.
- Homework: personal tasks with due date and optional file.
- Reminders: Telegram messages for classes and homework deadlines.
- Admin: statistics, users, unlimited AI, add administrators.

## Railway variables
Required:
- `BOT_TOKEN`
- `ADMIN_ID`
- `OPENAI_API_KEY`
- `WEB_APP_URL` (the public Railway URL, e.g. `https://uniuz-production.up.railway.app`)

Optional:
- `OPENAI_MODEL=gpt-4o-mini`

## Important
The 10/day limit is a UniUZ user quota. OpenAI API usage is not free; your server still needs a funded OpenAI API key. Admins marked unlimited bypass the UniUZ quota.

## Deploy
Replace the project files with the files in this package, commit, and deploy.

Check:
`/api/health`

Expected JSON contains `ok: true` and version `2026-08-11-simple`.

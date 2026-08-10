# UniUZ Mini App — Railway — 3 languages

The Mini App now shows a language selection screen on first launch:

- 🇷🇺 Русский
- 🇬🇧 English
- 🇰🇷 한국어

The selected language is saved in the browser/Telegram Mini App using localStorage, so the user does not have to choose it every time.

To change language later, the language selector can be exposed from the Profile/Settings page in a future step.

Railway start command:
`python server.py`

The existing UniUZ bot is not modified by these files.

## Update v2
The language storage key was versioned so users who opened the previous Mini App will see the language selection screen once after this deployment.

## Update v3
Added a language switcher in Profile. Users can change between Russian, English, and Korean at any time.

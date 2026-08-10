# UniUZ Mini App — Railway ready

## Railway
1. Push these files to the `uniuz-miniapp` GitHub repository.
2. Railway will create/deploy the service from GitHub.
3. In Railway open the Mini App service.
4. Settings → Deploy → Start Command:
   `python server.py`
5. Settings → Networking → Generate Domain.
6. When Railway asks for the target port, enter the value shown in the Railway `PORT` variable. If you did not create a `PORT` variable, Railway provides one automatically; the server reads it from the environment.
7. Open the generated `https://....up.railway.app` URL.

The server listens on `0.0.0.0:$PORT`, as required for Railway public networking.

Do not change the existing UniUZ bot service. This Mini App is a separate service.

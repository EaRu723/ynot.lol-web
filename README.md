# https://ynot.lol

```
cd ynot-server
docker compose up --build

cd ynot-server/y-frontend
npm run build
```

Served at `http://127.0.0.1:8000`. Email [arnav@surve.dev](mailto:arnav@surve.dev) for questions.

**NOTE:** `npm run build` build should be used in development due to the way session authentication is set up for same URL cookies.
Also note that this requires you use `127.0.0.1` instead of `localhost` *specifically*. This is to keep the environment
consistent between dev and production. In production, however, the frontend is hosted via nginx reverse proxy and not
served by FastAPI.

---

## Sample `.env`

The following two `.env` files are required for the frontend and backend services. Please make sure these are created before development.

### `ynot-server/.env`:

Currently, variables from `APP_URL` to `PATH_TO_PRIVATE_KEY` (inclusive) are not used, but these fields should be in your `.env` as they are dependencies for Pydantic. `JWT_SECRET` is required as well.

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ynot_db
POSTGRES_HOST=db
POSTGRES_PORT=5432

APP_PORT=8000
APP_ENV=development

APP_URL=http://127.0.0.1:8000
ATPROTOCOL_CLIENT_ID=https://ynot.lol/client-metadata.json
ATPROTOCOL_CLIENT_SECRET=your-client-secret
ATPROTOCOL_REDIRECT_URI=https://ynot.lol/oauth/callback
PATH_TO_PRIVATE_KEY=path-to-your-private-key


JWT_SECRET=🤐
PRIVATE_JWK={"crv":"P-256","x":"🤐","y":"🤐","d":"🤐","kty":"EC","kid":"🤐"}
SESSION_SECRET=🤐
```

### `ynot-server/y-frontend/.env`

This is the URL for the API. Set this to `http://127.0.0.1:8000` for local development.

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

To populate the database with sample site and tags data, send a `GET` request to `http://127.0.0.1:8000/api/insert-sample-data`. Otherwise, the home page will be empty.

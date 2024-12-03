# https://ynot.lol

```
cd ynot-server
docker compose up --build -d

cd ynot-server/y-frontend
npm run dev
```

Served at `http://localhost:8000`. For questions, email [arnav@surve.dev](mailto:arnav@surve.dev).

---

## Sample `.env`

The following two `.env` files are required for the frontend and backend services. Please make sure these are created before development.

### `ynot-server/.env`:

Currently, variables from `APP_URL` to `PATH_TO_PRIVATE_KEY` are not used, but these fields should be in your `.env` as they are dependencies for Pydantic. `JWT_SECRET` is required as well.

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ynot_db
POSTGRES_HOST=db
POSTGRES_PORT=5432

APP_PORT=8000
APP_ENV=development
API_BASE_URL=http://localhost

APP_URL=http://localhost:8000
ATPROTOCOL_CLIENT_ID=http://ynot.lol/static/client-metadata.json
ATPROTOCOL_CLIENT_SECRET=your-client-secret
ATPROTOCOL_REDIRECT_URI=http://ynot.lol/oauth/callback
PATH_TO_PRIVATE_KEY=path-to-your-private-key


JWT_SECRET=🤐
```

### `ynot-server/y-frontend/.env`

This is the URL for the API. Set this to `http://127.0.0.1:8000` for local development.

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

To populate the database with sample site and tags data, send a `GET` request to `http://localhost:8000/api/insert-sample-data`. Otherwise, the home page will be empty.

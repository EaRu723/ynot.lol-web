# https://ynot.lol

```
cd ynot-server
docker compose up --build -d
```

Served at `http://localhost:8000`

---

Environment variables (`ynot-server/.env`):

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
PATH_TO_PRIVATE_KEY=path-to-private-key


JWT_SECRET=🤐
```

To populate the database with sample data, send a `GET` request to `http://localhost:8000/api/insert-sample-data`.

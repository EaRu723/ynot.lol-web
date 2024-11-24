# https://ynot.lol

```
cd ynot-server
docker compose up --build -d
```

Served at `http://localhost:8000`

---

Environment variables (`ynot-server/.env`):

If this file does not exist, create it.

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ynot_db
POSTGRES_HOST=db
POSTGRES_PORT=5432

APP_PORT=8000
APP_ENV=development
```
You should be able to plug and play a `.env` with these values.

To populate the database with sample data, send a `POST` request to `http://localhost:8000/api/insert-sample-data`.

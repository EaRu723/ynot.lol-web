FROM node:16 as build-stage
WORKDIR /frontend
COPY y-frontend/package*.json ./
RUN npm install
COPY y-frontend/ ./
RUN npm run build

FROM python:3.13.0-slim-bookworm
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["sh", "-c", "python -m app.db.create_tables && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]

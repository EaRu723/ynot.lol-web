FROM python:3.13.0-alpine3.20
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/

ENV PYTHONPATH=/app

EXPOSE 8000
CMD ["sh", "-c", "python -m app.db.create_tables && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]

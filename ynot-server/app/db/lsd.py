import asyncio

from psycopg2 import pool

from app.config import settings


class LSD:
    def __init__(self):
        self.pool = None

    def connect(self):
        """Create a threaded connection pool using psycopg2."""
        self.pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=(
                f"dbname='{settings.lsd_db}' "
                f"host='{settings.lsd_host}' "
                f"user='{settings.lsd_user}' "
                f"password='{settings.lsd_password}'"
            ),
        )

    def disconnect(self):
        """Close all connections in the pool."""
        if self.pool:
            self.pool.closeall()

    def get_connection(self):
        """Retrieve a connection from the pool."""
        assert self.pool is not None, "Connection pool is not initialized!"
        return self.pool.getconn()

    def put_connection(self, conn):
        """Return a connection to the pool."""
        if self.pool:
            self.pool.putconn(conn)


lsd = LSD()


async def get_lsd_conn():
    conn = await asyncio.to_thread(lsd.get_connection)
    try:
        yield conn
    finally:
        await asyncio.to_thread(lsd.put_connection, conn)

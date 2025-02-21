import asyncio

from psycopg2.extensions import connection


async def parse_markdown(url: str, lsd: connection) -> str | None:
    """
    Get markdown content of a webpage by URL.
    """

    query = f"""
    FROM "{url}"
    |> SELECT MARKDOWN as content
    """

    def blocking_query():
        with lsd.cursor() as curs:
            curs.execute(query)
            row = curs.fetchone()
            return row[0] if row else None

    content = await asyncio.to_thread(blocking_query)

    return content

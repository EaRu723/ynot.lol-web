from atproto import AsyncClient, SessionEvent
from app.auth import get_user
from app.db.db import get_async_session

# Initialize the AsyncClient
async_client = AsyncClient()

# Handle session changes
@async_client.on_session_change
async def on_session_change(event, session):
    if event in (SessionEvent.CREATE, SessionEvent.REFRESH):
        print(f"Session changed: {event}")
        # Save the updated session string back to the user's record
        async for db in get_async_session():
            user = await get_user(db, session.handle)
            if user:
                user.session = session.session_string
                db.add(user)
                await db.commit()

# Export the client for use in other modules
def get_async_client() -> AsyncClient:
    return async_client
from atproto import AsyncClient, SessionEvent
from app.auth import get_user, fake_users_db

# Initialize the AsyncClient
async_client = AsyncClient()

# Handle session changes
@async_client.on_session_change
async def on_session_change(event, session):
    if event in (SessionEvent.CREATE, SessionEvent.REFRESH):
        print(f"Session changed: {event}")
        # Save the updated session string back to the user's record
        user = get_user(fake_users_db, session.did)
        if user:
            user.atproto_session = session.export()

# Export the client for use in other modules
def get_async_client() -> AsyncClient:
    return async_client
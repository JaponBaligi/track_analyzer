# api/routes/__init__.py

from fastapi import APIRouter
from .artists import router as artist_router
from .playlists import router as playlist_router
from .track_routes import router as track_router
from .streams import router as streams_router
from .auth import router as auth_router
from .db_view import router as db_router
from .flagged_artists import router as flagged_router
router = APIRouter()

# Public auth endpoints
router.include_router(auth_router, prefix="/auth", tags=["auth"])

# App endpoints
router.include_router(artist_router, prefix="/artists", tags=["artists"])
router.include_router(playlist_router, prefix="/playlists", tags=["playlists"])

# Track routes
# -> /api/tracks/evaluate, /api/tracks/unplayable, /api/stream/update
router.include_router(track_router, prefix="", tags=["tracks"])
router.include_router(db_view.router, prefix="/tracks")

# Stream routes
# -> /api/streams/{track_id} (frontend ile birebir eşleşiyor)
router.include_router(streams_router, prefix="", tags=["streams"])

# Flagged Artist routes
router.include_router(flagged_artists,prefix="flagged_artists", tags=["Flagged Artists"])

# DB views (protected)
router.include_router(db_router, prefix="/db", tags=["db"])

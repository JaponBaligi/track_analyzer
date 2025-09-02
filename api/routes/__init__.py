# api/routes/__init__.py

from fastapi import APIRouter
from .artists import router as artist_router
from .playlists import router as playlist_router
from .track_routes import router as track_router
from .streams import router as streams_router
from .auth import router as auth_router
from .db_view import router as db_router

router = APIRouter()

# Public auth endpoints
router.include_router(auth_router, prefix="/auth", tags=["auth"])

# App endpoints (şu an public; frontend'de header ile erişiliyor)
# İstersen bunları dependencies ile koruyabilirsin; şimdilik DB uçlarını guard ediyoruz.
router.include_router(artist_router, prefix="/artists", tags=["artists"])
router.include_router(playlist_router, prefix="/playlists", tags=["playlists"])
router.include_router(track_router, prefix="/tracks", tags=["tracks"])
router.include_router(streams_router, prefix="/streams", tags=["streams"])
router.include_router(db_view.router, prefix="/tracks")
# Protected DB views
router.include_router(db_router, prefix="/db", tags=["db"])
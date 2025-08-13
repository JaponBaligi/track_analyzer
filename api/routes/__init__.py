# api/routes/__init__.py

from fastapi import APIRouter
from .artists import router as artist_router
from .playlists import router as playlist_router
from .track_routes import router as track_router

router = APIRouter()
router.include_router(artist_router, prefix="/artists", tags=["artists"])
router.include_router(playlist_router, prefix="/playlists", tags=["playlists"])
router.include_router(track_router, prefix="/tracks", tags=["tracks"])

# api/routes/playlists.py

from fastapi import APIRouter, HTTPException
from api.services.playlist_service import (
    get_all_playlists,
    get_unplayable_tracks_by_playlist,
)
from utils.logger import get_logger

router = APIRouter(prefix="/playlists", tags=["Playlists"])
logger = get_logger(__name__)


@router.get("/", summary="List all tracked playlists")
def list_playlists() -> list[dict]:
    """
    Veritabanında izlenen tüm çalma listelerini döner.

    Returns:
        List[dict]: Playlist bilgileri listesi
    """
    logger.debug(" Fetching all tracked playlists.")
    playlists = get_all_playlists()

    if not playlists:
        logger.warning("No playlists found in the system.")
        raise HTTPException(status_code=404, detail="No playlists found.")

    logger.info(f"Found {len(playlists)} playlists.")
    return playlists


@router.get("/{playlist_id}/unplayable-tracks", summary="List unplayable tracks in a playlist")
def list_unplayable_tracks(playlist_id: str) -> list[dict]:
    """
    Belirli bir playlist içinde artık çalınamayan (silinmiş veya gizlenmiş) şarkıları döner.

    Args:
        playlist_id (str): Spotify playlist ID

    Returns:
        List[dict]: Ulaşılamayan şarkıların listesi
    """
    logger.debug(f" Fetching unplayable tracks for playlist: {playlist_id}")
    tracks = get_unplayable_tracks_by_playlist(playlist_id)

    if not tracks:
        logger.warning(f"No unplayable tracks found in playlist {playlist_id}.")
        raise HTTPException(status_code=404, detail="No unplayable tracks found for this playlist.")

    logger.info(f" Found {len(tracks)} unplayable tracks in playlist {playlist_id}.")
    return tracks

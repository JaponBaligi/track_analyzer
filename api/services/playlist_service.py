# api/services/playlist_service.py

from db.playlist_storage import PlaylistStorage
from utils.logger import get_logger
from typing import List, Dict

logger = get_logger(__name__)


def get_all_playlists() -> List[Dict[str, str]]:
    """
    Veritabanındaki tüm playlist ID ve sahip bilgilerini döner.

    Returns:
        List[Dict[str, str]]: Playlist bilgileri
    """
    storage = None
    try:
        logger.debug("Fetching all playlists from DB")
        storage = PlaylistStorage()
        storage.c.execute("SELECT id, owner FROM playlists")
        rows = storage.c.fetchall()
        playlists = [{"id": row[0], "owner": row[1]} for row in rows]
        logger.info(f"Found {len(playlists)} playlists")
        return playlists
    except Exception as e:
        logger.exception("Failed to fetch playlists")
        raise
    finally:
        if storage:
            storage.close()


def get_unplayable_tracks_by_playlist(playlist_id: str) -> List[Dict[str, str]]:
    """
    Belirtilen playlist içinde oynatılamayan track'leri döner.

    Args:
        playlist_id (str): Spotify playlist ID

    Returns:
        List[Dict[str, str]]: Oynatılamayan track bilgileri
    """
    storage = None
    try:
        logger.debug(f"Fetching unplayable tracks for playlist: {playlist_id}")
        storage = PlaylistStorage()
        storage.c.execute("""
            SELECT id, name, scan_date 
            FROM unplayable_tracks 
            WHERE playlist_id = ?
        """, (playlist_id,))
        rows = storage.c.fetchall()
        tracks = [
            {"track_id": row[0], "track_name": row[1], "scan_date": row[2]}
            for row in rows
        ]
        logger.info(f"Found {len(tracks)} unplayable tracks for playlist {playlist_id}")
        return tracks
    except Exception as e:
        logger.exception(f"Failed to fetch unplayable tracks for playlist {playlist_id}")
        raise
    finally:
        if storage:
            storage.close()

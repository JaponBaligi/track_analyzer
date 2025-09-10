# spotify_client/track.py

from spotify_client.client import get_spotify_client
from utils.logger import get_logger

logger = get_logger(__name__)
sp = get_spotify_client()

def get_track_popularity(track_id: str) -> int | None:
    """
    Belirtilen track ID için popularity skorunu döner.
    """
    try:
        logger.debug(f"Track popularity sorgulanıyor: {track_id}")
        track = sp.track(track_id)
        popularity = track.get("popularity")
        
        if popularity is not None:
            logger.info(f"Track popularity: {track_id} -> {popularity}")
            return popularity
        else:
            logger.warning(f"Track bulunamadı veya popularity alanı eksik: {track_id}")
            return None

    except Exception as e:
        logger.exception(f"Track popularity alınamadı: {track_id}")
        return None


def get_track_info(track_id: str) -> dict | None:
    """
    Belirtilen track ID için tam bilgileri döner.
    """
    try:
        logger.debug(f"Track bilgileri sorgulanıyor: {track_id}")
        track = sp.track(track_id)

        if not track:
            logger.warning(f"Track bulunamadı: {track_id}")
            return None

        return {
            "id": track["id"],
            "name": track["name"],
            "artist_names": [artist["name"] for artist in track["artists"]],
            "album_name": track["album"]["name"],
            "duration_ms": track["duration_ms"],
            "popularity": track.get("popularity"),
            "is_playable": track.get("is_playable", True),
            "spotify_url": track["external_urls"]["spotify"],
            "image_url": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
            "isrc": track.get("external_ids", {}).get("isrc")
        }

    except Exception as e:
        logger.exception(f"Track bilgileri alınamadı: {track_id}")
        return None

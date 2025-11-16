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


def _extract_upc_from_track(track: dict) -> str | None:
    """Extract UPC from track or album external_ids."""
    track_ext_ids = track.get("external_ids") or {}
    album = track.get("album") or {}
    album_ext_ids = album.get("external_ids") or {}
    return track_ext_ids.get("upc") or album_ext_ids.get("upc")


def _extract_image_url(album: dict) -> str | None:
    """Extract image URL from album images."""
    images = album.get("images", [])
    if images and images[0]:
        return images[0].get("url")
    return None


def get_track_info(track_id: str) -> dict | None:
    """
    Belirtilen track ID için tam bilgileri döner.
    UPC hem track hem album external_ids'den alınır.
    """
    try:
        logger.debug(f"Track bilgileri sorgulanıyor: {track_id}")
        track = sp.track(track_id)

        if not track:
            logger.warning(f"Track bulunamadı: {track_id}")
            return None

        album = track.get("album") or {}
        track_ext_ids = track.get("external_ids") or {}
        upc = _extract_upc_from_track(track)
        image_url = _extract_image_url(album)

        return {
            "id": track.get("id"),
            "name": track.get("name"),
            "artist_names": [artist.get("name") for artist in track.get("artists", [])],
            "album_name": album.get("name"),
            "duration_ms": track.get("duration_ms"),
            "popularity": track.get("popularity"),
            "is_playable": track.get("is_playable", True),
            "spotify_url": (track.get("external_urls") or {}).get("spotify"),
            "image_url": image_url,
            "isrc": track_ext_ids.get("isrc"),
            "upc": upc
        }

    except Exception as e:
        logger.exception(f"Track bilgileri alınamadı: {track_id}")
        return None
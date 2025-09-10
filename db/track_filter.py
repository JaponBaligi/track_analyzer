# db/track_filter.py
from typing import Dict, Any
from . import flagged_artists
from utils.logger import get_logger

logger = get_logger(__name__)

# //[should_skip_track] : return True if track should be skipped because an artist is flagged
def should_skip_track(track: Dict[str, Any]) -> bool:
    """
    Checks track['artist_names'] which can be list or JSON string.
    Performs exact match (case & unicode sensitive) against flagged artists.
    Returns True if any artist matches a flagged name.
    """
    try:
        artists = track.get("artist_names") or []
        if isinstance(artists, str):
            try:
                import json
                artists_list = json.loads(artists)
            except Exception:
                artists_list = [artists]
        elif isinstance(artists, list):
            artists_list = artists
        else:
            artists_list = []
        flagged = flagged_artists.get_flagged_names_set()
        for a in artists_list:
            if a in flagged:
                logger.info("Skipping track %s because artist %s is flagged", track.get("id"), a)
                return True
        return False
    except Exception as e:
        logger.exception("should_skip_track hata: %s", e)
        return False

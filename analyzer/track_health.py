# analyzer/track_health.py

from spotify_client.track import get_track_popularity
from utils.logger import get_logger

logger = get_logger(__name__)

def get_track_popularity_value(track_id: str) -> int | None:
    """
    Belirtilen track'in popülerlik değerini döner.

    Args:
        track_id (str): Spotify track ID.

    Returns:
        int | None: Popülerlik değeri (0–100 arası) veya None.
    """
    try:
        logger.debug(f"Fetching popularity for track: {track_id}")
        popularity = get_track_popularity(track_id)

        if popularity is None:
            logger.warning(f"Track {track_id} returned no popularity value.")
            return None

        logger.info(f"Track {track_id} popularity = {popularity}")
        return popularity

    except Exception as e:
        logger.exception(f"Error while fetching popularity for track {track_id}")
        return None

# api/services/track_service.py

from analyzer.track_health import get_track_popularity_value
from spotify_client.stream_data import get_historical_stream_count, get_current_stream_count
from db.track_storage import TrackStorage
from fastapi import HTTPException
from utils.logger import get_logger
import datetime

logger = get_logger(__name__)

def evaluate_unplayable_track(track_id: str):
    """
    Unplayable track için popülerlik ve stream sayısı bilgilerini döner.
    """
    try:
        logger.info(f"Evaluating unplayable track: {track_id}")
        popularity = get_track_popularity_value(track_id)
        stream_data = get_current_stream_count(track_id)
        stream_count = stream_data.get("streamCount") if stream_data else None

        return {
            "track_id": track_id,
            "popularity": popularity,
            "stream_count": stream_count,
        }
    except Exception as e:
        logger.exception(f"Error evaluating unplayable track: {track_id}")
        raise HTTPException(status_code=500, detail=str(e))

def update_stream_data_for_unplayable(track_id: str):
    """
    Stream verisini çekip DB'ye kaydeder.
    """
    historical_data = get_historical_stream_count(track_id)
    current_data = get_current_stream_count(track_id)

    if not historical_data or "error" in historical_data or not current_data or "error" in current_data:
        logger.warning(f"Stream data fetch error for track {track_id}")
        return {"status": "error", "message": "Stream data fetch failed"}

    try:
        storage = TrackStorage()
        storage.save_track_stream_data(track_id, historical_data, current_data)
        storage.close()
        logger.info(f"Stream data saved for track {track_id}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error saving stream data for track {track_id}: {e}")
        return {"status": "error", "message": str(e)}

def save_unplayable_track(track_data: dict):
    """
    Unplayable track verisini kaydeder (backend'de kullanılır).
    """
    storage = TrackStorage()
    try:
        storage.save_unplayable_track(track_data)
    finally:
        storage.close()

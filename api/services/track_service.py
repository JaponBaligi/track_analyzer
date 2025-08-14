# api/services/track_service.py

from analyzer.track_health import get_track_popularity_value
from spotify_client.stream_data import get_historical_stream_count
from db.track_storage import TrackStorage
from fastapi import HTTPException
from utils.logger import get_logger

logger = get_logger(__name__)

def evaluate_unplayable_track(track_id: str):
    """
    Unplayable track için popülerlik ve sadece historical stream verisini döner.
    """
    try:
        logger.info(f"Evaluating unplayable track: {track_id}")
        popularity = get_track_popularity_value(track_id)
        historical_data = get_historical_stream_count(track_id)

        historical_streams = None
        if isinstance(historical_data, dict) and "error" not in historical_data:
            historical_streams = historical_data.get("streams")
        elif isinstance(historical_data, list):
            historical_streams = historical_data  # Liste formatı da desteklenir

        return {
            "track_id": track_id,
            "popularity": popularity,
            "historical": historical_streams
        }
    except Exception as e:
        logger.exception(f"Error evaluating unplayable track: {track_id}")
        raise HTTPException(status_code=500, detail=str(e))


def update_stream_data_for_unplayable(track_id: str):
    """
    Sadece historical stream verisini çekip DB'ye kaydeder.
    """
    historical_data = get_historical_stream_count(track_id)

    if not historical_data or (isinstance(historical_data, dict) and "error" in historical_data):
        logger.warning(f"Historical stream data fetch error for track {track_id}")
        return {"status": "error", "message": "Historical stream data fetch failed"}

    try:
        storage = TrackStorage()
        # Dict ise "streams" alanını al, list ise direkt kaydet
        if isinstance(historical_data, dict) and "streams" in historical_data:
            storage.save_track_stream_data(track_id, historical_data)
        elif isinstance(historical_data, list):
            storage.save_track_stream_data(track_id, {"streams": historical_data})
        else:
            logger.warning(f"Unexpected historical data format for {track_id}: {type(historical_data)}")
            return {"status": "error", "message": "Unexpected data format"}
        storage.close()
        logger.info(f"Historical stream data saved for track {track_id}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error saving historical stream data for track {track_id}: {e}")
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

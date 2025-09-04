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


def update_stream_data_for_unplayable(track_id: str, owner: str):
    """
    RapidAPI'den stream verisi çekip normalize edip DB'ye kaydeder.
    """
    historical_data = get_historical_stream_count(track_id)

    if not historical_data or (isinstance(historical_data, dict) and "error" in historical_data):
        logger.warning(f"Historical stream data fetch error for track {track_id}")
        return {"status": "error", "message": "Historical stream data fetch failed"}

    try:
        # Normalize
        if isinstance(historical_data, dict) and "streams" in historical_data:
            raw_streams = historical_data["streams"]
        elif isinstance(historical_data, list):
            raw_streams = historical_data
        else:
            logger.warning(f"Unexpected historical data format for {track_id}: {type(historical_data)}")
            return {"status": "error", "message": "Unexpected data format"}

        normalized_streams = []
        for item in raw_streams:
            if isinstance(item, dict) and "date" in item and "streams" in item:
                normalized_streams.append({"date": str(item["date"]), "streams": int(item["streams"])})
            elif isinstance(item, (list, tuple)) and len(item) == 2:
                normalized_streams.append({"date": str(item[0]), "streams": int(item[1])})

        storage = TrackStorage()
        storage.save_track_stream_data(track_id, {"streams": normalized_streams}, owner)
        storage.close()

        logger.info(f"Historical stream data saved for track {track_id} (owner={owner})")
        return {"status": "success", "historicalData": normalized_streams}
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

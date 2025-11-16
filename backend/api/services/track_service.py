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


def _handle_historical_data_error(historical_data: dict) -> dict:
    """Handle error responses from historical data fetch. Returns error response dict."""
    error_type = historical_data.get("error")
    error_message = historical_data.get("message", "Historical stream data fetch failed")
    
    if error_type == "not_found":
        return {
            "status": "error",
            "error_type": "not_found",
            "message": "Song not found in Soundcharts database. It may be added within 24 hours."
        }
    elif error_type == "quota_exceeded":
        return {
            "status": "error",
            "error_type": "quota_exceeded",
            "message": "Soundcharts API quota exceeded or billing issue. Please check your account."
        }
    else:
        return {
            "status": "error",
            "error_type": "fetch_failed",
            "message": error_message
        }


def _extract_raw_streams(historical_data) -> list:
    """Extract raw streams list from historical data (dict or list format)."""
    if isinstance(historical_data, dict) and "streams" in historical_data:
        return historical_data["streams"]
    elif isinstance(historical_data, list):
        return historical_data
    return None


def _normalize_stream_item(item) -> dict | None:
    """Normalize a single stream item to {date, streams} format."""
    if isinstance(item, dict) and "date" in item and "streams" in item:
        return {"date": str(item["date"]), "streams": int(item["streams"])}
    elif isinstance(item, (list, tuple)) and len(item) == 2:
        return {"date": str(item[0]), "streams": int(item[1])}
    return None


def _normalize_streams(raw_streams: list) -> list[dict]:
    """Normalize list of stream items to standard format."""
    normalized_streams = []
    for item in raw_streams:
        normalized = _normalize_stream_item(item)
        if normalized:
            normalized_streams.append(normalized)
    return normalized_streams


def update_stream_data_for_unplayable(track_id: str, owner: str):
    """
    Soundcharts API'den stream verisi çekip normalize edip DB'ye kaydeder.
    Merges new data with existing data (incremental update).
    """
    historical_data = get_historical_stream_count(track_id)

    if not historical_data or (isinstance(historical_data, dict) and "error" in historical_data):
        return _handle_historical_data_error(
            historical_data if isinstance(historical_data, dict) else {}
        )

    try:
        raw_streams = _extract_raw_streams(historical_data)
        if raw_streams is None:
            logger.warning(f"Unexpected historical data format for {track_id}: {type(historical_data)}")
            return {"status": "error", "message": "Unexpected data format"}

        normalized_streams = _normalize_streams(raw_streams)

        storage = TrackStorage()
        storage.save_track_stream_data(track_id, {"streams": normalized_streams}, owner, merge=True)
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

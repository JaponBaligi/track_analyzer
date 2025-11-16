# api/routes/track_routes.py

from fastapi import APIRouter, HTTPException, Query, Depends
from api.services.track_service import evaluate_unplayable_track, update_stream_data_for_unplayable
from spotify_client.stream_data import get_track_stream_data
from utils.logger import get_logger
from db.track_storage import TrackStorage
from api.dependencies import get_current_user
from statistics import mean
import json

router = APIRouter(tags=["Track"])
logger = get_logger(__name__)

@router.get("/tracks/evaluate")
def track_evaluation(track_id: str = Query(..., description="Spotify Track ID")):
    """
    Verilen unplayable track ID için popülarite ve sadece historical stream bilgilerini döner.
    """
    logger.debug(f"Evaluating track popularity/stream for track_id: {track_id}")

    try:
        # Popülarite bilgisini al
        popularity_data = evaluate_unplayable_track(track_id)

        # Historical stream verisini al
        stream_data = get_track_stream_data(track_id)

        # Raw historical veriyi al
        raw_historical = stream_data.get("historicalData", [])

        # [[date, streams], ...] formatını [{date:..., streams:...}, ...] formatına çevir
        historical_list = []
        if isinstance(raw_historical, list):
            for item in raw_historical:
                if isinstance(item, (list, tuple)) and len(item) == 2:
                    historical_list.append({"date": item[0], "streams": item[1]})
                elif isinstance(item, dict) and "date" in item and "streams" in item:
                    historical_list.append(item)

        response_data = {
            "track_id": track_id,
            "popularity": popularity_data.get("popularity"),
            "historical": historical_list
        }

        # JSON olarak logla
        logger.debug("=== /tracks/evaluate RESPONSE ===")
        try:
            logger.debug(json.dumps(response_data, indent=2, ensure_ascii=False))
        except Exception as e:
            logger.warning(f"JSON dump error: {e}")
            logger.debug(f"Response data: {response_data}")
        logger.debug("=================================")

        return response_data

    except Exception as e:
        logger.error(f"Error evaluating track {track_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unplayable")
def fetch_unplayable_tracks(owner: str = Depends(get_current_user)):
    logger.debug("Fetching unplayable tracks from DB...")
    storage = TrackStorage()
    try:
        tracks = storage.get_unplayable_tracks(owner=owner)
        return tracks
    finally:
        storage.close()


@router.get("/streams/{track_id}")
def get_streams(track_id: str, owner: str = Depends(get_current_user)):
    storage = TrackStorage()
    try:
        historical = storage.get_track_historical(track_id, owner)
        if historical:  # DB'de veri varsa direkt dön
            # Calculate daily average (günlük ortalama)
            daily_average = None
            if isinstance(historical, list) and len(historical) >= 2:
                daily_diffs = []
                for i in range(1, len(historical)):
                    if isinstance(historical[i], dict) and isinstance(historical[i-1], dict):
                        current_streams = historical[i].get("streams", 0)
                        prev_streams = historical[i-1].get("streams", 0)
                        diff = current_streams - prev_streams
                        if diff >= 0:  # Only count positive differences
                            daily_diffs.append(diff)
                
                if daily_diffs:
                    daily_average = round(mean(daily_diffs), 2)
            
            return {
                "error": False,
                "historicalData": historical,
                "daily_average": daily_average
            }
        else:  # DB'de veri yoksa frontend'e mesaj gönder
            return {"error": True, "message": "No historical data in DB"}
    finally:
        storage.close()


@router.post("/stream/update")
def update_stream_data(
    track_id: str = Query(..., description="Spotify Track ID"),
    owner: str = Depends(get_current_user)
):
    logger.debug(f"Updating stream data for track {track_id} (owner={owner})")
    
    # Soundcharts API'den çek ve kaydet (incremental merge yapılacak)
    result = update_stream_data_for_unplayable(track_id, owner)
    
    if result["status"] == "error":
        error_type = result.get("error_type", "unknown")
        message = result.get("message", "Unknown error")
        
        # Map error types to appropriate HTTP status codes
        if error_type == "not_found":
            raise HTTPException(status_code=404, detail=message)
        elif error_type == "quota_exceeded":
            raise HTTPException(status_code=403, detail=message)
        else:
            raise HTTPException(status_code=500, detail=message)
    
    return result


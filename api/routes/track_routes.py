# api/routes/track_routes.py

from fastapi import APIRouter, HTTPException, Query
from api.services.track_service import evaluate_unplayable_track, update_stream_data_for_unplayable
from spotify_client.stream_data import get_track_stream_data
from utils.logger import get_logger
from db.track_storage import TrackStorage
import json

router = APIRouter(tags=["Track"])
logger = get_logger(__name__)

@router.get("/evaluate")
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
                    historical_list.append({
                        "date": item[0],
                        "streams": item[1]
                    })
                elif isinstance(item, dict) and "date" in item and "streams" in item:
                    historical_list.append(item)  # Zaten doğru formatta ise ekle

        response_data = {
            "track_id": track_id,
            "popularity": popularity_data.get("popularity"),
            "historical": historical_list
        }

        # JSON olarak logla
        print("\n=== /tracks/evaluate RESPONSE ===")
        try:
            print(json.dumps(response_data, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"JSON dump error: {e}")
            print(response_data)
        print("=================================\n")

        return response_data

    except Exception as e:
        logger.error(f"Error evaluating track {track_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unplayable")
def fetch_unplayable_tracks():
    logger.debug("Fetching unplayable tracks from DB...")
    storage = TrackStorage()
    try:
        tracks = storage.get_unplayable_tracks()
        return tracks
    finally:
        storage.close()

@router.post("/stream/update")
def update_stream_data(track_id: str = Query(..., description="Spotify Track ID")):
    logger.debug(f"Updating stream data for track {track_id}")
    result = update_stream_data_for_unplayable(track_id)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return {"status": "success"}

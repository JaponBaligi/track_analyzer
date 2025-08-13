# api/routes/track_routes.py

from fastapi import APIRouter, HTTPException, Query
from api.services.track_service import evaluate_unplayable_track, update_stream_data_for_unplayable
from spotify_client.stream_data import get_track_stream_data
from utils.logger import get_logger
from db.track_storage import TrackStorage

router = APIRouter(tags=["Track"])
logger = get_logger(__name__)

@router.get("/evaluate")
def track_evaluation(track_id: str = Query(..., description="Spotify Track ID")):
    """
    Verilen unplayable track ID için popülarite ve stream count bilgilerini döner.
    """
    logger.debug(f"Evaluating track popularity/stream for track_id: {track_id}")

    try:
        # Önce mevcut popülarite bilgisini al
        popularity_data = evaluate_unplayable_track(track_id)

        # Ardından stream verisini çek
        stream_data = get_track_stream_data(track_id)

        # Birleştirip döndür
        return {
            "track_id": track_id,
            "popularity": popularity_data.get("popularity"),
            "stream_count": stream_data.get("streamCount"),
            "historical": stream_data.get("historicalData", {})
        }
    except Exception as e:
        logger.error(f"Error evaluating track {track_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/unplayable")
def fetch_unplayable_tracks():
    """
    Veritabanındaki çalınamayan şarkıları detaylı olarak döner.
    """
    logger.debug("Fetching unplayable tracks from DB...")
    storage = TrackStorage()
    try:
        tracks = storage.get_unplayable_tracks()
        return tracks
    finally:
        storage.close()

@router.post("/stream/update")
def update_stream_data(track_id: str = Query(..., description="Spotify Track ID")):
    """
    Belirtilen track için stream verisini günceller.
    """
    logger.debug(f"Updating stream data for track {track_id}")
    result = update_stream_data_for_unplayable(track_id)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return {"status": "success"}

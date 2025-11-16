# api/routes/streams_bulk.py

from fastapi import APIRouter, Depends, BackgroundTasks
from api.dependencies import get_current_user
from api.services.track_service import update_stream_data_for_unplayable
from db.track_storage import TrackStorage
from utils.logger import get_logger
from typing import List, Optional
import time
from statistics import mean

router = APIRouter(tags=["Streams Bulk"])
logger = get_logger(__name__)

# Rate limiting: 8000 requests per minute = ~133 requests per second
# We'll use 130 requests per second to stay safely under 8000/minute (7800/minute)
REQUESTS_PER_SECOND = 130
DELAY_BETWEEN_REQUESTS = 1.0 / REQUESTS_PER_SECOND  # ~0.0077 seconds = ~7.7ms


def calculate_daily_average_from_historical(historical: List[dict]) -> float | None:
    """
    Calculate daily average from historical stream data.
    Returns None if insufficient data.
    """
    if not historical or len(historical) < 2:
        return None
    
    daily_diffs = []
    for i in range(1, len(historical)):
        if isinstance(historical[i], dict) and isinstance(historical[i-1], dict):
            current_streams = historical[i].get("streams", 0)
            prev_streams = historical[i-1].get("streams", 0)
            diff = current_streams - prev_streams
            if diff >= 0:  # Only count positive differences
                daily_diffs.append(diff)
    
    if not daily_diffs:
        return None
    
    return round(mean(daily_diffs), 2)


def process_bulk_update(track_ids: List[str], owner: str):
    """
    Background task to process bulk stream updates.
    """
    storage = TrackStorage()
    
    try:
        for i, track_id in enumerate(track_ids):
            try:
                # Update stream data
                update_result = update_stream_data_for_unplayable(track_id, owner)
                
                if update_result.get("status") == "error":
                    error_type = update_result.get("error_type", "unknown")
                    logger.warning(f"Failed to update stream data for {track_id}: {error_type}")
                    continue
                
                # Get updated historical data
                historical = storage.get_track_historical(track_id, owner)
                
                if historical and len(historical) >= 2:
                    # Calculate daily average
                    daily_avg = calculate_daily_average_from_historical(historical)
                    
                    if daily_avg and daily_avg > 5000:
                        # Save as priority track
                        storage.upsert_priority_track(track_id, owner, int(daily_avg))
                        logger.info(f"Track {track_id} promoted to priority (daily avg: {daily_avg})")
                
            except Exception as e:
                logger.error(f"Error processing track {track_id}: {e}")
            
            # Rate limiting: wait between requests (except for the last one)
            if i < len(track_ids) - 1:
                time.sleep(DELAY_BETWEEN_REQUESTS)
    
    finally:
        storage.close()


@router.post("/streams/bulk-update")
def bulk_update_streams(
    track_ids: Optional[List[str]] = None,
    background_tasks: BackgroundTasks = None,
    owner: str = Depends(get_current_user)
):
    """
    Bulk update stream data for multiple tracks with rate limiting.
    If daily average > 5000, track is saved as priority.
    
    Rate limit: 8000 requests/minute (we use 7800/minute = 130/sec to be safe)
    
    If track_ids is empty or None, fetches all unplayable tracks for the owner.
    
    This endpoint starts the bulk update in the background and returns immediately.
    """
    storage = TrackStorage()
    
    try:
        # If no track IDs provided, fetch all unplayable tracks for the owner
        if not track_ids:
            all_tracks = storage.get_unplayable_tracks(owner=owner)
            track_ids = [track.get("id") or track.get("track_id") for track in all_tracks if track.get("id") or track.get("track_id")]
            track_ids = [tid for tid in track_ids if tid]  # Filter out None/empty
        
        if not track_ids:
            return {"status": "error", "message": "No tracks found to update"}
        
        # Start background task
        if background_tasks:
            background_tasks.add_task(process_bulk_update, track_ids, owner)
        else:
            # If no background tasks available, run synchronously (not recommended for large batches)
            process_bulk_update(track_ids, owner)
        
        return {
            "status": "started",
            "total": len(track_ids),
            "message": f"Bulk update started for {len(track_ids)} tracks. Processing in background."
        }
    finally:
        storage.close()


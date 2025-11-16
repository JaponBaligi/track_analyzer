# spotify_client/stream_data.py

import os
import time
import requests
from utils.logger import get_logger
from db.track_storage import save_track_stream_data
from db.stream_failures import (
    create_failed_tracks_table, is_track_failed, mark_track_as_failed
)
from spotify_client.soundcharts_client import (
    get_or_fetch_track_uuid,
    get_song_audience,
    extract_stream_data_from_audience
)

create_failed_tracks_table()
logger = get_logger(__name__)

# ============================================================================
# RAPIDAPI CODE (COMMENTED OUT - KEPT FOR REFERENCE)
# ============================================================================
# RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
# if not RAPIDAPI_KEY:
#     logger.warning("RAPIDAPI_KEY environment variable not set. Stream data fetching may fail.")
#     RAPIDAPI_KEY = ""
# 
# BASE_URL = "https://spotify-stream-count.p.rapidapi.com/v1/spotify/tracks"
# 
# HEADERS = {
#     "X-RapidAPI-Key": RAPIDAPI_KEY,
#     "X-RapidAPI-Host": "spotify-stream-count.p.rapidapi.com"
# }
# 
# RETRY_COUNT = 2
# RETRY_DELAY = 10  # saniye
# 
# 
# def fetch_with_retry(url: str, headers: dict, retries: int = RETRY_COUNT, delay: int = RETRY_DELAY) -> dict:
#     for attempt in range(1, retries + 1):
#         try:
#             response = requests.get(url, headers=headers, timeout=20)
#             if response.status_code == 429:
#                 retry_after = response.headers.get("Retry-After")
#                 wait_time = int(retry_after) if retry_after and retry_after.isdigit() else delay
#                 logger.warning(f"Rate limited (429) on attempt {attempt}/{retries}, waiting {wait_time} seconds...")
#                 time.sleep(wait_time)
#                 continue
# 
#             response.raise_for_status()
#             return response.json()
# 
#         except requests.RequestException as e:
#             logger.warning(f"Request failed for {url} (attempt {attempt}/{retries}): {e}")
#             if attempt < retries:
#                 time.sleep(delay)
#             else:
#                 logger.error(f"Max retry limit reached for {url}")
#                 return {"error": str(e)}
# 
#     return {"error": "Max retries reached without success"}
# 
# 
# def get_historical_stream_count(track_id: str) -> dict:
#     """
#     RapidAPI'den gelen cevabı normalize eder.
#     API bazen liste döndürdüğü için, listeyi {"streams": [...]} formatına çevirir.
#     """
#     url = f"{BASE_URL}/{track_id}/streams"
#     logger.debug(f"Fetching historical stream count for track_id={track_id}")
#     resp = fetch_with_retry(url, HEADERS)
# 
#     # Liste dönerse dict içine sar
#     if isinstance(resp, list):
#         return {"streams": resp}
#     return resp
# ============================================================================

# ============================================================================
# SOUNDCHARTS IMPLEMENTATION
# ============================================================================

def get_historical_stream_count(track_id: str) -> dict:
    """
    Soundcharts API'den historical stream verisini alır.
    Önce UUID'yi cache'den veya API'den alır, sonra audience verisini çeker.
    
    Returns:
        {"streams": [{"date": "YYYY-MM-DD", "streams": int}, ...]} veya {"error": ...}
    """
    logger.debug(f"Fetching historical stream count for track_id={track_id} from Soundcharts")
    
    # Get or fetch UUID
    uuid = get_or_fetch_track_uuid(track_id)
    if not uuid:
        logger.warning(f"Could not get UUID for track {track_id}")
        return {"error": "uuid_not_found", "message": "Could not get Soundcharts UUID for this track"}
    
    # Get audience data (no date range = last 90 days)
    audience_data = get_song_audience(uuid, identifier=track_id)
    
    if "error" in audience_data:
        error_type = audience_data.get("error")
        if error_type == "not_found":
            logger.warning(f"Track {track_id} not found in Soundcharts database")
            return {"error": "not_found", "message": "Song not found in Soundcharts database"}
        elif error_type == "quota_exceeded":
            logger.error(f"Soundcharts quota exceeded for track {track_id}")
            return {"error": "quota_exceeded", "message": "Soundcharts API quota exceeded or billing issue"}
        else:
            logger.error(f"Error fetching audience data for track {track_id}: {audience_data.get('message')}")
            return audience_data
    
    # Extract stream data from audience response
    stream_data = extract_stream_data_from_audience(audience_data, track_id)
    
    if not stream_data:
        logger.warning(f"No stream data found in audience response for track {track_id}")
        return {"error": "no_data", "message": "No stream data found in Soundcharts response"}
    
    return {"streams": stream_data}


def get_stream_data_for_unplayable(track_data: dict):
    """
    Sadece historical stream verisini alır ve kaydeder.
    """
    if track_data.get("is_playable", True):
        logger.info(f"Track {track_data.get('id')} playable, stream data alınmayacak.")
        return

    track_id = track_data.get("id")
    if not track_id:
        logger.error("Track ID eksik.")
        return

    if is_track_failed(track_id):
        logger.info(f"Track {track_id} daha önce başarısız olmuş, tekrar denenmeyecek.")
        return

    historical = get_historical_stream_count(track_id)

    if historical and "error" not in historical and historical.get("streams") is not None:
        stream_data = {
            "historical_streams": historical.get("streams")
        }
        # Note: save_track_stream_data expects track_id, not track_data
        save_track_stream_data(track_id, {"streams": historical.get("streams")}, track_data.get("owner"))
    else:
        error_type = historical.get("error") if isinstance(historical, dict) else None
        if error_type == "not_found":
            logger.warning(f"Track {track_id} not found in Soundcharts - will not mark as failed (may be added later)")
            # Don't mark as failed for 404 - song might be added to Soundcharts later
        else:
            logger.warning(f"Stream verileri eksik veya hatalı: historical={historical}")
            mark_track_as_failed(track_id)


def get_track_stream_data(track_id: str) -> dict:
    """
    Verilen track_id için sadece historical stream verisini döner.
    """
    historical = get_historical_stream_count(track_id)

    if "error" in historical:
        error_type = historical.get("error")
        error_message = historical.get("message", "Unknown error")
        return {
            "error": True,
            "error_type": error_type,
            "message": error_message,
            "historicalData": None
        }

    return {
        "error": False,
        "historicalData": historical.get("streams")
    }

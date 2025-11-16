# spotify_client/soundcharts_client.py

import os
import time
import requests
from typing import Optional, Dict, List, Any
from utils.logger import get_logger
from db.track_storage import TrackStorage

logger = get_logger(__name__)

# Soundcharts API configuration
SOUNDCHARTS_API_KEY = os.getenv("SOUNDCHARTS_API_KEY")
SOUNDCHARTS_APP_ID = os.getenv("SOUNDCHARTS_APP_ID", "soundcharts")
SOUNDCHARTS_BASE_URL = "https://customer.api.soundcharts.com/api/v2"

if not SOUNDCHARTS_API_KEY:
    logger.warning("SOUNDCHARTS_API_KEY environment variable not set. Soundcharts API calls will fail.")
    SOUNDCHARTS_API_KEY = ""

HEADERS = {
    "x-app-id": SOUNDCHARTS_APP_ID,
    "x-api-key": SOUNDCHARTS_API_KEY
}

RETRY_COUNT = 3
RETRY_DELAY = 10  # seconds


def fetch_with_retry(url: str, headers: dict, retries: int = RETRY_COUNT, delay: int = RETRY_DELAY) -> Dict[str, Any]:
    """
    Fetch with retry logic for rate limiting and errors.
    Handles 429 (rate limit), 403 (quota/billing), 404 (not found).
    """
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            # Handle rate limiting (429)
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                wait_time = int(retry_after) if retry_after and retry_after.isdigit() else delay
                logger.warning(f"Rate limited (429) on attempt {attempt}/{retries}, waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue
            
            # Handle quota/billing (403)
            if response.status_code == 403:
                logger.error("Soundcharts API: 403 Forbidden - Check quota or billing status")
                return {"error": "quota_exceeded", "message": "Soundcharts API quota exceeded or billing issue"}
            
            # Handle not found (404)
            if response.status_code == 404:
                logger.warning(f"Soundcharts API: 404 Not Found - Song not in Soundcharts database")
                return {"error": "not_found", "message": "Song not found in Soundcharts database"}
            
            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            logger.warning(f"Request failed for {url} (attempt {attempt}/{retries}): {e}")
            if attempt < retries:
                time.sleep(delay)
            else:
                logger.error(f"Max retry limit reached for {url}")
                return {"error": "request_failed", "message": str(e)}

    return {"error": "max_retries", "message": "Max retries reached without success"}


def get_song_uuid_by_platform_id(identifier: str) -> Optional[str]:
    """
    Get Soundcharts song UUID by Spotify track ID.
    Platform is hardcoded to 'spotify'.
    
    Args:
        identifier: Spotify track ID
    
    Returns:
        Song UUID if found, None otherwise
    """
    platform = "spotify"  # Hardcoded to Spotify
    url = f"{SOUNDCHARTS_BASE_URL}/song/by-platform/{platform}/{identifier}"
    logger.debug(f"Fetching Soundcharts UUID for spotify:{identifier}")
    
    result = fetch_with_retry(url, HEADERS)
    
    if "error" in result:
        logger.warning(f"Failed to get UUID for spotify:{identifier}: {result.get('message')}")
        return None
    
    # Extract UUID from response
    uuid = result.get("uuid")
    if uuid:
        logger.debug(f"Found UUID {uuid} for spotify:{identifier}")
        return uuid
    
    logger.warning(f"No UUID found in response for spotify:{identifier}")
    return None


def get_song_audience(uuid: str, start_date: Optional[str] = None, end_date: Optional[str] = None, identifier: Optional[str] = None) -> Dict[str, Any]:
    """
    Get audience/stream data for a song by UUID.
    Platform is hardcoded to 'spotify'.
    
    Args:
        uuid: Soundcharts song UUID
        start_date: Optional start date (YYYY-MM-DD format)
        end_date: Optional end date (YYYY-MM-DD format)
        identifier: Optional song identifier (Spotify track ID)
    
    Returns:
        Dictionary with audience data or error information
    """
    platform = "spotify"  # Hardcoded to Spotify
    url = f"{SOUNDCHARTS_BASE_URL}/song/{uuid}/audience/{platform}"
    
    # Build query string
    params_list = []
    if start_date:
        params_list.append(f"startDate={start_date}")
    if end_date:
        params_list.append(f"endDate={end_date}")
    if identifier:
        params_list.append(f"identifier={identifier}")
    
    if params_list:
        url += "?" + "&".join(params_list)
    
    logger.debug(f"Fetching audience data for UUID {uuid} (platform: spotify)")
    result = fetch_with_retry(url, HEADERS)
    
    if "error" in result:
        return result
    
    return result


def extract_stream_data_from_audience(audience_data: Dict[str, Any], track_identifier: str) -> List[Dict[str, Any]]:
    """
    Extract stream data from Soundcharts audience response.
    
    Args:
        audience_data: Response from get_song_audience
        track_identifier: Spotify track ID to match against plots
    
    Returns:
        List of {date, streams} dictionaries
    """
    if "error" in audience_data:
        return []
    
    items = audience_data.get("items", [])
    stream_data = []
    
    for item in items:
        date_str = item.get("date", "")
        plots = item.get("plots", [])
        
        # Find the plot that matches our track identifier
        for plot in plots:
            if plot.get("identifier") == track_identifier:
                # Extract date (format: "2025-11-14T00:00:00+00:00" -> "2025-11-14")
                date_only = date_str.split("T")[0] if "T" in date_str else date_str
                stream_data.append({
                    "date": date_only,
                    "streams": int(plot.get("value", 0))
                })
                break
    
    return stream_data


def get_track_uuid_from_cache(track_id: str) -> Optional[str]:
    """
    Get cached UUID for a track from database.
    """
    storage = TrackStorage()
    try:
        uuid = storage.get_track_uuid(track_id)
        return uuid
    finally:
        storage.close()


def cache_track_uuid(track_id: str, uuid: str):
    """
    Cache UUID for a track in database.
    """
    storage = TrackStorage()
    try:
        storage.save_track_uuid(track_id, uuid)
    finally:
        storage.close()


def get_or_fetch_track_uuid(track_id: str) -> Optional[str]:
    """
    Get UUID from cache or fetch from Soundcharts API.
    """
    # Try cache first
    cached_uuid = get_track_uuid_from_cache(track_id)
    if cached_uuid:
        logger.debug(f"Using cached UUID for track {track_id}: {cached_uuid}")
        return cached_uuid
    
    # Fetch from API
    uuid = get_song_uuid_by_platform_id(track_id)
    if uuid:
        cache_track_uuid(track_id, uuid)
        logger.info(f"Cached UUID for track {track_id}: {uuid}")
    
    return uuid


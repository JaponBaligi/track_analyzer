# spotify_client/stream_data.py

import os
import time
import requests
from utils.logger import get_logger
from alerts.trigger import notify_rights_holder
from db.track_storage import save_track_stream_data
from db.stream_failures import (
    create_failed_tracks_table, is_track_failed, mark_track_as_failed
)

create_failed_tracks_table()
logger = get_logger(__name__)

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
BASE_URL = "https://spotify-stream-count.p.rapidapi.com/v1/spotify/tracks"

HEADERS = {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "spotify-stream-count.p.rapidapi.com"
}

RETRY_COUNT = 2
RETRY_DELAY = 10  # saniye


def fetch_with_retry(url: str, headers: dict, retries: int = RETRY_COUNT, delay: int = RETRY_DELAY) -> dict:
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                wait_time = int(retry_after) if retry_after and retry_after.isdigit() else delay
                logger.warning(f"Rate limited (429) on attempt {attempt}/{retries}, waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue

            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            logger.warning(f"Request failed for {url} (attempt {attempt}/{retries}): {e}")
            if attempt < retries:
                time.sleep(delay)
            else:
                logger.error(f"Max retry limit reached for {url}")
                return {"error": str(e)}

    return {"error": "Max retries reached without success"}


def get_historical_stream_count(track_id: str) -> dict:
    url = f"{BASE_URL}/{track_id}/streams"
    logger.debug(f"Fetching historical stream count for track_id={track_id}")
    return fetch_with_retry(url, HEADERS)


def get_current_stream_count(track_id: str) -> dict:
    url = f"{BASE_URL}/{track_id}/streams/current"
    logger.debug(f"Fetching current stream count for track_id={track_id}")
    return fetch_with_retry(url, HEADERS)


def get_stream_data_for_unplayable(track_data: dict):
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
    current = get_current_stream_count(track_id)

    if (
        historical
        and current
        and "error" not in historical
        and "error" not in current
        and historical.get("streams") is not None
        and current.get("streamCount") is not None
    ):
        stream_data = {
            "historical_streams": historical.get("streams"),
            "current_stream_count": current.get("streamCount"),
        }
        save_track_stream_data(track_data, stream_data)
        notify_rights_holder(track_data, stream_data)
    else:
        logger.warning(
            f"Stream verileri eksik veya hatalı: historical={historical}, current={current}"
        )
        mark_track_as_failed(track_id)

def get_track_stream_data(track_id: str) -> dict:
    """
    Verilen track_id için hem current hem historical stream verisini döner.
    """
    historical = get_historical_stream_count(track_id)
    current = get_current_stream_count(track_id)

    if "error" in historical or "error" in current:
        return {
            "error": True,
            "historicalData": historical if "error" not in historical else None,
            "streamCount": current.get("streamCount") if "error" not in current else None
        }

    return {
        "error": False,
        "historicalData": historical.get("streams"),
        "streamCount": current.get("streamCount")
    }

# api/services/artist_service.py

from spotify_client.artist_scanner import pseudo_recursive_scan
from spotify_client.artist_utils import get_artist_info
from utils.logger import get_logger

logger = get_logger(__name__)


def start_artist_scan(artist_name: str, market: str | None = None, max_depth: int = 2) -> dict:
    try:
        logger.info(f"Starting pseudo-recursive scan for: {artist_name} (market={market}, max_depth={max_depth})")
        scan_result = pseudo_recursive_scan(artist_name, max_depth=max_depth, market=market)

        # Güvenli artist_names dönüştürme
        if "tracks" in scan_result and isinstance(scan_result["tracks"], list):
            for track in scan_result["tracks"]:
                artists = track.get("artists") or []
                track["artist_names"] = [a.get("name", "") for a in artists if a.get("name")]
                # Eski artists field'ı frontend'e göndermeye gerek yok
                track.pop("artists", None)

        logger.info(f"Scan completed for: {artist_name}")
        return scan_result
    except Exception as e:
        logger.exception(f"Error during scan for: {artist_name}")
        return {
            "status": "error",
            "message": f"Tarama sırasında hata oluştu: {str(e)}"
        }


def fetch_artist_info(artist_name: str) -> dict:
    try:
        logger.debug(f"Fetching artist info: {artist_name}")
        info = get_artist_info(artist_name)
        logger.info(f"Artist info fetched: {artist_name}")
        return info
    except Exception as e:
        logger.exception(f"Failed to fetch artist info for: {artist_name}")
        return {"error": "Sanatçı bilgileri alınırken hata oluştu."}

# api/routes/artist_routes.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.services.artist_service import start_artist_scan, fetch_artist_info
from utils.logger import get_logger

router = APIRouter(prefix="/artists", tags=["Artists"])
logger = get_logger(__name__)

@router.get("/info")
def get_artist_info(name: str) -> dict:
    """
    Sanatçının temel bilgilerini döner.

    Args:
        name (str): Sanatçının adı

    Returns:
        dict: Sanatçının bilgileri veya hata mesajı
    """
    logger.debug(f"🔍 Artist info requested for: {name}")
    result = fetch_artist_info(name)

    if "error" in result:
        logger.warning(f"Artist info fetch failed for '{name}': {result['error']}")
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/scan")
def scan_artist(name: str) -> dict:
    """
    Belirtilen sanatçının yer aldığı çalma listelerini ve ilişkili sanatçıları tarar.

    Args:
        name (str): Sanatçının adı

    Returns:
        dict: Tarama sonucu
    """
    logger.info(f" Starting scan for artist: {name}")
    result = start_artist_scan(name)

    if result.get("status") == "error":
        logger.error(f"Artist scan failed for '{name}': {result['message']}")
        raise HTTPException(status_code=500, detail=result["message"])

    logger.info(f" Artist scan completed for '{name}'")
    return result

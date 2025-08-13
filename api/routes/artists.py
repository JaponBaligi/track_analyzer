# api/routes/artists.py

from fastapi import APIRouter, HTTPException
from api.schemas.artist import ArtistScanRequest, ArtistInfoResponse
from api.services.artist_service import start_artist_scan as scan_artist_playlists, fetch_artist_info as get_artist_info
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/scan", status_code=202)
async def scan_artist(request: ArtistScanRequest):
    """
    Belirtilen sanatçı için tarama işlemini başlatır (playliste girip kaldırılan trackleri arar).
    """
    artist_name = request.artist_name.strip()
    market = request.region

    if not artist_name:
        logger.warning("Received empty artist name in scan request.")
        raise HTTPException(status_code=400, detail="Artist name is required")

    try:
        logger.info(f"Artist scan started for: {artist_name} with market={market}")
        scan_result = scan_artist_playlists(artist_name, market=market)
        logger.info(f"Artist scan completed for: {artist_name}")

        return {
            "artist": {"name": artist_name},
            "related_artists": [],
            "playlists": scan_result.get("playlists", []),
            "tracks": scan_result.get("tracks", [])
        }

    except Exception as e:
        logger.exception(f"Error scanning artist: {artist_name}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/info", response_model=ArtistInfoResponse)
async def get_artist_basic_info(artist_name: str):
    try:
        logger.debug(f"Fetching info for artist: {artist_name}")
        artist_data = get_artist_info(artist_name)

        if not artist_data:
            logger.warning(f"Artist not found: {artist_name}")
            raise HTTPException(status_code=404, detail="Artist not found")

        return artist_data
    except Exception as e:
        logger.exception(f"Error fetching artist info for: {artist_name}")
        raise HTTPException(status_code=500, detail="Internal server error")

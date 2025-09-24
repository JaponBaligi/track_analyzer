# api/services/artist_db_service.py

from db.artist_storage import ArtistStorage
from utils.logger import get_logger

logger = get_logger(__name__)

def get_all_artists() -> list[str]:
    try:
        storage = ArtistStorage()
        artist_names = storage.get_all_artist_names()
        return artist_names
    except Exception as e:
        logger.exception("Failed to fetch artists from DB")
        return []
    finally:
        if 'storage' in locals():
            storage.close()

from db.artist_storage import ArtistStorage
from spotify_client.artist_scanner import pseudo_recursive_scan
from utils.logger import get_logger

logger = get_logger(__name__)

def scheduled_artist_scan():
    storage = ArtistStorage()
    artist_list = storage.get_all_artists()

    if not artist_list:
        logger.warning("Tarama için sanatçı bulunamadı.")
        return

    for artist_name in artist_list:
        try:
            logger.info(f"Scheduled tarama başlatılıyor: {artist_name}")
            pseudo_recursive_scan(artist_name, max_depth=2)
            logger.info(f"{artist_name} için tarama tamamlandı.")
        except Exception as e:
            logger.exception(f"{artist_name} için tarama hatası.")
    storage.close()

# spotify_client/artist_utils.py

from typing import Optional
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from config.config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
from utils.logger import get_logger

logger = get_logger(__name__)

def get_spotify_client() -> spotipy.Spotify:
    try:
        auth_manager = SpotifyClientCredentials(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET
        )
        return spotipy.Spotify(auth_manager=auth_manager)
    except Exception as e:
        logger.critical("Spotify client başlatılamadı.", exc_info=True)
        raise RuntimeError("Spotify client initialization failed")

def get_artist_id(artist_name: str) -> Optional[str]:
    try:
        logger.debug(f"Artist ID aranıyor: {artist_name}")
        sp = get_spotify_client()
        results = sp.search(q=artist_name, type='artist', limit=1)
        items = results.get('artists', {}).get('items', [])
        
        if not items:
            logger.warning(f"Artist bulunamadı: {artist_name}")
            return None

        artist_id = items[0]['id']
        logger.info(f"Artist bulundu: {artist_name} -> {artist_id}")
        return artist_id
    except Exception:
        logger.exception(f"get_artist_id() başarısız: {artist_name}")
        return None

def get_artist_info(artist_name: str) -> dict:
    try:
        sp = get_spotify_client()
        results = sp.search(q=artist_name, type='artist', limit=1)
        items = results.get('artists', {}).get('items', [])
        if not items:
            logger.warning(f"Artist bulunamadı: {artist_name}")
            return {}

        artist = items[0]
        info = {
            "id": artist.get('id'),
            "name": artist.get('name'),
            "followers": artist.get('followers', {}).get('total', 0),
            "genres": artist.get('genres', []),
            "image_url": artist.get('images')[0]['url'] if artist.get('images') else None,
            "popularity": artist.get('popularity'),
            "spotify_url": artist.get('external_urls', {}).get('spotify')
        }
        logger.info(f"Artist info alındı: {artist_name}")
        logger.debug(f"Spotify search response: {results}")
        return info
    except Exception as e:
        logger.exception(f"get_artist_info hata: {artist_name}")
        return {}
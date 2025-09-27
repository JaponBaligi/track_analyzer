# spotify_client/artist_utils.py

from typing import Optional
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from config.config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
from utils.logger import get_logger
import re

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

def get_artist_id(artist_identifier: str) -> Optional[str]:
    try:
        # Eğer doğrudan 22 karakterlik Spotify Artist ID geldiyse direkt dön
        if re.fullmatch(r"[0-9A-Za-z]{22}", artist_identifier):
            logger.info(f"Artist ID direkt kullanılıyor: {artist_identifier}")
            return artist_identifier

        sp = get_spotify_client()

        logger.debug(f"Artist ID aranıyor (artist: prefix): {artist_identifier}")
        results = sp.search(q=f"artist:{artist_identifier}", type="artist", limit=1)
        items = results.get("artists", {}).get("items", [])

        if not items:
            logger.debug(f"artist: prefix ile bulunamadı, düz arama yapılıyor: {artist_identifier}")
            results = sp.search(q=artist_identifier, type="artist", limit=1)
            items = results.get("artists", {}).get("items", [])

        if not items:
            logger.debug(f"Artist aramada bulunamadı, track üzerinden denenecek: {artist_identifier}")
            results = sp.search(q=artist_identifier, type="track", limit=1)
            tracks = results.get("tracks", {}).get("items", [])
            if tracks and tracks[0].get("artists"):
                artist_id = tracks[0]["artists"][0]["id"]
                logger.info(f"Track üzerinden artist bulundu: {artist_identifier} -> {artist_id}")
                return artist_id
            else:
                logger.warning(f"Artist bulunamadı: {artist_identifier}")
                return None

        artist_id = items[0]["id"]
        logger.info(f"Artist bulundu: {artist_identifier} -> {artist_id}")
        return artist_id

    except Exception:
        logger.exception(f"get_artist_id() başarısız: {artist_identifier}")
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
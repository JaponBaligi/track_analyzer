# spotify_client/auth.py

import requests
import base64
from config.config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
from utils.logger import get_logger

logger = get_logger(__name__)

def get_spotify_token(timeout: int = 10) -> str:
    try:
        if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
            logger.error("Spotify API kimlik bilgileri eksik.")
            raise ValueError("Spotify credentials are missing.")

        client_creds = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
        b64_creds = base64.b64encode(client_creds.encode()).decode()

        headers = {
            "Authorization": f"Basic {b64_creds}"
        }
        data = {
            "grant_type": "client_credentials"
        }

        logger.info("Spotify erişim tokenı alınıyor...")
        response = requests.post(
            "https://accounts.spotify.com/api/token",
            data=data,
            headers=headers,
            timeout=timeout
        )
        response.raise_for_status()

        token = response.json().get("access_token")
        if not token:
            logger.error("Token alınamadı. Yanıt geçersiz.")
            raise ValueError("Token not found in response.")
        
        logger.info("Spotify token başarıyla alındı.")
        return token

    except requests.exceptions.RequestException as e:
        logger.exception(f"Spotify token alma isteği başarısız: {e}")
        raise
    except Exception as e:
        logger.exception(f"Spotify token alınırken hata oluştu: {e}")
        raise

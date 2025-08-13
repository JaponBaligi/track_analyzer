# Related Artists endpoint'i kaldırıldığı için bu kod kullanılmıyor.





#from spotify_client.auth import get_spotify_token
#from utils.logger import get_logger
#import requests
#
#logger = get_logger(__name__)
#
#SPOTIFY_API_BASE = "https://api.spotify.com/v1"
#
#def get_related_artists(artist_id: str, timeout: int = 10) -> list[str]:
#    """
#    Verilen artist_id'ye göre Spotify API üzerinden benzer sanatçıların ID'lerini döner.
#    """
#    try:
#        token = get_spotify_token()
#        headers = {"Authorization": f"Bearer {token}"}
#        url = f"{SPOTIFY_API_BASE}/artists/{artist_id}/related-artists"
#
#        logger.info(f"Benzer sanatçılar sorgulanıyor: {artist_id}")
#        response = requests.get(url, headers=headers, timeout=timeout)
#        response.raise_for_status()
#
#        data = response.json()
#        artists = data.get("artists", [])
#        related_ids = [artist["id"] for artist in artists if "id" in artist]
#
#        logger.info(f"{len(related_ids)} benzer sanatçı ID'si bulundu.")
#        return related_ids
#
#    except requests.exceptions.RequestException as e:
#        logger.exception(f"[HATA] Related artists isteği başarısız: {e}")
#        return []
#
#    except Exception as e:
#        logger.exception(f"[HATA] Benzer sanatçılar alınamadı: {artist_id}")
#        return []

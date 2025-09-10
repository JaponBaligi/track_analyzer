# spotify_client/playlist_scanner.py

from spotify_client.client import get_spotify_client
from utils.logger import get_logger
from spotify_client.track import get_track_info
from db.track_storage import TrackStorage
from db.flagged_artists import get_flagged_names_set

logger = get_logger(__name__)
sp = get_spotify_client()


def search_artist_playlists(artist_name: str, limit: int = 10) -> list[dict]:
    """
    Bir sanatçının adını kullanarak Spotify'da public playlistleri arar.
    """
    logger.debug(f"Playlist aranıyor: '{artist_name}' (limit={limit})")
    try:
        results = sp.search(q=artist_name, type='playlist', limit=limit)
        raw_items = results.get("playlists", {}).get("items", [])
        playlists = []

        for item in raw_items:
            if not item:
                logger.warning(f"[SKIP] Boş playlist item: {artist_name}")
                continue
            try:
                playlists.append({
                    "id": item["id"],
                    "name": item["name"],
                    "owner": item["owner"]["id"]
                })
            except KeyError as ke:
                logger.warning(f"[SKIP] Playlist eksik alan: {ke}")
            except Exception as e:
                logger.warning(f"[SKIP] Playlist işlenemedi: {e}")

        logger.info(f"{len(playlists)} playlist bulundu: '{artist_name}'")
        return playlists

    except Exception as e:
        logger.exception(f"[HATA] Playlist arama başarısız: {artist_name}")
        return []


def get_owner_playlists(owner_id: str, limit: int = 5) -> list[dict]:
    """
    Belirli bir kullanıcının sahip olduğu public playlistleri getirir.
    """
    logger.debug(f"Owner playlistleri alınıyor: {owner_id} (limit={limit})")
    try:
        results = sp.user_playlists(owner_id, limit=limit)
        playlists = [
            {
                "id": item["id"],
                "name": item["name"],
                "owner": item["owner"]["id"]
            }
            for item in results.get("items", [])
            if item
        ]
        logger.info(f"{len(playlists)} playlist bulundu: owner={owner_id}")
        return playlists

    except Exception as e:
        logger.exception(f"[HATA] Owner playlistleri alınamadı: {owner_id}")
        return []


def scan_playlist_for_unplayable_tracks(
    playlist_id: str,
    market: str | None = None,
    owner: str | None = None
) -> list[dict]:
    """
    Playlist içindeki unplayable trackleri tarar.
    Flagged artist'lerin parçaları DB'ye kaydedilmez ve kullanıcıya gösterilmez.
    """
    logger.debug(f"Playlist taranıyor: {playlist_id} (market={market})")
    bad_tracks = []

    try:
        kwargs = {
            "playlist_id": playlist_id,
            "fields": (
                "items.track.id,"
                "items.track.name,"
                "items.track.is_playable,"
                "items.track.album.images,"
                "items.track.artists.name"
            ),
            "additional_types": ["track"]
        }
        if market is not None:
            kwargs["market"] = market

        results = sp.playlist_tracks(**kwargs)
        flagged = get_flagged_names_set()  # hızlı lookup için set

        for item in results.get("items", []):
            track = item.get("track")
            if not track:
                logger.warning(f"[SKIP] Track bilgisi eksik: {playlist_id}")
                continue

            if track.get("is_playable") is False:
                track_id = track.get("id")
                track_name = track.get("name")
                album_images = track.get("album", {}).get("images", [])
                image_url = album_images[0]["url"] if album_images else None

                # Artist ismini al
                artists = track.get("artists", [])
                artist_name = artists[0]["name"] if artists else None

                # Flagged kontrolü
                if artist_name in flagged:
                    logger.info(f"[SKIP] Flagged artist bulundu: {artist_name} (playlist={playlist_id})")
                    continue

                if not track_id or not track_name:
                    logger.warning(f"[SKIP] Track ID veya isim eksik: playlist={playlist_id}")
                    continue

                # Spotify'dan tam track bilgilerini çek
                track_info = get_track_info(track_id)
                if track_info:
                    track_info["playlist_id"] = playlist_id
                    track_info["image_url"] = image_url
                    track_info["artist_name"] = artist_name

                    # Veritabanına kaydet
                    storage = TrackStorage()
                    if storage.save_unplayable_track_if_new(track_info, owner=owner):
                        # Albüm adı boşsa Single yaz
                        album_name = track_info.get("album", {}).get("name", "Single")

                        bad_tracks.append({
                            "track_id": track_info.get("id"),
                            "track_name": track_info.get("name"),
                            "artist_name": artist_name,
                            "playlist_id": playlist_id,
                            "image_url": image_url,
                            "album_name": album_name,
                            "popularity": track_info.get("popularity", "Bilinmiyor"),
                            "duration_ms": track_info.get("duration_ms")
                        })

                    storage.close()

        logger.info(f"{len(bad_tracks)} unplayable track bulundu: {playlist_id}")
        return bad_tracks

    except Exception as e:
        logger.exception(f"[HATA] Playlist tarama hatası: {playlist_id}")
        return []

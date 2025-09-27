# spotify_client/playlist_scanner.py

from spotify_client.client import get_spotify_client
from utils.logger import get_logger
from spotify_client.track import get_track_info
from spotify_client.playable_scanner import get_tracks_by_ids, _track_obj_to_storage_format
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
    Playlist içindeki tüm unplayable trackleri tarar (pagination ile).
    Flagged artist'lerin parçaları DB'ye kaydedilmez ve kullanıcıya gösterilmez.
    """
    logger.debug(f"Playlist taranıyor: {playlist_id} (market={market})")
    bad_tracks = []

    try:
        limit = 100
        offset = 0
        flagged = get_flagged_names_set(owner=owner)

        while True:
            kwargs = {
                "playlist_id": playlist_id,
                "fields": (
                    "items.track.id,"
                    "items.track.name,"
                    "items.track.is_playable,"
                    "items.track.album.images,"
                    "items.track.artists.name,"
                    "total"
                ),
                "additional_types": ["track"],
                "limit": limit,
                "offset": offset
            }
            if market is not None:
                kwargs["market"] = market

            results = sp.playlist_tracks(**kwargs)
            items = results.get("items", [])
            total = results.get("total", 0)

            if not items:
                break
            page_unplayable_ids = []
            playlist_meta_by_tid = {}

            for item in items:
                track = item.get("track")
                if not track:
                    logger.warning(f"[SKIP] Track bilgisi eksik: {playlist_id}")
                    continue

                if track.get("is_playable") is False:
                    track_id = track.get("id")
                    track_name = track.get("name")
                    album_images = track.get("album", {}).get("images", [])
                    image_url = album_images[0]["url"] if album_images else None

                    artists = track.get("artists", [])
                    artist_name = artists[0]["name"] if artists else None

                    if artist_name in flagged:
                        logger.info(f"[SKIP] Flagged artist bulundu: {artist_name} (playlist={playlist_id})")
                        continue

                    if not track_id or not track_name:
                        logger.warning(f"[SKIP] Track ID veya isim eksik: playlist={playlist_id}")
                        continue

                    page_unplayable_ids.append(track_id)
                    playlist_meta_by_tid[track_id] = {
                        "image_url": image_url,
                        "artist_name": artist_name
                    }
            if not page_unplayable_ids:
                offset += limit
                if offset >= total:
                    break
                continue
            enriched = []
            try:
                enriched = get_tracks_by_ids(sp, page_unplayable_ids)
            except Exception as e:
                logger.exception("get_tracks_by_ids hata verdi: %s", e)

            enriched_map = {t.get("id"): t for t in enriched if t and t.get("id")}

            storage = TrackStorage()
            try:
                for tid in page_unplayable_ids:
                    t_obj = enriched_map.get(tid)
                    td = {}

                    if t_obj:
                        td = _track_obj_to_storage_format(t_obj)
                    else:
                        try:
                            single = get_track_info(tid)
                        except Exception as e:
                            logger.exception("get_track_info hata: %s (track_id=%s)", e, tid)
                            single = None
                        if single:
                            td = _track_obj_to_storage_format(single)
                        else:
                            logger.warning(f"[SKIP] Track bilgisi alınamadı fallback: {tid}")
                            continue
                    if not td:
                        logger.warning(f"[SKIP] Track normalize edilemedi: {tid}")
                        continue
                    pm = playlist_meta_by_tid.get(tid, {})
                    if pm.get("image_url"):
                        td["image_url"] = pm.get("image_url")
                    if pm.get("artist_name"):
                        td.setdefault("artist_names", td.get("artist_names") or [])
                        if pm.get("artist_name") not in td["artist_names"]:
                            td["artist_names"].insert(0, pm.get("artist_name"))

                    td["playlist_id"] = playlist_id
                    if owner:
                        td["owner"] = owner
                    td["is_playable"] = False

                    # Kaydet
                    try:
                        saved = storage.save_unplayable_track_if_new(td, owner=owner)
                        if saved:
                            bad_tracks.append({
                                "track_id": td.get("id"),
                                "track_name": td.get("name"),
                                "artist_name": pm.get("artist_name"),
                                "playlist_id": playlist_id,
                                "image_url": td.get("image_url"),
                                "album_name": td.get("album_name"),
                                "popularity": td.get("popularity", "Bilinmiyor"),
                                "duration_ms": td.get("duration_ms"),
                                "upc": td.get("upc")
                            })
                    except Exception:
                        logger.exception("Unplayable track kaydedilemedi: %s", td.get("id"))
            finally:
                storage.close()

            offset += limit
            if offset >= total:
                break

        logger.info(f"{len(bad_tracks)} unplayable track bulundu: {playlist_id}")
        return bad_tracks

    except Exception as e:
        logger.exception(f"[HATA] Playlist tarama hatası: {playlist_id}")
        return []

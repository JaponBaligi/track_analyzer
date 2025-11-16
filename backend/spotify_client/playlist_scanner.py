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


def _extract_unplayable_tracks_from_page(items: list, flagged: set, playlist_id: str) -> tuple[list[str], dict]:
    """Extract unplayable track IDs and metadata from a page of playlist items."""
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
    
    return page_unplayable_ids, playlist_meta_by_tid


def _get_track_data_for_id(track_id: str, enriched_map: dict) -> dict | None:
    """Get track data from enriched map or fetch individually as fallback."""
    t_obj = enriched_map.get(track_id)
    if t_obj:
        return _track_obj_to_storage_format(t_obj)
    
    try:
        single = get_track_info(track_id)
        if single:
            return _track_obj_to_storage_format(single)
    except Exception as e:
        logger.exception("get_track_info hata: %s (track_id=%s)", e, track_id)
    
    logger.warning(f"[SKIP] Track bilgisi alınamadı fallback: {track_id}")
    return None


def _enrich_track_data_with_playlist_meta(td: dict, playlist_meta: dict) -> dict:
    """Enrich track data with playlist metadata (image_url, artist_name)."""
    if playlist_meta.get("image_url"):
        td["image_url"] = playlist_meta.get("image_url")
    if playlist_meta.get("artist_name"):
        td.setdefault("artist_names", td.get("artist_names") or [])
        if playlist_meta.get("artist_name") not in td["artist_names"]:
            td["artist_names"].insert(0, playlist_meta.get("artist_name"))
    return td


def _save_unplayable_track_from_page(
    track_ids: list[str],
    enriched_map: dict,
    playlist_meta_by_tid: dict,
    playlist_id: str,
    owner: str | None
) -> list[dict]:
    """Process and save unplayable tracks from a page. Returns list of saved track info."""
    bad_tracks = []
    storage = TrackStorage()
    
    try:
        for tid in track_ids:
            td = _get_track_data_for_id(tid, enriched_map)
            if not td:
                continue
            
            pm = playlist_meta_by_tid.get(tid, {})
            td = _enrich_track_data_with_playlist_meta(td, pm)
            
            td["playlist_id"] = playlist_id
            if owner:
                td["owner"] = owner
            td["is_playable"] = False

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
    
    return bad_tracks


def _build_playlist_tracks_kwargs(playlist_id: str, limit: int, offset: int, market: str | None) -> dict:
    """Build kwargs for playlist_tracks API call."""
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
    return kwargs


def _process_playlist_page(
    playlist_id: str,
    items: list,
    flagged: set,
    owner: str | None
) -> list[dict]:
    """Process a single page of playlist items and return list of saved unplayable tracks."""
    page_unplayable_ids, playlist_meta_by_tid = _extract_unplayable_tracks_from_page(
        items, flagged, playlist_id
    )
    
    if not page_unplayable_ids:
        return []
    
    enriched = []
    try:
        enriched = get_tracks_by_ids(sp, page_unplayable_ids)
    except Exception as e:
        logger.exception("get_tracks_by_ids hata verdi: %s", e)

    enriched_map = {t.get("id"): t for t in enriched if t and t.get("id")}
    
    page_bad_tracks = _save_unplayable_track_from_page(
        page_unplayable_ids, enriched_map, playlist_meta_by_tid, playlist_id, owner
    )
    
    return page_bad_tracks


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
            kwargs = _build_playlist_tracks_kwargs(playlist_id, limit, offset, market)
            results = sp.playlist_tracks(**kwargs)
            items = results.get("items", [])
            total = results.get("total", 0)

            if not items:
                break
            
            page_bad_tracks = _process_playlist_page(playlist_id, items, flagged, owner)
            bad_tracks.extend(page_bad_tracks)

            offset += limit
            if offset >= total:
                break

        logger.info(f"{len(bad_tracks)} unplayable track bulundu: {playlist_id}")
        return bad_tracks

    except Exception as e:
        logger.exception(f"[HATA] Playlist tarama hatası: {playlist_id}")
        return []

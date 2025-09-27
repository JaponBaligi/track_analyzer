#spotify_client/playable_scanner.py

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional
from itertools import chain
import math
import logging
import datetime

from spotify_client.client import get_spotify_client
from spotify_client.artist_utils import get_artist_id
from spotify_client.track import get_track_info
from db.track_storage import TrackStorage
from utils.logger import get_logger

logger = get_logger(__name__)

sp = None  # geçici


def _ensure_spotify_client():
    global sp
    if sp is None:
        sp = get_spotify_client()
    return sp


def _pages_from_paged_response(resp: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    return resp


def get_all_artist_albums(sp_client, artist_id: str, include_groups: str = "album,single,appears_on,compilation", market: Optional[str] = None) -> List[Dict[str, Any]]:
    """Artist'in tüm albümlerini (unique by id) döndürür."""
    albums = []
    limit = 50
    offset = 0
    while True:
        params = dict(limit=limit, offset=offset, include_groups=include_groups)
        if market:
            params["market"] = market
        resp = sp_client.artist_albums(artist_id, album_type=None, limit=limit, offset=offset)
        items = resp.get("items", [])
        if not items:
            break
        albums.extend(items)
        total = resp.get("total", 0)
        offset += len(items)
        if offset >= total:
            break
    unique = {a.get("id"): a for a in albums if a and a.get("id")}
    logger.info("Found %d unique albums for artist %s", len(unique), artist_id)
    return list(unique.values())


def get_album_tracks_ids(sp_client, album_id: str) -> List[str]:
    ids: List[str] = []
    limit = 50
    offset = 0
    while True:
        resp = sp_client.album_tracks(album_id, limit=limit, offset=offset)
        items = resp.get("items", [])
        for it in items:
            tid = it.get("id") or it.get("uri")
            if tid:
                ids.append(tid)
        total = resp.get("total", 0)
        offset += len(items)
        if offset >= total:
            break
    logger.debug("Album %s -> %d track ids", album_id, len(ids))
    return ids


def get_all_artist_track_ids(artist_identifier: str, market: Optional[str] = None) -> List[str]:
    """Artist ismi veya id verildiğinde, tüm albumlardan track id'lerini getirir.
    Dönen liste unique (id bazlı) olacaktır."""
    sp_client = _ensure_spotify_client()
    try:
        artist_id = get_artist_id(artist_identifier)
    except Exception:
        artist_id = artist_identifier
    albums = get_all_artist_albums(sp_client, artist_id, market=market)
    album_ids = [a["id"] for a in albums if a.get("id")]

    all_track_ids = []
    for aid in album_ids:
        tids = get_album_tracks_ids(sp_client, aid)
        all_track_ids.extend(tids)

    unique_ids = list(dict.fromkeys(t for t in all_track_ids if t))
    logger.info("Artist %s -> %d unique track ids", artist_identifier, len(unique_ids))
    return unique_ids


def _chunked(iterable: List[Any], n: int) -> Iterable[List[Any]]:
    for i in range(0, len(iterable), n):
        yield iterable[i:i+n]


def get_tracks_by_ids(sp_client, ids: List[str]) -> List[Dict[str, Any]]:
    if not ids:
        return []
    tracks: List[Dict[str, Any]] = []
    for batch in _chunked(ids, 50):
        try:
            resp = sp_client.tracks(batch)
        except Exception as e:
            logger.exception("sp_client.tracks failed for batch (len=%d): %s", len(batch), e)
            continue
        items = resp.get("tracks", []) or []
        items = [it for it in items if it]
        tracks.extend(items)
    logger.info("Fetched %d track objects by ids", len(tracks))

    album_ids = []
    for t in tracks:
        album = (t or {}).get("album") or {}
        aid = album.get("id")
        if aid:
            album_ids.append(aid)
    album_ids = list(dict.fromkeys(album_ids))

    album_map: Dict[str, Dict[str, Any]] = {}
    if album_ids:
        for a_batch in _chunked(album_ids, 20):
            try:
                resp = sp_client.albums(a_batch)
            except Exception as e:
                logger.exception("sp_client.albums failed for batch (len=%d): %s", len(a_batch), e)
                continue
            albums = resp.get("albums", []) or []
            for alb in albums:
                if not alb:
                    continue
                album_map[alb.get("id")] = alb

    filled = 0
    for t in tracks:
        album = (t or {}).get("album") or {}
        aid = album.get("id")
        if not aid:
            continue
        has_upc = (album.get("external_ids") or {}).get("upc")
        if not has_upc:
            full_album = album_map.get(aid)
            if full_album:
                full_ext = full_album.get("external_ids") or {}
                if full_ext.get("upc"):
                    t.setdefault("album", {})["external_ids"] = full_ext
                    filled += 1

    logger.info("Populated album.external_ids (with upc) for %d tracks using sp.albums()", filled)

    upc_count = 0
    for t in tracks:
        track_ext = t.get("external_ids") or {}
        album_ext = (t.get("album") or {}).get("external_ids") or {}
        if track_ext.get("upc") or album_ext.get("upc"):
            upc_count += 1
    logger.info("Tracks with UPC after enrichment: %d/%d", upc_count, len(tracks))

    return tracks



def is_track_playable_sp(track_obj: Dict[str, Any], market: Optional[str] = None) -> bool:
    if track_obj.get("is_playable") is False:
        return False
    if market:
        av = track_obj.get("available_markets")
        if isinstance(av, list) and av:
            return market in av
    return True


def _track_obj_to_storage_format(track_obj: Dict[str, Any]) -> Dict[str, Any]:
    try:
        album = track_obj.get("album", {}) or {}
        track_ext_ids = track_obj.get("external_ids") or {}
        album_ext_ids = album.get("external_ids") or {}

        upc = track_ext_ids.get("upc") or album_ext_ids.get("upc")

        return {
            "id": track_obj.get("id"),
            "name": track_obj.get("name"),
            "artist_names": [a.get("name") for a in track_obj.get("artists", [])],
            "album_name": album.get("name"),
            "duration_ms": track_obj.get("duration_ms"),
            "popularity": track_obj.get("popularity"),
            "is_playable": track_obj.get("is_playable", True),
            "spotify_url": (track_obj.get("external_urls") or {}).get("spotify"),
            "image_url": (album.get("images") or [None])[0] and (album.get("images") or [None])[0].get("url"),
            "isrc": track_ext_ids.get("isrc"),
            "upc": upc
        }
    except Exception as e:
        logger.exception("Track obj formatlanırken hata: %s", e)
        return {}


def scan_artist_and_persist_tracks(
    artist_identifier: str, owner: Optional[str] = None, market: Optional[str] = None
) -> Dict[str, Any]:
    """
    Artist'in tüm tracklerini tarar, playable ve unplayable trackleri ayrı tablolarına kaydeder.
    """
    sp_client = _ensure_spotify_client()
    logger.info("Scanning artist for all tracks: %s", artist_identifier)

    track_ids = get_all_artist_track_ids(artist_identifier, market=market)
    total = len(track_ids)
    if total == 0:
        return {
            "status": "success",
            "total": 0,
            "playable_total": 0,
            "playable_saved": 0,
            "unplayable_total": 0,
            "unplayable_saved": 0
        }

    tracks = get_tracks_by_ids(sp_client, track_ids)
    storage = TrackStorage()

    playable_total = 0
    playable_saved = 0
    unplayable_total = 0
    unplayable_saved = 0

    try:
        for t in tracks:
            is_playable = is_track_playable_sp(t, market=market)
            td = _track_obj_to_storage_format(t)
            if owner:
                td["owner"] = owner
            td["added_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            td["is_playable"] = bool(is_playable)

            if is_playable:
                playable_total += 1
                try:
                    saved = storage.save_playable_track_if_new(td, owner=owner)
                    if saved:
                        playable_saved += 1
                except Exception:
                    logger.exception("Error saving playable track %s", td.get("id"))
            else:
                unplayable_total += 1
                try:
                    saved = storage.save_unplayable_track_if_new(td, owner=owner)
                    if saved:
                        unplayable_saved += 1
                except Exception:
                    logger.exception("Error saving unplayable track %s", td.get("id"))
    finally:
        storage.close()

    logger.info(
        "Artist %s scan finished: total=%d playable=%d (saved=%d) unplayable=%d (saved=%d)",
        artist_identifier, total, playable_total, playable_saved, unplayable_total, unplayable_saved
    )

    return {
        "status": "success",
        "total": total,
        "playable_total": playable_total,
        "playable_saved": playable_saved,
        "unplayable_total": unplayable_total,
        "unplayable_saved": unplayable_saved,
        "unplayable_count": unplayable_total,
        "saved_count": playable_saved
    }

def get_playable_tracks_for_user(owner: str):
    """
    Session'daki kullanıcıya ait tüm playable trackleri döndürür.
    """
    storage = TrackStorage()
    try:
        tracks = storage.get_playable_tracks(owner=owner)
        return tracks
    except Exception as e:
        logger.exception("Error fetching playable tracks for owner %s: %s", owner, e)
        return []
    finally:
        storage.close()

__all__ = [
    "get_all_artist_track_ids",
    "get_tracks_by_ids",
    "scan_artist_and_persist_tracks",
    "get_playable_tracks_for_user",
]

# spotify_client/artist_scanner.py

from spotify_client.playlist_scanner import (
    search_artist_playlists,
    scan_playlist_for_unplayable_tracks,
    get_owner_playlists,
)
from spotify_client.artist_utils import get_artist_id
from utils.logger import get_logger

logger = get_logger(__name__)

def pseudo_recursive_scan(
    artist_name: str,
    current_owner: str,  
    max_depth=2,
    playlist_limit=10,
    market: str | None = None
) -> dict:
    logger.info(f"Artist araması başlatıldı: {artist_name}")
    artist_id = get_artist_id(artist_name)

    if not artist_id:
        logger.error(f"[!] Artist ID bulunamadı: {artist_name}")
        return {"status": "error", "artist": artist_name, "reason": "ID bulunamadı"}

    visited_owners = set()
    to_scan_playlists = search_artist_playlists(artist_name, limit=playlist_limit)

    if not to_scan_playlists:
        logger.warning(f"Playlist bulunamadı: {artist_name}")
        return {"status": "warning", "artist": artist_name, "reason": "Hiç playlist bulunamadı"}

    current_depth = 0

    collected_playlists = []
    collected_tracks = []

    try:
        while current_depth < max_depth and to_scan_playlists:
            logger.info(
                f"[DEPTH LOG] Şu an {current_depth + 1}. derinlikteyiz / max_depth={max_depth} "
                f"— taranacak playlist sayısı: {len(to_scan_playlists)}"
            )
            next_level_owners = set()
            new_playlists = []

            for playlist in to_scan_playlists:
                pid = playlist["id"]
                owner = playlist["owner"]
                logger.debug(f"Playlist taranıyor: {pid} (Owner: {owner})")

                try:
                    unplayables = scan_playlist_for_unplayable_tracks(pid, market=market, owner=current_owner)
                    if unplayables:
                        for t in unplayables:
                            logger.warning(f"[!] Unplayable track bulundu: {t['track_name']} (ID: {t['track_id']})")
                    else:
                        logger.info(f"Playlist tamamen oynatılabilir: {pid}")
                except Exception as e:
                    logger.error(f"Playlist taranırken hata oluştu: {pid}", exc_info=True)

                # Playlist ve unplayable trackleri topla
                collected_playlists.append(playlist)
                if unplayables:
                    collected_tracks.extend(unplayables)

                if owner not in visited_owners:
                    next_level_owners.add(owner)
                    try:
                        owner_playlists = get_owner_playlists(owner, limit=10)
                        new_playlists.extend(owner_playlists)
                        logger.debug(f"{owner} kullanıcısının diğer playlistleri eklendi.")
                    except Exception as e:
                        logger.error(f"{owner} kullanıcısının playlistleri alınamadı.", exc_info=True)

            visited_owners.update(next_level_owners)
            to_scan_playlists = new_playlists
            current_depth += 1

        logger.info(f"{artist_name} için tarama işlemi tamamlandı.")
        return {
            "status": "success",
            "artist": artist_name,
            "playlists": collected_playlists,
            "tracks": collected_tracks
        }

    except Exception as e:
        logger.exception(f"{artist_name} için beklenmeyen hata.")
        return {"status": "error", "artist": artist_name, "reason": str(e)}

import logging

logger = logging.getLogger(__name__)

def notify_rights_holder(track_data: dict, stream_data: dict):
    """
    Unplayable track tespit edildiğinde hak sahibine haber ver.
    Şimdilik log'a yazıyoruz. İleri versiyonda e-posta, webhook, vs.
    """
    track_name = track_data.get("name", "Bilinmeyen parça")
    artists = ", ".join(track_data.get("artist_names", []))
    track_id = track_data.get("id")

    logger.warning(f"UNPLAYABLE TRACK TESPİT EDİLDİ! -> {track_name} - {artists} | ID: {track_id}")
    logger.info(f"Stream verisi (current): {stream_data.get('current_stream_count')}")
    logger.info(f"Stream verisi (history): {stream_data.get('historical_streams', [])[:3]}...")  # ilk 3 günü göster

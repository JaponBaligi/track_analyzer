# db/playlist_storage.py

import sqlite3
from typing import List
from datetime import datetime
from utils.logger import get_logger
from datetime import timezone

logger = get_logger(__name__)

DB_FILE = "database.db"

class PlaylistStorage:
    def __init__(self, db_file=DB_FILE):
        try:
            self.conn = sqlite3.connect(db_file, check_same_thread=False)
            self.c = self.conn.cursor()
            logger.info("Veritabanı bağlantısı başarılı.")
            self._init_db()
        except Exception as e:
            logger.error("Veritabanı bağlantısı başarısız.", exc_info=True)
            raise  # Bağlantı kurulamazsa üst katmana iletmek iyi olur

    def _init_db(self):
        try:
            self.c.execute("""
            CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                owner TEXT
            )
            """)

            self.c.execute("""
            CREATE TABLE IF NOT EXISTS unplayable_tracks (
                id TEXT PRIMARY KEY,
                name TEXT,
                playlist_id TEXT,
                scan_date TEXT,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id)
            )
            """)
            self.conn.commit()
            logger.info("Veritabanı tabloları başarıyla başlatıldı.")
        except Exception as e:
            logger.error("Veritabanı tablo oluşturulurken hata oluştu.", exc_info=True)
            raise

    def save_playlist(self, playlist_id: str, owner: str):
        try:
            self.c.execute(
                "INSERT OR IGNORE INTO playlists (id, owner) VALUES (?, ?)",
                (playlist_id, owner)
            )
            self.conn.commit()
            logger.info(f"Playlist kaydedildi: {playlist_id} (Owner: {owner})")
        except Exception as e:
            logger.error(f"Playlist kaydedilirken hata oluştu: {playlist_id}", exc_info=True)
            raise

    def save_unplayable_tracks(self, tracks: List[dict]):
        if not tracks:
            logger.info("Kaydedilecek unplayable track bulunamadı.")
            return
        scan_date = datetime.now(timezone.utc).isoformat()
        try:
            for track in tracks:
                self.c.execute(
                    """
                    INSERT OR IGNORE INTO unplayable_tracks (id, name, playlist_id, scan_date)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        track.get('track_id', 'unknown'),
                        track.get('track_name', 'Unknown or removed track'),
                        track.get('playlist_id', 'unknown'),
                        scan_date
                    )
                )
                logger.warning(f"Unplayable track kaydedildi: {track.get('track_name')} [{track.get('track_id')}]")
            self.conn.commit()
        except Exception as e:
            logger.error("Unplayable track'ler kaydedilirken hata oluştu.", exc_info=True)
            raise

    def close(self):
        try:
            self.conn.close()
            logger.info("Veritabanı bağlantısı kapatıldı.")
        except Exception as e:
            logger.error("Veritabanı bağlantısı kapatılamadı.", exc_info=True)
            raise

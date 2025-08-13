# db/artist_storage.py

import sqlite3
from utils.logger import get_logger

logger = get_logger(__name__)
DB_FILE = "spotify_monitoring.db"

class ArtistStorage:
    def __init__(self, db_file=DB_FILE):
        try:
            self.conn = sqlite3.connect(db_file)
            self.c = self.conn.cursor()
            self._init_db()
            logger.info("Artist veritabanı bağlantısı kuruldu.")
        except Exception as e:
            logger.exception("Artist veritabanı bağlantısı kurulamadı.")

    def _init_db(self):
        try:
            self.c.execute("""
                CREATE TABLE IF NOT EXISTS tracked_artists (
                    name TEXT PRIMARY KEY
                )
            """)
            self.conn.commit()
            logger.debug("tracked_artists tablosu hazır.")
        except Exception as e:
            logger.exception("tracked_artists tablosu oluşturulamadı.")

    def get_all_artists(self) -> list[str]:
        try:
            self.c.execute("SELECT name FROM tracked_artists")
            return [row[0] for row in self.c.fetchall()]
        except Exception as e:
            logger.exception(" Sanatçılar alınamadı.")
            return []

    def add_artist(self, name: str):
        try:
            self.c.execute("INSERT OR IGNORE INTO tracked_artists (name) VALUES (?)", (name,))
            self.conn.commit()
            logger.info(f"Artist eklendi: {name}")
        except Exception as e:
            logger.exception(f"Artist eklenemedi: {name}")

    def close(self):
        try:
            self.conn.close()
        except Exception as e:
            logger.exception("Artist veritabanı kapatılamadı.")

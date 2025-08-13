# db/stream_failures.py

import sqlite3
from contextlib import contextmanager
import os
from pathlib import Path
from config.config import DATABASE_URL  # .env'den geliyor
BASE_DIR = Path(__file__).resolve().parent.parent  # db klasöründen iki seviye yukarı -> proje kökü
DB_PATH = BASE_DIR / "spotify_monitoring.db"
if not DB_PATH.is_absolute():
    DB_PATH = (BASE_DIR / DB_PATH).resolve()

@contextmanager
def db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def create_failed_tracks_table():
    with db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS failed_tracks (
                track_id TEXT PRIMARY KEY,
                failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def mark_track_as_failed(track_id: str):
    with db_connection() as conn:
        conn.execute("""
            INSERT OR IGNORE INTO failed_tracks (track_id) VALUES (?)
        """, (track_id,))

def is_track_failed(track_id: str) -> bool:
    with db_connection() as conn:
        result = conn.execute("""
            SELECT 1 FROM failed_tracks WHERE track_id = ?
        """, (track_id,)).fetchone()
        return result is not None

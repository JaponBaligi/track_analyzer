# db/track_storage.py

import sqlite3
import json
import datetime
from utils.db import get_connection
from utils.logger import get_logger

logger = get_logger(__name__)

class TrackStorage:
    def __init__(self):
        self.conn = get_connection()
        self.c = self.conn.cursor()
        self._init_db()

    def _init_db(self):
        # Unplayable tracks tablosu - tam alanlar ile
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS unplayable_tracks (
                id TEXT PRIMARY KEY,
                name TEXT,
                artist_names TEXT,
                album_name TEXT,
                duration_ms INTEGER,
                popularity INTEGER,
                is_playable INTEGER,
                spotify_url TEXT,
                image_url TEXT,
                playlist_id TEXT,
                added_at TEXT
            )
        """)

        self.c.execute("""
            CREATE TABLE IF NOT EXISTS track_streams (
                track_id TEXT PRIMARY KEY,
                historical_streams TEXT,
                last_updated TEXT
            )
        """)
        self.conn.commit()
        
    def save_unplayable_track(self, track_data: dict):
        """
        Track verisini (Spotify'dan çekilmiş tam veri) kaydeder veya günceller.
        Beklenen keys:
            id, name, artist_names (JSON string), album_name, duration_ms, popularity,
            is_playable, spotify_url, image_url, playlist_id, added_at
        """
        try:
            self.c.execute("""
                INSERT INTO unplayable_tracks (
                    id, name, artist_names, album_name, duration_ms, popularity,
                    is_playable, spotify_url, image_url, playlist_id, added_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name,
                    artist_names=excluded.artist_names,
                    album_name=excluded.album_name,
                    duration_ms=excluded.duration_ms,
                    popularity=excluded.popularity,
                    is_playable=excluded.is_playable,
                    spotify_url=excluded.spotify_url,
                    image_url=excluded.image_url,
                    playlist_id=excluded.playlist_id,
                    added_at=excluded.added_at
            """, (
                track_data["id"],
                track_data["name"],
                json.dumps(track_data["artist_names"]),  # JSON string olarak sakla
                track_data["album_name"],
                track_data["duration_ms"],
                track_data["popularity"],
                1 if track_data.get("is_playable", True) else 0,
                track_data["spotify_url"],
                track_data.get("image_url"),
                track_data.get("playlist_id"),
                track_data.get("added_at", datetime.datetime.utcnow().isoformat())
            ))
            self.conn.commit()
            logger.info(f"Unplayable track saved/updated: {track_data['id']}")
        except Exception as e:
            logger.error(f"Error saving unplayable track {track_data['id']}: {e}")
    def save_track_stream_data(self, track_id: str, historical_data: dict):
        hist_json = json.dumps(historical_data)
        last_updated = datetime.datetime.utcnow().isoformat()

        self.c.execute("""
            INSERT INTO track_streams (track_id, historical_streams, last_updated)
            VALUES (?, ?, ?)
            ON CONFLICT(track_id) DO UPDATE SET
                historical_streams=excluded.historical_streams,
                last_updated=excluded.last_updated
        """, (track_id, hist_json, last_updated))

        self.conn.commit()
        logger.info(f"Historical stream data saved for track {track_id}")

    def get_unplayable_tracks(self) -> list[dict]:
        try:
            self.c.execute("""
                SELECT 
                    t.id, t.name, t.artist_names, t.album_name, t.duration_ms, t.popularity,
                    t.is_playable, t.spotify_url, t.image_url, t.playlist_id, t.added_at,
                    ts.historical_streams, ts.last_updated
                FROM unplayable_tracks t
                LEFT JOIN track_streams ts ON t.id = ts.track_id
                WHERE t.is_playable = 0
            """)
            rows = self.c.fetchall()
            columns = [desc[0] for desc in self.c.description]
            result = []
            for row in rows:
                d = dict(zip(columns, row))
                d["artist_names"] = json.loads(d["artist_names"]) if d["artist_names"] else []
                d["historical_streams"] = json.loads(d["historical_streams"]) if d["historical_streams"] else {}
                result.append(d)
            logger.info(f"{len(result)} unplayable tracks fetched from DB")
            return result
        except Exception as e:
            logger.error(f"Error fetching unplayable tracks: {e}")
            return []

    def close(self):
        if self.conn:
            self.conn.close()
    

# Modül dışı fonksiyon
def save_track_stream_data(track_id: str, historical_data: dict, current_data: dict):
    storage = TrackStorage()
    try:
        storage.save_track_stream_data(track_id, historical_data)
    finally:
        storage.close()

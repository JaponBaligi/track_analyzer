# db/track_storage.py

import sqlite3
import json
import datetime
from typing import Optional, List, Dict, Any
from utils.db import get_connection
from utils.logger import get_logger

logger = get_logger(__name__)

class TrackStorage:
    def __init__(self):
        self.conn = get_connection()
        self.c = self.conn.cursor()
        self._init_db()

    # ---------- INIT & MIGRATIONS ----------

    def _column_exists(self, table: str, column: str) -> bool:
        self.c.execute(f"PRAGMA table_info({table})")
        cols = [row[1] for row in self.c.fetchall()]
        return column in cols

    def _table_exists(self, table: str) -> bool:
        self.c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table,))
        return self.c.fetchone() is not None

    def _init_db(self):
        # unplayable_tracks (owner eklendi)
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
                added_at TEXT,
                owner TEXT
            )
        """)

        # track_streams: historical_streams JSON ve last_updated
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS track_streams (
                track_id TEXT PRIMARY KEY,
                historical_streams TEXT,
                last_updated TEXT
            )
        """)

        # priority_tracks: ortalama >= threshold olanlar
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS priority_tracks (
                track_id TEXT,
                owner TEXT,
                average INTEGER,
                created_at TEXT,
                PRIMARY KEY (track_id, owner)
            )
        """)

        # Migration: owner kolonu yoksa ekle
        if not self._column_exists("unplayable_tracks", "owner"):
            self.c.execute("ALTER TABLE unplayable_tracks ADD COLUMN owner TEXT")

        self.conn.commit()

    # ---------- UPSERTS ----------

    def save_unplayable_track(self, track_data: dict, owner: Optional[str] = None):
        """
        Track verisini (Spotify'dan çekilmiş tam veri) kaydeder veya günceller.
        Beklenen keys:
            id, name, artist_names (list veya JSON), album_name, duration_ms, popularity,
            is_playable, spotify_url, image_url, playlist_id, added_at
        """
        try:
            artist_names = track_data.get("artist_names")
            if isinstance(artist_names, list):
                artist_names = json.dumps(artist_names, ensure_ascii=False)

            self.c.execute("""
                INSERT INTO unplayable_tracks (
                    id, name, artist_names, album_name, duration_ms, popularity,
                    is_playable, spotify_url, image_url, playlist_id, added_at, owner
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    added_at=excluded.added_at,
                    owner=COALESCE(excluded.owner, owner)
            """, (
                track_data.get("id"),
                track_data.get("name"),
                artist_names,
                track_data.get("album_name"),
                track_data.get("duration_ms"),
                track_data.get("popularity"),
                int(track_data.get("is_playable", 0)),
                track_data.get("spotify_url"),
                track_data.get("image_url"),
                track_data.get("playlist_id"),
                track_data.get("added_at"),
                owner
            ))
            self.conn.commit()
        except Exception as e:
            logger.exception("save_unplayable_track hata: %s", e)

    def save_track_stream_data(self, track_id: str, historical_data: dict):
        """
        historical_data beklenen format:
        {
            "streams": [
                {"date": "YYYY-MM-DD", "streams": 123},
                ...
            ]
        }
        """
        try:
            hist_json = json.dumps(historical_data, ensure_ascii=False)
            last_updated = datetime.datetime.utcnow().isoformat()

            self.c.execute("""
                INSERT INTO track_streams (track_id, historical_streams, last_updated)
                VALUES (?, ?, ?)
                ON CONFLICT(track_id) DO UPDATE SET
                    historical_streams=excluded.historical_streams,
                    last_updated=excluded.last_updated
            """, (track_id, hist_json, last_updated))

            self.conn.commit()
            logger.info("Historical stream data saved for track %s", track_id)
        except Exception as e:
            logger.exception("save_track_stream_data hata: %s", e)

    def upsert_priority_track(self, track_id: str, owner: str, average: int):
        try:
            created_at = datetime.datetime.utcnow().isoformat()
            self.c.execute("""
                INSERT INTO priority_tracks (track_id, owner, average, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(track_id, owner) DO UPDATE SET
                    average=excluded.average,
                    created_at=excluded.created_at
            """, (track_id, owner, average, created_at))
            self.conn.commit()
        except Exception as e:
            logger.exception("upsert_priority_track hata: %s", e)

    # ---------- QUERIES ----------

    def _row_to_dict(self, cursor, row) -> Dict[str, Any]:
        d = {}
        for idx, col in enumerate(cursor.description):
            d[col[0]] = row[idx]
        return d

    def get_unplayable_tracks(self, owner: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
        """
        owner verilirse sadece owner'a ait kayıtlar + owner NULL (legacy) döner.
        """
        try:
            if owner:
                self.c.execute("""
                    SELECT id, name, artist_names, album_name, duration_ms, popularity,
                           is_playable, spotify_url, image_url, playlist_id, added_at, owner
                    FROM unplayable_tracks
                    WHERE (owner IS NULL OR owner = ?)
                    ORDER BY added_at DESC
                    LIMIT ?
                """, (owner, limit))
            else:
                self.c.execute("""
                    SELECT id, name, artist_names, album_name, duration_ms, popularity,
                           is_playable, spotify_url, image_url, playlist_id, added_at, owner
                    FROM unplayable_tracks
                    ORDER BY added_at DESC
                    LIMIT ?
                """, (limit,))
            rows = self.c.fetchall()
            result = []
            for row in rows:
                d = self._row_to_dict(self.c, row)
                d["artist_names"] = json.loads(d["artist_names"]) if d["artist_names"] else []
                result.append(d)
            return result
        except Exception as e:
            logger.exception("get_unplayable_tracks hata: %s", e)
            return []

    def get_priority_tracks(self, owner: str, limit: int = 200) -> List[Dict[str, Any]]:
        try:
            self.c.execute("""
                SELECT p.track_id, p.owner, p.average, p.created_at,
                       u.name, u.artist_names, u.album_name, u.spotify_url, u.image_url
                FROM priority_tracks p
                LEFT JOIN unplayable_tracks u ON u.id = p.track_id
                WHERE p.owner = ?
                ORDER BY p.average DESC, p.created_at DESC
                LIMIT ?
            """, (owner, limit))
            rows = self.c.fetchall()
            result = []
            for row in rows:
                d = self._row_to_dict(self.c, row)
                if d.get("artist_names"):
                    try:
                        d["artist_names"] = json.loads(d["artist_names"])
                    except Exception:
                        pass
                result.append(d)
            return result
        except Exception as e:
            logger.exception("get_priority_tracks hata: %s", e)
            return []

    def get_track_historical(self, track_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        track_streams.historical_streams içindeki 'streams' listesini döndürür.
        """
        try:
            self.c.execute("""
                SELECT historical_streams FROM track_streams WHERE track_id = ?
            """, (track_id,))
            row = self.c.fetchone()
            if not row or not row[0]:
                return None
            payload = json.loads(row[0])
            streams = payload.get("streams")
            if isinstance(streams, list):
                # Normalize: her elemanda {"date": "...", "streams": int}
                norm = []
                for item in streams:
                    if isinstance(item, dict) and "date" in item and "streams" in item:
                        norm.append({"date": item["date"], "streams": int(item["streams"])})
                return norm
            return None
        except Exception as e:
            logger.exception("get_track_historical hata: %s", e)
            return None

    def close(self):
        if self.conn:
            self.conn.close()

# ---- Modül-dışı uyumluluk fonksiyonu (spotify_client.stream_data import ediyor) ----
def save_track_stream_data(track_id: str, historical_data: dict, current_data: dict):
    """
    Eski imza ile uyumluluk için mevcut; current_data şu an kullanılmıyor.
    """
    storage = TrackStorage()
    try:
        storage.save_track_stream_data(track_id, historical_data)
    finally:
        storage.close()

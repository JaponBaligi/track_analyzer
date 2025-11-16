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

    def _create_tables(self):
        """Create all required tables if they don't exist."""
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
                owner TEXT,
                isrc TEXT,
                upc TEXT
            )
        """)
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS playable_tracks (
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
                owner TEXT,
                isrc TEXT,
                upc TEXT
            )
        """)
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS track_streams (
                track_id TEXT,
                owner TEXT,
                historical_streams TEXT,
                last_updated TEXT,
                PRIMARY KEY (track_id, owner)
            )
        """)
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS priority_tracks (
                track_id TEXT,
                owner TEXT,
                average INTEGER,
                created_at TEXT,
                PRIMARY KEY (track_id, owner)
            )
        """)
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS track_uuid_cache (
                track_id TEXT PRIMARY KEY,
                uuid TEXT NOT NULL,
                created_at TEXT,
                updated_at TEXT
            )
        """)

    def _add_column_if_not_exists(self, table: str, column: str, column_type: str = "TEXT"):
        """Add a column to a table if it doesn't exist."""
        if not self._column_exists(table, column):
            self.c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}")

    def _migrate_columns(self):
        """Add migration columns to track tables if they don't exist."""
        tables = ["unplayable_tracks", "playable_tracks"]
        columns = [
            ("owner", "TEXT"),
            ("isrc", "TEXT"),
            ("upc", "TEXT"),
            ("licensor_name", "TEXT"),
            ("release_date", "TEXT")
        ]
        for table in tables:
            for column, col_type in columns:
                self._add_column_if_not_exists(table, column, col_type)

    def _init_db(self):
        self._create_tables()
        self._migrate_columns()
        self.conn.commit()

    # ---------- UPSERTS ----------

    def save_unplayable_track(self, track_data: dict, owner: Optional[str] = None):
        """
        Track verisini (Spotify'dan çekilmiş tam veri) kaydeder veya günceller.
        Beklenen keys:
            id, name, artist_names (list veya JSON), album_name, duration_ms, popularity,
            is_playable, spotify_url, image_url, playlist_id, added_at, isrc
        """
        try:
            artist_names = track_data.get("artist_names")
            if isinstance(artist_names, list):
                artist_names = json.dumps(artist_names, ensure_ascii=False)
            self.c.execute("""
                INSERT INTO unplayable_tracks (
                    id, name, artist_names, album_name, duration_ms, popularity,
                    is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    owner=COALESCE(excluded.owner, owner),
                    isrc=excluded.isrc,
                    upc=excluded.upc
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
                owner,
                track_data.get("isrc"),
                track_data.get("upc")
            ))
            self.conn.commit()
        except Exception as e:
            logger.exception("save_unplayable_track hata: %s", e)
        
    def save_playable_track(self, track_data: dict, owner: Optional[str] = None):
        try:
            artist_names = track_data.get("artist_names")
            if isinstance(artist_names, list):
                artist_names = json.dumps(artist_names, ensure_ascii=False)
            self.c.execute("""
                INSERT INTO playable_tracks (
                    id, name, artist_names, album_name, duration_ms, popularity,
                    is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    owner=COALESCE(excluded.owner, owner),
                    isrc=excluded.isrc,
                    upc=excluded.upc
            """, (
                track_data.get("id"),
                track_data.get("name"),
                artist_names,
                track_data.get("album_name"),
                track_data.get("duration_ms"),
                track_data.get("popularity"),
                int(track_data.get("is_playable", 1)),
                track_data.get("spotify_url"),
                track_data.get("image_url"),
                track_data.get("playlist_id"),
                track_data.get("added_at"),
                owner,
                track_data.get("isrc"),
                track_data.get("upc") 
            ))
            self.conn.commit()
        except Exception as e:
            logger.exception("save_playable_track hata: %s", e)

    def save_playable_track_if_new(self, track_data: dict, owner: Optional[str] = None) -> bool:
        try:
            track_id = track_data.get("id")
            if not track_id:
                return False

            self.c.execute(
                "SELECT 1 FROM playable_tracks WHERE id = ? AND (owner = ? OR owner IS NULL)",
                (track_id, owner)
            )
            exists = self.c.fetchone()
            if exists:
                return False

            self.save_playable_track(track_data, owner)
            return True
        except Exception as e:
            logger.exception("save_playable_track_if_new hata: %s", e)
            return False


    def _extract_date_key_from_stream_item(self, item) -> str | None:
        """Extract date key from a stream item (dict or tuple/list format)."""
        if isinstance(item, dict):
            return item.get("date")
        elif isinstance(item, (list, tuple)) and len(item) == 2:
            return str(item[0])
        return None

    def _normalize_stream_item_to_dict(self, item) -> dict | None:
        """Normalize a stream item to {date, streams} dict format."""
        if isinstance(item, dict):
            return {"date": str(item["date"]), "streams": int(item["streams"])}
        elif isinstance(item, (list, tuple)) and len(item) == 2:
            return {"date": str(item[0]), "streams": int(item[1])}
        return None

    def _merge_stream_data(self, existing: list, new_streams: list) -> dict:
        """Merge new stream data with existing, only adding new dates."""
        existing_dates = {item["date"]: item for item in existing}
        merged_streams = list(existing)
        
        for new_item in new_streams:
            date_key = self._extract_date_key_from_stream_item(new_item)
            if date_key and date_key not in existing_dates:
                normalized = self._normalize_stream_item_to_dict(new_item)
                if normalized:
                    merged_streams.append(normalized)
        
        merged_streams.sort(key=lambda x: x["date"])
        return {"streams": merged_streams}

    def save_track_stream_data(self, track_id: str, historical_data: dict, owner: str, merge: bool = True):
        """
        Owner bazlı stream verisi kaydeder.
        If merge=True, merges new data with existing (only adds new dates, doesn't overwrite).
        If merge=False, replaces existing data.
        """
        try:
            new_streams = historical_data.get("streams", [])
            
            if merge:
                existing = self.get_track_historical(track_id, owner)
                historical_data = self._merge_stream_data(existing, new_streams)
            
            hist_json = json.dumps(historical_data, ensure_ascii=False)
            last_updated = datetime.datetime.now(datetime.timezone.utc).isoformat()

            self.c.execute("""
                INSERT INTO track_streams (track_id, owner, historical_streams, last_updated)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(track_id, owner) DO UPDATE SET
                    historical_streams=excluded.historical_streams,
                    last_updated=excluded.last_updated
            """, (track_id, owner, hist_json, last_updated))

            self.conn.commit()
            logger.info("Historical stream data saved for track %s (owner=%s, merge=%s)", track_id, owner, merge)
        except Exception as e:
            logger.exception("save_track_stream_data hata: %s", e)

    def save_track_uuid(self, track_id: str, uuid: str):
        """
        Cache Soundcharts UUID for a track.
        """
        try:
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self.c.execute("""
                INSERT INTO track_uuid_cache (track_id, uuid, created_at, updated_at)
                VALUES (?, ?, COALESCE((SELECT created_at FROM track_uuid_cache WHERE track_id = ?), ?), ?)
                ON CONFLICT(track_id) DO UPDATE SET
                    uuid=excluded.uuid,
                    updated_at=excluded.updated_at
            """, (track_id, uuid, track_id, now, now))
            self.conn.commit()
            logger.debug("UUID cached for track %s: %s", track_id, uuid)
        except Exception as e:
            logger.exception("save_track_uuid hata: %s", e)

    def get_track_uuid(self, track_id: str) -> Optional[str]:
        """
        Get cached Soundcharts UUID for a track.
        """
        try:
            self.c.execute("SELECT uuid FROM track_uuid_cache WHERE track_id = ?", (track_id,))
            row = self.c.fetchone()
            return row[0] if row else None
        except Exception as e:
            logger.exception("get_track_uuid hata: %s", e)
            return None

    def save_unplayable_track_if_new(self, track_data: dict, owner: Optional[str] = None) -> bool:
        """
        Track zaten DB’de yoksa kaydeder, varsa hiçbir şey yapmaz.
        True -> yeni kaydedildi
        False -> zaten vardı
        """
        try:
            track_id = track_data.get("id")
            if not track_id:
                return False

            # DB'de var mı kontrol et
            self.c.execute(
                "SELECT 1 FROM unplayable_tracks WHERE id = ? AND (owner = ? OR owner IS NULL)",
                (track_id, owner)
            )
            exists = self.c.fetchone()
            if exists:
                return False  # zaten var

            # Yoksa kaydet
            self.save_unplayable_track(track_data, owner)
            return True
        except Exception as e:
            logger.exception("save_unplayable_track_if_new hata: %s", e)
            return False

    def upsert_priority_track(self, track_id: str, owner: str, average: int):
        try:
            created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
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

    def save_lookup_data(self, track_id: str, licensor_name: Optional[str], release_date: Optional[str]) -> bool:
        """
        Lookup butonundan gelen veriyi kaydeder (hem playable hem unplayable tabloda günceller).
        """
        try:
            self.c.execute("""
                UPDATE playable_tracks
                SET licensor_name = ?, release_date = ?
                WHERE id = ?
            """, (licensor_name, release_date, track_id))

            self.c.execute("""
                UPDATE unplayable_tracks
                SET licensor_name = ?, release_date = ?
                WHERE id = ?
            """, (licensor_name, release_date, track_id))

            self.conn.commit()
            logger.info("Lookup data saved for track %s", track_id)
            return True
        except Exception as e:
            logger.exception("save_lookup_data hata: %s", e)
            return False

    # ---------- DELETE ----------

    def delete_track(self, track_id: str) -> bool:
        try:
            logger.debug(f"Silme denemesi: track_id={track_id}")
            
            # Her iki tablodan sil
            self.c.execute("DELETE FROM playable_tracks WHERE id = ?", (track_id,))
            count_playable = self.c.rowcount

            self.c.execute("DELETE FROM unplayable_tracks WHERE id = ?", (track_id,))
            count_unplayable = self.c.rowcount

            self.conn.commit()
            total_deleted = count_playable + count_unplayable
            logger.debug(f"Silinen satır sayısı: {total_deleted}")

            return total_deleted > 0
        except Exception as e:
            logger.error(f"delete_track hata: {e}", exc_info=True)
            return False

    def delete_artist(self, artist_name: str) -> int:
        """
        Verilen artist_name'e ait tüm trackleri playable ve unplayable tablolardan siler.
        Returns: silinen toplam satır sayısı
        """
        try:
            # Playable tablodan sil
            self.c.execute(
                "DELETE FROM playable_tracks WHERE artist_names LIKE ?",
                (f'%"{artist_name}"%',)  # JSON içinde name kontrolü
            )
            count_playable = self.c.rowcount

            # Unplayable tablodan sil
            self.c.execute(
                "DELETE FROM unplayable_tracks WHERE artist_names LIKE ?",
                (f'%"{artist_name}"%',)
            )
            count_unplayable = self.c.rowcount

            self.conn.commit()
            total_deleted = count_playable + count_unplayable
            logger.debug(f"Silinen toplam satır sayısı: {total_deleted}")
            return total_deleted
        except Exception as e:
            logger.error(f"delete_artist hata: {e}", exc_info=True)
            return 0

    def delete_tracks_bulk(self, track_ids: List[str], owner: Optional[str] = None) -> int:
        """
        Verilen track_id listesi için playable + unplayable tablolardan silme yapar.
        owner verilirse sadece owner'a ait (veya owner IS NULL legacy) kayıtları siler.
        Dönen: toplam silinen satır sayısı
        """
        if not track_ids:
            return 0

        try:
            placeholders = ",".join("?" for _ in track_ids)

            if owner:
                # playable
                self.c.execute(
                    f"DELETE FROM playable_tracks WHERE id IN ({placeholders}) AND (owner = ? OR owner IS NULL)",
                    (*track_ids, owner)
                )
                count_playable = self.c.rowcount

                # unplayable
                self.c.execute(
                    f"DELETE FROM unplayable_tracks WHERE id IN ({placeholders}) AND (owner = ? OR owner IS NULL)",
                    (*track_ids, owner)
                )
                count_unplayable = self.c.rowcount
            else:
                self.c.execute(
                    f"DELETE FROM playable_tracks WHERE id IN ({placeholders})",
                    tuple(track_ids)
                )
                count_playable = self.c.rowcount

                self.c.execute(
                    f"DELETE FROM unplayable_tracks WHERE id IN ({placeholders})",
                    tuple(track_ids)
                )
                count_unplayable = self.c.rowcount

            self.conn.commit()
            total_deleted = (count_playable or 0) + (count_unplayable or 0)
            logger.debug(f"Silinen toplam satır sayısı (bulk): {total_deleted}")
            return total_deleted
        except Exception as e:
            logger.exception("delete_tracks_bulk hata: %s", e)
            return 0

    # Compatibility aliases for various endpoint expectations
    def delete_tracks(self, track_ids: List[str], owner: Optional[str] = None) -> int:
        """
        Alias for delete_tracks_bulk. Returns number of deleted rows.
        """
        return self.delete_tracks_bulk(track_ids, owner)

    def delete_by_ids(self, ids: List[str], owner: Optional[str] = None) -> int:
        return self.delete_tracks_bulk(ids, owner)

    def delete_by_id(self, track_id: str) -> bool:
        return self.delete_track(track_id)

    def remove_tracks(self, ids: List[str], owner: Optional[str] = None) -> int:
        return self.delete_tracks_bulk(ids, owner)

    def remove_track(self, track_id: str) -> bool:
        return self.delete_track(track_id)

    # ---------- QUERIES ----------

    def _row_to_dict(self, cursor, row) -> Dict[str, Any]:
        return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

    def get_unplayable_tracks(self, owner: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
        """
        owner verilirse sadece owner'a ait kayıtlar + owner NULL (legacy) döner.
        """
        try:
            if owner:
                self.c.execute("""
                    SELECT id, name, artist_names, album_name, duration_ms, popularity,
                        is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc
                    FROM unplayable_tracks
                    WHERE (owner IS NULL OR owner = ?)
                    ORDER BY added_at DESC
                    LIMIT ?
                """, (owner, limit))
            else:
                self.c.execute("""
                    SELECT id, name, artist_names, album_name, duration_ms, popularity,
                        is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc
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

    def get_playable_tracks(self, owner: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
        """
        owner verilirse sadece owner'a ait playable trackleri döner.
        """
        try:
            if owner:
                self.c.execute("""
                    SELECT id, name, artist_names, album_name, duration_ms, popularity,
                        is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc
                    FROM playable_tracks
                    WHERE owner = ? OR owner IS NULL
                    ORDER BY added_at DESC
                    LIMIT ?
                """, (owner, limit))
            else:
                self.c.execute("""
                    SELECT id, name, artist_names, album_name, duration_ms, popularity,
                        is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc
                    FROM playable_tracks
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
            logger.exception("get_playable_tracks hata: %s", e)
            return []


    def get_priority_tracks(self, owner: str, limit: int = 200) -> List[Dict[str, Any]]:
        try:
            self.c.execute("""
                SELECT p.track_id, p.owner, p.average, p.created_at,
                    u.name, u.artist_names, u.album_name, u.spotify_url, u.image_url, u.upc
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


    def get_track_historical(self, track_id: str, owner: str) -> list[dict]:
        """
        Owner bazlı historical_streams döner. Boş liste dönerse frontend hata vermez.
        """
        try:
            self.c.execute("""
                SELECT historical_streams FROM track_streams WHERE track_id = ? AND owner = ?
            """, (track_id, owner))
            row = self.c.fetchone()
            if not row or not row[0]:
                return []
            payload = json.loads(row[0])
            streams = payload.get("streams", [])
            normalized = []
            for item in streams:
                if isinstance(item, dict) and "date" in item and "streams" in item:
                    normalized.append({"date": str(item["date"]), "streams": int(item["streams"])})
                elif isinstance(item, (list, tuple)) and len(item) == 2:
                    normalized.append({"date": str(item[0]), "streams": int(item[1])})
            return normalized
        except Exception as e:
            logger.exception("get_track_historical hata: %s", e)
            return []

    def get_track_by_id(self, track_id: str):
        self.c.execute("SELECT * FROM playable_tracks WHERE id = ?", (track_id,))
        row = self.c.fetchone()
        if row:
            return self._row_to_dict(self.c, row)  # ← düzeltilmiş satır
        return None

    def _row_to_dict_and_decode_artist_names(self, cursor, row) -> Dict[str, Any]:
        """Convert database row to dict and decode artist_names JSON."""
        d = {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
        if d.get("artist_names"):
            try:
                d["artist_names"] = json.loads(d["artist_names"])
            except Exception:
                d["artist_names"] = [d["artist_names"]]
        else:
            d["artist_names"] = []
        return d

    def _build_licensor_query(self, placeholders: str, owner: Optional[str]) -> tuple[str, list]:
        """Build SQL query and params for licensor search."""
        select_cols = "id, name, artist_names, album_name, duration_ms, popularity, is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc, licensor_name, release_date"
        owner_clause = " AND (owner IS NULL OR owner = ?)" if owner else ""
        query = f"""
            SELECT {select_cols} FROM {{table}}
            WHERE LOWER(TRIM(COALESCE(licensor_name, ''))) IN ({placeholders})
            {owner_clause}
        """
        return query, owner_clause

    def _fetch_tracks_by_licensors_from_table(
        self, table: str, placeholders: str, params: list, owner: Optional[str]
    ) -> list:
        """Fetch tracks from a specific table by licensors."""
        query_template, owner_clause = self._build_licensor_query(placeholders, owner)
        query = query_template.format(table=table)
        params_with_owner = params + [owner] if owner else params
        self.c.execute(query, params_with_owner)
        return self.c.fetchall()

    def _merge_track_results(self, playable_rows: list, unplayable_rows: list) -> List[Dict[str, Any]]:
        """Merge playable and unplayable track results, preferring playable."""
        combined = {}
        for row in playable_rows:
            d = self._row_to_dict_and_decode_artist_names(self.c, row)
            combined[d["id"]] = d
        for row in unplayable_rows:
            d = self._row_to_dict_and_decode_artist_names(self.c, row)
            if d["id"] not in combined:
                combined[d["id"]] = d
        return list(combined.values())

    def _normalize_licensors(self, licensors: List[str]) -> List[str]:
        """Normalize licensor names (strip and lowercase). Returns empty list if invalid."""
        if not licensors:
            return []
        normalized = [l.strip().lower() for l in licensors if l and l.strip()]
        return normalized if normalized else []

    def _sort_and_limit_results(self, result: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
        """Sort results by added_at desc and apply limit."""
        try:
            result.sort(key=lambda x: x.get("added_at") or "", reverse=True)
        except Exception:
            pass
        if limit and len(result) > limit:
            result = result[:limit]
        return result

    def get_tracks_by_licensors(self, licensors: List[str], owner: Optional[str] = None, limit: int = 500) -> List[Dict[str, Any]]:
        """
        Verilen licensor isimlerine (case-insensitive) uyan kayıtları playable + unplayable tablolardan döndür.
        Eğer aynı track iki tabloda varsa playable versiyon tercih edilir.
        """
        try:
            licensors_norm = self._normalize_licensors(licensors)
            if not licensors_norm:
                return []

            placeholders = ",".join("?" for _ in licensors_norm)
            params = licensors_norm[:]

            playable_rows = self._fetch_tracks_by_licensors_from_table(
                "playable_tracks", placeholders, params, owner
            )
            unplayable_rows = self._fetch_tracks_by_licensors_from_table(
                "unplayable_tracks", placeholders, params, owner
            )

            result = self._merge_track_results(playable_rows, unplayable_rows)
            return self._sort_and_limit_results(result, limit)
        except Exception as e:
            logger.exception("get_tracks_by_licensors hata: %s", e)
            return []

    def _fetch_all_tracks_from_table(self, table: str, owner: Optional[str]) -> list:
        """Fetch all tracks from a specific table."""
        select_cols = "id, name, artist_names, album_name, duration_ms, popularity, is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc, licensor_name, release_date"
        if owner:
            self.c.execute(
                f"SELECT {select_cols} FROM {table} WHERE (owner IS NULL OR owner = ?) ORDER BY added_at DESC",
                (owner,)
            )
        else:
            self.c.execute(f"SELECT {select_cols} FROM {table} ORDER BY added_at DESC", ())
        return self.c.fetchall()

    def get_all_tracks(self, owner: Optional[str] = None, limit: Optional[int] = 500) -> List[Dict[str, Any]]:
        """
        Playable + unplayable tablolardaki tüm kayıtları döner.
        Eğer aynı track her iki tabloda varsa playable versiyon tercih edilir.
        owner verilirse sadece owner IS NULL veya owner eşleşen kayıtlar döner.
        """
        try:
            playable_rows = self._fetch_all_tracks_from_table("playable_tracks", owner)
            unplayable_rows = self._fetch_all_tracks_from_table("unplayable_tracks", owner)

            result = self._merge_track_results(playable_rows, unplayable_rows)
            
            try:
                result.sort(key=lambda x: x.get("added_at") or "", reverse=True)
            except Exception:
                pass

            if limit and len(result) > limit:
                result = result[:limit]

            return result
        except Exception as e:
            logger.exception("get_all_tracks hata: %s", e)
            return []


    def close(self):
        if self.conn:
            self.conn.close()

# ---- Modül-dışı uyumluluk ----
def save_track_stream_data(track_id: str, historical_data: dict, owner: str, merge: bool = True):
    storage = TrackStorage()
    try:
        storage.save_track_stream_data(track_id, historical_data, owner, merge=merge)
    finally:
        storage.close()

def save_lookup_data(track_id: str, licensor_name: Optional[str], release_date: Optional[str]):
    storage = TrackStorage()
    try:
        storage.save_lookup_data(track_id, licensor_name, release_date)
    finally:
        storage.close()

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
        # unplayable_tracks
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
        # playable_tracks
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
        
        # track_streams: artık owner ile primary key olacak
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS track_streams (
                track_id TEXT,
                owner TEXT,
                historical_streams TEXT,
                last_updated TEXT,
                PRIMARY KEY (track_id, owner)
            )
        """)

        # priority_tracks
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
        if not self._column_exists("playable_tracks", "owner"):
            self.c.execute("ALTER TABLE playable_tracks ADD COLUMN owner TEXT")

        # Migration: isrc kolonu yoksa ekle
        if not self._column_exists("unplayable_tracks", "isrc"):
            self.c.execute("ALTER TABLE unplayable_tracks ADD COLUMN isrc TEXT")
        if not self._column_exists("playable_tracks", "isrc"):
            self.c.execute("ALTER TABLE playable_tracks ADD COLUMN isrc TEXT")

        # Migration: upc kolonu yoksa ekle
        if not self._column_exists("unplayable_tracks", "upc"):
            self.c.execute("ALTER TABLE unplayable_tracks ADD COLUMN upc TEXT")
        if not self._column_exists("playable_tracks", "upc"):
            self.c.execute("ALTER TABLE playable_tracks ADD COLUMN upc TEXT")

        if not self._column_exists("unplayable_tracks", "licensor_name"):
            self.c.execute("ALTER TABLE unplayable_tracks ADD COLUMN licensor_name TEXT")
        if not self._column_exists("playable_tracks", "licensor_name"):
            self.c.execute("ALTER TABLE playable_tracks ADD COLUMN licensor_name TEXT")

        if not self._column_exists("unplayable_tracks", "release_date"):
            self.c.execute("ALTER TABLE unplayable_tracks ADD COLUMN release_date TEXT")
        if not self._column_exists("playable_tracks", "release_date"):
            self.c.execute("ALTER TABLE playable_tracks ADD COLUMN release_date TEXT")

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


    def save_track_stream_data(self, track_id: str, historical_data: dict, owner: str):
        """
        Owner bazlı stream verisi kaydeder.
        """
        try:
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
            logger.info("Historical stream data saved for track %s (owner=%s)", track_id, owner)
        except Exception as e:
            logger.exception("save_track_stream_data hata: %s", e)

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
            print(f"[DEBUG] Silme denemesi: track_id={track_id}")
            
            # Her iki tablodan sil
            self.c.execute("DELETE FROM playable_tracks WHERE id = ?", (track_id,))
            count_playable = self.c.rowcount

            self.c.execute("DELETE FROM unplayable_tracks WHERE id = ?", (track_id,))
            count_unplayable = self.c.rowcount

            self.conn.commit()
            total_deleted = count_playable + count_unplayable
            print(f"[DEBUG] Silinen satır sayısı: {total_deleted}")

            return total_deleted > 0
        except Exception as e:
            print(f"[ERROR] delete_track hata: {e}")
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
            print(f"[DEBUG] Silinen toplam satır sayısı: {total_deleted}")
            return total_deleted
        except Exception as e:
            print(f"[ERROR] delete_artist hata: {e}")
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
            print(f"[DEBUG] Silinen toplam satır sayısı (bulk): {total_deleted}")
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

    def get_tracks_by_licensors(self, licensors: List[str], owner: Optional[str] = None, limit: int = 500) -> List[Dict[str, Any]]:
        """
        Verilen licensor isimlerine (case-insensitive) uyan kayıtları playable + unplayable tablolardan döndür.
        Eğer aynı track iki tabloda varsa playable versiyon tercih edilir.
        """
        try:
            if not licensors:
                return []

            # normalize params
            licensors_norm = [l.strip().lower() for l in licensors if l and l.strip()]
            if not licensors_norm:
                return []

            placeholders = ",".join("?" for _ in licensors_norm)
            params = licensors_norm[:]  # for IN (...)

            owner_clause = ""
            if owner:
                owner_clause = " AND (owner IS NULL OR owner = ?)"
                params_with_owner = params + [owner]
            else:
                params_with_owner = params

            select_cols = "id, name, artist_names, album_name, duration_ms, popularity, is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc, licensor_name, release_date"

            query_playable = f"""
                SELECT {select_cols} FROM playable_tracks
                WHERE LOWER(TRIM(COALESCE(licensor_name, ''))) IN ({placeholders})
                {owner_clause}
            """

            query_unplayable = f"""
                SELECT {select_cols} FROM unplayable_tracks
                WHERE LOWER(TRIM(COALESCE(licensor_name, ''))) IN ({placeholders})
                {owner_clause}
            """

            # fetch playable
            if owner:
                self.c.execute(query_playable, params_with_owner)
            else:
                self.c.execute(query_playable, params)
            playable_rows = self.c.fetchall()

            # fetch unplayable
            if owner:
                self.c.execute(query_unplayable, params_with_owner)
            else:
                self.c.execute(query_unplayable, params)
            unplayable_rows = self.c.fetchall()

            combined = {}
            # helper to convert
            def row_to_dict_and_decode(cursor, row):
                d = {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
                if d.get("artist_names"):
                    try:
                        d["artist_names"] = json.loads(d["artist_names"])
                    except Exception:
                        # eğer JSON değilse tek string olarak bırak
                        d["artist_names"] = [d["artist_names"]]
                else:
                    d["artist_names"] = []
                return d

            # add playable first (prefer playable on duplicates)
            for row in playable_rows:
                d = row_to_dict_and_decode(self.c, row)
                combined[d["id"]] = d

            for row in unplayable_rows:
                d = row_to_dict_and_decode(self.c, row)
                if d["id"] not in combined:
                    combined[d["id"]] = d

            # sort by added_at desc if present, otherwise keep insertion order
            result = list(combined.values())
            try:
                result.sort(key=lambda x: x.get("added_at") or "", reverse=True)
            except Exception:
                pass

            if limit and len(result) > limit:
                result = result[:limit]

            return result
        except Exception as e:
            logger.exception("get_tracks_by_licensors hata: %s", e)
            return []

    def get_all_tracks(self, owner: Optional[str] = None, limit: Optional[int] = 500) -> List[Dict[str, Any]]:
        """
        Playable + unplayable tablolardaki tüm kayıtları döner.
        Eğer aynı track her iki tabloda varsa playable versiyon tercih edilir.
        owner verilirse sadece owner IS NULL veya owner eşleşen kayıtlar döner.
        """
        try:
            select_cols = "id, name, artist_names, album_name, duration_ms, popularity, is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc, licensor_name, release_date"

            if owner:
                self.c.execute(f"SELECT {select_cols} FROM playable_tracks WHERE (owner IS NULL OR owner = ?) ORDER BY added_at DESC", (owner,))
            else:
                self.c.execute(f"SELECT {select_cols} FROM playable_tracks ORDER BY added_at DESC", ())
            playable_rows = self.c.fetchall()

            if owner:
                self.c.execute(f"SELECT {select_cols} FROM unplayable_tracks WHERE (owner IS NULL OR owner = ?) ORDER BY added_at DESC", (owner,))
            else:
                self.c.execute(f"SELECT {select_cols} FROM unplayable_tracks ORDER BY added_at DESC", ())
            unplayable_rows = self.c.fetchall()

            combined = {}

            def row_to_dict_and_decode(cursor, row):
                d = {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
                if d.get("artist_names"):
                    try:
                        d["artist_names"] = json.loads(d["artist_names"])
                    except Exception:
                        # Eğer JSON değilse tek string olarak listele
                        d["artist_names"] = [d["artist_names"]]
                else:
                    d["artist_names"] = []
                return d

            # playable önce ekle (tercih)
            for row in playable_rows:
                d = row_to_dict_and_decode(self.c, row)
                combined[d["id"]] = d

            # sonra unplayable ekle, zaten yoksa
            for row in unplayable_rows:
                d = row_to_dict_and_decode(self.c, row)
                if d["id"] not in combined:
                    combined[d["id"]] = d

            result = list(combined.values())
            try:
                result.sort(key=lambda x: x.get("added_at") or "", reverse=True)
            except Exception:
                # added_at format'ı karışık ise sıralama atlanır
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
def save_track_stream_data(track_id: str, historical_data: dict, owner: str):
    storage = TrackStorage()
    try:
        storage.save_track_stream_data(track_id, historical_data, owner)
    finally:
        storage.close()

def save_lookup_data(track_id: str, licensor_name: Optional[str], release_date: Optional[str]):
    storage = TrackStorage()
    try:
        storage.save_lookup_data(track_id, licensor_name, release_date)
    finally:
        storage.close()

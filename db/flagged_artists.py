# db/flagged_artists.py

import sqlite3
import json
from typing import List, Dict, Set, Optional
from utils.db import get_connection
from utils.logger import get_logger

logger = get_logger(__name__)

# //[list_flagged_artists] : Return all flagged artists from DB as list of dicts
def list_flagged_artists() -> List[Dict]:
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("""CREATE TABLE IF NOT EXISTS flagged_artists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )""")
        # fetch
        c.execute("SELECT id, name FROM flagged_artists ORDER BY name ASC")
        rows = c.fetchall()
        return [{"id": r[0], "name": r[1]} for r in rows]
    except Exception as e:
        logger.exception("list_flagged_artists hata: %s", e)
        return []
    finally:
        conn.close()

# //[add_flagged_artist] : Add exact artist name to DB (returns True if added, False if exists/failed)
def add_flagged_artist(name: str) -> bool:
    name = name.strip()
    if not name:
        return False
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("""CREATE TABLE IF NOT EXISTS flagged_artists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )""")
        c.execute("INSERT INTO flagged_artists (name) VALUES (?)", (name,))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    except Exception as e:
        logger.exception("add_flagged_artist hata: %s", e)
        return False
    finally:
        conn.close()

# //[delete_flagged_artist] : Remove flagged artist by id
def delete_flagged_artist(artist_id: int) -> bool:
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("DELETE FROM flagged_artists WHERE id = ?", (artist_id,))
        conn.commit()
        return c.rowcount > 0
    except Exception as e:
        logger.exception("delete_flagged_artist hata: %s", e)
        return False
    finally:
        conn.close()

# //[get_flagged_names_set] : Return set of exact artist names
def get_flagged_names_set() -> Set[str]:
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("""CREATE TABLE IF NOT EXISTS flagged_artists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )""")
        c.execute("SELECT name FROM flagged_artists")
        rows = c.fetchall()
        return set(r[0] for r in rows)
    except Exception as e:
        logger.exception("get_flagged_names_set hata: %s", e)
        return set()
    finally:
        conn.close()

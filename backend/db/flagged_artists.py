# db/flagged_artists.py
"""
Flagged artists persistence helpers.

This module stores artist names that should be excluded from future scanning results.
Each user has their own flagged list (scoped by `owner`).
Matching is performed as an exact string match (case & unicode sensitive).
"""

import sqlite3
from typing import List, Dict, Set
from utils.db import get_connection
from utils.logger import get_logger

logger = get_logger(__name__)


def _init_table(conn: sqlite3.Connection) -> None:
    """
    Ensure the flagged_artists table exists.
    """
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS flagged_artists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            UNIQUE(name, owner)
        )
        """
    )
    conn.commit()


# //[list_flagged_artists] : Return all flagged artists for given owner
def list_flagged_artists(owner: str) -> List[Dict]:
    """
    Returns list of {"id": int, "name": str} for all flagged artists of a user.
    """
    conn = get_connection()
    try:
        _init_table(conn)
        c = conn.cursor()
        c.execute("SELECT id, name FROM flagged_artists WHERE owner = ? ORDER BY name", (owner,))
        rows = c.fetchall()
        return [{"id": r[0], "name": r[1]} for r in rows]
    except Exception as e:
        logger.exception("list_flagged_artists hata: %s", e)
        return []
    finally:
        conn.close()


# //[add_flagged_artist] : Add exact artist name (case-sensitive) to DB for given owner
def add_flagged_artist(name: str, owner: str) -> bool:
    """
    Adds an artist name to the flagged list for a specific user.
    The comparison and storage is exact (case-sensitive).
    Returns True if the artist was inserted, False if it already existed or an error occurred.
    """
    if not name or not isinstance(name, str):
        return False
    conn = get_connection()
    try:
        _init_table(conn)
        c = conn.cursor()
        # INSERT OR IGNORE ensures idempotence per (name, owner)
        c.execute("INSERT OR IGNORE INTO flagged_artists (name, owner) VALUES (?, ?)", (name, owner))
        conn.commit()
        return c.rowcount > 0
    except Exception as e:
        logger.exception("add_flagged_artist hata: %s", e)
        return False
    finally:
        conn.close()


# //[delete_flagged_artist] : Delete a flagged artist by id for given owner
def delete_flagged_artist(artist_id: int, owner: str) -> bool:
    """
    Deletes a flagged artist by numeric id for a specific user.
    Returns True if a row was removed.
    """
    conn = get_connection()
    try:
        _init_table(conn)
        c = conn.cursor()
        c.execute("DELETE FROM flagged_artists WHERE id = ? AND owner = ?", (artist_id, owner))
        conn.commit()
        return c.rowcount > 0
    except Exception as e:
        logger.exception("delete_flagged_artist hata: %s", e)
        return False
    finally:
        conn.close()


# //[get_flagged_names_set] : Return set of flagged artist names for fast lookup (case-sensitive)
def get_flagged_names_set(owner: str) -> Set[str]:
    """
    Returns a set of artist names (strings) currently flagged for exclusion by a specific user.
    This set is suitable for O(1) exact membership checks.
    """
    conn = get_connection()
    try:
        _init_table(conn)
        c = conn.cursor()
        c.execute("SELECT name FROM flagged_artists WHERE owner = ?", (owner,))
        rows = c.fetchall()
        return {r[0] for r in rows}
    except Exception as e:
        logger.exception("get_flagged_names_set hata: %s", e)
        return set()
    finally:
        conn.close()

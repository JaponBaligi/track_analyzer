# utils/db.py

import sqlite3
import os

DB_PATH = os.getenv("DATABASE_PATH", "database.db")

def get_connection():
    return sqlite3.connect(DB_PATH)

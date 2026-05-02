"""Load isrc-company secrets from config/.env (see config/.env.example)."""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_ENV_PATH = _CONFIG_DIR / ".env"


def load_isrc_env() -> None:
    load_dotenv(_ENV_PATH)


def get_web_authorization() -> Optional[str]:
    load_isrc_env()
    v = os.getenv("SPOTIFY_WEB_AUTHORIZATION", "").strip()
    return v or None


def get_web_client_token() -> Optional[str]:
    load_isrc_env()
    v = os.getenv("SPOTIFY_WEB_CLIENT_TOKEN", "").strip()
    return v or None


def get_spclient_track_metadata_url(gid: str) -> Optional[str]:
    """URL template from env must contain `{gid}` (hex track id for spclient)."""
    load_isrc_env()
    template = os.getenv("SPOTIFY_SPCLIENT_TRACK_URL_TEMPLATE", "").strip()
    if not template:
        return None
    if "{gid}" not in template:
        return None
    try:
        return template.format(gid=gid)
    except (KeyError, ValueError):
        return None

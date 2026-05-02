# config/config.py

from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def get_env_var(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise EnvironmentError(f"Missing required environment variable: {name}")
    return value

SPOTIFY_CLIENT_ID = get_env_var("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = get_env_var("SPOTIFY_CLIENT_SECRET")
#CHARTMETRIC_API_KEY = get_env_var("CHARTMETRIC_API_KEY")
DATABASE_URL = get_env_var("DATABASE_URL")

def _parse_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]


ENVIRONMENT = os.getenv("ENVIRONMENT", "dev").lower()
_origins = _parse_allowed_origins()

if ENVIRONMENT == "prod":
    if not _origins:
        raise EnvironmentError(
            "ENVIRONMENT=prod requires ALLOWED_ORIGINS "
            "(comma-separated origins, e.g. https://app.example.com,http://localhost:3000)."
        )
    if any(o == "*" for o in _origins):
        raise EnvironmentError(
            "ALLOWED_ORIGINS must not contain '*' when ENVIRONMENT=prod; list explicit origins."
        )
    ALLOWED_ORIGINS = _origins
else:
    ALLOWED_ORIGINS = _origins if _origins else ["*"]

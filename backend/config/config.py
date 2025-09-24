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

# Yeni eklenen: ortam bazlı allowed_origins
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev").lower()

if ENVIRONMENT == "prod":
    ALLOWED_ORIGINS = [
        "*", 
    ]
else:
    ALLOWED_ORIGINS = ["*"]

# api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from api.routes import db_view
from utils.logger import get_logger
from db.track_storage import TrackStorage
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent / "config" / ".env"
load_dotenv(dotenv_path=env_path)
logger = get_logger(__name__)
# Veritabanı migration/kolon kontrolleri için bir kez aç-kapat
storage = TrackStorage()
storage.close()

app = FastAPI(
    title="Spotify Track Analyzer API",
    version="1.1.0"
)

# CORS (gerekirse prod domain'inle sınırla)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # prod'da sabitle
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ana API router
app.include_router(api_router, prefix="/api")
@app.get("/")
def root():
    return {"message": "Spotify Track Analyzer API çalışıyor."}

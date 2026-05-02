"""Run from repo root: uvicorn main:app --reload (adds backend/ to sys.path). Prefer: cd backend && uvicorn api.main:app."""

from pathlib import Path
import sys

_backend = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(_backend))

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(_backend / "config" / ".env")

from api.routes import router as api_router
from utils.logger import get_logger
from db.track_storage import TrackStorage
from config.config import ALLOWED_ORIGINS
logger = get_logger(__name__)
storage = TrackStorage()
storage.close()
app = FastAPI(
    title="Spotify Track Analyzer API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Spotify Track Analyzer API çalışıyor."}

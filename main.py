from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from utils.logger import get_logger
from db.track_storage import TrackStorage

logger = get_logger(__name__)
storage = TrackStorage()
storage.close()
app = FastAPI(
    title="Spotify Track Analyzer API",
    version="1.0.0"
)

# CORS: Web panelin erişimi için gerekli
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da buraya domain yazmalısın
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API route'ları
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Spotify Track Analyzer API çalışıyor."}

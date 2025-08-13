# api/schemas/artist.py

from pydantic import BaseModel, Field
from typing import List, Optional


class ArtistScanRequest(BaseModel):
    """
    Tarama işlemi başlatmak için sanatçı adı bilgisi ve isteğe bağlı bölge.
    """
    artist_name: str = Field(..., description="Sanatçının tam adı")
    region: Optional[str] = Field(None, description="Spotify market kodu (örn. TR, US). None ise global arama.")


class ArtistInfoResponse(BaseModel):
    """
    Spotify API'den dönen sanatçı bilgileri.
    """
    id: str = Field(..., description="Spotify sanatçı ID'si")
    name: str = Field(..., description="Sanatçının adı")
    followers: int = Field(..., description="Sanatçının takipçi sayısı")
    genres: List[str] = Field(..., description="Sanatçının türleri")
    popularity: int = Field(..., description="Sanatçının popülerlik puanı (0-100)")
    spotify_url: str = Field(..., description="Spotify'daki sanatçı profili URL'si")
    image_url: Optional[str] = Field(None, description="Sanatçı resmi URL'si, varsa")

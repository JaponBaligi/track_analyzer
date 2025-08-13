from pydantic import BaseModel, Field
from typing import List, Optional


class TrackBase(BaseModel):
    id: str = Field(..., description="Spotify track ID")
    name: str = Field(..., description="Parça adı")
    artist_names: List[str] = Field(default_factory=list, description="Parçanın sanatçıları")
    album_name: str = Field(..., description="Parçanın albüm adı")
    duration_ms: int = Field(..., description="Parça uzunluğu (milisaniye)")
    popularity: int = Field(..., description="Parçanın popülerlik değeri (0-100)")
    is_playable: bool = Field(..., description="Parçanın Spotify'da çalınıp çalınamayacağı")
    spotify_url: str = Field(..., description="Spotify parça URL'si")
    image_url: Optional[str] = Field(None, description="Albüm resmi URL'si, varsa")
    region: Optional[str] = Field(None, description="Parçanın bölgesi") 


class TrackEvaluationResponse(BaseModel):
    track_id: str = Field(..., description="Değerlendirilen parça ID'si")
    popularity: Optional[int] = Field(None, description="Parçanın popülerlik değeri, varsa")
    stream_count: Optional[int] = Field(None, description="Parçanın tahmini stream sayısı, varsa")
    message: Optional[str] = Field(None, description="Değerlendirme ile ilgili ek mesaj")

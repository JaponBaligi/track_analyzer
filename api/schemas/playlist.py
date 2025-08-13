# api/schemas/playlist.py

from pydantic import BaseModel, Field
from typing import List, Optional

class PlaylistBase(BaseModel):
    id: str = Field(..., description="Spotify playlist ID")
    name: str = Field(..., description="Playlist adı")
    owner_name: str = Field(..., description="Playlist sahibi")
    description: Optional[str] = Field(None, description="Playlist açıklaması")
    total_tracks: int = Field(..., description="Playlist içindeki toplam şarkı sayısı")
    spotify_url: str = Field(..., description="Spotify playlist URL'si")
    image_url: Optional[str] = Field(None, description="Playlist resmi URL'si, varsa")

class PlaylistListResponse(BaseModel):
    playlists: List[PlaylistBase] = Field(..., description="Playlistler listesi")

class TrackInfo(BaseModel):
    id: str = Field(..., description="Track ID")
    name: str = Field(..., description="Track adı")
    artist_names: List[str] = Field(..., description="Track sanatçıları")
    duration_ms: int = Field(..., description="Track uzunluğu (milisaniye)")
    is_playable: bool = Field(..., description="Şarkının çalınabilirliği")

class PlaylistDetailResponse(PlaylistBase):
    tracks: List[TrackInfo] = Field(..., description="Playlist içindeki şarkılar")

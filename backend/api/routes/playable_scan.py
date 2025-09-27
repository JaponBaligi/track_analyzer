# api/routes/playable_scan.py

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from spotify_client.artist_scanner import scan_artist_and_persist_tracks
from api.dependencies import get_current_user
from fastapi import APIRouter, Depends
from db.track_storage import TrackStorage


router = APIRouter(prefix="/playable", tags=["playable"])


class ScanArtistRequest(BaseModel):
    artist_identifier: str
    owner: Optional[str] = None
    market: Optional[str] = None


@router.post("/artists/scan", status_code=status.HTTP_200_OK)
def scan_artist_playable(req: ScanArtistRequest, current_user=Depends(get_current_user)):
    try:
        result = scan_artist_and_persist_tracks(
            req.artist_identifier, 
            owner=current_user, 
            market=req.market)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/result")
def playable_result(current_user=Depends(get_current_user)):
    """
    Session'daki kullanıcıya ait tüm playable trackleri döner.
    """
    owner = current_user
    storage = TrackStorage()
    try:
        storage.c.execute("""
            SELECT id, name, artist_names, album_name, duration_ms, popularity,
                   is_playable, spotify_url, image_url, playlist_id, added_at, owner, isrc, upc
            FROM playable_tracks
            WHERE owner = ? OR owner IS NULL
            ORDER BY added_at DESC
        """, (owner,))
        rows = storage.c.fetchall()
        result = []
        for row in rows:
            d = {col[0]: row[idx] for idx, col in enumerate(storage.c.description)}
            if d.get("artist_names"):
                try:
                    import json
                    d["artist_names"] = json.loads(d["artist_names"])
                except Exception:
                    d["artist_names"] = []
            result.append(d)
        return result
    finally:
        storage.close()

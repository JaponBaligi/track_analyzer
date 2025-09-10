# api/routes/flagged_artists.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from api.dependencies import get_current_user
from db import flagged_artists

router = APIRouter()

@router.get("/db/flagged-artists", response_model=List[Dict])
def list_flagged(owner: str = Depends(get_current_user)):
    """
    List flagged artists.
    """
    return flagged_artists.list_flagged_artists()

@router.post("/db/flagged-artists", response_model=Dict, status_code=status.HTTP_201_CREATED)
def add_flagged(payload: Dict, owner: str = Depends(get_current_user)):
    """
    Add flagged artist. Body: { "name": "ExactArtistName" }
    """
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Artist name required")
    ok = flagged_artists.add_flagged_artist(name)
    if not ok:
        raise HTTPException(status_code=409, detail="Artist already exists or failed to add")
    # return created row (best-effort)
    items = flagged_artists.list_flagged_artists()
    for it in items:
        if it["name"] == name:
            return it
    return {"id": None, "name": name}

@router.delete("/db/flagged-artists/{artist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flagged(artist_id: int, owner: str = Depends(get_current_user)):
    ok = flagged_artists.delete_flagged_artist(artist_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return

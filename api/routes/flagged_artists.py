# api/routes/flagged_artists.py
"""
API endpoints for managing flagged artists.

Paths:
 - GET  /api/flagged-artists    -> list all flagged artists
 - POST /api/flagged-artists    -> add a flagged artist { "name": "Exact Name" }
 - DELETE /api/flagged-artists/{id} -> remove flagged artist by id
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Dict
from api.dependencies import get_current_user
from db import flagged_artists as fa

router = APIRouter()

# //[list_flagged] : List flagged artists
@router.get("/flagged-artists", response_model=List[Dict])
def list_flagged(owner: str = Depends(get_current_user)):
    """
    Return list of flagged artists. Protected endpoint.
    """
    return fa.list_flagged_artists()

# //[add_flagged] : Add a flagged artist (exact string stored)
@router.post("/flagged-artists", response_model=Dict, status_code=status.HTTP_201_CREATED)
def add_flagged(payload: Dict = Body(...), owner: str = Depends(get_current_user)):
    """
    Add a flagged artist. Payload should be {"name": "<Exact Artist Name>"}.
    Returns the created row (best-effort).
    """
    name = payload.get("name") if isinstance(payload, dict) else None
    if not name or not isinstance(name, str):
        raise HTTPException(status_code=400, detail="Invalid 'name' value")
    ok = fa.add_flagged_artist(name)
    if not ok:
        raise HTTPException(status_code=409, detail="Artist already exists or failed to add")
    items = fa.list_flagged_artists()
    for it in items:
        if it["name"] == name:
            return it
    return {"id": None, "name": name}

# //[delete_flagged] : Delete a flagged artist by id
@router.delete("/flagged-artists/{artist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flagged(artist_id: int, owner: str = Depends(get_current_user)):
    ok = fa.delete_flagged_artist(artist_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return

# api/routes/lookup.py
import os
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from db.track_storage import TrackStorage
import requests

router = APIRouter()

ISRC_SERVICE_URL = os.getenv("ISRC_SERVICE_URL", "http://127.0.0.1:1337/get_licensor")

class LookupSaveRequest(BaseModel):
    track_id: str
    licensor_name: str | None = None
    release_date: str | None = None

class BulkDeleteRequest(BaseModel):
    ids: List[str]

@router.post("/save")
def save_lookup(req: LookupSaveRequest):
    storage = TrackStorage()
    try:
        licensor = (req.licensor_name or "").strip()
        release_date = (req.release_date or "").strip()

        if not licensor or not release_date:
            try:
                resp = requests.get(ISRC_SERVICE_URL, params={"track_id": req.track_id}, timeout=6)
                resp.raise_for_status()
                info = resp.json()
                licensor = licensor or info.get("licensor_name") or info.get("licensor") or ""
                release_date = release_date or info.get("release_date") or info.get("live_timestamp") or ""
            except Exception as e:
                print(f"ISRC service lookup failed: {e}")

        ok = storage.save_lookup_data(req.track_id, licensor, release_date)
        if not ok:
            raise HTTPException(status_code=500, detail="DB update failed")

        track = storage.get_track_by_id(req.track_id)
        return {"success": True, "track": jsonable_encoder(track)}
    finally:
        storage.close()

@router.get("/whitelist")
def get_whitelist():
    storage = TrackStorage()
    try:
        whitelist = {"distrokid", "toolost", "tunecore", "landr", "dittomusic", "labelengine", "amuse"}

        if hasattr(storage, "get_tracks_by_licensors"):
            tracks = storage.get_tracks_by_licensors(list(whitelist))
        elif hasattr(storage, "get_all_tracks"):
            all_tracks = storage.get_all_tracks()
            tracks = [t for t in all_tracks if (str(t.get("licensor_name") or "").strip().lower() in whitelist)]
        else:
            tracks = []

        return {"success": True, "tracks": jsonable_encoder(tracks)}
    finally:
        storage.close()

@router.delete("/whitelist/delete_bulk")
def delete_whitelist_bulk(req: BulkDeleteRequest):
    storage = TrackStorage()
    try:
        ids = req.ids or []
        if not ids:
            raise HTTPException(status_code=400, detail="ids boş olamaz")

        if hasattr(storage, "delete_tracks"):
            res = storage.delete_tracks(ids)
        elif hasattr(storage, "delete_by_ids"):
            res = storage.delete_by_ids(ids)
        elif hasattr(storage, "remove_tracks"):
            res = storage.remove_tracks(ids)
        elif hasattr(storage, "delete_track"):
            for _id in ids:
                storage.delete_track(_id)
            res = True
        else:
            raise HTTPException(status_code=501, detail="TrackStorage toplu silme metodu yok. delete_tracks(ids) veya delete_track(id) ekleyin.")

        return {"success": True, "deleted_count": len(ids)}
    finally:
        storage.close()

@router.delete("/whitelist/{track_id}")
def delete_whitelist_item(track_id: str):
    storage = TrackStorage()
    try:
        # desteklenen method isimleri için esnek fallback
        if hasattr(storage, "delete_track"):
            ok = storage.delete_track(track_id)
        elif hasattr(storage, "delete_by_id"):
            ok = storage.delete_by_id(track_id)
        elif hasattr(storage, "remove_track"):
            ok = storage.remove_track(track_id)
        else:
            raise HTTPException(status_code=501, detail="TrackStorage.delete_track veya eşdeğeri yok. Lütfen TrackStorage içinde tekil silme metodu ekleyin.")

        if not ok:
            raise HTTPException(status_code=404, detail="Track bulunamadı veya silinemedi")

        return {"success": True, "deleted": track_id}
    finally:
        storage.close()
# api/routes/db_view.py
from fastapi import APIRouter, Depends, Query, HTTPException
from api.dependencies import get_current_user
from db.track_storage import TrackStorage

router = APIRouter()

@router.get("/unplayable")
def list_unplayable(
    owner: str = Depends(get_current_user),
    limit: int = Query(200, ge=1, le=1000)
):
    storage = TrackStorage()
    try:
        return storage.get_unplayable_tracks(owner=owner, limit=limit)
    finally:
        storage.close()

@router.get("/priority")
def list_priority(
    owner: str = Depends(get_current_user),
    limit: int = Query(200, ge=1, le=1000)
):
    storage = TrackStorage()
    try:
        return storage.get_priority_tracks(owner=owner, limit=limit)
    finally:
        storage.close()

@router.post("/evaluate/{track_id}")
def evaluate_and_maybe_promote(
    track_id: str,
    owner: str = Depends(get_current_user),
    min_required_avg: int = Query(5000, ge=1)
):
    """
    Frontend "Stream Verisi Getir" butonuna bastığında bu ucu çağırır.
    - track_streams tablosundaki historical_streams verisine bakar (yoksa spotify_client tarafı ile önce populate etmen gerekebilir).
    - En az 2 tarih varsa günlük artışların ortalamasını alır.
    - Ortalama >= min_required_avg ise priority_tracks'a yazar.
    - Tek tarih veya veri yoksa uygun mesajla döner.
    """
    storage = TrackStorage()
    try:
        # DB'de varsa çek
        hist = storage.get_track_historical(track_id)
        if not hist or not isinstance(hist, list) or len(hist) == 0:
            # Hiç veri yoksa: Spotify RapidAPI'yi kullanan akışın bu kaydı daha önce populate etmiş olması gerekir.
            # Projende /api/routes/streams.py var ve get_historical_stream_count çağırıyor. Orayı genişletip önce populate ettirebilirsin.
            raise HTTPException(status_code=404, detail="Bu parça için stream verisi bulunamadı.")
        if len(hist) < 2:
            return {"status": "insufficient", "message": "Veri, ortalaması alınacak kadar fazla bilgi içermiyor"}

        # Günlük artışların ortalaması (negatifler hariç)
        daily = []
        for i in range(1, len(hist)):
            diff = hist[i]["streams"] - hist[i-1]["streams"]
            if diff >= 0:
                daily.append(diff)
        avg = int(sum(daily) / len(daily)) if daily else 0

        if avg >= min_required_avg:
            storage.upsert_priority_track(track_id=track_id, owner=owner, average=avg)
            return {"status": "ok", "average": avg, "promoted": True}
        else:
            return {"status": "ok", "average": avg, "promoted": False}

    finally:
        storage.close()

# api/routes/streams.py

from fastapi import APIRouter
from spotify_client.stream_data import get_historical_stream_count, get_current_stream_count
from utils.logger import get_logger
from statistics import mean

logger = get_logger(__name__)
router = APIRouter()

@router.get("/streams/{track_id}")
def get_stream_data(track_id: str):
    try:
        # Historic veriyi çek
        historical_data = get_historical_stream_count(track_id)
        if isinstance(historical_data, dict) and "error" in historical_data:
            return {"error": historical_data["error"]}

        # Eğer data list değilse API yanıtı formatı yanlış
        if not isinstance(historical_data, list):
            return {"error": "Unexpected historical data format"}

        # Current veriyi çek
        current_data = get_current_stream_count(track_id)
        if isinstance(current_data, dict) and "error" in current_data:
            return {"error": current_data["error"]}

        # Günlük ortalama hesapla
        daily_averages = []
        for i in range(1, len(historical_data)):
            diff = historical_data[i]["streams"] - historical_data[i-1]["streams"]
            if diff >= 0:
                daily_averages.append(diff)

        daily_avg = round(mean(daily_averages), 2) if daily_averages else None

        return {
            "current": current_data.get("streams"),
            "daily_average": daily_avg,
            "historic": historical_data
        }

    except Exception as e:
        logger.exception(f"Stream verisi alınırken hata: {track_id}")
        return {"error": str(e)}

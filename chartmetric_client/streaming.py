import requests
from config.config import CHARTMETRIC_API_KEY

BASE_URL = "https://api.chartmetric.com/api"

def get_streaming_stats(track_id: str) -> list[dict]:
    headers = {
        "Authorization": f"Bearer {CHARTMETRIC_API_KEY}"
    }
    url = f"{BASE_URL}/track/{track_id}/streaming"
    params = {
        "interval": "daily",
        "since": "150daysAgo"
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)  # ⬅️ Timeout burada
        response.raise_for_status()
    except requests.exceptions.Timeout:
        print("Chartmetric API timed out.")
        return []
    except requests.exceptions.RequestException as e:
        print(f"Chartmetric API error: {e}")
        return []

    data = response.json()
    return data.get("data", [])

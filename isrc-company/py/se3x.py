# isrc-company/py/se3x.py

from flask import Flask, request, jsonify, render_template
import base62
import requests
import json
import os
import re
import subprocess
import atexit
from datetime import datetime

from isrc_env import (
    get_web_authorization,
    get_web_client_token,
    get_spclient_track_metadata_url,
)

app = Flask(__name__)

# Configuration
BASE_DIR = os.path.dirname(__file__)
DATABASE_FILE = os.path.join(BASE_DIR, "..", "data", "licensor_db.json")

puppeteer_process = None

def extract_track_id(input_string):
    if re.match(r'^[a-zA-Z0-9]{22}$', input_string):
        return input_string
    patterns = [
        r'spotify\.com/track/([a-zA-Z0-9]{22})',
        r'spotify\.com/intl-[a-z]{2}/track/([a-zA-Z0-9]{22})',
        r'track/([a-zA-Z0-9]{22})'
    ]
    for pattern in patterns:
        match = re.search(pattern, input_string)
        if match:
            return match.group(1)
    return None

def load_database():
    if os.path.exists(DATABASE_FILE):
        try:
            with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def media_id_to_gid(media_id: str) -> str:
    return hex(base62.decode(media_id, charset=base62.CHARSET_INVERTED))[2:].zfill(32)

def get_track_details(track_id: str):
    auth_token = get_web_authorization()
    client_token = get_web_client_token()
    if not auth_token or not client_token:
        return None, None, None, None

    gid = media_id_to_gid(track_id)
    url = get_spclient_track_metadata_url(gid)
    if not url:
        print(
            "Error: SPOTIFY_SPCLIENT_TRACK_URL_TEMPLATE missing or invalid "
            "(config/.env — see .env.example; must include {gid})."
        )
        return None, None, None, None

    headers = {
        "accept": "application/json",
        "accept-language": "tr",
        "app-platform": "WebPlayer",
        "authorization": auth_token,
        "client-token": client_token,
        "referer": "https://open.spotify.com/",
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        uuid = None
        for path in [['licensor', 'uuid'], ['album', 'licensor', 'uuid'], ['file', 'licensor', 'uuid']]:
            current = data
            for key in path:
                if isinstance(current, dict) and key in current:
                    current = current[key]
                else:
                    break
            else:
                uuid = current

        file_id = None
        if 'cover_group' in data and 'image' in data['cover_group']:
            for image in data['cover_group']['image']:
                if image.get('size') == 'DEFAULT' and image.get('file_id'):
                    file_id = image.get('file_id')
                    break
                if not file_id and image.get('file_id'):
                    file_id = image.get('file_id')

        if not file_id and 'album' in data and 'cover_group' in data['album'] and 'image' in data['album']['cover_group']:
            for image in data['album']['cover_group']['image']:
                if image.get('size') == 'DEFAULT' and image.get('file_id'):
                    file_id = image.get('file_id')
                    break
                if not file_id and image.get('file_id'):
                    file_id = image.get('file_id')

        name = data.get('name', 'Unknown Track')
        live_timestamp = data.get('earliest_live_timestamp')

        return uuid, file_id, live_timestamp, name
    except Exception as e:
        print(f"API Error for track {track_id}: {str(e)}")
        return None, None, None, None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_licensor', methods=['GET'])
def get_licensor():
    track_input = request.args.get('track_id')
    if not track_input:
        return jsonify({"error": "Track ID or URL is required"}), 400

    track_id = extract_track_id(track_input)
    if not track_id:
        return jsonify({"error": "Invalid Track ID or Spotify URL"}), 400

    db = load_database()
    uuid, file_id, live_timestamp, name = get_track_details(track_id)
    licensor_name = db.get(uuid, "null") if uuid else "null"
    image_url = f"https://i.scdn.co/image/{file_id}" if file_id else None

    release_date = None
    if live_timestamp:
        try:
            release_date = datetime.utcfromtimestamp(live_timestamp).strftime('%Y-%m-%d %H:%M:%S UTC')
        except:
            pass

    return jsonify({
        "track_id": track_id,
        "name": name,
        "licensor_name": licensor_name,
        "image_url": image_url,
        "live_timestamp": live_timestamp,
        "release_date": release_date
    })

if __name__ == "__main__":
    puppeteer_script = os.path.join(BASE_DIR, "..", "backend", "js", "token_collector.js")
    if os.path.exists(puppeteer_script):
        puppeteer_process = subprocess.Popen(["node", puppeteer_script])
        atexit.register(lambda: puppeteer_process.terminate())

    app.run(host='0.0.0.0', port=1337)

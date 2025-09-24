from flask import Flask, request, jsonify, render_template
import base62
import requests
import json
import os
import re
import subprocess
import atexit
from datetime import datetime

app = Flask(__name__)

# Configuration
BASE_DIR = os.path.dirname(__file__)
AUTH_TOKEN_FILE = os.path.join(BASE_DIR, "..", "config", "auth_tokens.txt")
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

def get_auth_token():
    try:
        with open(AUTH_TOKEN_FILE, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"Error: {AUTH_TOKEN_FILE} file not found!")
        return None

def media_id_to_gid(media_id: str) -> str:
    return hex(base62.decode(media_id, charset=base62.CHARSET_INVERTED))[2:].zfill(32)

def get_track_details(track_id: str):
    auth_token = get_auth_token()
    if not auth_token:
        return None, None, None, None

    gid = media_id_to_gid(track_id)
    headers = {
        "accept": "application/json",
        "accept-language": "tr",
        "app-platform": "WebPlayer",
        "authorization": auth_token,
        "client-token": "AAAAwKf027OjS/J2/V+h7MqG8Usltweu1SaIV1gY6RlP/bJcT0nVHg0J8Tdc05ySxe9/i+EQrsJ4SS4BH5UC2AoX3S/VFsckIpB6vUUUIJEOZxE6TNnFyhuaUlV+QlgV0hNpFeCgj2cwbgB062ZMmBgoZdz233RBrSQliQICettSgSIIGmMqve4z70bAje4QNRJaFFhiC/25OpxwjnM8Cwtkxg4Yd/l+qsVaDzqnv9zHPB7HZ/Wab7eJNTQCpwzoKDXDVwbe389cXrSmg7KeCIbUR4Ooyvgeg4S7jNBlwNLa+DzAs80uYmG+FkzxEzA35cgprkItoT+1xhLKd9Zok90M3thy",
        "referer": "https://open.spotify.com/",
    }
    url = f"https://spclient.wg.spotify.com/metadata/4/track/{gid}?market=from_token"
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
    puppeteer_script = os.path.join(BASE_DIR, "token_collector.js")
    if os.path.exists(puppeteer_script):
        puppeteer_process = subprocess.Popen(["node", puppeteer_script])
        atexit.register(lambda: puppeteer_process.terminate())

    app.run(host='0.0.0.0', port=1337)

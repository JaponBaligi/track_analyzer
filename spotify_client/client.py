# spotify_client/client.py

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from config.config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET

_sp_client = None

def get_spotify_client():
    global _sp_client
    if _sp_client is None:
        _sp_client = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET
        ))
    return _sp_client

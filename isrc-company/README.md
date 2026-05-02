# isrc-company (optional)

Auxiliary tools for licensor metadata lookup via Spotify web-client flows. This is **not** required for the main FastAPI + React panel.

## Setup

1. `cd isrc-company && npm install`
2. Copy `config/.env.example` to `config/.env` and fill `SPOTIFY_WEB_*`, `SPOTIFY_SPCLIENT_TRACK_URL_TEMPLATE`, and other keys (only in `.env`; not committed).
3. Optionally copy `data/licensor_db.example.json` to `data/licensor_db.json` and `config/api_keys.example.json` to `config/api_keys.json` if you use those files locally.

## Components

- `py/licensor_lookup_server.py` — Flask UI + metadata helpers (default port `1337`).
- `py/adder.py` — CLI to maintain `data/licensor_db.json`.
- `backend/js/token_collector.js` — Puppeteer helper; set `CHROME_PATH` (or `PUPPETEER_EXECUTABLE_PATH`) if Chrome is not in the default location.
- `misc/browser_metadata_request_example.js` — commented example of the request shape the stack imitates (values from `.env` only).

Using unofficial Spotify endpoints may conflict with Spotify’s terms of service; use at your own risk.

# Spotify Track Analyzer

[![CI](https://github.com/JaponBaligi/track_analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/JaponBaligi/track_analyzer/actions/workflows/ci.yml)

A FastAPI backend and React (`web_panel`) for Spotify track and playlist monitoring (popularity, stream history, unplayable detection, and related tooling).

**License:** [MIT](LICENSE). See [SECURITY.md](SECURITY.md) for reporting issues.

**Disclaimer:** This software uses Spotify’s APIs and optional community tooling. You are responsible for complying with [Spotify’s Developer Terms](https://developer.spotify.com/terms) and applicable law. Optional components under `isrc-company/` may rely on session-style credentials and unofficial endpoints — review `isrc-company/README.md` before enabling them.

**Upstream repository:** [github.com/JaponBaligi/track_analyzer](https://github.com/JaponBaligi/track_analyzer)

## 📁 Project Structure

```
spotify_monitoring/
├── backend/                 # FastAPI app (run from here: uvicorn api.main:app)
│   ├── api/
│   ├── config/              # config.py, .env (not committed — use .env.example)
│   ├── db/
│   ├── scheduler/
│   ├── spotify_client/
│   └── utils/
├── web_panel/               # React frontend (CRA)
├── isrc-company/            # Optional licensor / ISRC helpers — see isrc-company/README.md
├── main.py                  # Alternate entrypoint (adds backend/ to sys.path)
├── requirements.txt
├── LICENSE
├── SECURITY.md
└── CONTRIBUTING.md
```

## 🚀 Features

### ✅ Core API Features
- [x] **Track Analysis API** - RESTful endpoints for track data analysis
- [x] **Artist Monitoring** - Automated scanning of artist playlists and tracks
- [x] **Playlist Tracking** - Monitor playlists for unplayable/unavailable tracks
- [x] **Stream History Analysis** - Historical streaming data with daily averages
- [x] **Track Popularity Metrics** - Real-time popularity scores (0-100 scale)

### ✅ Data Collection & Processing
- [x] **Automated Artist Scanning** - Scheduled background tasks for artist data
- [x] **Playlist Monitoring** - Track changes in playlist compositions
- [x] **Stream Data Aggregation** - Historical stream count analysis
- [x] **Unplayable Track Detection** - Identify removed/hidden tracks
- [x] **Regional Market Support** - Multi-region data collection

### ✅ Frontend Web Panel
- [x] **Interactive Dashboard** - React-based web interface
- [x] **Artist Search** - Real-time artist lookup and analysis
- [x] **Playlist Management** - Visual playlist tracking interface
- [x] **Track Visualization** - Charts and graphs for track data
- [x] **Region Selection** - Multi-market data viewing
- [x] **Stream History Charts** - Historical data visualization
- [x] **Unplayable Tracks List** - Detailed unavailable track reports

### ✅ Monitoring & Analytics
- [x] **Real-time Data Updates** - Live data synchronization
- [x] **Historical Trend Analysis** - Long-term performance tracking
- [x] **Popularity Score Tracking** - Track popularity evolution
- [x] **Playlist Health Monitoring** - Track playlist availability
- [x] **Artist Performance Metrics** - Comprehensive artist analytics

### ✅ Automation & Scheduling
- [ ] **Background Task Scheduler** - APScheduler for automated tasks
- [ ] **Periodic Data Collection** - Configurable scan intervals
- [x] **Error Handling & Logging** - Comprehensive logging system
- [x] **Data Validation** - Input validation and error handling
- [x] **Rate Limiting** - Spotify API rate limit management

## 💻 Minimum System Requirements

### Server Requirements (Production)
- **CPU**: 2+ cores (Intel i3 or AMD Ryzen 3 equivalent)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB free space (SSD recommended)
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Network**: Stable internet connection (10+ Mbps)

### Development Requirements
- **CPU**: 2+ cores
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **OS**: Windows 10+ / macOS 10.15+ / Ubuntu 18.04+

### Docker Requirements
- **Docker Engine**: 20.10+
- **Docker Compose**: 1.29+
- **Memory**: 4GB allocated to Docker
- **Storage**: 10GB for containers and images

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **Python 3.11** - Programming language
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **APScheduler** - Advanced Python scheduler
- **Uvicorn** - ASGI server

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library
- **React Router** - Client-side routing

### Infrastructure
- **Docker** — optional; this repository does **not** ship a `docker-compose.yml` yet.

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ (frontend)
- PostgreSQL (or compatible DB URL in `DATABASE_URL`)

### Local development

```bash
git clone https://github.com/JaponBaligi/track_analyzer.git spotify_monitoring
cd spotify_monitoring

python -m venv venv
# Windows: venv\Scripts\activate
# Unix:    source venv/bin/activate
pip install -r requirements.txt

cp backend/config/.env.example backend/config/.env
# Edit backend/config/.env — Spotify credentials, DATABASE_URL, JWT_*, USER*_PASSWORD (48 chars each)

cd backend
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd web_panel
cp .env.example .env.local   # optional — defaults target http://localhost:8000/api
npm install
npm start
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` — JWT login (48-character password)
- Most other `/api/*` routes require `Authorization: Bearer <token>`

### Artists
- `POST /api/artists/scan` — Start artist scanning (auth required)
- `GET /api/artists/info` — Artist metadata (auth required)

### Playlists
- `GET /api/playlists/` - List all tracked playlists
- `GET /api/playlists/{id}/unplayable-tracks` - Get unplayable tracks

### Tracks
- `GET /api/tracks/` - Track related endpoints (various)
- `GET /api/tracks/{track_id}/popularity` - Get track popularity score

### Streams
- `GET /api/streams/{track_id}` - Get stream history and daily averages

### Database Views
- `GET /api/db/` - Database related views and queries

### Flagged Artists
- `GET /api/flagged-artists/` - Get flagged artists list

## 📊 Data Models

### Track
```json
{
  "id": "string",
  "name": "string",
  "artist": "string",
  "album": "string",
  "popularity": 0-100,
  "is_playable": boolean,
  "duration_ms": number,
  "explicit": boolean
}
```

### Artist
```json
{
  "id": "string",
  "name": "string",
  "followers": number,
  "genres": ["string"],
  "image_url": "string"
}
```

### Playlist
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "tracks": [Track],
  "total_tracks": number
}
```

## 🎯 Usage Examples

Most `/api/*` routes require a JWT from `POST /api/auth/login`. Export it for curl, e.g. `export JWT_TOKEN='…'` (paste the access token only).

### Track Analysis
```bash
# Get track stream data
curl http://localhost:8000/api/streams/4iV5W9uYEdYUVa79Axb7Rh \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Get track popularity (if exposed in your deployment)
curl http://localhost:8000/api/tracks/4iV5W9uYEdYUVa79Axb7Rh/popularity \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### Artist Monitoring
```bash
# Start artist scan
curl -X POST http://localhost:8000/api/artists/scan \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"artist_name": "Taylor Swift", "region": "US"}'
```

### Playlist Monitoring
```bash
# List all playlists
curl http://localhost:8000/api/playlists/ \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Get unplayable tracks
curl http://localhost:8000/api/playlists/37i9dQZF1DXcBWIGoYBM5M/unplayable-tracks \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## 🔧 Configuration

### Environment Variables
Copy `backend/config/.env.example` to `backend/config/.env` and set at least:

- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- `DATABASE_URL`
- `JWT_SECRET`, `JWT_ALGORITHM` (e.g. `HS256`)
- `USER1_PASSWORD`, `USER2_PASSWORD` — **exactly 48 characters** each (used by `POST /api/auth/login`)

Optional / operational:

```bash
REDIS_URL=redis://localhost:6379
SCHEDULER_INTERVAL_MINUTES=60
ISRC_SERVICE_URL=http://127.0.0.1:1337/get_licensor
SOUNDCHARTS_API_KEY=
```

**Production CORS:** set `ENVIRONMENT=prod` and comma-separated `ALLOWED_ORIGINS` (wildcard `*` is not allowed in prod). See `backend/config/config.py`.

Optional **`isrc-company/`** env: copy `isrc-company/config/.env.example` to `isrc-company/config/.env`.

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest   # add tests/ under backend when present
```

### Frontend Tests
```bash
cd web_panel
npm test
```

## 📈 Monitoring & Logging

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Metrics**: API response time monitoring
- **Health Checks**: Application health endpoints
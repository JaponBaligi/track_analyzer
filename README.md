# Spotify Track Analyzer

A comprehensive application for analyzing Spotify track data, consisting of a FastAPI backend API and a React-based web panel frontend. The system provides insights into track popularity, streaming history, playlist monitoring, and artist analytics.

## 📁 Project Structure

```
spotify_monitoring/
├── api/                          # FastAPI backend
│   ├── main.py                   # Main FastAPI app
│   ├── routes/                   # API route handlers
│   │   ├── artists.py
│   │   ├── auth.py
│   │   ├── db_view.py
│   │   ├── flagged_artists.py
│   │   ├── playlists.py
│   │   ├── streams.py
│   │   └── track_routes.py
│   ├── schemas/                  # Pydantic models
│   ├── services/                 # Business logic
│   └── dependencies.py
├── config/                       # Configuration files
│   ├── config.py
│   └── jwt_generator.py
├── db/                           # Database models and storage
├── scheduler/                    # Background task scheduler
├── scraper/                      # Spotify data scraping
├── spotify_client/               # Spotify API client
├── utils/                        # Utilities (logger, db, security)
├── web_panel/                    # React frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Main pages (Home, Tracks, Database, etc.)
│   │   ├── context/              # React context providers
│   │   ├── hooks/                # Custom React hooks
│   │   └── types/                # TypeScript type definitions
│   ├── public/                   # Static assets
│   └── package.json
├── analyzer/                     # Track analysis modules
├── main.py                       # Root FastAPI entry point
├── requirements.txt              # Python dependencies
├── docker-compose.yml            # Docker orchestration
└── README.md
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
- **Electron** - Desktop application framework (IN PROGRESS)
- **Recharts** - Charting library
- **React Router** - Client-side routing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline (IN PROGRESS)

## 📦 Installation

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend development)

### Quick Start with Docker
```bash
# Clone the repository
git clone https://github.com/JaponBaligi/spotify-track-analyzer.git
cd spotify-track-analyzer

# Start all services
docker-compose up --build
(this docker command pretty much does everything)
# Access the applications:
# - API: http://localhost:8000
# - Frontend: http://localhost:3000
```

### Local Development Setup
```bash
# Backend setup
cd spotify-track-analyzer
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Frontend setup
cd web_panel
npm install
npm start
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login (if implemented)

### Artists
- `POST /api/artists/scan` - Start artist scanning
- `GET /api/artists/info` - Get artist basic info

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

### Track Analysis
```bash
# Get track stream data
curl http://localhost:8000/api/streams/4iV5W9uYEdYUVa79Axb7Rh

# Get track popularity
curl http://localhost:8000/api/tracks/4iV5W9uYEdYUVa79Axb7Rh/popularity
```

### Artist Monitoring
```bash
# Start artist scan
curl -X POST http://localhost:8000/api/artists/scan \
  -H "Content-Type: application/json" \
  -d '{"artist_name": "Taylor Swift", "region": "US"}'
```

### Playlist Monitoring
```bash
# List all playlists
curl http://localhost:8000/api/playlists/

# Get unplayable tracks
curl http://localhost:8000/api/playlists/37i9dQZF1DXcBWIGoYBM5M/unplayable-tracks
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:
```bash
# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Database
DATABASE_URL=postgresql://user:password@localhost/spotify_analyzer
REDIS_URL=redis://localhost:6379

# Scheduler
SCHEDULER_INTERVAL_MINUTES=60
```

### Docker Environment
The application uses Docker Compose for easy setup:
- **Backend**: FastAPI on port 8000
- **Frontend**: React on port 3000
- **Database**: PostgreSQL
- **Cache**: Redis

## 🧪 Testing

### Backend Tests
```bash
cd spotify-track-analyzer
pytest tests/
```

### Frontend Tests
```bash
cd web_panel
npm test (never used but could've been useful)
```

## 📈 Monitoring & Logging

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Metrics**: API response time monitoring
- **Health Checks**: Application health endpoints
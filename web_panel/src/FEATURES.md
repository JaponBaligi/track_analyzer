# Web Panel Features Documentation

## Overview

This is a React-based web application for monitoring and analyzing Spotify tracks, artists, and playlists. The application provides tools for scanning unplayable tracks, managing artist databases, performing ISRC lookups, and tracking stream history.

## Architecture

### Technology Stack
- **Framework**: React with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API
- **Styling**: Tailwind CSS with dark mode support
- **Animations**: Framer Motion
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Project Structure
```
src/
├── pages/          # Route pages/components
├── components/     # Reusable UI components
├── api/            # API service functions
├── context/        # React Context providers
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── lib/            # Library utilities
└── styles/         # Global styles
```

## Pages

### 1. Home (`/`)
**Purpose**: Main search interface for finding unplayable tracks

**Features**:
- Artist search with configurable scan depth (1-5)
- Region selector for market-specific searches
- Displays artist search results with images, followers, and genres
- Shows playlists containing unplayable tracks
- Lists all tracks found during scan
- Real-time loading states and error handling
- Animated UI transitions using Framer Motion

**Key Components**:
- `ArtistSearch`: Search input with depth control
- `RegionSelector`: Market region selection
- `PlaylistCard`: Playlist display cards
- `TrackList`: Track listing component
- `UnplayableTracks`: Unplayable tracks display

### 2. Tracks (`/tracks`)
**Purpose**: Detailed view of tracks for a selected artist

**Features**:
- Displays analysis results for selected artist
- Shows unplayable tracks list
- Animated page transitions

### 3. Login (`/login`)
**Purpose**: Authentication page

**Features**:
- Password-based authentication (48-character password)
- Token storage in localStorage
- Error handling with detailed messages
- Redirects to home on successful login

### 4. Database (`/db`)
**Purpose**: Comprehensive track database management

**Features**:
- **Track List View**:
  - Searchable track list (by name, artist, album, ID)
  - Checkbox selection for bulk operations
  - Date range filtering for stream data
  - Auto-selects first track on load

- **Track Detail View**:
  - Track metadata (ID, ISRC, UPC, Spotify URI)
  - Stream history chart with date range filtering
  - Stream statistics:
    - Average streams between dates
    - Range delta (first to last)
    - Backend daily average
  - Lookup functionality (licensor/distributor lookup)
  - Save lookup results to database
  - Delete individual tracks

- **Bulk Operations**:
  - Bulk delete selected tracks
  - Bulk lookup for all tracks (with progress tracking)
  - Rate limiting (3 second delay between lookups)
  - Error tracking and skipping already-looked-up tracks

- **Navigation**: Quick links to Flagged Artists, Playable Artists, and Whitelist pages

### 5. Artist Scanner (`/artist-scanner`)
**Purpose**: Scan artist's playable tracks

**Features**:
- Artist search by name or Spotify ID
- Scans all tracks for an artist and saves playable tracks to database
- Displays scan results with tracks added during current scan session
- Shows track metadata (name, artists, album, duration, popularity, playability)
- Real-time scan progress indication

### 6. Flagged Artists (`/flagged-artists`)
**Purpose**: Manage artists to skip during scans

**Features**:
- Add artists to flagged list (exact name matching)
- View list of flagged artists
- Delete flagged artists
- Animated list with Framer Motion
- Navigation links to related pages

### 7. ISRC Lookup (`/isrc-lookup`)
**Purpose**: Premium distributor/licensor lookup tool

**Features**:
- Track ID or Spotify URL input
- Extracts track ID from various formats
- Displays licensor/distributor information
- Shows release date
- Album art display
- Error handling for invalid inputs

### 8. Playable Artists (`/playable-artist`)
**Purpose**: Manage and analyze playable tracks grouped by artist

**Features**:
- **Artist List Sidebar**:
  - Searchable artist list
  - Select all/none functionality
  - Artist selection checkboxes
  - Delete individual artists
  - Shows song count per artist

- **Track Grid View**:
  - Expandable artist sections
  - Track cards with metadata:
    - Track name, artists, album
    - Duration, popularity, playability status
    - ISRC, UPC codes
    - Spotify links
  - Stream history charts per track
  - Lookup functionality per track
  - Delete individual tracks

- **Bulk Operations**:
  - Bulk lookup for all tracks
  - Bulk delete selected artists (deletes all their tracks)
  - Progress tracking with skip/error counts

- **Stream Data**:
  - Fetch stream history for tracks
  - Visual charts using Recharts
  - Automatic data refresh

### 9. Whitelist (`/whitelist`)
**Purpose**: Manage whitelisted tracks

**Features**:
- Grid view of whitelisted tracks
- Search functionality (track, artist, album, ID, ISRC, UPC, owner)
- Track cards with comprehensive metadata:
  - Track info, artists, album
  - Label/distributor (licensor_name)
  - Release date
  - Playability status
  - Duration, popularity
  - ISRC, UPC codes
  - Owner information
  - Genres
- Stream history charts
- Bulk delete selected tracks
- Individual track deletion
- Checkbox selection for bulk operations

## Components

### Layout Components

#### `Layout`
- Wraps all protected pages
- Includes header navigation
- Provides consistent page structure
- Dark mode support

#### `Header`
- Navigation bar with page links:
  - Unplayable Tarama (Home)
  - Playable Tarama (Artist Scanner)
  - Database
  - ISRC Lookup
- Dark mode toggle button
- Logout functionality
- Sticky header with z-index

#### `Guard`
- Route protection component
- Checks for authentication token
- Redirects to login if unauthorized

### Search & Display Components

#### `ArtistSearch`
- Search input with Enter key support
- Configurable scan depth (1-5)
- Loading states with spinner
- Integrates with AppContext

#### `RegionSelector`
- Market region selection dropdown
- Defaults to "TR" (Turkey)
- Updates AppContext region state

#### `PlaylistCard`
- Displays playlist information
- Shows tracks with playability status
- Visual card layout

#### `TrackList`
- Lists tracks in table/card format
- Shows track metadata
- Playability indicators

#### `UnplayableTracks`
- Fetches and displays unplayable tracks from database
- Loading and empty states
- Integrates with TrackList component

#### `ScanResultList`
- Displays scan results from Artist Scanner
- Shows tracks added during scan session
- Filters by scan timestamp

### Chart Components

#### `StreamHistoryChart`
- Line chart for stream history data
- Uses Recharts library
- Responsive container
- Date-sorted data visualization

### UI Components

#### `ThemeToggle`
- Dark/light mode switcher
- Integrates with ThemeContext

#### `Badge` (ui/badge.tsx)
- Reusable badge component

#### `Card` (ui/card.tsx)
- Card container component with variants

#### `IconWrappers`
- Icon component wrappers (e.g., TrashIcon)

## API Integration

### API Client (`api/axiosInstance.ts`)
- Base URL configuration via environment variable
- 10-minute timeout for long-running requests
- Automatic token injection from localStorage
- Bearer token authentication

### API Services

#### `api/spotify.ts`
- **Artist Operations**:
  - `searchArtist`: Search for artists by name
  - `scanArtist`: Deep scan artist with related artists and playlists
  - `scanArtistPlayable`: Scan artist's playable tracks

- **Playlist Operations**:
  - `getPlaylistsByArtist`: Get playlists for an artist
  - `getTracksByPlaylist`: Get tracks in a playlist

- **Track Operations**:
  - `evaluateTrack`: Evaluate track playability
  - `getUnplayableTracks`: Get unplayable tracks from database
  - `getPlayableTracksByOwner`: Get playable tracks by owner

- **Stream Operations**:
  - `getStreamSeries`: Get stream history for a track
  - `updateAndSaveStreamSeries`: Update and save stream data from Soundcharts API

#### `api/flaggedArtists.ts`
- `fetchFlaggedArtists`: Get list of flagged artists
- `addFlaggedArtist`: Add artist to flagged list
- `deleteFlaggedArtist`: Remove artist from flagged list

## State Management

### AppContext (`context/AppContext.tsx`)
**Global State**:
- `artist`: Currently selected artist name
- `playlists`: List of playlists
- `selectedPlaylist`: Currently selected playlist
- `artistResults`: Search results for artists
- `trackResults`: Search results for tracks
- `loading`: Global loading state
- `error`: Global error message
- `region`: Market region (default: "TR")
- `theme`: Light/dark theme preference

**Methods**:
- Setters for all state variables
- `toggleTheme`: Switch between light/dark modes

### ThemeContext (`context/ThemeContext.tsx`)
**Features**:
- System preference detection
- Manual theme toggle
- Automatic DOM class updates (`dark` class on html element)
- Persists theme preference

### ArtistContext (`context/ArtistContext.tsx`)
- Additional artist-specific state management (if needed)

## Custom Hooks

### `useSpotifySearch`
- Handles artist search operations
- Updates AppContext with results
- Error handling

### `useStreamHistory`
- Fetches stream history for tracks
- Manages loading and error states per track
- Development mode logging

## Type Definitions

### Core Types (`types/index.ts`)
- `Artist`: Artist information with followers, genres, popularity
- `Playlist`: Playlist with tracks
- `Track`: Track metadata including playability, ISRC, UPC
- `TrackEvaluation`: Track evaluation results
- `ScanResult`: Complete scan result structure

### Whitelist Types (`types/Whitetype.ts`)
- `DBTrack`: Database track representation (flexible schema)
- `NormalizedTrack`: Normalized track type for UI
- `normalizeTrack`: Function to normalize database tracks
- `normalizeList`: Batch normalization function

## Utilities

### `utils/format.ts`
- Number formatting utilities (e.g., `formatNumber`)

### `lib/utils.ts`
- General utility functions

## Styling

### Global Styles
- `styles/globals.css`: Tailwind CSS imports and custom styles
- `index.css`: Additional global styles
- `App.css`: App-specific styles

### Theme Support
- Dark mode via Tailwind's `dark:` variant
- System preference detection
- Manual theme switching
- Smooth transitions between themes

## Key Features Summary

1. **Authentication**: Password-based login with token storage
2. **Artist Scanning**: Deep scanning of artists, related artists, and playlists
3. **Track Management**: Comprehensive database for unplayable and playable tracks
4. **Stream Analytics**: Historical stream data with visualizations
5. **ISRC Lookup**: Distributor/licensor lookup service
6. **Bulk Operations**: Batch lookup, delete, and management operations
7. **Search & Filter**: Advanced search across multiple fields
8. **Dark Mode**: Full dark mode support with system preference detection
9. **Responsive Design**: Mobile-friendly layouts
10. **Error Handling**: Comprehensive error states and user feedback
11. **Loading States**: Visual feedback for async operations
12. **Animations**: Smooth UI transitions with Framer Motion

## Navigation Flow

```
Login → Home (Unplayable Search)
  ├── Tracks (Detailed track view)
  ├── Artist Scanner (Playable scan)
  ├── Database (Track management)
  │   ├── Flagged Artists
  │   ├── Playable Artists
  │   └── Whitelist
  └── ISRC Lookup
```

## Environment Variables

- `REACT_APP_API_URL`: Backend API base URL (default: `http://localhost:8000/api`)
- `REACT_APP_LOOKUP_URL`: External lookup service URL (optional)

## Dependencies

Key dependencies include:
- React & React DOM
- React Router DOM
- Axios
- Framer Motion
- Recharts
- Tailwind CSS
- Lucide React
- TypeScript


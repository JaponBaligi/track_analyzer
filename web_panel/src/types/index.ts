// web_panel/src/types/index.ts

export interface Artist {
  id: string;
  name: string;
  followers: number;
  genres: string[];
  popularity: number;
  spotify_url: string;
  image_url?: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  owner: string;
  image_url?: string;
  total_tracks?: number;
  tracks: Track[];
}


export interface Track {
  track_id: string;
  track_name: string;
  artist_names: string[];
  artist_name: string[];
  album_name: string;
  duration_ms: number;
  popularity: number;
  is_playable: boolean;
  spotify_url: string;
  image_url?: string | null;
  added_at?: Date | null;
  isrc?: string;
  upc?: string;
}

export interface TrackEvaluation {
  track_id: string;
  is_strong: boolean;
  popularity?: number;
  message?: string;
}


export interface ScanResult {
  artist: Artist;
  related_artists: Artist[];
  playlists: Playlist[];
  tracks: Track[];
}
// Helper functions for track data manipulation

export interface DbTrack {
  id?: string;
  track_id?: string;
  name: string;
  artist?: string;
  artists?: string[];
  artist_names?: string[];
  album?: string;
  album_name?: string;
  image_url?: string | null;
  album_image?: string | null;
  duration_ms?: number;
  popularity?: number;
  spotify_url?: string;
  track_url?: string;
  playlist_id?: string;
  isrc?: string;
  upc?: string;
  licensor_name?: string;
  release_date?: string;
}

/**
 * Gets the track ID from a track object
 */
export function getTrackId(t: DbTrack | any): string {
  return (t?.track_id || t?.id || "").toString();
}

/**
 * Gets the track image URL
 */
export function getTrackImage(t: DbTrack): string | undefined {
  return t.image_url || t.album_image || undefined;
}

/**
 * Gets the track album name
 */
export function getTrackAlbum(t: DbTrack): string | undefined {
  return t.album || t.album_name || undefined;
}

/**
 * Gets the track artist name(s)
 */
export function getTrackArtist(t: DbTrack): string {
  if (t.artist) return t.artist;
  if (t.artists?.length) return t.artists.join(", ");
  if (t.artist_names?.length) return t.artist_names.join(", ");
  return "Bilinmiyor";
}

/**
 * Gets track ID from various possible field names (for flexible data structures)
 */
export function getTrackIdFlexible(song: any): string | undefined {
  return song?.track_id ?? song?.id ?? song?.trackId ?? song?.tid ?? undefined;
}

/**
 * Gets track name from various possible field names
 */
export function getTrackNameFlexible(song: any): string | undefined {
  return (
    song?.track_name ??
    song?.name ??
    song?.title ??
    song?.trackName ??
    (song?.track && (song.track.name ?? song.track.title)) ??
    undefined
  );
}

/**
 * Gets artist names from various possible field structures
 */
export function getArtistNamesFlexible(song: any): string[] {
  if (!song) return [];

  // Helper to check and return array
  const getArray = (value: any): string[] | null => {
    if (Array.isArray(value)) return value;
    return null;
  };

  // Helper to check and return string as array
  const getStringAsArray = (value: any): string[] | null => {
    if (typeof value === "string") return [value];
    return null;
  };

  // Try array fields first (priority order)
  const arrayFields = ["artist_names", "artists", "artist"];
  for (const field of arrayFields) {
    const result = getArray(song[field]);
    if (result) return result;
  }

  // Try string fields
  const stringFields = ["artist_names", "artist", "artists"];
  for (const field of stringFields) {
    const result = getStringAsArray(song[field]);
    if (result) return result;
  }

  // Check object field
  if (song.artist && typeof song.artist === "object" && song.artist.name) {
    return [song.artist.name];
  }

  return [];
}


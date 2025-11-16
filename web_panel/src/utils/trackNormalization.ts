// Utility functions for normalizing track data from various sources

import { getTrackIdFlexible, getTrackNameFlexible, getArtistNamesFlexible } from "./trackHelpers";

export interface NormalizedTrack {
  track_id?: string;
  track_name?: string;
  artist_names?: string[];
  image_url?: string | null;
  [key: string]: any;
}

/**
 * Normalizes a track object to have consistent field names
 */
export function normalizeTrack(track: any): NormalizedTrack {
  const normalized: any = { ...track };

  // Normalize track_id
  if (!normalized.track_id) {
    normalized.track_id = getTrackIdFlexible(track);
  }

  // Normalize track_name
  if (!normalized.track_name) {
    normalized.track_name = getTrackNameFlexible(track);
  }

  // Normalize artist_names
  if (!normalized.artist_names) {
    const artistNames = getArtistNamesFlexible(track);
    normalized.artist_names = artistNames.length > 0 ? artistNames : [];
  }

  // Normalize image_url
  if (!normalized.image_url) {
    normalized.image_url = track.image ?? track.thumbnail ?? track.cover ?? undefined;
  }

  return normalized;
}

/**
 * Gets the primary artist name from a normalized track or any track-like object
 */
export function getPrimaryArtistName(track: NormalizedTrack | any): string {
  if (track?.artist_names?.[0]) return track.artist_names[0];
  if (track?.artist) return typeof track.artist === 'string' ? track.artist : track.artist[0];
  if (track?.artists?.[0]) return track.artists[0];
  return "Unknown Artist";
}


import { useMemo } from "react";
import { getTrackId, getTrackArtist, getTrackAlbum, DbTrack } from "../utils/trackHelpers";

export function useTrackFilter(tracks: DbTrack[], searchQuery: string) {
  return useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const artist = (getTrackArtist(t) || "").toLowerCase();
      const album = (getTrackAlbum(t) || "").toLowerCase();
      const tid = getTrackId(t).toLowerCase();
      return name.includes(q) || artist.includes(q) || album.includes(q) || tid.includes(q);
    });
  }, [tracks, searchQuery]);
}


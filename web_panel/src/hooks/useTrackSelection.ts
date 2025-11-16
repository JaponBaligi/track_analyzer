import { useEffect, useState } from "react";
import { getTrackId, DbTrack } from "../utils/trackHelpers";

export function useTrackSelection(tracks: DbTrack[], filteredTracks: DbTrack[]) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>();

  // Auto select first track when tracks change
  useEffect(() => {
    if (!selectedTrackId && tracks.length) {
      setSelectedTrackId(getTrackId(tracks[0]));
    }
  }, [tracks, selectedTrackId]);

  // When search/filter changes, ensure selection stays valid
  useEffect(() => {
    if (!filteredTracks.length) {
      return;
    }
    if (!selectedTrackId || !filteredTracks.some((t) => getTrackId(t) === selectedTrackId)) {
      setSelectedTrackId(getTrackId(filteredTracks[0]));
    }
  }, [filteredTracks, selectedTrackId]);

  return [selectedTrackId, setSelectedTrackId] as const;
}


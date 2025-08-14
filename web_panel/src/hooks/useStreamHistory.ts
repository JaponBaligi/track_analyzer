// web_panel/src/hooks/useStreamHistory.ts
import { useState } from "react";
import { evaluateTrack } from "../api/spotify";

export function useStreamHistory() {
  const [loadingTrackIds, setLoadingTrackIds] = useState<string[]>([]);
  const [errorTrackIds, setErrorTrackIds] = useState<string[]>([]);
  const [streamHistory, setStreamHistory] = useState<
    Record<string, { date: string; streams: number }[]>
  >({});

  const fetchStreamHistory = async (trackId: string) => {
    if (loadingTrackIds.includes(trackId)) return;

    setLoadingTrackIds(ids => [...ids, trackId]);
    try {
      const response = await evaluateTrack(trackId);

      if (Array.isArray(response) && response.length > 0) {
        setStreamHistory(prev => ({ ...prev, [trackId]: response }));
      } else {
        setErrorTrackIds(ids => [...ids, trackId]);
      }
    } catch {
      setErrorTrackIds(ids => [...ids, trackId]);
    } finally {
      setLoadingTrackIds(ids => ids.filter(id => id !== trackId));
    }
  };

  return {
    loadingTrackIds,
    errorTrackIds,
    streamHistory,
    fetchStreamHistory
  };
}

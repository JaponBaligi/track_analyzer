// web_panel/src/hooks/useStreamHistory.ts
import { useState } from "react";
import axios from "axios";

export function useStreamHistory() {
  const [streamHistory, setStreamHistory] = useState<Record<string, any[]>>({});
  const [errorTrackIds, setErrorTrackIds] = useState<string[]>([]);
  const [loadingTrackIds, setLoadingTrackIds] = useState<string[]>([]);

  const fetchStreamHistory = async (trackId: string) => {
    console.log(`[DEBUG] fetchStreamHistory called for trackId=${trackId}`);
    setLoadingTrackIds((prev) => [...prev, trackId]);
    setErrorTrackIds((prev) => prev.filter((id) => id !== trackId));

    try {
      const response = await axios.get(`/api/tracks/evaluate?track_id=${trackId}`);
      console.log("[DEBUG] /tracks/evaluate response.data =", response.data);

      // API'den gelen veri kontrolü
      const historical = response.data?.historical;
      if (!historical) {
        console.warn(`[WARN] No 'historical' key found in API response for trackId=${trackId}`);
        setErrorTrackIds((prev) => [...prev, trackId]);
        return;
      }

      // Tarih ve stream sayılarını logla
      console.log(`[DEBUG] Historical data for trackId=${trackId}:`, historical);

      if (Array.isArray(historical) && historical.length > 0) {
        setStreamHistory((prev) => ({
          ...prev,
          [trackId]: historical,
        }));
      } else {
        console.warn(`[WARN] Historical array is empty for trackId=${trackId}`);
        setErrorTrackIds((prev) => [...prev, trackId]);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to fetch stream history for ${trackId}:`, error);
      setErrorTrackIds((prev) => [...prev, trackId]);
    } finally {
      setLoadingTrackIds((prev) => prev.filter((id) => id !== trackId));
    }
  };

  return { streamHistory, errorTrackIds, loadingTrackIds, fetchStreamHistory };
}


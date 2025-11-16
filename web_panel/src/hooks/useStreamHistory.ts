// web_panel/src/hooks/useStreamHistory.ts
import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

const isDevelopment = process.env.NODE_ENV === "development";

export function useStreamHistory() {
  const [streamHistory, setStreamHistory] = useState<Record<string, any[]>>({});
  const [errorTrackIds, setErrorTrackIds] = useState<string[]>([]);
  const [loadingTrackIds, setLoadingTrackIds] = useState<string[]>([]);

  const fetchStreamHistory = async (trackId: string) => {
    if (isDevelopment) {
      console.log(`[DEBUG] fetchStreamHistory called for trackId=${trackId}`);
    }
    setLoadingTrackIds((prev) => [...prev, trackId]);
    setErrorTrackIds((prev) => prev.filter((id) => id !== trackId));

    try {
      const response = await axiosInstance.get(`/tracks/evaluate?track_id=${trackId}`);
      if (isDevelopment) {
        console.log("[DEBUG] /tracks/evaluate response.data =", response.data);
      }

      // API'den gelen veri kontrolü
      const historical = response.data?.historical;
      if (!historical) {
        if (isDevelopment) {
          console.warn(`[WARN] No 'historical' key found in API response for trackId=${trackId}`);
        }
        setErrorTrackIds((prev) => [...prev, trackId]);
        return;
      }

      if (Array.isArray(historical) && historical.length > 0) {
        setStreamHistory((prev) => ({
          ...prev,
          [trackId]: historical,
        }));
      } else {
        if (isDevelopment) {
          console.warn(`[WARN] Historical array is empty for trackId=${trackId}`);
        }
        setErrorTrackIds((prev) => [...prev, trackId]);
      }
    } catch (error) {
      if (isDevelopment) {
        console.error(`[ERROR] Failed to fetch stream history for ${trackId}:`, error);
      }
      setErrorTrackIds((prev) => [...prev, trackId]);
    } finally {
      setLoadingTrackIds((prev) => prev.filter((id) => id !== trackId));
    }
  };

  return { streamHistory, errorTrackIds, loadingTrackIds, fetchStreamHistory };
}


// web_panel/src/components/TrackList.tsx
import React, { useState, useMemo } from "react";
import { cn } from "../lib/utils";
import { Track } from "../types";
import { evaluateTrack } from "../api/spotify";
import { motion, AnimatePresence } from "framer-motion";
import { TrackCard } from "./tracklist/TrackCard";

type TrackListProps = {
  tracks: Track[];
  className?: string;
  region?: string;
};

const TrackList: React.FC<TrackListProps> = ({ tracks, className, region }) => {
  const [loadingTrackIds, setLoadingTrackIds] = useState<string[]>([]);
  const [errorTrackIds, setErrorTrackIds] = useState<string[]>([]);
  const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});
  const [historicalData, setHistoricalData] = useState<Record<
    string,
    { date: string; streams: number }[]
  >>({});

  const uniqueUnplayableTracks = useMemo(
    () =>
      Array.from(
        new Map(tracks.filter((t) => !t.is_playable).map((t) => [t.track_id, t])).values()
      ),
    [tracks]
  );

  if (!tracks.length || uniqueUnplayableTracks.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-sm text-center text-gray-500 dark:text-gray-400 italic px-4 py-2"
      >
        Aramaya devam et; tarih arayıp bulamayanları unutulmuşluğun sessizliğine gömer.
      </motion.p>
    );
  }

  // Helper to update stream data state
  const updateStreamData = (trackId: string, response: any) => {
    if (response.stream_count !== undefined && response.stream_count !== null) {
      setStreamCounts((prev) => ({ ...prev, [trackId]: response.stream_count }));
    }
    if (response.historical && Array.isArray(response.historical)) {
      setHistoricalData((prev) => ({ ...prev, [trackId]: response.historical }));
    }
    if (response.stream_count === undefined && !response.historical) {
      setErrorTrackIds((ids) => [...ids, trackId]);
    }
  };

  const handleGetStreamData = async (trackId: string) => {
    if (loadingTrackIds.includes(trackId)) return;

    setLoadingTrackIds((ids) => [...ids, trackId]);
    setErrorTrackIds((ids) => ids.filter((id) => id !== trackId));

    try {
      const response = await evaluateTrack(trackId);
      updateStreamData(trackId, response);
    } catch {
      setErrorTrackIds((ids) => [...ids, trackId]);
    } finally {
      setLoadingTrackIds((ids) => ids.filter((id) => id !== trackId));
    }
  };

  return (
    <AnimatePresence>
      <div className={cn("space-y-4", className)}>
        {uniqueUnplayableTracks.map((t, index) => (
          <TrackCard
            key={t.track_id}
            track={t}
            index={index}
            isLoading={loadingTrackIds.includes(t.track_id)}
            isError={errorTrackIds.includes(t.track_id)}
            streamCount={streamCounts[t.track_id]}
            history={historicalData[t.track_id] || []}
            region={region}
            onGetStreamData={handleGetStreamData}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default TrackList;

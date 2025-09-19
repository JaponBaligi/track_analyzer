// web_panel/src/components/TrackList.tsx
import React, { useState, useMemo } from "react";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { Track } from "../types";
import { evaluateTrack } from "../api/spotify";
import { formatDuration, formatNumber, formatImageUrl } from "../utils/format";
import { StreamHistoryChart } from "./StreamHistoryChart";
import { motion, AnimatePresence } from "framer-motion"; // <-- Import framer-motion

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

  const handleGetStreamData = async (trackId: string) => {
    if (loadingTrackIds.includes(trackId)) return;

    setLoadingTrackIds((ids) => [...ids, trackId]);
    setErrorTrackIds((ids) => ids.filter((id) => id !== trackId));

    try {
      const response = await evaluateTrack(trackId);
      if (response.stream_count !== undefined && response.stream_count !== null) {
        setStreamCounts((prev) => ({ ...prev, [trackId]: response.stream_count }));
      }
      if (response.historical && Array.isArray(response.historical)) {
        setHistoricalData((prev) => ({ ...prev, [trackId]: response.historical }));
      }
      if (response.stream_count === undefined && !response.historical) {
        setErrorTrackIds((ids) => [...ids, trackId]);
      }
    } catch {
      setErrorTrackIds((ids) => [...ids, trackId]);
    } finally {
      setLoadingTrackIds((ids) => ids.filter((id) => id !== trackId));
    }
  };

  // Inline TrackCard with animation
  const TrackCard: React.FC<{ track: Track; index: number }> = ({ track, index }) => {
    const isLoading = loadingTrackIds.includes(track.track_id);
    const isError = errorTrackIds.includes(track.track_id);
    const streamCount = streamCounts[track.track_id];
    const history = historicalData[track.track_id] || [];

    const displayArtists =
      track.artist_names?.length > 0
        ? track.artist_names.join(", ")
        : track.artist_name || "Bilinmiyor";

    const spotifyUrl =
      track.spotify_url || `https://open.spotify.com/track/${track.track_id}`;

    const albumName =
      track.album_name && track.album_name.trim() !== "" ? track.album_name : "Single";

    return (
      <motion.div
        key={track.track_id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: index * 0.1 }} // <-- stagger by index
        whileHover={{ scale: 1.02 }}
        className={cn(
          "flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border",
          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          "shadow-sm hover:shadow-lg transition-shadow duration-300"
        )}
      >
        {/* Album Image */}
        <img
          src={formatImageUrl(track.image_url)}
          alt={`${track.track_name} albüm resmi`}
          className="w-24 h-24 rounded-md object-cover flex-shrink-0"
        />

        {/* Track Info */}
        <div className="flex flex-col flex-grow text-gray-900 dark:text-gray-100">
          <span className="text-lg font-semibold">{track.track_name}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{displayArtists}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Albüm: {albumName}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Süre: {track.duration_ms ? formatDuration(track.duration_ms) : "Bilinmiyor"}
          </span>
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Spotify'da Aç
          </a>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Popülarite: {track.popularity ?? "Bilinmiyor"}
          </span>
          {region && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Kaldırılan Bölge: <strong>{region}</strong>
            </span>
          )}
          {streamCount !== undefined && (
            <span className="text-sm text-green-700 dark:text-green-400 mt-1">
              Stream sayısı: {formatNumber(streamCount)}
            </span>
          )}
          {isError && (
            <span className="text-sm text-red-600 dark:text-red-400 mt-1">
              Stream verisi alınırken hata oluştu.
            </span>
          )}

          {/* Stream History Chart */}
          {history.length > 0 && (
            <div className="mt-4 w-full">
              <StreamHistoryChart data={history} />
            </div>
          )}
        </div>

        {/* Badge & Action Button */}
        <div className="flex flex-col items-center space-y-2 flex-shrink-0 mt-4 sm:mt-0">
          <Badge variant="destructive" className="dark:bg-red-600 dark:text-white">
            Unplayable
          </Badge>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="rounded bg-blue-600 dark:bg-blue-500 text-white dark:text-gray-100 px-4 py-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors duration-200"
            disabled={isLoading}
            onClick={() => handleGetStreamData(track.track_id)}
          >
            {isLoading ? "Yükleniyor..." : "Stream Verisi Getir"}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <div className={cn("space-y-4", className)}>
        {uniqueUnplayableTracks.map((t, index) => (
          <TrackCard key={t.track_id} track={t} index={index} />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default TrackList;

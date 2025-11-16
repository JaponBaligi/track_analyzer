import React from "react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { Track } from "../../types";
import { formatDuration, formatNumber, formatImageUrl } from "../../utils/format";
import { StreamHistoryChart } from "../StreamHistoryChart";

interface TrackCardProps {
  track: Track;
  index: number;
  isLoading: boolean;
  isError: boolean;
  streamCount?: number;
  history: { date: string; streams: number }[];
  region?: string;
  onGetStreamData: (trackId: string) => void;
}

// Track info section
const TrackInfoSection: React.FC<{
  track: Track;
  displayArtists: string;
  albumName: string;
  spotifyUrl: string;
  region?: string;
  streamCount?: number;
  isError: boolean;
  history: { date: string; streams: number }[];
}> = ({ track, displayArtists, albumName, spotifyUrl, region, streamCount, isError, history }) => {
  return (
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
  );
};

// Action section
const TrackActionSection: React.FC<{
  isLoading: boolean;
  onGetStreamData: () => void;
}> = ({ isLoading, onGetStreamData }) => {
  return (
    <div className="flex flex-col items-center space-y-2 flex-shrink-0 mt-4 sm:mt-0">
      <Badge variant="destructive" className="dark:bg-red-600 dark:text-white">
        Unplayable
      </Badge>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="rounded bg-blue-600 dark:bg-blue-500 text-white dark:text-gray-100 px-4 py-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors duration-200"
        disabled={isLoading}
        onClick={onGetStreamData}
      >
        {isLoading ? "Yükleniyor..." : "Stream Verisi Getir"}
      </motion.button>
    </div>
  );
};

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  index,
  isLoading,
  isError,
  streamCount,
  history,
  region,
  onGetStreamData,
}) => {
  const displayArtists: string =
    track.artist_names?.length > 0
      ? track.artist_names.join(", ")
      : Array.isArray(track.artist_name)
      ? track.artist_name.join(", ")
      : track.artist_name || "Bilinmiyor";

  const spotifyUrl = track.spotify_url || `https://open.spotify.com/track/${track.track_id}`;

  const albumName = track.album_name && track.album_name.trim() !== "" ? track.album_name : "Single";

  return (
    <motion.div
      key={track.track_id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
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

      <TrackInfoSection
        track={track}
        displayArtists={displayArtists}
        albumName={albumName}
        spotifyUrl={spotifyUrl}
        region={region}
        streamCount={streamCount}
        isError={isError}
        history={history}
      />

      <TrackActionSection isLoading={isLoading} onGetStreamData={() => onGetStreamData(track.track_id)} />
    </motion.div>
  );
};


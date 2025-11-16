import React from "react";
import { Clock, Link as LinkIcon } from "lucide-react";
import { Track } from "../../types";
import { formatDuration } from "../../utils/format";

interface UnplayableTrackItemProps {
  track: Track;
  playlistId: string;
  region: string;
  isLoading: boolean;
  isError: boolean;
  streamCount?: number;
  onGetStreamData: (trackId: string) => void;
}

export const UnplayableTrackItem: React.FC<UnplayableTrackItemProps> = ({
  track,
  playlistId,
  region,
  isLoading,
  isError,
  streamCount,
  onGetStreamData,
}) => {
  return (
    <li className="flex items-center justify-between bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-xl px-4 py-2 shadow-sm hover:shadow-md transition-all">
      {/* Track Info */}
      <div className="flex items-center gap-3 min-w-0">
        {track.image_url ? (
          <img
            src={track.image_url}
            alt={track.track_name}
            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0">
            N/A
          </div>
        )}

        <div className="min-w-0">
          <p className="font-semibold truncate max-w-xs text-gray-900 dark:text-gray-100">{track.track_name}</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-xs">
            {track.artist_names.join(", ")}
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(track.duration_ms)}</span>

            <a
              href={track.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline ml-4"
              title="Parçaya Git"
            >
              <LinkIcon className="w-4 h-4" /> Parça
            </a>

            <a
              href={`https://open.spotify.com/playlist/${playlistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline ml-4"
              title="Playlist'e Git"
            >
              <LinkIcon className="w-4 h-4" /> Playlist
            </a>
          </div>

          <div className="text-xs mt-1 text-gray-700 dark:text-gray-300">
            <strong>Kaldırılan Bölge:</strong> {region}
          </div>
        </div>
      </div>

      {/* Badge & Action */}
      <div className="flex flex-col items-center space-y-1 min-w-[110px]">
        <span className="px-2 py-0.5 rounded bg-red-600 dark:bg-red-500 text-white text-xs font-semibold transition-colors">
          Unplayable
        </span>

        {streamCount !== undefined && (
          <span className="text-xs text-green-700 dark:text-green-400">
            Stream: {streamCount.toLocaleString()}
          </span>
        )}

        {isError && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Stream verisi alınamadı
          </span>
        )}

        <button
          className="mt-1 rounded bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all"
          disabled={isLoading}
          onClick={() => onGetStreamData(track.track_id)}
        >
          {isLoading ? "Loading..." : "Stream Getir"}
        </button>
      </div>
    </li>
  );
};


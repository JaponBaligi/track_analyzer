// web_panel/src/components/PlaylistCard.tsx

import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Music2, User, AlertTriangle, Link as LinkIcon, Clock } from "lucide-react";
import { Playlist, Track } from "../types";
import { formatDuration } from "../utils/format"; // Süre formatlama yardımcı fonksiyonu (ms => mm:ss)
import { useAppContext } from "../context/AppContext";
import { evaluateTrack } from "../api/spotify";

interface PlaylistCardProps {
  playlist: Playlist & { tracks: Track[] }; // Playlist içinde tracks olacak
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const { region } = useAppContext(); // Context'ten seçili bölge bilgisi alınıyor
  const badTracks = playlist.tracks?.filter((track) => !track.is_playable) || [];

  // Stream sayısı, loading ve error durumları track_id bazında tutulacak
  const [loadingTrackIds, setLoadingTrackIds] = useState<string[]>([]);
  const [errorTrackIds, setErrorTrackIds] = useState<string[]>([]);
  const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});

  const handleGetStreamData = async (trackId: string) => {
    if (loadingTrackIds.includes(trackId)) return;

    setLoadingTrackIds((ids) => [...ids, trackId]);
    setErrorTrackIds((ids) => ids.filter((id) => id !== trackId));

    try {
      const response = await evaluateTrack(trackId);
      if (response.stream_count !== undefined && response.stream_count !== null) {
        setStreamCounts((prev) => ({ ...prev, [trackId]: response.stream_count }));
      } else {
        setErrorTrackIds((ids) => [...ids, trackId]);
      }
    } catch {
      setErrorTrackIds((ids) => [...ids, trackId]);
    } finally {
      setLoadingTrackIds((ids) => ids.filter((id) => id !== trackId));
    }
  };

  return (
    <Card className="w-full max-w-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all rounded-2xl bg-white dark:bg-gray-800">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Music2 className="w-4 h-4" />
            <span className="font-medium">Playlist ID:</span> {playlist.id}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <User className="w-4 h-4" />
            <span className="font-medium">Owner:</span> {playlist.owner}
          </div>
          {playlist.image_url && (
            <img
              src={playlist.image_url}
              alt={`${playlist.name} resmi`}
              className="w-10 h-10 rounded-md object-cover"
            />
          )}
        </div>

        {badTracks.length === 0 ? (
          <div className="text-green-600 dark:text-green-400 text-sm">Tüm parçalar oynatılabilir ✅</div>
        ) : (
          <div className="text-red-600 dark:text-red-400 text-sm flex flex-col gap-3">
            <div className="flex items-center gap-1 font-medium text-lg">
              <AlertTriangle className="w-5 h-5" />
              Oynatılamayan parçalar ({badTracks.length}):
            </div>

            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {badTracks.map((track) => {
                const isLoading = loadingTrackIds.includes(track.track_id);
                const isError = errorTrackIds.includes(track.track_id);
                const streamCount = streamCounts[track.track_id];

                return (
                  <li
                    key={track.track_id}
                    className="flex items-center justify-between bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-xl px-4 py-2 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Track Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {track.image_url ? (
                        <img
                          src={track.image_url}
                          alt={track.track_name}
                          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-300 flex items-center justify-center text-gray-600 flex-shrink-0">
                          N/A
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-semibold truncate max-w-xs">{track.track_name}</p>
                        <p className="text-xs text-gray-700 truncate max-w-xs">
                          {track.artist_names.join(", ")}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(track.duration_ms)}</span>

                          <a
                            href={track.spotify_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline ml-4"
                            title="Parçaya Git"
                          >
                            <LinkIcon className="w-4 h-4" /> Parça
                          </a>

                          <a
                            href={`https://open.spotify.com/playlist/${playlist.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline ml-4"
                            title="Playlist'e Git"
                          >
                            <LinkIcon className="w-4 h-4" /> Playlist
                          </a>
                        </div>

                        <div className="text-xs mt-1">
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
                        onClick={() => handleGetStreamData(track.track_id)}
                      >
                        {isLoading ? "Loading..." : "Stream Getir"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlaylistCard;

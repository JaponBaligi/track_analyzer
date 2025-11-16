// web_panel/src/components/PlaylistCard.tsx

import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Music2, User, AlertTriangle } from "lucide-react";
import { Playlist, Track } from "../types";
import { useAppContext } from "../context/AppContext";
import { evaluateTrack } from "../api/spotify";
import { UnplayableTrackItem } from "./playlist/UnplayableTrackItem";

interface PlaylistCardProps {
  playlist: Playlist & { tracks: Track[] };
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const { region } = useAppContext();
  const badTracks = playlist.tracks?.filter((track) => !track.is_playable) || [];

  const [loadingTrackIds, setLoadingTrackIds] = useState<string[]>([]);
  const [errorTrackIds, setErrorTrackIds] = useState<string[]>([]);
  const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});

  // Helper to update stream count state
  const updateStreamCount = (trackId: string, count: number | null | undefined) => {
    if (count !== undefined && count !== null) {
      setStreamCounts((prev) => ({ ...prev, [trackId]: count }));
    } else {
      setErrorTrackIds((ids) => [...ids, trackId]);
    }
  };

  const handleGetStreamData = async (trackId: string) => {
    if (loadingTrackIds.includes(trackId)) return;

    setLoadingTrackIds((ids) => [...ids, trackId]);
    setErrorTrackIds((ids) => ids.filter((id) => id !== trackId));

    try {
      const response = await evaluateTrack(trackId);
      updateStreamCount(trackId, response.stream_count);
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
              {badTracks.map((track) => (
                <UnplayableTrackItem
                  key={track.track_id}
                  track={track}
                  playlistId={playlist.id}
                  region={region}
                  isLoading={loadingTrackIds.includes(track.track_id)}
                  isError={errorTrackIds.includes(track.track_id)}
                  streamCount={streamCounts[track.track_id]}
                  onGetStreamData={handleGetStreamData}
                />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlaylistCard;

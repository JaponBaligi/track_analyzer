// web_panel/src/components/TrackList.tsx

import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { Track } from "../types";
import { evaluateTrack } from "../api/spotify";
import { formatDuration, formatNumber, formatImageUrl } from "../utils/format";

type TrackListProps = {
  tracks: Track[];
  className?: string;
  region?: string;
};

export const TrackList: React.FC<TrackListProps> = ({ tracks, className, region }) => {
  const unplayableTracks = tracks.filter((t) => !t.is_playable);

  const uniqueUnplayableTracks = Array.from(
    new Map(unplayableTracks.map((t) => [t.track_id, t])).values()
  );

  const [loadingTrackIds, setLoadingTrackIds] = useState<string[]>([]);
  const [errorTrackIds, setErrorTrackIds] = useState<string[]>([]);
  const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});

  if (!tracks.length || uniqueUnplayableTracks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic px-4 py-2">
        Aramaya devam et; tarih arayıp bulamayanları unutulmuşluğun sessizliğine gömer.
      </p>
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
    <div className={cn("space-y-4", className)}>
      {uniqueUnplayableTracks.map((track) => {
        const isLoading = loadingTrackIds.includes(track.track_id);
        const isError = errorTrackIds.includes(track.track_id);
        const streamCount = streamCounts[track.track_id];

        // Artist fallback
        const displayArtists =
          track.artist_names?.length > 0
            ? track.artist_name.join(", ")
            : track.artist_name || "Bilinmiyor";
        // Spotify URL fallback
        const spotifyUrl =
          track.spotify_url || `https://open.spotify.com/track/${track.track_id}`;

        // Albüm fallback
        const albumName = track.album_name && track.album_name.trim() !== ""
          ? track.album_name
          : "Single";

        return (
          <div
            key={track.track_id}
            className={cn(
              "flex border rounded-xl p-4 shadow-sm bg-red-50 border-red-300",
              "flex-col sm:flex-row gap-4 items-center"
            )}
          >
            <img
              src={formatImageUrl(track.image_url)}
              alt={`${track.track_name} albüm resmi`}
              className="w-24 h-24 rounded-md object-cover flex-shrink-0"
            />

            <div className="flex flex-col flex-grow">
              <span className="text-lg font-semibold">{track.track_name}</span>
              <span className="text-sm text-gray-700">{displayArtists}</span>
              <span className="text-sm text-gray-600">Albüm: {albumName}</span>
              <span className="text-sm text-gray-600">
                Süre: {track.duration_ms ? formatDuration(track.duration_ms) : "Bilinmiyor"}
              </span>
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Spotify'da Aç
              </a>
              <span className="text-sm text-gray-600">
                Popülarite: {track.popularity ?? "Bilinmiyor"}
              </span>
              {region && (
                <span className="text-sm text-gray-600">
                  Kaldırılan Bölge: <strong>{region}</strong>
                </span>
              )}
              {streamCount !== undefined && (
                <span className="text-sm text-green-700 mt-1">
                  Stream sayısı: {formatNumber(streamCount)}
                </span>
              )}
              {isError && (
                <span className="text-sm text-red-600 mt-1">
                  Stream verisi alınırken hata oluştu.
                </span>
              )}
            </div>

            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <Badge variant="destructive">Unplayable</Badge>
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                disabled={isLoading}
                onClick={() => handleGetStreamData(track.track_id)}
              >
                {isLoading ? "Yükleniyor..." : "Stream Verisi Getir"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrackList;

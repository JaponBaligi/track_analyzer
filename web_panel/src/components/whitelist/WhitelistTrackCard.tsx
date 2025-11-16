import React from "react";
import StreamHistoryChart from "../StreamHistoryChart";
import { NormalizedTrack } from "../../types/Whitetype";
import { msToMinSec } from "../../utils/format";

interface WhitelistTrackCardProps {
  track: NormalizedTrack;
  artistId: string;
  index: number;
  onDelete: (artistId: string, track: NormalizedTrack) => void;
  onFetchStreams: (artistId: string, track: NormalizedTrack) => void;
  busyIds: Set<string>;
  getTrackId: (track: NormalizedTrack) => string;
}

// Track metadata section
const TrackMetadata: React.FC<{ track: NormalizedTrack }> = ({ track }) => {
  return (
    <div className="mt-3 text-sm text-gray-700 dark:text-white space-y-1">
      {track.isrc && <div>ISRC: {track.isrc}</div>}
      {track.upc && <div>UPC: {track.upc}</div>}
      {track.licensor_name && (
        <div>
          <span className="font-medium">Label:</span> {track.licensor_name}
        </div>
      )}
      {track.release_date && (
        <div>
          <span className="font-medium">Released:</span> {track.release_date}
        </div>
      )}
      {track.owner && (
        <div>
          <span className="font-medium">Owner:</span> {track.owner}
        </div>
      )}
      {Array.isArray(track.genres) && track.genres.length > 0 && (
        <div>
          <span className="font-medium">Genres:</span> {track.genres.join(", ")}
        </div>
      )}
    </div>
  );
};

// Stream data section
const StreamDataSection: React.FC<{
  track: NormalizedTrack;
  artistId: string;
  busy: boolean;
  onFetchStreams: (artistId: string, track: NormalizedTrack) => void;
}> = ({ track, artistId, busy, onFetchStreams }) => {
  if (!track.streamData) {
    return (
      <div className="mt-2">
        <button
          onClick={() => onFetchStreams(artistId, track)}
          disabled={busy}
          className="px-3 py-1 rounded border text-sm"
        >
          {busy ? "Bekleniyor..." : "Stream Verisi Getir"}
        </button>
      </div>
    );
  }

  if (track.streamData.historicalData && track.streamData.historicalData.length > 0) {
    return (
      <div className="mt-3">
        <StreamHistoryChart
          data={[...track.streamData.historicalData].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )}
        />
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      Stream verisi mevcut ama tarihsel veri bulunamadı.
    </div>
  );
};

export const WhitelistTrackCard: React.FC<WhitelistTrackCardProps> = ({
  track,
  artistId,
  index,
  onDelete,
  onFetchStreams,
  busyIds,
  getTrackId,
}) => {
  const tid = getTrackId(track) ?? `${artistId}-fallback-${index}`;
  const tname = track.track_name ?? "(isim yok)";
  const anames = Array.isArray(track.artist_names) ? track.artist_names.join(", ") : "";
  const busy = busyIds.has(tid);

  return (
    <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {track.image_url ? (
            <img src={track.image_url} alt={tname} className="w-20 h-20 rounded-md object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center text-sm text-gray-500 dark:text-white">
              No Image
            </div>
          )}
          <div>
            <div className="font-semibold dark:text-white">{tname}</div>
            <div className="text-sm text-gray-500 dark:text-white">{anames}</div>
            <div className="text-xs text-gray-600 mt-1 dark:text-white">
              Albüm: {track.album_name ?? "—"} · Süre: {msToMinSec(track.duration_ms)}
            </div>
          </div>
        </div>
        <div className="text-right text-sm dark:text-white">
          <div className="mb-1 dark:text-white">ID: {tid}</div>
          <div className="text-xs text-gray-600 dark:text-white">Pop: {track.popularity ?? "—"}</div>
          <div className="text-xs text-gray-600 dark:text-white">Playable: {track.is_playable ? "Evet" : "Hayır"}</div>
          <div className="mt-2 flex flex-col gap-2 dark:text-white">
            <a
              href={track.spotify_url ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:text-white"
            >
              Spotify'ta Aç
            </a>
            <button
              onClick={() => onDelete(artistId, track)}
              className="text-xs px-2 py-1 border rounded text-red-600 dark:text-white"
              disabled={busy}
            >
              {busy ? "Bekleniyor..." : "Şarkıyı Sil"}
            </button>
          </div>
        </div>
      </div>
      <TrackMetadata track={track} />
      <StreamDataSection track={track} artistId={artistId} busy={busy} onFetchStreams={onFetchStreams} />
    </div>
  );
};


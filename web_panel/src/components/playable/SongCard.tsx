import React from "react";
import StreamHistoryChart from "../StreamHistoryChart";
import { getTrackIdFlexible, getTrackNameFlexible, getArtistNamesFlexible } from "../../utils/trackHelpers";
import { msToMinSec } from "../../utils/format";

type Song = any;

interface SongCardProps {
  song: Song;
  artistId: string;
  index: number;
  onLookup: (artistId: string, song: Song) => void;
  onDelete: (artistId: string, song: Song) => void;
  onFetchStreams: (artistId: string, song: Song) => void;
  lookupBusyIds: Set<string>;
  busyIds: Set<string>;
}

// Song metadata section
const SongMetadata: React.FC<{ song: Song }> = ({ song }) => {
  return (
    <div className="mt-3 text-sm text-gray-700 dark:text-white space-y-1">
      {song.isrc && <div>ISRC: {song.isrc}</div>}
      {song.upc && <div>UPC: {song.upc}</div>}
      {song.lookupError && <div className="text-sm text-red-500">{song.lookupError}</div>}
      {(song.licensor_name || song.release_date) && (
        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
          {song.licensor_name && (
            <div>
              <span className="font-medium">Distributor:</span> {song.licensor_name}
            </div>
          )}
          {song.release_date && (
            <div>
              <span className="font-medium">Released:</span> {song.release_date}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Stream data section
const SongStreamDataSection: React.FC<{
  song: Song;
  artistId: string;
  trackId: string | undefined;
  busyIds: Set<string>;
  onFetchStreams: (artistId: string, song: Song) => void;
}> = ({ song, artistId, trackId, busyIds, onFetchStreams }) => {
  if (!song.streamData) {
    return (
      <div className="mt-2">
        <button
          onClick={() => onFetchStreams(artistId, song)}
          disabled={busyIds.has(trackId ?? "")}
          className="px-3 py-1 rounded border text-sm"
        >
          {busyIds.has(trackId ?? "") ? "Bekleniyor..." : "Stream Verisi Getir"}
        </button>
      </div>
    );
  }

  if (song.streamData.historicalData && song.streamData.historicalData.length > 0) {
    return (
      <div className="mt-3">
        <StreamHistoryChart
          data={[...song.streamData.historicalData].sort(
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

export const SongCard: React.FC<SongCardProps> = ({
  song,
  artistId,
  index,
  onLookup,
  onDelete,
  onFetchStreams,
  lookupBusyIds,
  busyIds,
}) => {
  const tname = getTrackNameFlexible(song) ?? "(isim yok)";
  const anames = getArtistNamesFlexible(song).join(", ");
  const trackId = getTrackIdFlexible(song);

  return (
    <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {song.image_url ? (
            <img src={song.image_url} alt={tname} className="w-20 h-20 rounded-md object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center text-sm text-gray-500 dark:text-white">
              No Image
            </div>
          )}
          <div>
            <div className="font-semibold dark:text-white">{tname}</div>
            <div className="text-sm text-gray-500 dark:text-white">{anames}</div>
            <div className="text-xs text-gray-600 mt-1 dark:text-white">
              Albüm: {song.album_name ?? song.album ?? "—"} · Süre: {msToMinSec(song.duration_ms)}
            </div>
          </div>
        </div>
        <div className="text-right text-sm dark:text-white">
          <div className="mb-1 dark:text-white">ID: {trackId ?? "—"}</div>
          <div className="text-xs text-gray-600 dark:text-white">Pop: {song.popularity ?? "—"}</div>
          <div className="text-xs text-gray-600 dark:text-white">Playable: {song.is_playable ? "Evet" : "Hayır"}</div>
          <div className="mt-2 flex flex-col gap-2 dark:text-white">
            <a
              href={song.spotify_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:text-white"
            >
              Spotify'ta Aç
            </a>
            <div className="flex gap-2">
              <button
                onClick={() => onLookup(artistId, song)}
                className="text-xs px-2 py-1 border rounded bg-green-50 text-green-700"
                disabled={lookupBusyIds.has(trackId ?? "")}
              >
                {lookupBusyIds.has(trackId ?? "") ? "Aranıyor..." : "Lookup"}
              </button>
              <button
                onClick={() => onDelete(artistId, song)}
                className="text-xs px-2 py-1 border rounded text-red-600 dark:text-white"
              >
                Şarkıyı Sil
              </button>
            </div>
          </div>
        </div>
      </div>
      <SongMetadata song={song} />
      <SongStreamDataSection
        song={song}
        artistId={artistId}
        trackId={trackId}
        busyIds={busyIds}
        onFetchStreams={onFetchStreams}
      />
    </div>
  );
};


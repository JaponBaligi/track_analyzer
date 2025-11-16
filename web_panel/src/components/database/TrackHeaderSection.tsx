import { DbTrack } from "../../utils/trackHelpers";
import { StreamState } from "../../types/database";

interface TrackHeaderSectionProps {
  track: DbTrack;
  trackId: string;
  streamState: StreamState | undefined;
  onFetchStreams: (id: string) => void;
}

export const TrackHeaderSection: React.FC<TrackHeaderSectionProps> = ({
  track,
  trackId,
  streamState,
  onFetchStreams,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between flex-wrap items-center gap-4 p-4 rounded-lg shadow-md bg-gray-50 dark:bg-gray-700">
      {/* Track Info */}
      <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap gap-4">
        <span>
          Seçili Parça ID: <span className="font-mono">{trackId}</span>
        </span>
        {track.isrc && (
          <span>
            ISRC: <span className="font-mono">{track.isrc}</span>
          </span>
        )}
        {track.upc && (
          <span>
            UPC: <span className="font-mono">{track.upc}</span>
          </span>
        )}
      </div>

      {/* Spotify URI */}
      {track?.spotify_url && (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          URI:{" "}
          <a
            href={`spotify:track:${trackId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors duration-200"
          >
            {`spotify:track:${trackId}`}
          </a>
        </div>
      )}

      {/* Fetch Streams Button */}
      {(!streamState?.data || streamState?.error) && (
        <div>
          <button
            onClick={() => onFetchStreams(trackId)}
            disabled={streamState?.loading}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {streamState?.loading ? "Yükleniyor…" : "Stream Verisi Getir"}
          </button>
        </div>
      )}
    </div>
  );
};


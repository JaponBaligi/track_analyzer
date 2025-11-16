import { getTrackId, getTrackImage, getTrackAlbum, DbTrack } from "../../utils/trackHelpers";

interface TrackInfoSectionProps {
  track: DbTrack;
  onDelete: (id: string) => void;
  lookupSection: React.ReactNode;
}

export const TrackInfoSection: React.FC<TrackInfoSectionProps> = ({ track, onDelete, lookupSection }) => {
  const trackId = getTrackId(track);
  const image = getTrackImage(track);
  const album = getTrackAlbum(track);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 shadow-sm space-y-2">
      <div className="flex items-center gap-3">
        {image && <img src={image} alt="Cover" className="w-16 h-16 rounded object-cover" />}
        <div className="space-y-1">
          <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">{track.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {track.artist_names || "Bilinmiyor"} • {album || "Single"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-700 dark:text-gray-300 mt-2">
        <div>
          <span className="font-medium">Süre:</span>{" "}
          {track.duration_ms ? formatDuration(track.duration_ms) : "—"}
        </div>
        <div>
          <span className="font-medium">Popülarite:</span> {track.popularity ?? "—"}
        </div>
        <div>
          <a
            href={`https://open.spotify.com/track/${trackId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Spotify Link
          </a>
        </div>
        {track.playlist_id && (
          <div>
            <a
              href={`https://open.spotify.com/playlist/${track.playlist_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Playlist Link
            </a>
          </div>
        )}
        {lookupSection}
        <div className="sm:col-span-2">
          <button
            onClick={() => track.id && onDelete(track.id)}
            className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};


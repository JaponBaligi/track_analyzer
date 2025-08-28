import { useEffect, useState } from "react";

interface Track {
  id: string;
  name: string;
  artist: string;
  playlist_id: string | null;
  detected_at: string;
}

export default function Database() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8000/api/tracks/unplayable", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "API error");
        }
        return res.json();
      })
      .then(setTracks)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Unplayable Tracks</h2>
        {error && <p className="text-red-500">{error}</p>}
        <table className="w-full border-collapse bg-white shadow-md rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Track</th>
              <th className="p-2 border">Artist</th>
              <th className="p-2 border">Playlist</th>
              <th className="p-2 border">Detected</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-2 border">{t.name}</td>
                <td className="p-2 border">{t.artist}</td>
                <td className="p-2 border">{t.playlist_id || "-"}</td>
                <td className="p-2 border">{new Date(t.detected_at).toLocaleString()}</td>
              </tr>
            ))}
            {tracks.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

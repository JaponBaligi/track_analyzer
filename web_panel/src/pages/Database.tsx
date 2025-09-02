// src/pages/Database.tsx

import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

interface Track {
  id: string;
  name: string;
  artist: string;
  playlist_id: string | null;
}

export default function Database() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get("/tracks/unplayable")
      .then((res) => setTracks(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || err.message)
      );
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Unplayable Track'ler</h2>
        {error && <p className="text-red-500">{error}</p>}
        <table className="w-full border-collapse bg-white shadow-md rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="p-2 border">Track</th>
              <th className="p-2 border">Artist</th>
              <th className="p-2 border">Bulunduğu Playlist</th>
              <th className="p-2 border">Arama Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-2 border">{t.name}</td>
                <td className="p-2 border">{t.artist}</td>
                <td className="p-2 border">{t.playlist_id || "-"}</td>
              </tr>
            ))}
            {tracks.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
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

// src/pages/Database.tsx

import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  album_image: string; 
  duration_ms: number;
  popularity: number;
  track_url: string; 
  playlist_url: string | null; 
}

export default function Database() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get("/tracks/unplayable")
      .then((res) => {
        const mapped = res.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          artist: t.artist_names.join(", "),
          album: t.album_name,
          album_image: t.image_url,
          duration_ms: t.duration_ms,
          popularity: t.popularity,
          track_url: t.spotify_url,
          playlist_url: t.playlist_id
            ? `https://open.spotify.com/playlist/${t.playlist_id}`
            : null,
        }));
        setTracks(mapped);
      })
      .catch((err) =>
        setError(err.response?.data?.detail || err.message)
      );
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/tracks/${id}`);
      console.log("[DEBUG] Silme cevabı:", res.data);
      // Başarılı olursa frontend listesinden çıkar
      setTracks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error("[ERROR] Silme hatası:", err.response?.data || err.message);
      setError(err.response?.data?.detail || err.message);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Unplayable Track'ler</h2>
        {error && <p className="text-red-500">{error}</p>}
        <table className="w-full border-collapse bg-white shadow-md rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="p-2 border">Album Foto</th>
              <th className="p-2 border">Track</th>
              <th className="p-2 border">Artist</th>
              <th className="p-2 border">Albüm</th>
              <th className="p-2 border">Süre</th>
              <th className="p-2 border">Popülarite</th>
              <th className="p-2 border">Track Link</th>
              <th className="p-2 border">Playlist Link</th>
              <th className="p-2 border">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 text-center">
                <td className="p-2 border">
                  <img
                    src={t.album_image}
                    alt={t.album}
                    className="w-12 h-12 mx-auto rounded"
                  />
                </td>
                <td className="p-2 border">{t.name}</td>
                <td className="p-2 border">{t.artist}</td>
                <td className="p-2 border">{t.album}</td>
                <td className="p-2 border">{formatDuration(t.duration_ms)}</td>
                <td className="p-2 border">{t.popularity}</td>
                <td className="p-2 border">
                  <a
                    href={t.track_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Link
                  </a>
                </td>
                <td className="p-2 border">
                  {t.playlist_url ? (
                    <a
                      href={t.playlist_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      Playlist
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2 border">
                <button
                  onClick={() => handleDelete(t.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Sil
                </button>
              </td>
              </tr>
            ))}
            {tracks.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
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

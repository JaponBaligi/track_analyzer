// src/pages/ArtistScanner.tsx
import React, { useState } from "react";
import { scanArtistPlayable, getPlayableTracksByOwner } from "../api/spotify";
import ScanResultList from "../components/ScanResultList";
import type { Track } from "../types";
import { JSX } from "react/jsx-runtime";

type ScanResult = {
  success?: boolean;
  data?: any;
  error?: string;
};

function mapDbRowToTrack(row: any): Track {
  const artistNames = (() => {
    try {
      if (!row.artist_names) return [];
      if (Array.isArray(row.artist_names)) return row.artist_names;
      return JSON.parse(row.artist_names);
    } catch {
      return typeof row.artist_names === "string" ? [row.artist_names] : [];
    }
  })();

  return {
    track_id: row.id,
    track_name: row.name,
    artist_names: artistNames,
    album_name: row.album_name,
    duration_ms: row.duration_ms,
    popularity: row.popularity,
    is_playable: !!row.is_playable,
    spotify_url: row.spotify_url,
    image_url: row.image_url,
    isrc: row.isrc,
    upc: row.upc,
    added_at: row.added_at,
  } as Track;
}

export default function ArtistScanner(): JSX.Element {
  const [artist, setArtist] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  const clearResults = () => {
    setResult(null);
    setError(null);
    setTracks([]);
  };

  const onScan = async () => {
    if (!artist) return;
    clearResults();
    setLoading(true);

    const scanTime = new Date().toISOString();

    try {
      const res = await scanArtistPlayable(artist);
      setResult({ success: res?.success ?? true, data: res?.data });

      const rows = await getPlayableTracksByOwner();
      console.log("ROWS:", rows)
      const thisScanTracks = (rows || [])
        .map(mapDbRowToTrack)
        .filter(r => r.added_at && new Date(r.added_at) >= new Date(scanTime))
        .sort((a, b) => new Date(b.added_at!).getTime() - new Date(a.added_at!).getTime());

      setTracks(thisScanTracks);
    } catch (err: any) {
      console.error("Scan error:", err);
      const message = err?.response?.data?.detail || err?.message || "Bilinmeyen hata";
      setError(String(message));
      setResult({ error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">
          Artist Playable Scan
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Artist adını veya Spotify ID'sini girip tarama başlatın.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Örn: Ed Sheeran veya 2hazSY4Ef3aB9ATXW7F5w3"
          className="flex-1 p-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        />
        <button
          onClick={onScan}
          disabled={!artist || loading}
          className={`px-6 py-3 rounded-xl font-semibold text-white shadow-md transition-colors ${
            loading || !artist
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {loading ? "Taranıyor…" : "Ara"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-400 rounded-xl shadow-sm">
          {error}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Tarama Sonuçları
        </h3>

        <div className="max-h-[500px] overflow-y-auto border rounded-xl p-3 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <ScanResultList tracks={tracks} />
        </div>
      </div>
    </div>
  );
}

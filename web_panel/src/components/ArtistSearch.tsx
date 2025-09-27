// src/components/ArtistSearch.tsx

import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { scanArtist } from "../api/spotify";
import { Search } from "lucide-react";

const ArtistSearch = () => {
  const [input, setInput] = useState("");
  const [depth, setDepth] = useState(2);
  const {
    setArtist,
    setArtistResults,
    setPlaylists,
    setTrackResults,
    setLoading,
    setError,
    loading,
    region,
  } = useAppContext();

  const handleSearch = async () => {
    if (!input.trim()) return;

    setArtist("");
    setArtistResults([]);
    setPlaylists([]);
    setTrackResults([]);
    setError(null);
    setLoading(true);

    try {
      const result = await scanArtist(input, region, depth);

      setArtist(result.artist.name || result.artist);
      setArtistResults(result.related_artists || []);
      setPlaylists(result.playlists || []);
      setTrackResults(result.tracks || []);
    } catch (err) {
      console.error("Arama hatası:", err);
      setError("Sanatçı taraması sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto px-4">
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Playlist adı girin..."
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all"
          disabled={loading}
        />
        <input
          type="number"
          value={depth}
          min={1}
          max={5}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="w-20 px-2 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all"
          disabled={loading}
          title="Tarama derinliği"
        />
        <button
          onClick={handleSearch}
          disabled={!input.trim() || loading}
          className="bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 active:scale-95 transition-transform duration-100 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <Search className="w-5 h-5" />
          )}
          {loading ? "Aranıyor..." : "Tara"}
        </button>
      </div>
    </div>
  );
};

export default ArtistSearch;

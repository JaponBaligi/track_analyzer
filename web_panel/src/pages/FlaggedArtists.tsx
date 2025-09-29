import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <- ekledik
import { fetchFlaggedArtists, addFlaggedArtist, deleteFlaggedArtist } from "../api/flaggedArtists";
import { TrashIcon } from "../components/IconWrappers";
import { motion, AnimatePresence } from "framer-motion";

interface FlaggedArtist {
  id: number;
  name: string;
}

export default function FlaggedArtistsPage() {
  const navigate = useNavigate(); // <- ekledik
  const [name, setName] = useState("");
  const [list, setList] = useState<FlaggedArtist[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadList = async () => {
    try {
      const data = await fetchFlaggedArtists();
      setList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError("Flagged Artistler yüklenemedi");
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tam artist adını girin (Artist adı 'xxxxx' ise 'xxxxx' yazın).");
      return;
    }

    setLoading(true);
    try {
      await addFlaggedArtist(trimmed);
      await loadList();
      setName("");
      setMessage("Artist veritabanına eklendi, sonraki aramalarda bu artist atlanacak.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Artist eklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await deleteFlaggedArtist(id);
      setList((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error(err);
      setError("Artist silinemedi");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="md:w-2/3 bg-blue-50 dark:bg-gray-800 p-6 shadow-md flex flex-col">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate("/db")}
            className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
          >
            Track Database
          </button>

          <h1 className="text-2xl font-semibold">Flagged Artists</h1>

          <button
            onClick={() => navigate("/playable-artist")}
            className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
          >
            Playable Artists
          </button>

          <button
            onClick={() => navigate("/whitelist")}
            className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
          >
            Whitelist
          </button>
        </div>

        <form onSubmit={handleAdd} className="mb-6">
          <label htmlFor="artist-name-input" className="block mb-2 font-medium text-blue-800 dark:text-blue-200">
            Tam Artist Adını Girin
          </label>
          <div className="flex gap-2">
            <input
              id="artist-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder='"xxxxx" ise "xxxxx" yazın'
              aria-label="Artist name"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 dark:bg-blue-500 text-white disabled:opacity-60 hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-1"
            >
              Ekle
            </button>
          </div>
        </form>
        {message && <div className="mb-2 text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 p-2 rounded">{message}</div>}
        {error && <div className="mb-2 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 p-2 rounded">{error}</div>}
      </div>

      {/* Artist List */}
      <div className="md:w-1/2 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Eklenen Flagged Artistler</h2>
        {list.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">Henüz flag'lenmiş artist yok.</div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {list.map((it) => (
                <motion.li
                  key={it.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow rounded hover:shadow-lg transition-shadow duration-200"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-100">{it.name}</span>
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="px-3 py-1 rounded bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-1"
                    aria-label={`Delete ${it.name}`}
                  >
                    <TrashIcon className="w-5 h-5" /> Sil
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

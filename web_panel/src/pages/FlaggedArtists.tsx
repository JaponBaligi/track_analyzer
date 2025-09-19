// web_panel/src/pages/FlaggedArtists.tsx

import React, { useState, useEffect } from "react";
import { fetchFlaggedArtists, addFlaggedArtist, deleteFlaggedArtist } from "../api/flaggedArtists";
import { UserPlusIcon, TrashIcon } from "../components/IconWrappers";
import { motion, AnimatePresence } from "framer-motion";

interface FlaggedArtist {
  id: number;
  name: string;
}

export default function FlaggedArtistsPage() {
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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <div className="md:w-1/3 bg-blue-50 p-6 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <UserPlusIcon className="text-blue-600 text-2xl" />
          <h1 className="text-2xl font-bold text-blue-700">Flagged Artists</h1>
        </div>

        <form onSubmit={handleAdd} className="mb-6">
          <label htmlFor="artist-name-input" className="block mb-2 font-medium text-blue-800">
            Tam Artist Adını Girin
          </label>
          <div className="flex gap-2">
            <input
              id="artist-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-400"
              placeholder='"xxxxx" ise "xxxxx" yazın'
              aria-label="Artist name"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700 flex items-center gap-1"
            >
              Ekle
            </button>
          </div>
        </form>

        {message && <div className="mb-2 text-green-700 bg-green-100 p-2 rounded">{message}</div>}
        {error && <div className="mb-2 text-red-700 bg-red-100 p-2 rounded">{error}</div>}
      </div>

      <div className="md:w-2/3 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Eklenen Flagged Artistler</h2>
        {list.length === 0 ? (
          <div className="text-gray-500">Henüz flag'lenmiş artist yok.</div>
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
                  className="flex justify-between items-center p-4 bg-white shadow rounded hover:shadow-lg transition-shadow duration-200"
                >
                  <span className="font-medium text-gray-800">{it.name}</span>
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
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

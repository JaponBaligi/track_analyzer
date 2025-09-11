// web_panel/src/pages/FlaggedArtists.tsx
import React, { useState, useEffect } from "react";
import { fetchFlaggedArtists, addFlaggedArtist, deleteFlaggedArtist } from "../api/flaggedArtists";
import * as FiIcons from "react-icons/fi";

export default function FlaggedArtistsPage() {
  const [name, setName] = useState("");
  const [list, setList] = useState<Array<{ id: number; name: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const FiUserPlus = FiIcons.FiUserPlus as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
  const FiTrash2 = FiIcons.FiTrash2 as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFlaggedArtists();
        setList(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error(e);
        setError("Flagged Artistler yüklenemedi");
      }
    })();
  }, []);

  async function handleAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setMessage(null);
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tam artist adını girin (Artist adı 'xxxxx' ise 'Xxxxx' yazmayın).");
      return;
    }
    setLoading(true);
    try {
      await addFlaggedArtist(trimmed);
      const items = await fetchFlaggedArtists();
      setList(Array.isArray(items) ? items : []);
      setName("");
      setMessage("Artist veritabanına eklendi, sonraki arama sonuçlarında bu artistin parçaları atlanacak.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Artist eklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteFlaggedArtist(id);
      setList((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error(err);
      setError("Artist silinemedi");
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <div className="md:w-1/3 bg-blue-50 p-6 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <FiUserPlus className="text-blue-600 text-2xl" />
          <h1 className="text-2xl font-bold text-blue-700">Flagged Artists</h1>
        </div>

        <form onSubmit={(e) => handleAdd(e)} className="mb-6">
          <label htmlFor="artist-name-input" className="block mb-2 font-medium text-blue-800">
            Tam Artist Adını Girin
          </label>
          <div className="flex gap-2">
            <input
              id="artist-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-400"
              placeholder='"xxxxx" ise "xxxxx" yazın, "Xxxxx" değil'
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
            {list.map((it) => (
              <li
                key={it.id}
                className="flex justify-between items-center p-4 bg-white shadow rounded hover:shadow-lg transition-shadow duration-200"
              >
                <span className="font-medium text-gray-800">{it.name}</span>
                <button
                  onClick={() => handleDelete(it.id)}
                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                  aria-label={`Delete ${it.name}`}
                >
                  <FiTrash2 /> Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

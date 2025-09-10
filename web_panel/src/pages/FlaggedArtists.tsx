// web_panel/src/pages/FlaggedArtists.tsx
// //[FlaggedArtistsPage] : UI to add/delete flagged artist names (exact-match, case-sensitive)
import React, { useState, useEffect } from "react";
import { fetchFlaggedArtists, addFlaggedArtist, deleteFlaggedArtist } from "../api/flaggedArtists";

export default function FlaggedArtistsPage() {
  const [name, setName] = useState("");
  const [list, setList] = useState<Array<{ id: number; name: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // //[load_list] : load flagged artists on mount
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

  // //[handle_add] : add a flagged artist (exact name)
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
      // API returns created object; reload list
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

  // //[handle_delete] : delete flagged by id
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Flagged Artists</h1>
      </div>

      <form onSubmit={(e) => handleAdd(e)} className="mb-4">
        <label htmlFor="artist-name-input" className="block mb-2 font-medium">Tam Artist Adını Girin (büyük-küçük harf duyarlı)</label>
        <div className="flex gap-2">
          <input
            id="artist-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder='"xxxxx" ise "xxxxx" yazın, "Xxxxx" değil'
            aria-label="Artist name"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            Ekle
          </button>
        </div>
      </form>

      {message && <div className="mb-4 text-green-700">{message}</div>}
      {error && <div className="mb-4 text-red-700">{error}</div>}

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-medium mb-2">Eklenen Flagged Artistler</h2>
        {list.length === 0 ? (
          <div className="text-sm text-gray-600">Henüz flag'lenmiş artist yok.</div>
        ) : (
          <ul className="space-y-2">
            {list.map((it) => (
              <li key={it.id} className="flex items-center justify-between">
                <div>{it.name}</div>
                <div>
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    aria-label={`Delete ${it.name}`}
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

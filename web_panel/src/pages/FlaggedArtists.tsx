// FlaggedArtists.tsx
import React, { useState, useEffect } from "react";
import { fetchFlaggedArtists, addFlaggedArtist, deleteFlaggedArtist } from "../api/flaggedArtists";

export default function FlaggedArtistsPage() {
  const [name, setName] = useState("");
  const [list, setList] = useState<Array<{ id: number; name: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFlaggedArtists();
        setList(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  async function handleAdd() {
    setMessage(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Please enter an exact artist name.");
      return;
    }
    setLoading(true);
    try {
      const created = await addFlaggedArtist(trimmed);
      // Add to local list
      setList((s) => [...s, created]);
      // Use the exact user-requested success message
      setMessage(
        "Artist added to the database, for further search results will not display this artist's unplayable tracks and their tracks will not saved to the database."
      );
      setName("");
    } catch (e) {
      setMessage("Failed to add artist (maybe it already exists).");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteFlaggedArtist(id);
      setList((s) => s.filter((x) => x.id !== id));
    } catch (e) {
      setMessage("Failed to delete");
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Flagged Artists</h2>
      <p style={{ fontSize: 13, color: "#666" }}>
        Enter the exact artist name (case & unicode sensitive). Example: <code>Floki</code>
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exact artist name"
          style={{ flex: 1 }}
        />
        <button onClick={handleAdd} disabled={loading}>
          Add
        </button>
      </div>

      {message && <div style={{ marginTop: 12, padding: 8, border: "1px solid #ddd" }}>{message}</div>}

      <div style={{ marginTop: 24 }}>
        <h3>Current flagged artists</h3>
        <ul>
          {list.map((it) => (
            <li key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{it.name}</span>
              <button onClick={() => handleDelete(it.id)} aria-label={`Delete ${it.name}`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

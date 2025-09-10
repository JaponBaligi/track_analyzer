// api/flaggedArtists.ts
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export async function fetchFlaggedArtists() {
  const res = await fetch(`${API_BASE}/api/flagged-artists`);
  if (!res.ok) throw new Error("Failed to fetch flagged artists");
  return res.json();
}

export async function addFlaggedArtist(name: string) {
  const res = await fetch(`${API_BASE}/api/flagged-artists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to add");
  }
  return res.json();
}

export async function deleteFlaggedArtist(id: number) {
  const res = await fetch(`${API_BASE}/api/flagged-artists/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete");
  return true;
}

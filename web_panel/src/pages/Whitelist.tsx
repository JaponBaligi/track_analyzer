// src/pages/Whitelist.tsx

import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { NormalizedTrack, normalizeList } from "../types/Whitetype";
import StreamHistoryChart from "../components/StreamHistoryChart";
import { useNavigate } from "react-router-dom";

export default function Whitelist() {
  const [tracks, setTracks] = useState<NormalizedTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/lookup/whitelist");
      const normalized = normalizeList(res?.data?.tracks ?? []);
      setTracks(normalized);
    } catch (err: any) {
      console.error("Whitelist yüklenemedi:", err);
      alert("Whitelist verisi alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTrack(trackId?: string) {
    if (!trackId) return;
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    setBusyIds((s) => new Set([...s, trackId]));
    try {
      try {
        await axiosInstance.delete(`/lookup/whitelist/${encodeURIComponent(trackId)}`);
      } catch (_) {
        await axiosInstance.request({ url: "/lookup/whitelist/delete_bulk", method: "DELETE", data: { ids: [trackId] } });
      }

      setTracks((prev) => prev.filter((t) => (t.track_id ?? t.id) !== trackId));
      setSelectedForDelete((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    } catch (err: any) {
      console.error("Whitelist silme hatası:", err);
      alert("Silme başarısız: " + (err?.message ?? String(err)));
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(trackId);
        return next;
      });
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedForDelete);
    if (!ids.length) return;
    if (!window.confirm(`${ids.length} kayıt silinecek. Emin misiniz?`)) return;

    ids.forEach((id) => setBusyIds((s) => new Set([...s, id])));

    try {
      await axiosInstance.request({ url: "/lookup/whitelist/delete_bulk", method: "DELETE", data: { ids } });
      setTracks((prev) => prev.filter((t) => !ids.includes((t.track_id ?? t.id) as string)));
      setSelectedForDelete(new Set());
    } catch (err: any) {
      console.error("Whitelist toplu silme hatası:", err);
      alert("Toplu silme başarısız: " + (err?.message ?? String(err)));
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  async function fetchStreamDataForSong(track: NormalizedTrack) {
    const trackId = track.track_id ?? track.id;
    if (!trackId) return alert("Track id bulunamadı.");

    setBusyIds((s) => new Set([...s, trackId]));
    try {
      try {
        const resGet = await axiosInstance.get(`/streams/${trackId}`);
        if (resGet?.data && !resGet.data.error) {
          setTracks((prev) =>
            prev.map((t) => (t.track_id === trackId ? { ...t, streamData: resGet.data } : t))
          );
          return;
        }
      } catch {}

      await axiosInstance.post("/stream/update", null, { params: { track_id: trackId } });
      const res = await axiosInstance.get(`/streams/${trackId}`);
      setTracks((prev) => prev.map((t) => (t.track_id === trackId ? { ...t, streamData: res.data } : t)));
    } catch (err: any) {
      console.error(err);
      alert("Stream verisi alınamadı: " + (err?.message ?? String(err)));
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(trackId);
        return next;
      });
    }
  }

  function msToMinSec(ms?: number) {
    if (!ms) return "—";
    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function toggleSelect(id?: string) {
    if (!id) return;
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredTracks = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => {
      const title = (t.track_name ?? "").toString().toLowerCase();
      const artists = Array.isArray(t.artist_names) ? t.artist_names.join(" ") : (t.artist_names || "");
      const album = (t.album_name ?? "").toString().toLowerCase();
      const tid = ((t.track_id ?? t.id) || "").toString().toLowerCase();
      const isrc = (t.isrc ?? "").toString().toLowerCase();
      const upc = (t.upc ?? "").toString().toLowerCase();
      const owner = (t.owner ?? "").toString().toLowerCase();
      const haystack = [title, artists.toString().toLowerCase(), album, tid, isrc, upc, owner].join(" ");
      return haystack.includes(q);
    });
  }, [tracks, searchQuery]);


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/db")}
            className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
          >
            Track Database
          </button>
          <button
            onClick={() => navigate("/flagged-artists")}
            className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
          >
            Flagged Artists
          </button>
          <button
            onClick={() => navigate("/playable-artist")}
            className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
          >
            Playable Artists
          </button>
          <h1 className="text-2xl font-semibold">Whitelist</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* search input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ara: parça, sanatçı, albüm, id..."
              className="rounded px-2 py-1 text-sm bg-white text-black dark:bg-gray-800 dark:text-white border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={load}
            className="px-3 py-1 rounded-md border hover:bg-gray-100"
          >
            Yenile
          </button>
          <button
            onClick={bulkDelete}
            disabled={selectedForDelete.size === 0}
            className={`px-3 py-1 rounded-md border ml-2 ${selectedForDelete.size === 0 ? "opacity-50 cursor-not-allowed" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
          >
            Toplu Sil ({selectedForDelete.size})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <div className="text-sm text-gray-500 dark:text-white">Yükleniyor...</div>
        )}
        {!loading && filteredTracks.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-white">Whitelist için kayıt bulunamadı.</div>
        )}

        {filteredTracks.map((t) => {
          const key = (t.id ?? t.track_id) as string;
          const title = t.track_name as string;
          const artists = Array.isArray(t.artist_names) ? t.artist_names : [];
          const playable = Boolean(t.is_playable);
          const busy = busyIds.has(key);
          const selected = selectedForDelete.has(key);

          return (
            <div key={key} className="border rounded-lg p-3 bg-white shadow dark:bg-gray-800 relative">
              <div className="absolute top-2 right-2">
                <input type="checkbox" checked={selected} onChange={() => toggleSelect(key)} />
              </div>

              <div className="flex gap-3">
                {t.image_url ? (
                  <img src={t.image_url} alt={title} className="w-20 h-20 rounded-md object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-500 dark:text-white">No Image</div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-gray-500 dark:text-white">{artists.join(", ")}</div>

                  <div className="text-xs text-gray-600 dark:text-white mt-2"><strong>Label:</strong> {t.licensor_name ?? "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>Released:</strong> {t.release_date ?? "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>Playable:</strong> {playable ? "Evet" : "Hayır"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>Süre:</strong> {msToMinSec(t.duration_ms)}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>Popularity:</strong> {t.popularity ?? "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>Album:</strong> {t.album_name ?? "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>ISRC:</strong> {t.isrc ?? "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>UPC:</strong> {t.upc ?? "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>Owner:</strong> {t.owner ?? "—"}</div>
                  <div className="text-xs text-gray-600 dark:text-white"><strong>Genres:</strong> {Array.isArray(t.genres) ? t.genres.join(", ") : "—"}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <a href={t.spotify_url ?? undefined} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 border rounded">Spotify'ta Aç</a>
                <div className="text-xs text-gray-500">{t.owner ?? ""}</div>
              </div>

              <div className="mt-3">
                {t.streamData ? (
                  <div>
                    {t.streamData.historicalData && t.streamData.historicalData.length > 0 ? (
                      <StreamHistoryChart data={[...t.streamData.historicalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())} />
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Stream verisi mevcut ama tarihsel veri bulunamadı.</div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => fetchStreamDataForSong(t)} disabled={busy} className="px-3 py-1 mt-2 rounded border text-sm">{busy ? "Bekleniyor..." : "Stream Verisi Getir"}</button>
                )}
              </div>

              {/* card delete button bottom-right */}
              <div className="absolute bottom-3 right-3">
                <button onClick={() => deleteTrack(key)} disabled={busy} className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700">{busy ? "Bekleniyor..." : "Sil"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

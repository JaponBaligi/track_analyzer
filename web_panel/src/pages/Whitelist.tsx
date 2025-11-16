// src/pages/Whitelist.tsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { NormalizedTrack, normalizeList } from "../types/Whitetype";
import { useNavigate } from "react-router-dom";
import { getStreamErrorMessage } from "../utils/streamErrors";
import { WhitelistTrackCard } from "../components/whitelist/WhitelistTrackCard";
import { getTrackId } from "../utils/trackHelpers";

export default function Whitelist() {
  const [tracks, setTracks] = useState<NormalizedTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();

  // Use utility function
  const getTrackId = (track: NormalizedTrack): string => {
    return (track.track_id ?? track.id) as string;
  };

  // Group tracks by artist
  const artists = useMemo(() => {
    const grouped: Record<string, NormalizedTrack[]> = {};
    tracks.forEach((track) => {
      const artistName = Array.isArray(track.artist_names) && track.artist_names.length > 0
        ? track.artist_names[0]
        : "Unknown Artist";
      if (!grouped[artistName]) grouped[artistName] = [];
      grouped[artistName].push(track);
    });
    return Object.keys(grouped).map((name) => ({
      id: encodeURIComponent(name),
      name,
      songs: grouped[name],
    }));
  }, [tracks]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!expandedArtist && artists.length > 0) {
      setExpandedArtist(artists[0].id);
    }
  }, [artists, expandedArtist]);

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

  function toggleArtistSelection(artistId: string) {
    setSelectedArtists((prev) => {
      const next = new Set(prev);
      if (next.has(artistId)) next.delete(artistId);
      else next.add(artistId);
      setSelectAll(false);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedArtists(new Set());
      setSelectAll(false);
    } else {
      setSelectedArtists(new Set(artists.map((a) => a.id)));
      setSelectAll(true);
    }
  }

  async function deleteTrack(artistId: string, track: NormalizedTrack) {
    const trackId = getTrackId(track);
    if (!trackId) return;
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    setBusyIds((s) => new Set([...s, trackId]));
    try {
      try {
        await axiosInstance.delete(`/lookup/whitelist/${encodeURIComponent(trackId)}`);
      } catch (_) {
        await axiosInstance.request({ url: "/lookup/whitelist/delete_bulk", method: "DELETE", data: { ids: [trackId] } });
      }

      setTracks((prev) => prev.filter((t) => getTrackId(t) !== trackId));
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

  async function deleteArtist(artistId: string) {
    const artist = artists.find((a) => a.id === artistId);
    if (!artist) return;
    if (!window.confirm(`"${artist.name}" artistine ait tüm şarkılar silinecek. Emin misiniz?`)) return;

    try {
      setBusyIds((s) => new Set([...s, artistId]));
      const trackIds = artist.songs.map((s) => getTrackId(s));
      await axiosInstance.request({ url: "/lookup/whitelist/delete_bulk", method: "DELETE", data: { ids: trackIds } });
      setTracks((prev) => prev.filter((t) => !trackIds.includes(getTrackId(t))));
    } catch (err: any) {
      console.error("Artist silinirken hata:", err);
      alert("Silme başarısız: " + (err?.message ?? String(err)));
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(artistId);
        return next;
      });
    }
  }

  async function bulkDelete() {
    const trackIds = Array.from(selectedArtists)
      .map((artistId) => {
        const artist = artists.find((a) => a.id === artistId);
        return artist ? artist.songs.map((s) => getTrackId(s)) : [];
      })
      .flat();
    
    if (!trackIds.length) return;
    if (!window.confirm(`${trackIds.length} kayıt silinecek. Emin misiniz?`)) return;

    trackIds.forEach((id) => setBusyIds((s) => new Set([...s, id])));

    try {
      await axiosInstance.request({ url: "/lookup/whitelist/delete_bulk", method: "DELETE", data: { ids: trackIds } });
      setTracks((prev) => prev.filter((t) => !trackIds.includes(getTrackId(t))));
      setSelectedArtists(new Set());
      setSelectAll(false);
    } catch (err: any) {
      console.error("Whitelist toplu silme hatası:", err);
      alert("Toplu silme başarısız: " + (err?.message ?? String(err)));
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        trackIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  // Helper to update a track in the tracks array
  const updateTrack = (trackId: string, updater: (track: NormalizedTrack) => NormalizedTrack) => {
    setTracks((prev) => prev.map((t) => (getTrackId(t) === trackId ? updater(t) : t)));
  };

  async function fetchStreamDataForSong(artistId: string, track: NormalizedTrack) {
    const trackId = getTrackId(track);
    if (!trackId) return alert("Track id bulunamadı.");

    setBusyIds((s) => new Set([...s, trackId]));
    try {
      // Try to get existing stream data first
      try {
        const resGet = await axiosInstance.get(`/streams/${trackId}`);
        if (resGet?.data && !resGet.data.error) {
          updateTrack(trackId, (t) => ({ ...t, streamData: resGet.data }));
          return;
        }
      } catch {
        // ignore and fallback to update
      }

      // Update and fetch stream data
      await axiosInstance.post("/stream/update", null, { params: { track_id: trackId } });
      const res = await axiosInstance.get(`/streams/${trackId}`);
      updateTrack(trackId, (t) => ({ ...t, streamData: res.data }));
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      const errorMessage = getStreamErrorMessage(status, err?.response?.data?.detail || err?.message);
      alert("Stream verisi alınamadı: " + errorMessage);
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(trackId);
        return next;
      });
    }
  }

  const getArtistById = (id: string | null) => artists.find((a) => a.id === id) || null;

  // Helper to check if a track matches search query
  const trackMatchesQuery = useCallback((track: NormalizedTrack, query: string): boolean => {
    const searchFields = [
      track.track_name ?? "",
      track.album_name ?? "",
      Array.isArray(track.artist_names) ? track.artist_names.join(", ") : "",
      getTrackId(track) ?? "",
      track.isrc ?? "",
      track.upc ?? "",
      track.owner ?? "",
    ];
    return searchFields.some((field) => field.toLowerCase().includes(query));
  }, []);

  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artists;

    return artists.filter((a) => {
      if (a.name.toLowerCase().includes(q)) return true;
      return a.songs.some((s) => trackMatchesQuery(s, q));
    });
  }, [artists, searchQuery, trackMatchesQuery]);

  // If current expanded artist is filtered out, pick first filtered
  useEffect(() => {
    if (!filteredArtists.length) return;
    if (!expandedArtist || !filteredArtists.some((a) => a.id === expandedArtist)) {
      setExpandedArtist(filteredArtists[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredArtists]);


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
          <button onClick={load} className="px-3 py-1 rounded-md border hover:bg-gray-100">Yenile</button>
          <button
            onClick={bulkDelete}
            disabled={selectedArtists.size === 0}
            className={`px-3 py-1 rounded-md border ${
              selectedArtists.size === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-100 bg-red-50 text-red-700"
            }`}
          >
            Seçilenleri Sil ({selectedArtists.size})
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-lg shadow p-3 h-full dark:bg-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                <span>Tümünü seç</span>
              </label>
              <div className="text-sm text-gray-500 dark:text-gray-400">{artists.length} artist</div>
            </div>

            {/* Search input */}
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ara: artist, parça, albüm, id..."
                  className="w-full rounded px-2 py-1 text-sm bg-white text-black dark:bg-gray-800 dark:text-white border"
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
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {loading && <div className="text-sm text-gray-500">Yükleniyor...</div>}
              {!loading && filteredArtists.length === 0 && <div className="text-sm text-gray-500">Kayıtlı artist yok.</div>}

              {filteredArtists.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => setExpandedArtist(artist.id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    expandedArtist === artist.id ? "bg-gray-100 dark:bg-gray-800" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedArtists.has(artist.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleArtistSelection(artist.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className="text-sm font-medium">{artist.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{artist.songs.length} şarkı</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteArtist(artist.id);
                    }}
                    className="text-xs px-2 py-1 border rounded text-red-600"
                    disabled={busyIds.has(artist.id)}
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <div className="bg-white rounded-lg shadow p-4 min-h-[40vh] dark:bg-gray-900 dark:text-gray-100">
            {expandedArtist ? (
              (() => {
                const artist = getArtistById(expandedArtist);
                if (!artist) return <div className="text-sm text-gray-500">Artist bulunamadı.</div>;
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{artist.name}</h2>
                        <div className="text-sm text-gray-500">{artist.songs.length} şarkı</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExpandedArtist(null)} className="px-2 py-1 border rounded text-sm">Kapat</button>
                        <button onClick={() => deleteArtist(artist.id)} className="px-2 py-1 border rounded text-red-600" disabled={busyIds.has(artist.id)}>Tümünü Sil</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {artist.songs.map((track, idx) => (
                        <WhitelistTrackCard
                          key={getTrackId(track) ?? `${artist.id}-fallback-${idx}`}
                          track={track}
                          artistId={artist.id}
                          index={idx}
                          onDelete={deleteTrack}
                          onFetchStreams={fetchStreamDataForSong}
                          busyIds={busyIds}
                          getTrackId={getTrackId}
                        />
                      ))}
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="text-sm text-gray-500">Soldan bir artist seçin; şarkılar burada görüntülenecek.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

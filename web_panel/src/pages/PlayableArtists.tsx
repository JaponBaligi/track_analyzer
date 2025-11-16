import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { getPlayableTracksByOwner } from "../api/spotify";
import type { Track } from "../types";
import { useNavigate } from "react-router-dom";
import { getTrackIdFlexible, getTrackNameFlexible, getArtistNamesFlexible } from "../utils/trackHelpers";
import { normalizeTrack, getPrimaryArtistName } from "../utils/trackNormalization";
import { performLookup } from "../utils/lookup";
import { getStreamErrorMessage } from "../utils/streamErrors";
import { SongCard } from "../components/playable/SongCard";

type Song = Track & { streamData?: any; [k: string]: any };

type Artist = {
  id: string;
  name: string;
  songs: Song[];
};

export default function PlayableArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [lookupBusyIds, setLookupBusyIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bulkLookupRunning, setBulkLookupRunning] = useState(false);
  const [bulkLookupProgress, setBulkLookupProgress] = useState<{ current: number; total: number; skipped: number; errors: Array<any> }>({ current: 0, total: 0, skipped: 0, errors: [] });
  const navigate = useNavigate();
  const confirmDialog = (message: string) => window.confirm(message);

  // Use utility functions
  const getTrackId = getTrackIdFlexible;
  const getTrackName = getTrackNameFlexible;
  const getArtistNames = getArtistNamesFlexible;

  useEffect(() => {
    loadArtistsFromPlayableResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadArtistsFromPlayableResult() {
    setLoading(true);
    try {
      const rows = await getPlayableTracksByOwner();
      const grouped: Record<string, Song[]> = {};
      
      rows.forEach((r: any) => {
        const normalized = normalizeTrack(r) as Song;
        const artistName = getPrimaryArtistName(normalized);

        if (!grouped[artistName]) grouped[artistName] = [];
        grouped[artistName].push(normalized);
      });

      const list: Artist[] = Object.keys(grouped).map((name) => ({
        id: encodeURIComponent(name),
        name,
        songs: grouped[name],
      }));
      setArtists(list);

      if (!expandedArtist && list.length > 0) {
        setExpandedArtist(list[0].id);
      }
    } catch (err: any) {
      console.error(err);
      alert("Playable sonuçları alınamadı: " + (err?.message ?? String(err)));
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

  async function deleteSong(artistId: string, songOrTrackId: Song | string) {
    const trackId = typeof songOrTrackId === "string" ? songOrTrackId : getTrackId(songOrTrackId);
    if (!trackId) {
      alert("Silinecek track id bulunamadı.");
      return;
    }
    if (!confirmDialog("Bu şarkıyı silmek istediğinize emin misiniz?")) return;
    try {
      setBusyIds((s) => new Set([...s, trackId]));
      await axiosInstance.delete(`/tracks/${trackId}`);
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistId ? { ...a, songs: a.songs.filter((s) => getTrackId(s) !== trackId) } : a
        )
      );
    } catch (err: any) {
      console.error(err);
      alert("Şarkı silinemedi: " + (err?.message ?? String(err)));
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

    if (!confirmDialog(`"${artist.name}" artistine ait tüm şarkılar silinecek. Emin misiniz?`)) return;

    try {
      setBusyIds((s) => new Set([...s, artistId]));

      await axiosInstance.request({
        url: "playable/tracks/delete_artist",
        method: "DELETE",
        params: { artist: artist.name },
      });

      setArtists((prev) => prev.filter((a) => a.id !== artistId));
    } catch (err) {
      console.error("Artist silinirken hata:", err);
    } finally {
      setBusyIds((s) => {
        const newSet = new Set(s);
        newSet.delete(artistId);
        return newSet;
      });
    }
  }

  async function bulkDeleteSelected(trackIds: string[]) {
    if (!trackIds.length) return;
    if (!confirmDialog(`${trackIds.length} şarkı silinecek. Emin misiniz?`)) return;

    try {
      setBusyIds((s) => new Set([...s, ...trackIds]));
      await axiosInstance.request({
        url: "playable/tracks/delete_bulk",
        method: "DELETE",
        data: { track_ids: trackIds },
      });
      setArtists((prev) =>
        prev.map((a) => ({
          ...a,
          songs: a.songs.filter((s) => !trackIds.includes(getTrackId(s)!)),
        }))
      );
    } catch (err) {
      console.error("Toplu silme hatası:", err);
    } finally {
      setBusyIds((s) => {
        const newSet = new Set(s);
        trackIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  }

  // Helper to update a song in an artist's songs array
  const updateSongInArtist = (artistId: string, trackId: string, updater: (song: Song) => Song) => {
    setArtists((prev) =>
      prev.map((a) =>
        a.id === artistId
          ? {
              ...a,
              songs: a.songs.map((s) => (getTrackId(s) === trackId ? updater(s) : s)),
            }
          : a
      )
    );
  };

  async function fetchStreamDataForSong(artistId: string, song: Song) {
    const trackId = getTrackId(song);
    if (!trackId) {
      alert("Track id bulunamadı.");
      return;
    }
    try {
      setBusyIds((s) => new Set([...s, trackId]));

      // Try to get existing stream data first
      try {
        const resGet = await axiosInstance.get(`/streams/${trackId}`);
        if (resGet?.data && !resGet.data.error) {
          updateSongInArtist(artistId, trackId, (s) => ({ ...s, streamData: resGet.data }));
          return;
        }
      } catch {
        // ignore and fallback to update
      }

      // Update and fetch stream data
      await axiosInstance.post("/stream/update", null, { params: { track_id: trackId } });
      const res = await axiosInstance.get(`/streams/${trackId}`);
      updateSongInArtist(artistId, trackId, (s) => ({ ...s, streamData: res.data }));
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

  // --- Lookup ---
  async function lookupLicensorForSong(artistId: string, song: Song) {
    const trackId = getTrackId(song);
    if (!trackId) return alert("Track id bulunamadı.");

    setLookupBusyIds((s) => new Set([...s, trackId]));

    try {
      const payload = {
        track_id: trackId,
        licensor_name: song.licensor_name ?? "",
        release_date: song.release_date ?? "",
      };

      const resPost = await axiosInstance.post("/lookup/save", payload);
      const updatedTrack = resPost.data.track;

      updateSongInArtist(artistId, trackId, (s) => ({ ...s, ...updatedTrack, lookupError: undefined }));
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? "Lookup başarısız";
      updateSongInArtist(artistId, trackId, (s) => ({ ...s, lookupError: msg }));
    } finally {
      setLookupBusyIds((s) => {
        const next = new Set(s);
        next.delete(trackId);
        return next;
      });
    }
  }


  const getArtistById = (id: string | null) => artists.find((a) => a.id === id) || null;

  // --- Bulk lookup implementation ---
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Process a single song for bulk lookup
  const processSongForBulkLookup = async (artistId: string, song: Song, index: number): Promise<void> => {
    const tid = getTrackId(song);
    
    setBulkLookupProgress((p) => ({ ...p, current: index }));

    if (!tid) {
      setBulkLookupProgress((p) => ({ ...p, skipped: p.skipped + 1, current: p.current + 1 }));
      return;
    }

    // Skip if already has lookup data
    if (song?.licensor_name || song?.release_date) {
      setBulkLookupProgress((p) => ({ ...p, skipped: p.skipped + 1, current: p.current + 1 }));
      return;
    }

    setLookupBusyIds((s) => new Set([...s, tid]));

    try {
      const lookupResult = await performLookup(tid);
      if (lookupResult.error) {
        throw new Error(lookupResult.error);
      }

      const payload = {
        track_id: tid,
        licensor_name: lookupResult.licensor_name ?? "",
        release_date: lookupResult.release_date ?? "",
      };
      const resSave = await axiosInstance.post("/lookup/save", payload);

      if (resSave?.data?.track) {
        const updatedTrack = resSave.data.track;
        updateSongInArtist(artistId, tid, (s) => ({ ...s, ...updatedTrack, lookupError: undefined }));
      }
    } catch (e: any) {
      setBulkLookupProgress((prev) => ({
        ...prev,
        errors: [...prev.errors, { id: tid, error: e?.message || (e?.response?.data || e) }],
      }));
    } finally {
      setLookupBusyIds((s) => {
        const next = new Set(s);
        next.delete(tid);
        return next;
      });
      setBulkLookupProgress((p) => ({ ...p, current: p.current + 1 }));
      await wait(3000);
    }
  };

  const handleBulkLookup = async () => {
    if (bulkLookupRunning) return;
    const all = artists.flatMap((a) => a.songs.map((s) => ({ artistId: a.id, song: s })));
    setBulkLookupRunning(true);
    setBulkLookupProgress({ current: 0, total: all.length, skipped: 0, errors: [] });

    for (let i = 0; i < all.length; i++) {
      await processSongForBulkLookup(all[i].artistId, all[i].song, i);
    }

    setBulkLookupRunning(false);
  };

  // --- Search/filter logic ---
  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artists;

    return artists.filter((a) => {
      if (a.name.toLowerCase().includes(q)) return true;
      // search within songs: title, album, artist names, track id
      return a.songs.some((s) => {
        const title = (getTrackName(s) ?? "").toLowerCase();
        const album = (s.album_name ?? s.album ?? "").toLowerCase();
        const artistsField = getArtistNames(s).join(", ").toLowerCase();
        const tid = (getTrackId(s) ?? "").toLowerCase();
        return title.includes(q) || album.includes(q) || artistsField.includes(q) || tid.includes(q);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artists, searchQuery]);

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
          <button onClick={() => navigate("/db")} className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black">
            Track Database
          </button>
          <button onClick={() => navigate("/flagged-artists")} className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black">
            Flagged Artists
          </button>
          <h1 className="text-2xl font-semibold">Playable Artists</h1>
          <button onClick={() => navigate("/whitelist")} className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black">
            Whitelist
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkLookup}
            disabled={bulkLookupRunning || loading}
            className="px-3 py-1 rounded-md border bg-emerald-50 text-emerald-700"
          >
            {bulkLookupRunning ? `Toplu Sorgu (${bulkLookupProgress.current}/${bulkLookupProgress.total})` : "Toplu Sorgu"}
          </button>
          <button onClick={loadArtistsFromPlayableResult} className="px-3 py-1 rounded-md border hover:bg-gray-100">Yenile</button>
          <button
            onClick={() => bulkDeleteSelected(
              Array.from(selectedArtists) // seçilen artistleri string[] olarak veriyoruz
                .map((artistId) => {
                  const artist = artists.find((a) => a.id === artistId);
                  return artist ? artist.songs.map((s) => getTrackId(s)!).filter(Boolean) : [];
                })
                .flat()
            )}
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

      {bulkLookupRunning && (
        <div className="mb-3 text-sm text-gray-600">Atlanan: {bulkLookupProgress.skipped} • Hatalar: {bulkLookupProgress.errors.length}</div>
      )}

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
                      {artist.songs.map((song, idx) => (
                        <SongCard
                          key={getTrackId(song) ?? `${artist.id}-fallback-${idx}`}
                          song={song}
                          artistId={artist.id}
                          index={idx}
                          onLookup={lookupLicensorForSong}
                          onDelete={deleteSong}
                          onFetchStreams={fetchStreamDataForSong}
                          lookupBusyIds={lookupBusyIds}
                          busyIds={busyIds}
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

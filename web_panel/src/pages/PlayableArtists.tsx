import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { getPlayableTracksByOwner } from "../api/spotify";
import type { Track } from "../types";
import StreamHistoryChart from "../components/StreamHistoryChart";
import { useNavigate } from "react-router-dom";

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

  // helpers
  function getTrackId(song: any): string | undefined {
    return song?.track_id ?? song?.id ?? song?.trackId ?? song?.tid ?? undefined;
  }
  function getTrackName(song: any): string | undefined {
    return (
      song?.track_name ??
      song?.name ??
      song?.title ??
      song?.trackName ??
      (song?.track && (song.track.name ?? song.track.title)) ??
      undefined
    );
  }
  function getArtistNames(song: any): string[] {
    if (!song) return [];
    if (Array.isArray(song.artist_names)) return song.artist_names;
    if (Array.isArray(song.artists)) return song.artists;
    if (typeof song.artist_names === "string") return [song.artist_names];
    if (typeof song.artist === "string") return [song.artist];
    if (typeof song.artists === "string") return [song.artists];
    if (song.artist && Array.isArray(song.artist)) return song.artist;
    if (song.artist && typeof song.artist === "object" && song.artist.name) return [song.artist.name];
    return [];
  }

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
        const normalized: any = { ...(r as any) };

        if (!normalized.track_id) {
          normalized.track_id = normalized.id ?? normalized.trackId ?? normalized.tid ?? undefined;
        }
        if (!normalized.track_name) {
          normalized.track_name =
            normalized.name ??
            normalized.title ??
            normalized.trackName ??
            (normalized.track && (normalized.track.name ?? normalized.track.title)) ??
            undefined;
        }
        if (!normalized.artist_names) {
          if (Array.isArray(normalized.artists)) normalized.artist_names = normalized.artists;
          else if (Array.isArray(normalized.artist)) normalized.artist_names = normalized.artist;
          else if (typeof normalized.artist_names === "string") normalized.artist_names = [normalized.artist_names];
          else if (typeof normalized.artists === "string") normalized.artist_names = [normalized.artists];
          else if (typeof normalized.artist === "string") normalized.artist_names = [normalized.artist];
          else normalized.artist_names = [];
        }
        if (!normalized.image_url) {
          normalized.image_url = normalized.image ?? normalized.thumbnail ?? normalized.cover ?? undefined;
        }

        const artistName =
          normalized.artist_names?.[0] ??
          normalized.artist ??
          normalized.artists?.[0] ??
          "Unknown Artist";

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

  async function fetchStreamDataForSong(artistId: string, song: Song) {
    const trackId = getTrackId(song);
    if (!trackId) {
      alert("Track id bulunamadı.");
      return;
    }
    try {
      setBusyIds((s) => new Set([...s, trackId]));

      try {
        const resGet = await axiosInstance.get(`/streams/${trackId}`);
        if (resGet?.data && !resGet.data.error) {
          setArtists((prev) =>
            prev.map((a) =>
              a.id === artistId
                ? {
                    ...a,
                    songs: a.songs.map((t) =>
                      getTrackId(t) === trackId ? { ...t, streamData: resGet.data } : t
                    ),
                  }
                : a
            )
          );
          return;
        }
      } catch {
        // ignore and fallback
      }

      await axiosInstance.post("/stream/update", null, { params: { track_id: trackId } });
      const res = await axiosInstance.get(`/streams/${trackId}`);
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistId
            ? {
                ...a,
                songs: a.songs.map((t) =>
                  getTrackId(t) === trackId ? { ...t, streamData: res.data } : t
                ),
              }
            : a
        )
      );
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

  // --- Lookup (no axios) ---
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

      // UI'yi backend’den gelen veriyle güncelle
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistId
            ? {
                ...a,
                songs: a.songs.map((s) =>
                  getTrackId(s) === trackId
                    ? { ...s, ...updatedTrack, lookupError: undefined }
                    : s
                ),
              }
            : a
        )
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? "Lookup başarısız";
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistId
            ? { ...a, songs: a.songs.map((s) => (getTrackId(s) === trackId ? { ...s, lookupError: msg } : s)) }
            : a
        )
      );
    } finally {
      setLookupBusyIds((s) => {
        const next = new Set(s);
        next.delete(trackId);
        return next;
      });
    }
  }

  function msToMinSec(ms?: number) {
    if (!ms) return "—";
    const totalSec = Math.round((ms || 0) / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const getArtistById = (id: string | null) => artists.find((a) => a.id === id) || null;

  // --- Bulk lookup implementation ---
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleBulkLookup = async () => {
    if (bulkLookupRunning) return;
    // flatten artist-song pairs
    const all = artists.flatMap((a) => a.songs.map((s) => ({ artistId: a.id, song: s })));
    setBulkLookupRunning(true);
    setBulkLookupProgress({ current: 0, total: all.length, skipped: 0, errors: [] });

    for (let i = 0; i < all.length; i++) {
      const { artistId, song } = all[i];
      const tid = getTrackId(song);

      // update progress current start
      setBulkLookupProgress((p) => ({ ...p, current: i }));

      if (!tid) {
        setBulkLookupProgress((p) => ({ ...p, skipped: p.skipped + 1, current: p.current + 1 }));
        continue;
      }

      // skip if already has lookup data
      if (song?.licensor_name || song?.release_date) {
        setBulkLookupProgress((p) => ({ ...p, skipped: p.skipped + 1, current: p.current + 1 }));
        continue;
      }

      setLookupBusyIds((s) => new Set([...s, tid]));

      try {
        // external lookup if available
        let data: any = null;
        const win: any = window as any;
        if (win?.__LOOKUP_SERVICE && typeof win.__LOOKUP_SERVICE.getLicensor === "function") {
          data = await win.__LOOKUP_SERVICE.getLicensor(tid);
        } else {
          const base = process.env.REACT_APP_LOOKUP_URL || "";
          const url = base
            ? `${base.replace(/\/$/, "")}/get_licensor?track_id=${encodeURIComponent(tid)}`
            : `/get_licensor?track_id=${encodeURIComponent(tid)}`;

          const res = await fetch(url, { method: "GET", credentials: "include" });
          if (!res.ok) throw new Error(`Lookup failed: ${res.status}`);
          data = await res.json();
        }

        const payload = { track_id: tid, licensor_name: data?.licensor_name ?? "", release_date: data?.release_date ?? "" };
        const resSave = await axiosInstance.post("/lookup/save", payload);

        if (resSave?.data?.track) {
          const updatedTrack = resSave.data.track;
          setArtists((prev) =>
            prev.map((a) =>
              a.id === artistId
                ? { ...a, songs: a.songs.map((s) => (getTrackId(s) === tid ? { ...s, ...updatedTrack, lookupError: undefined } : s)) }
                : a
            )
          );
        }
      } catch (e: any) {
        setBulkLookupProgress((prev) => ({ ...prev, errors: [...prev.errors, { id: tid, error: e?.message || (e?.response?.data || e) }] }));
      } finally {
        setLookupBusyIds((s) => {
          const next = new Set(s);
          next.delete(tid);
          return next;
        });
        setBulkLookupProgress((p) => ({ ...p, current: p.current + 1 }));
        await wait(3000);
      }
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
                      {artist.songs.map((song, idx) => {
                        const tid = getTrackId(song) ?? `${artist.id}-fallback-${idx}`;
                        const tname = getTrackName(song) ?? "(isim yok)";
                        const anames = getArtistNames(song).join(", ");
                        return (
                          <div key={tid} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {song.image_url ? (
                                  <img src={song.image_url} alt={tname} className="w-20 h-20 rounded-md object-cover" />
                                ) : (
                                  <div className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center text-sm text-gray-500 dark:text-white">No Image</div>
                                )}
                                <div>
                                  <div className="font-semibold dark:text-white">{tname}</div>
                                  <div className="text-sm text-gray-500 dark:text-white">{anames}</div>
                                  <div className="text-xs text-gray-600 mt-1 dark:text-white">
                                    Albüm: {song.album_name ?? song.album ?? "—"} · Süre: {msToMinSec(song.duration_ms)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-sm dark:text-white">
                                <div className="mb-1 dark:text-white">ID: {getTrackId(song) ?? "—"}</div>
                                <div className="text-xs text-gray-600 dark:text-white">Pop: {song.popularity ?? "—"}</div>
                                <div className="text-xs text-gray-600 dark:text-white">Playable: {song.is_playable ? "Evet" : "Hayır"}</div>
                                <div className="mt-2 flex flex-col gap-2 dark:text-white">
                                  <a href={song.spotify_url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:text-white">
                                    Spotify'ta Aç
                                  </a>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => lookupLicensorForSong(artist.id, song)}
                                      className="text-xs px-2 py-1 border rounded bg-green-50 text-green-700"
                                      disabled={lookupBusyIds.has(getTrackId(song) ?? "")}
                                    >
                                      {lookupBusyIds.has(getTrackId(song) ?? "") ? "Aranıyor..." : "Lookup"}
                                    </button>
                                    <button onClick={() => deleteSong(artist.id, song)} className="text-xs px-2 py-1 border rounded text-red-600 dark:text-white">
                                      Şarkıyı Sil
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 text-sm text-gray-700 dark:text-white space-y-1">
                              {song.isrc && <div>ISRC: {song.isrc}</div>}
                              {song.upc && <div>UPC: {song.upc}</div>}

                              {/* Lookup results or errors */}
                              {song.lookupError && <div className="text-sm text-red-500">{song.lookupError}</div>}
                              {(song.licensor_name || song.release_date) && (
                                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {song.licensor_name && (
                                    <div>
                                      <span className="font-medium">Distributor:</span> {song.licensor_name}
                                    </div>
                                  )}
                                  {song.release_date && (
                                    <div>
                                      <span className="font-medium">Released:</span> {song.release_date}
                                    </div>
                                  )}
                                </div>
                              )}

                              {song.streamData ? (
                                <div className="mt-3">
                                  {song.streamData.historicalData && song.streamData.historicalData.length > 0 ? (
                                    <StreamHistoryChart
                                      data={[...song.streamData.historicalData].sort(
                                        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                                      )}
                                    />
                                  ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Stream verisi mevcut ama tarihsel veri bulunamadı.</div>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <button
                                    onClick={() => fetchStreamDataForSong(artist.id, song)}
                                    disabled={busyIds.has(getTrackId(song) ?? "")}
                                    className="px-3 py-1 rounded border text-sm"
                                  >
                                    {busyIds.has(getTrackId(song) ?? "") ? "Bekleniyor..." : "Stream Verisi Getir"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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

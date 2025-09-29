// src/pages/Database.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import axios from "../api/axiosInstance";
import axiosInstance from "../api/axiosInstance";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent } from "../components/ui/card";
import { formatNumber } from "../utils/format";

// --- Types ---
interface DbTrack {
  id?: string;
  track_id?: string;
  name: string;
  artist?: string;
  artists?: string[];
  artist_names?: string[];
  album?: string;
  album_name?: string;
  image_url?: string | null;
  album_image?: string | null;
  duration_ms?: number;
  popularity?: number;
  spotify_url?: string;
  track_url?: string;
  playlist_id?: string;
  isrc?: string;
  upc?: string;
  licensor_name?: string; // lookup sonucu için
  release_date?: string; // lookup sonucu için
}

type StreamPoint = { date: string; streams: number };

interface StreamState {
  loading: boolean;
  error?: string;
  data?: StreamPoint[];
  dailyAvg?: number | null;
}

// --- Helpers ---
const getTrackId = (t: DbTrack | any) => (t?.track_id || t?.id || "").toString();
const getTrackImage = (t: DbTrack) => t.image_url || t.album_image || undefined;
const getTrackAlbum = (t: DbTrack) => t.album || t.album_name || undefined;
const getTrackArtist = (t: DbTrack) =>
  t.artist || (t.artists?.length ? t.artists.join(", ") : t.artist_names?.length ? t.artist_names.join(", ") : "Bilinmiyor");

const toDaily = (series: StreamPoint[]): number[] => {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const diff = series[i].streams - series[i - 1].streams;
    if (diff >= 0) out.push(diff);
  }
  return out;
};

const average = (nums: number[]): number | null => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null);

// --- Motion Variants ---
const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

// --- Components ---
interface TrackListItemProps {
  track: DbTrack;
  selected: boolean;
  checked: boolean;
  onSelect: (id: string) => void;
  onCheck: (id: string, checked: boolean) => void;
}

const TrackListItem: React.FC<TrackListItemProps> = ({ track, selected, checked, onSelect, onCheck }) => {
  const tid = getTrackId(track);
  const img = getTrackImage(track);

  return (
    <motion.div variants={listItem} className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheck(tid, e.target.checked)}
        className="mx-2 transform scale-150"
      />
      <button
        onClick={() => onSelect(tid)}
        className={`w-full text-left px-2 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors ${
          selected ? "bg-gray-200 dark:bg-gray-700" : "bg-gray-50 dark:bg-gray-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {img ? (
            <img src={img} alt={track.name} className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600" />
          )}
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{track.name}</div>
            <div className="truncate text-xs text-gray-600 dark:text-gray-400">
              {getTrackArtist(track) + (getTrackAlbum(track) ? ` • ${getTrackAlbum(track)}` : "")}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

interface TrackDetailCardProps {
  track: DbTrack;
  streamState: StreamState | undefined;
  series: StreamPoint[];
  fetchStreams: (id: string, force?: boolean) => void;
  handleDelete: (id: string) => void;
  onLookupSaved?: (updatedTrack: any) => void; // <-- new callback to update parent DB state
}

const TrackDetailCard: React.FC<TrackDetailCardProps> = ({ track, streamState, series, fetchStreams, handleDelete, onLookupSaved }) => {
  const selectedTrackId = getTrackId(track);
  const rangeAvg = average(toDaily(series));
  const rangeDelta = series.length > 1 ? series[series.length - 1].streams - series[0].streams : null;

  // --- Lookup state ---
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [licensorInfo, setLicensorInfo] = useState<{ licensor_name?: string; release_date?: string } | null>(null);

  // Keep the optional external lookup (same as before) — but the main DB save will not depend on this.
  const lookupLicensor = async () => {
    if (!selectedTrackId) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      let data: any = null;
      const win: any = window as any;

      if (win?.__LOOKUP_SERVICE && typeof win.__LOOKUP_SERVICE.getLicensor === "function") {
        data = await win.__LOOKUP_SERVICE.getLicensor(selectedTrackId);
      } else {
        const base = process.env.REACT_APP_LOOKUP_URL || "";
        const url = base
          ? `${base.replace(/\/$/, "")}/get_licensor?track_id=${encodeURIComponent(selectedTrackId)}`
          : `/get_licensor?track_id=${encodeURIComponent(selectedTrackId)}`;

        const res = await fetch(url, { method: "GET", credentials: "include" });
        if (!res.ok) throw new Error(`Lookup failed: ${res.status}`);
        data = await res.json();
      }

      if (data?.error) {
        setLookupError(data.error || "Lookup error");
      } else {
        setLicensorInfo({ licensor_name: data.licensor_name, release_date: data.release_date });
      }
    } catch (e: any) {
      setLookupError(e?.message || "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  // Save to DB — this mirrors PlayableArtists behavior: post to /lookup/save and use returned track to update UI
  const saveLookupToDB = async () => {
    if (!selectedTrackId) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const payload = {
        track_id: selectedTrackId,
        licensor_name: licensorInfo?.licensor_name ?? "",
        release_date: licensorInfo?.release_date ?? "",
      };

      const res = await axiosInstance.post("/lookup/save", payload);

      if (res?.data?.track) {
        const updatedTrack = res.data.track;
        // Update local licensor info with returned data if present
        setLicensorInfo({ licensor_name: updatedTrack.licensor_name ?? licensorInfo?.licensor_name, release_date: updatedTrack.release_date ?? licensorInfo?.release_date });

        // Notify parent to update its tracks state (so DB list shows the new data)
        if (typeof onLookupSaved === "function") onLookupSaved(updatedTrack);

        // show a small confirmation (keeps parity with previous UX)
        alert("Lookup bilgisi DB'ye kaydedildi.");
      } else if (res?.data?.success) {
        alert("Lookup isteği işlendi.");
      } else {
        setLookupError("DB kaydı başarısız oldu");
      }
    } catch (e: any) {
      console.error(e);
      setLookupError(e?.response?.data?.detail || e?.message || "DB kaydı sırasında hata");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between flex-wrap items-center gap-4 p-4 rounded-lg shadow-md bg-gray-50 dark:bg-gray-700">
          {/* Track Info */}
          <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap gap-4">
            <span>
              Seçili Parça ID: <span className="font-mono">{selectedTrackId}</span>
            </span>
            {track.isrc && (
              <span>
                ISRC: <span className="font-mono">{track.isrc}</span>
              </span>
            )}
            {track.upc && (
              <span>
                UPC: <span className="font-mono">{track.upc}</span>
              </span>
            )}
          </div>

          {/* Spotify URI */}
          {track?.spotify_url && (
            <div className="text-sm text-gray-900 dark:text-gray-100">
              URI: {" "}
              <a
                href={`spotify:track:${selectedTrackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors duration-200"
              >
                {`spotify:track:${selectedTrackId}`}
              </a>
            </div>
          )}

          {/* Fetch Streams Button */}
          {(!streamState?.data || streamState?.error) && (
            <div>
              <button
                onClick={() => fetchStreams(selectedTrackId, true)}
                disabled={streamState?.loading}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {streamState?.loading ? "Yükleniyor…" : "Stream Verisi Getir"}
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border rounded-lg p-3 text-center bg-gray-100 dark:bg-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-300">Tarihler Arası Ortalama Stream</div>
            <div className="text-lg font-semibold">{rangeAvg != null ? formatNumber(rangeAvg) : "—"}</div>
          </div>
          <div className="border rounded-lg p-3 text-center bg-gray-100 dark:bg-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-300">Aralık Değişim (Son - İlk)</div>
            <div className="text-lg font-semibold">{rangeDelta != null ? formatNumber(rangeDelta) : "—"}</div>
          </div>
          <div className="border rounded-lg p-3 text-center bg-gray-100 dark:bg-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-300">Backend Günlük Ortalama</div>
            <div className="text-lg font-semibold">{streamState?.dailyAvg != null ? formatNumber(streamState.dailyAvg) : "—"}</div>
          </div>
        </div>

        <div className="w-full h-80">
          {streamState?.loading && <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">Yükleniyor…</div>}
          {streamState?.error && <div className="h-full flex items-center justify-center text-red-600 dark:text-red-400 text-sm">{streamState.error}</div>}
          {series.length > 1 && (
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis tickFormatter={formatNumber} stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value: any) => formatNumber(value as number)}
                  labelFormatter={(label) => `Tarih: ${label}`}
                  contentStyle={{
                    backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                    border: "1px solid",
                    borderColor: document.documentElement.classList.contains("dark") ? "#374151" : "#d1d5db",
                    color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
                  }}
                  labelStyle={{
                    color: document.documentElement.classList.contains("dark") ? "#f9fafb" : "#111827",
                  }}
                />
                <Line type="monotone" dataKey="streams" dot stroke="#3B82F6" />
              </LineChart>
            </ResponsiveContainer>

          )}
          {streamState?.data && series.length <= 1 && !streamState?.loading && (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">Grafik için yeterli veri yok.</div>
          )}
        </div>
      <div className="mt-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 shadow-sm space-y-2">
  <div className="flex items-center gap-3">
    {getTrackImage(track) && <img src={getTrackImage(track)} alt="Cover" className="w-16 h-16 rounded object-cover" />}
    <div className="space-y-1">
      <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">{track.name}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{track.artist_names || "Bilinmiyor"} • {getTrackAlbum(track) || "Single"}</div>
    </div>
  </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-700 dark:text-gray-300 mt-2">
            <div>
              <span className="font-medium">Süre:</span>{" "}
              {track.duration_ms
                ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}`
                : "—"}
            </div>
            <div>
              <span className="font-medium">Popülarite:</span> {track.popularity ?? "—"}
            </div>
            <div>
              <a
                href={`https://open.spotify.com/track/${getTrackId(track)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Spotify Link
              </a>
            </div>
            {track.playlist_id && (
              <div>
                <a
                  href={`https://open.spotify.com/playlist/${track.playlist_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Playlist Link
                </a>
              </div>
            )}

            {/* Lookup + Delete buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  // Attempt external lookup first (non-blocking), then always call save to DB.
                  // External lookup will populate licensorInfo which saveLookupToDB will send if present.
                  await lookupLicensor().catch(() => undefined);
                  await saveLookupToDB();
                }}
                disabled={lookupLoading}
                className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {lookupLoading ? "Aranıyor…" : "Lookup"}
              </button>

            </div>

            <div className="sm:col-span-2">
              <button
                onClick={() => track.id && handleDelete(track.id)}
                className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>

          {/* Show lookup results / errors */}
          {lookupError && <div className="text-sm text-red-500 mt-2">{lookupError}</div>}
          {(licensorInfo?.licensor_name || licensorInfo?.release_date) && (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {licensorInfo?.licensor_name && (
                <div>
                  <span className="font-medium">Distributor:</span> {licensorInfo.licensor_name}
                </div>
              )}
              {licensorInfo?.release_date && (
                <div>
                  <span className="font-medium">Released:</span> {licensorInfo.release_date}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Page ---
export default function Database() {
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [streams, setStreams] = useState<Record<string, StreamState>>({});
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bulkLookupRunning, setBulkLookupRunning] = useState(false);
  const [bulkLookupProgress, setBulkLookupProgress] = useState<{ current: number; total: number; skipped: number; errors: Array<any> }>({ current: 0, total: 0, skipped: 0, errors: [] });
  const navigate = useNavigate();

  // Fetch tracks
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(undefined);
        const { data } = await axios.get("/db/unplayable", { params: { limit: 1000 } });
        if (!mounted) return;
        const items: DbTrack[] = Array.isArray(data) ? data : data?.items ?? [];
        setTracks(items);
      } catch (e: any) {
        setError(e?.message || "Liste alınamadı");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto select first track when tracks change (same as before)
  useEffect(() => {
    if (!selectedTrackId && tracks.length) {
      setSelectedTrackId(getTrackId(tracks[0]));
    }
  }, [tracks, selectedTrackId]);

  // When search/filter changes, ensure selection stays valid; if not, select first filtered.
  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const artist = (getTrackArtist(t) || "").toLowerCase();
      const album = (getTrackAlbum(t) || "").toLowerCase();
      const tid = getTrackId(t).toLowerCase();
      return name.includes(q) || artist.includes(q) || album.includes(q) || tid.includes(q);
    });
  }, [tracks, searchQuery]);

  useEffect(() => {
    if (!filteredTracks.length) {
      // If filter yields nothing, keep selection but don't change it. (Optional: clear selection)
      return;
    }
    if (!selectedTrackId || !filteredTracks.some((t) => getTrackId(t) === selectedTrackId)) {
      setSelectedTrackId(getTrackId(filteredTracks[0]));
    }
  }, [filteredTracks, selectedTrackId]);

  // Fetch streams
  const fetchStreams = async (trackId: string, forceUpdateAndSave = false) => {
    if (!forceUpdateAndSave && streams[trackId]?.data) return;
    setStreams((s) => ({ ...s, [trackId]: { ...(s[trackId] || {}), loading: true, error: undefined } }));

    try {
      if (forceUpdateAndSave) await axiosInstance.post("/stream/update", null, { params: { track_id: trackId } });
      const res = await axiosInstance.get(`/streams/${trackId}`);
      let series: StreamPoint[] | undefined;
      let dailyAvg: number | null | undefined;

      if (Array.isArray(res.data?.historic)) {
        series = res.data.historic;
        dailyAvg = res.data.daily_average ?? undefined;
      } else if (Array.isArray(res.data?.historicalData)) {
        series = res.data.historicalData;
      }

      if (!series?.length) throw new Error("Stream verisi bulunamadı.");

      setStreams((s) => ({ ...s, [trackId]: { loading: false, data: series, dailyAvg } }));
    } catch (e: any) {
      setStreams((s) => ({ ...s, [trackId]: { loading: false, error: e?.message || "Stream verisi alınamadı" } }));
    }
  };

  // Delete track
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/tracks/${id}`);
      setTracks((prev) => prev.filter((t) => t.id !== id));
      setSelectedForDelete((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err: any) {
      console.error("[ERROR] Silme hatası:", err.response?.data || err.message);
      setError(err.response?.data?.detail || err.message);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedForDelete);
    if (!ids.length) return;
    try {
      await axios.post("/tracks/delete_artist", { ids });
      setTracks((prev) => prev.filter((t) => !selectedForDelete.has(getTrackId(t))));
      setSelectedForDelete(new Set());
    } catch (err: any) {
      console.error("[ERROR] Toplu silme hatası:", err.response?.data || err.message);
      const errorDetail = err.response?.data?.detail;
      setError(Array.isArray(errorDetail) ? errorDetail.map((d: any) => d.msg).join(", ") : errorDetail || err.message);
    }
  };

  const selectedTrack = tracks.find((t) => getTrackId(t) === selectedTrackId);
  const selectedSeries = useMemo(() => {
    if (!selectedTrackId) return [];
    const st = streams[selectedTrackId];
    if (!st?.data) return [];
    let filtered = st.data;
    if (startDate) filtered = filtered.filter((p) => p.date >= startDate);
    if (endDate) filtered = filtered.filter((p) => p.date <= endDate);
    return [...filtered].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [selectedTrackId, streams, startDate, endDate]);

  // Handler passed to child so it can update the parent tracks array after successful DB save
  const handleLookupSaved = (updated: any) => {
    if (!updated) return;
    const updatedId = getTrackId(updated);
    setTracks((prev) => prev.map((t) => (getTrackId(t) === updatedId ? { ...t, ...updated } : t)));
  };

  // --- Bulk lookup implementation ---
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleBulkLookup = async () => {
    if (bulkLookupRunning) return;
    setBulkLookupRunning(true);
    setBulkLookupProgress({ current: 0, total: tracks.length, skipped: 0, errors: [] });

    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      const tid = getTrackId(t);

      // Skip if already looked up
      if (t?.licensor_name || t?.release_date) {
        setBulkLookupProgress((prev) => ({ ...prev, current: prev.current + 1, skipped: prev.skipped + 1 }));
        await wait(3000);
        continue;
      }

      try {
        // external lookup
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
          setTracks((prev) => prev.map((p) => (getTrackId(p) === getTrackId(updatedTrack) ? { ...p, ...updatedTrack } : p)));
        }
      } catch (e: any) {
        setBulkLookupProgress((prev) => ({ ...prev, errors: [...prev.errors, { id: tid, error: e?.message || (e?.response?.data || e) }] }));
      } finally {
        setBulkLookupProgress((prev) => ({ ...prev, current: prev.current + 1 }));
        await wait(3000); // rate limit
      }
    }

    setBulkLookupRunning(false);
  };

  return (
    <div className="p-6 space-y-6 bg-white text-black min-h-screen dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Track Database</h1>
        <button onClick={() => navigate("/flagged-artists")} className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black">
          Flagged Artists
        </button>
        <button onClick={() => navigate("/playable-artist")} className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black">
          Playable Artists
        </button>
        <button onClick={() => navigate("/whitelist")} className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover=text-black">
          Whitelist
        </button>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm text-black mb-1 dark:text-gray-300">
            Başlangıç Tarihi
          </label>
          <input
            id="start-date"
            type="date"
            className="border rounded px-2 py-1 bg-gray text-black dark:bg-gray-800 dark:text-white"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm text-black mb-1 dark:text-gray-300">
            Bitiş Tarihi
          </label>
          <input
            id="end-date"
            type="date"
            className="border rounded px-2 py-1 bg-gray text-black dark:bg-gray-800 dark:text-white"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Toplu Sorgu Button */}
        <div className="self-end">
          <button
            onClick={handleBulkLookup}
            disabled={bulkLookupRunning || loading}
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {bulkLookupRunning ? `Toplu Sorgu (${bulkLookupProgress.current}/${bulkLookupProgress.total || tracks.length})` : "Toplu Sorgu"}
          </button>
          {bulkLookupRunning && (
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Atlanan: {bulkLookupProgress.skipped} • Hata: {bulkLookupProgress.errors.length}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track List */}
        <motion.div variants={listContainer} initial="hidden" animate="visible" className="lg:col-span-1 border rounded-xl overflow-hidden bg-gray-450 dark:bg-gray-700">
          <div className="bg-gray-700 dark:bg-gray-600 px-4 py-2 font-medium flex justify-between items-center text-gray-100 gap-2">
            <div className="flex items-center gap-2 w-full">
              <span className="min-w-[80px]">Parçalar</span>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ara: parça, sanatçı, albüm..."
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
            </div>

            <button
              onClick={handleBulkDelete}
              disabled={selectedForDelete.size === 0}
              className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              Toplu Sil
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto divide-y divide-gray-700">
            {loading && <div className="p-4 text-sm text-gray-400">Yükleniyor…</div>}
            {error && <div className="p-4 text-sm text-red-600">{error}</div>}
            {!loading && !error && filteredTracks.length === 0 && <div className="p-4 text-sm text-gray-400">Eşleşen parça yok</div>}
            {filteredTracks.map((t) => (
              <TrackListItem
                key={getTrackId(t)}
                track={t}
                selected={getTrackId(t) === selectedTrackId}
                checked={selectedForDelete.has(getTrackId(t))}
                onSelect={setSelectedTrackId}
                onCheck={(id, checked) => setSelectedForDelete((prev) => {
                  const newSet = new Set(prev);
                  checked ? newSet.add(id) : newSet.delete(id);
                  return newSet;
                })}
              />
            ))}
          </div>
        </motion.div>

        {/* Track Detail */}
        <div className="lg:col-span-2 border rounded-xl p-4 space-y-4 bg-gray-700 dark:bg-gray-700">
          {selectedTrackId && selectedTrack ? (
            <TrackDetailCard
              track={selectedTrack}
              streamState={streams[selectedTrackId]}
              series={selectedSeries}
              fetchStreams={fetchStreams}
              handleDelete={handleDelete}
              onLookupSaved={handleLookupSaved}
            />
          ) : (
            <div className="text-gray-400">Bir parça seçin.</div>
          )}
        </div>
      </div>
    </div>
  );
}

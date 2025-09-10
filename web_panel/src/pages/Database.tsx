// src/pages/Database.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "../api/axiosInstance";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "../utils/format";
import { SeparatorHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

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
}

type StreamPoint = { date: string; streams: number };

type StreamState = {
  loading: boolean;
  error?: string;
  data?: StreamPoint[];
  dailyAvg?: number | null;
};

function getTrackId(t: DbTrack): string {
  return (t.track_id || t.id || "").toString();
}

function getTrackImage(t: DbTrack): string | undefined {
  return (t.image_url || t.album_image || undefined) ?? undefined;
}

function getTrackAlbum(t: DbTrack): string | undefined {
  return t.album || t.album_name || undefined;
}

function getTrackArtist(t: DbTrack): string {
  if (t.artist) return t.artist;
  if (Array.isArray(t.artists) && t.artists.length) return t.artists.join(", ");
  if (Array.isArray(t.artist_names) && t.artist_names.length) return t.artist_names.join(", ");
  return "Bilinmiyor";
}


function toDaily(series: StreamPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const diff = series[i].streams - series[i - 1].streams;
    if (diff >= 0) out.push(diff);
  }
  return out;
}

function average(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return Math.round((s / nums.length) * 100) / 100;
}

export default function Database() {
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [streams, setStreams] = useState<Record<string, StreamState>>({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Track listesi
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

  // Stream verisini getir (DB veya RapidAPI)
  const fetchStreams = async (trackId: string, forceUpdateAndSave = false) => {
    if (!forceUpdateAndSave && streams[trackId]?.data) return;

    setStreams((s) => ({
      ...s,
      [trackId]: { ...(s[trackId] || {}), loading: true, error: undefined },
    }));

    try {
      if (forceUpdateAndSave) {
        await axios.post("/stream/update", null, { params: { track_id: trackId } });
      }

      const res = await axios.get(`/streams/${trackId}`);

      let series: StreamPoint[] | undefined;
      let dailyAvg: number | null | undefined = undefined;

      if (Array.isArray(res.data?.historic)) {
        series = res.data.historic;
        dailyAvg = res.data.daily_average ?? undefined;
      } else if (Array.isArray(res.data?.historicalData)) {
        series = res.data.historicalData;
      }

      if (!series || !series.length) {
        throw new Error("Stream verisi bulunamadı.");
      }

      setStreams((s) => ({
        ...s,
        [trackId]: { loading: false, data: series, dailyAvg },
      }));
    } catch (e: any) {
      setStreams((s) => ({
        ...s,
        [trackId]: { loading: false, error: e?.message || "Stream verisi alınamadı" },
      }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axios.delete(`/tracks/${id}`);
      console.log("[DEBUG] Silme cevabı:", res.data);
      // Başarılı olursa frontend listesinden çıkar
      setTracks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error("[ERROR] Silme hatası:", err.response?.data || err.message);
      setError(err.response?.data?.detail || err.message);
    }
  };

  // İlk track seçimi, otomatik fetch yok
  useEffect(() => {
    if (!selectedTrackId && tracks.length) {
      setSelectedTrackId(getTrackId(tracks[0]));
    }
  }, [tracks]);

  // Seçili track’in filtrelenmiş verisi
  const selectedSeries = useMemo(() => {
    if (!selectedTrackId) return [];
    const st = streams[selectedTrackId];
    if (!st?.data) return [];

    let filtered = st.data;
    if (startDate) filtered = filtered.filter((p) => p.date >= startDate);
    if (endDate) filtered = filtered.filter((p) => p.date <= endDate);
    return [...filtered].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [selectedTrackId, streams, startDate, endDate]);

  const rangeAvg = useMemo(() => average(toDaily(selectedSeries)), [selectedSeries]);

  const rangeDelta = useMemo(() => {
    if (selectedSeries.length < 2) return null;
    return selectedSeries[selectedSeries.length - 1].streams - selectedSeries[0].streams;
  }, [selectedSeries]);

  const selectedTrack = tracks.find((t) => getTrackId(t) === selectedTrackId);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2x1 font-semibold">Track Database</h1>

      <SeparatorHorizontal>|</SeparatorHorizontal>

        <Link to="/database/flagged-artists">
          <button aria-label="Open Flagged Artists">Flagged Artists</button>
        </Link>

      <div className="flex items-end gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Başlangıç Tarihi</label>
          <input type="date" className="border rounded px-2 py-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Bitiş Tarihi</label>
          <input type="date" className="border rounded px-2 py-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track listesi */}
        <div className="lg:col-span-1 border rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 font-medium">Parçalar</div>
          <div className="max-h-[70vh] overflow-auto divide-y">
            {loading && <div className="p-4 text-sm text-gray-500">Yükleniyor…</div>}
            {error && <div className="p-4 text-sm text-red-600">{error}</div>}
            {!loading && !error && tracks.length === 0 && <div className="p-4 text-sm text-gray-500">Kayıt yok</div>}
            {tracks.map((t) => {
              const tid = getTrackId(t);
              const active = tid === selectedTrackId;
              const img = getTrackImage(t);
              return (
                <button
                  key={tid}
                  onClick={() => setSelectedTrackId(tid)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${active ? "bg-indigo-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {img ? <img src={img} alt={t.name} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-gray-200" />}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.name}</div>
                      <div className="truncate text-xs text-gray-500">
                        {(getTrackArtist(t)  + (getTrackAlbum(t) ? ` • ${getTrackAlbum(t)}` : ""))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detay */}
        <div className="lg:col-span-2 border rounded-xl p-4 space-y-4">
          {!selectedTrackId ? (
            <div className="text-gray-500">Bir parça seçin.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Seçili Parça ID: <span className="font-mono">{selectedTrackId}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(!streams[selectedTrackId]?.data || streams[selectedTrackId]?.error) && (
                    <button
                      onClick={() => fetchStreams(selectedTrackId, true)}
                      disabled={streams[selectedTrackId]?.loading}
                      className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {streams[selectedTrackId]?.loading ? "Yükleniyor…" : "Stream Verisi Getir"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Tarihler Arası Ortalama Stream</div>
                  <div className="text-lg font-semibold">{rangeAvg != null ? formatNumber(rangeAvg) : "—"}</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Aralık Değişim (Son - İlk)</div>
                  <div className="text-lg font-semibold">{rangeDelta != null ? formatNumber(rangeDelta) : "—"}</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Backend Günlük Ortalama</div>
                  <div className="text-lg font-semibold">
                    {streams[selectedTrackId]?.dailyAvg != null ? formatNumber(streams[selectedTrackId]!.dailyAvg as number) : "—"}
                  </div>
                </div>
              </div>

              <div className="w-full h-80">
                {streams[selectedTrackId]?.loading && <div className="h-full flex items-center justify-center text-gray-500">Yükleniyor…</div>}
                {streams[selectedTrackId]?.error && <div className="h-full flex items-center justify-center text-red-600 text-sm">{streams[selectedTrackId]?.error}</div>}
                {selectedSeries.length > 1 && (
                  <ResponsiveContainer>
                    <LineChart data={selectedSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={formatNumber} />
                      <Tooltip formatter={(value: any) => formatNumber(value as number)} labelFormatter={(label) => `Tarih: ${label}`} />
                      <Line type="monotone" dataKey="streams" dot />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {streams[selectedTrackId]?.data && selectedSeries.length <= 1 && !streams[selectedTrackId]?.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">Grafik için yeterli veri yok.</div>
                )}
              </div>

              {/* --- Track Bilgi Kartı --- */}
              {selectedTrack && (
                <div className="mt-4 border rounded-lg p-4 bg-gray-50 shadow-sm space-y-2">
                  <div className="flex items-center gap-3">
                    {getTrackImage(selectedTrack) && (
                      <img
                        src={getTrackImage(selectedTrack)}
                        alt="Cover"
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">{selectedTrack.name}</div>
                      <div className="text-sm text-gray-600">
                        {selectedTrack.artist_names || "Bilinmiyor"} • {getTrackAlbum(selectedTrack) || "Single"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-700 mt-2">
                    <div>
                      <span className="font-medium">Süre:</span>{" "}
                      {selectedTrack.duration_ms
                        ? `${Math.floor(selectedTrack.duration_ms / 60000)}:${String(Math.floor((selectedTrack.duration_ms % 60000) / 1000)).padStart(2, "0")}`
                        : "—"}
                    </div>
                    <div><span className="font-medium">Popülarite:</span> {selectedTrack.popularity ?? "—"}</div>
                    <div><span className="font-medium">Spotify URI: </span>
                      {selectedTrack.spotify_url && (
                        <a
                          href={`https://open.spotify.com/track/${selectedTrackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          {`spotify:track:${selectedTrackId}`}
                        </a>
                      )}
                    </div>
                    <div>
                      {selectedTrack.playlist_id && (
                        <a
                          href={`https://open.spotify.com/playlist/${selectedTrack.playlist_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          Playlist Link
                        </a>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        onClick={() => selectedTrack.id && handleDelete(selectedTrack.id)}
                        className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                        > Sil </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

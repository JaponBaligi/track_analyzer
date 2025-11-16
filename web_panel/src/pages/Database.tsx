// src/pages/Database.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "../api/axiosInstance";
import axiosInstance from "../api/axiosInstance";
import { Card, CardContent } from "../components/ui/card";
import { isWhitelisted, performLookup } from "../utils/lookup";
import { toDaily, average, calculateDailyAverage, calculateRangeDelta } from "../utils/streamCalculations";
import { StreamPoint, StreamState } from "../types/database";
import { getTrackId, DbTrack } from "../utils/trackHelpers";
import { TrackHeaderSection } from "../components/database/TrackHeaderSection";
import { StreamStatsSection } from "../components/database/StreamStatsSection";
import { StreamChartSection } from "../components/database/StreamChartSection";
import { LookupSection } from "../components/database/LookupSection";
import { TrackInfoSection } from "../components/database/TrackInfoSection";
import { DatabaseHeader } from "../components/database/DatabaseHeader";
import { DatabaseFilters } from "../components/database/DatabaseFilters";
import { TrackListSection } from "../components/database/TrackListSection";
import { useTrackFilter } from "../hooks/useTrackFilter";
import { useTrackSelection } from "../hooks/useTrackSelection";

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
  const rangeDelta = calculateRangeDelta(series);

  return (
    <Card className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <CardContent className="space-y-4">
        <TrackHeaderSection
          track={track}
          trackId={selectedTrackId}
          streamState={streamState}
          onFetchStreams={(id) => fetchStreams(id, true)}
        />

        {/* Update Stream Data Button */}
        {streamState?.data && !streamState?.error && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => fetchStreams(selectedTrackId, true)}
              disabled={streamState?.loading}
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 shadow-sm hover:shadow-md transition-all duration-200 text-sm"
            >
              {streamState?.loading ? "Güncelleniyor…" : "Güncelle"}
            </button>
          </div>
        )}

        <StreamStatsSection
          rangeAvg={rangeAvg}
          rangeDelta={rangeDelta}
          streamState={streamState}
        />

        <StreamChartSection series={series} streamState={streamState} />

        <TrackInfoSection
          track={track}
          onDelete={handleDelete}
          lookupSection={<LookupSection track={track} onLookupSaved={onLookupSaved} />}
        />
      </CardContent>
    </Card>
  );
};

// --- Main Page ---
export default function Database() {
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [streams, setStreams] = useState<Record<string, StreamState>>({});
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bulkLookupRunning, setBulkLookupRunning] = useState(false);
  const [bulkLookupProgress, setBulkLookupProgress] = useState<{ current: number; total: number; skipped: number; errors: Array<any> }>({ current: 0, total: 0, skipped: 0, errors: [] });
  const [redHighlightedTracks, setRedHighlightedTracks] = useState<Set<string>>(new Set());

  // Use custom hooks for filtering and selection
  const filteredTracks = useTrackFilter(tracks, searchQuery);
  const [selectedTrackId, setSelectedTrackId] = useTrackSelection(tracks, filteredTracks);

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

  // Get error message for stream fetch errors
  const getStreamErrorMessage = (status?: number, defaultMessage?: string): string => {
    if (status === 404) {
      return "Bu şarkı Soundcharts veritabanında bulunamadı. Şarkı 24 saat içinde eklenebilir.";
    }
    if (status === 403) {
      return "Soundcharts API kotası aşıldı veya fatura sorunu var. Lütfen hesabınızı kontrol edin.";
    }
    if (status === 429) {
      return "Rate limit aşıldı. Lütfen daha sonra tekrar deneyin.";
    }
    return defaultMessage || "Stream verisi alınamadı";
  };

  // Parse stream data from API response
  const parseStreamData = (data: any): { series: StreamPoint[] | null; dailyAvg: number | null | undefined } => {
    if (Array.isArray(data?.historic)) {
      return { series: data.historic, dailyAvg: data.daily_average ?? undefined };
    }
    if (Array.isArray(data?.historicalData)) {
      return { series: data.historicalData, dailyAvg: data.daily_average ?? undefined };
    }
    return { series: null, dailyAvg: undefined };
  };

  // Update stream data on backend
  const updateStreamData = async (trackId: string): Promise<void> => {
    try {
      await axiosInstance.post("/stream/update", null, { params: { track_id: trackId } });
    } catch (updateError: any) {
      const status = updateError?.response?.status;
      if (status === 404 || status === 403) {
        const errorMsg = getStreamErrorMessage(status);
        setStreams((s) => ({ ...s, [trackId]: { loading: false, error: errorMsg } }));
        throw updateError;
      }
      throw updateError;
    }
  };

  // Fetch streams
  const fetchStreams = async (trackId: string, forceUpdateAndSave = false) => {
    if (!forceUpdateAndSave && streams[trackId]?.data) return;
    setStreams((s) => ({ ...s, [trackId]: { ...(s[trackId] || {}), loading: true, error: undefined } }));

    try {
      if (forceUpdateAndSave) {
        await updateStreamData(trackId);
      }

      const res = await axiosInstance.get(`/streams/${trackId}`);
      const { series, dailyAvg } = parseStreamData(res.data);

      if (!series?.length) {
        throw new Error("Stream verisi bulunamadı.");
      }

      setStreams((s) => ({ ...s, [trackId]: { loading: false, data: series, dailyAvg } }));
    } catch (e: any) {
      const status = e?.response?.status;
      const errorMessage = getStreamErrorMessage(status, e?.message);
      setStreams((s) => ({ ...s, [trackId]: { loading: false, error: errorMessage } }));
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

  // Fetch and save lookup data for a track
  const fetchAndSaveLookupData = async (track: DbTrack): Promise<{ licensorName: string; releaseDate: string }> => {
    const tid = getTrackId(track);
    let licensorName = track?.licensor_name || "";
    let releaseDate = track?.release_date || "";

    // If track already has lookup data, return it
    if (licensorName || releaseDate) {
      return { licensorName, releaseDate };
    }

    // Perform lookup
    const lookupResult = await performLookup(tid);
    if (lookupResult.error) {
      throw new Error(lookupResult.error);
    }

    licensorName = lookupResult.licensor_name || "";
    releaseDate = lookupResult.release_date || "";

    // Save lookup data to DB
    const payload = { track_id: tid, licensor_name: licensorName, release_date: releaseDate };
    const resSave = await axiosInstance.post("/lookup/save", payload);
    
    if (resSave?.data?.track) {
      const updatedTrack = resSave.data.track;
      setTracks((prev) => prev.map((p) => (getTrackId(p) === getTrackId(updatedTrack) ? { ...p, ...updatedTrack } : p)));
      licensorName = updatedTrack.licensor_name || licensorName;
    }

    return { licensorName, releaseDate };
  };

  // Fetch stream data for a track
  const fetchStreamDataForTrack = async (trackId: string): Promise<StreamPoint[] | null> => {
    try {
      // Update stream data (backend handles rate limiting for Soundcharts)
      await axiosInstance.post("/stream/update", null, { params: { track_id: trackId } }).catch(() => {
        // If update fails, try to get existing data
      });

      // Get stream data
      const streamRes = await axiosInstance.get(`/streams/${trackId}`);
      if (Array.isArray(streamRes.data?.historic)) {
        return streamRes.data.historic;
      }
      if (Array.isArray(streamRes.data?.historicalData)) {
        return streamRes.data.historicalData;
      }
      return null;
    } catch (streamErr: any) {
      console.warn(`Stream data fetch failed for ${trackId}:`, streamErr);
      return null;
    }
  };

  // Process a single track for bulk lookup
  const processTrackForBulkLookup = async (
    track: DbTrack,
    delayMs: number,
    redHighlighted: Set<string>
  ): Promise<void> => {
    const tid = getTrackId(track);

    // Step 1: Fetch and save lookup data
    const { licensorName } = await fetchAndSaveLookupData(track);
    await wait(delayMs);

    // Step 2: Fetch stream data
    const historical = await fetchStreamDataForTrack(tid);
    await wait(delayMs);

    // Step 3: Calculate daily average and check conditions
    if (historical && historical.length >= 2) {
      const dailyAvg = calculateDailyAverage(historical);
      if (dailyAvg && dailyAvg > 5000) {
        const isWhitelist = isWhitelisted(licensorName);
        if (!isWhitelist) {
          redHighlighted.add(tid);
        }
      }
    }
  };

  const handleBulkLookup = async () => {
    if (bulkLookupRunning) return;
    setBulkLookupRunning(true);
    setBulkLookupProgress({ current: 0, total: tracks.length, skipped: 0, errors: [] });
    const newRedHighlighted = new Set<string>();

    // Rate limiting: 8000 requests/minute = ~133 requests/second
    // We'll use 130 requests/second to be safe (7800/minute)
    // Since we do lookup + stream update per track, we need to space them out
    const REQUESTS_PER_SECOND = 130;
    const DELAY_BETWEEN_REQUESTS = 1000 / REQUESTS_PER_SECOND; // ~7.7ms

    for (const track of tracks) {
      const tid = getTrackId(track);
      try {
        await processTrackForBulkLookup(track, DELAY_BETWEEN_REQUESTS, newRedHighlighted);
      } catch (e: any) {
        setBulkLookupProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, { id: tid, error: e?.message || (e?.response?.data || e) }],
        }));
      } finally {
        setBulkLookupProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      }
    }

    // Update red highlighted tracks
    setRedHighlightedTracks(newRedHighlighted);
    setBulkLookupRunning(false);
  };


  return (
    <div className="p-6 space-y-6 bg-white text-black min-h-screen dark:bg-gray-900 dark:text-gray-100">
      <DatabaseHeader />

      <DatabaseFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onBulkLookup={handleBulkLookup}
        bulkLookupRunning={bulkLookupRunning}
        loading={loading}
        bulkLookupProgress={bulkLookupProgress}
        tracksLength={tracks.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrackListSection
          loading={loading}
          error={error}
          filteredTracks={filteredTracks}
          selectedTrackId={selectedTrackId ?? null}
          selectedForDelete={selectedForDelete}
          redHighlightedTracks={redHighlightedTracks}
          onSelect={setSelectedTrackId}
          onCheck={(id, checked) => {
            setSelectedForDelete((prev) => {
              const newSet = new Set(prev);
              checked ? newSet.add(id) : newSet.delete(id);
              return newSet;
            });
          }}
          onBulkDelete={handleBulkDelete}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

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

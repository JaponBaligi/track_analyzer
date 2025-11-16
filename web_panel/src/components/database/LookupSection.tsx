import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { performLookup } from "../../utils/lookup";
import { getTrackId, DbTrack } from "../../utils/trackHelpers";

interface LookupSectionProps {
  track: DbTrack;
  onLookupSaved?: (updatedTrack: any) => void;
}

export const LookupSection: React.FC<LookupSectionProps> = ({ track, onLookupSaved }) => {
  const trackId = getTrackId(track);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [licensorInfo, setLicensorInfo] = useState<{ licensor_name?: string; release_date?: string } | null>(null);

  const lookupLicensor = async () => {
    if (!trackId) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const result = await performLookup(trackId);
      if (result.error) {
        setLookupError(result.error);
      } else {
        setLicensorInfo({ licensor_name: result.licensor_name, release_date: result.release_date });
      }
    } catch (e: any) {
      setLookupError(e?.message || "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  const saveLookupToDB = async () => {
    if (!trackId) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const payload = {
        track_id: trackId,
        licensor_name: licensorInfo?.licensor_name ?? "",
        release_date: licensorInfo?.release_date ?? "",
      };

      const res = await axiosInstance.post("/lookup/save", payload);

      if (res?.data?.track) {
        const updatedTrack = res.data.track;
        setLicensorInfo({
          licensor_name: updatedTrack.licensor_name ?? licensorInfo?.licensor_name,
          release_date: updatedTrack.release_date ?? licensorInfo?.release_date,
        });

        if (typeof onLookupSaved === "function") onLookupSaved(updatedTrack);
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

  const handleLookupClick = async () => {
    await lookupLicensor().catch(() => undefined);
    await saveLookupToDB();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLookupClick}
          disabled={lookupLoading}
          className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {lookupLoading ? "Aranıyor…" : "Lookup"}
        </button>
      </div>

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
    </>
  );
};


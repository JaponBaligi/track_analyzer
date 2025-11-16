import { formatNumber } from "../../utils/format";
import { StreamState } from "../../types/database";

interface StreamStatsSectionProps {
  rangeAvg: number | null;
  rangeDelta: number | null;
  streamState: StreamState | undefined;
}

export const StreamStatsSection: React.FC<StreamStatsSectionProps> = ({
  rangeAvg,
  rangeDelta,
  streamState,
}) => {
  return (
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
  );
};


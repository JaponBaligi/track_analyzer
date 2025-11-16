import React from "react";

interface DatabaseFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onBulkLookup: () => void;
  bulkLookupRunning: boolean;
  loading: boolean;
  bulkLookupProgress: { current: number; total: number; skipped: number; errors: Array<any> };
  tracksLength: number;
}

export const DatabaseFilters: React.FC<DatabaseFiltersProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onBulkLookup,
  bulkLookupRunning,
  loading,
  bulkLookupProgress,
  tracksLength,
}) => {
  return (
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
          onChange={(e) => onStartDateChange(e.target.value)}
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
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>

      {/* Toplu Sorgu */}
      <div className="self-end flex gap-2">
        <button
          onClick={onBulkLookup}
          disabled={bulkLookupRunning || loading}
          className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {bulkLookupRunning
            ? `Toplu Sorgu (${bulkLookupProgress.current}/${bulkLookupProgress.total || tracksLength})`
            : "Toplu Sorgu"}
        </button>
        {bulkLookupRunning && (
          <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
            Atlanan: {bulkLookupProgress.skipped} • Hata: {bulkLookupProgress.errors.length}
          </div>
        )}
      </div>
    </div>
  );
};


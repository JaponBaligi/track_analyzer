import React from "react";
import { motion, Variants } from "framer-motion";
import { DbTrack } from "../../utils/trackHelpers";
import { TrackListItem } from "./TrackListItem";

const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

interface TrackListSectionProps {
  loading: boolean;
  error: string | undefined;
  filteredTracks: DbTrack[];
  selectedTrackId: string | null;
  selectedForDelete: Set<string>;
  redHighlightedTracks: Set<string>;
  onSelect: (id: string) => void;
  onCheck: (id: string, checked: boolean) => void;
  onBulkDelete: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const TrackListSection: React.FC<TrackListSectionProps> = ({
  loading,
  error,
  filteredTracks,
  selectedTrackId,
  selectedForDelete,
  redHighlightedTracks,
  onSelect,
  onCheck,
  onBulkDelete,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <motion.div
      variants={listContainer}
      initial="hidden"
      animate="visible"
      className="lg:col-span-1 border rounded-xl overflow-hidden bg-gray-450 dark:bg-gray-700"
    >
      <div className="bg-gray-700 dark:bg-gray-600 px-4 py-2 font-medium flex justify-between items-center text-gray-100 gap-2">
        <div className="flex items-center gap-2 w-full">
          <span className="min-w-[80px]">Parçalar</span>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Ara: parça, sanatçı, albüm..."
                className="w-full rounded px-2 py-1 text-sm bg-white text-black dark:bg-gray-800 dark:text-white border"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
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
          onClick={onBulkDelete}
          disabled={selectedForDelete.size === 0}
          className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          Toplu Sil
        </button>
      </div>
      <div className="max-h-[70vh] overflow-auto divide-y divide-gray-700">
        {loading && <div className="p-4 text-sm text-gray-400">Yükleniyor…</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}
        {!loading && !error && filteredTracks.length === 0 && (
          <div className="p-4 text-sm text-gray-400">Eşleşen parça yok</div>
        )}
        {filteredTracks.map((t) => (
          <TrackListItem
            key={t.track_id || t.id}
            track={t}
            selected={(t.track_id || t.id) === selectedTrackId}
            checked={selectedForDelete.has(t.track_id || t.id || "")}
            onSelect={onSelect}
            onCheck={onCheck}
            isRedHighlighted={redHighlightedTracks.has(t.track_id || t.id || "")}
          />
        ))}
      </div>
    </motion.div>
  );
};


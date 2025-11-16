import React from "react";
import { motion, Variants } from "framer-motion";
import { DbTrack, getTrackId, getTrackImage, getTrackAlbum, getTrackArtist } from "../../utils/trackHelpers";

const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

interface TrackListItemProps {
  track: DbTrack;
  selected: boolean;
  checked: boolean;
  onSelect: (id: string) => void;
  onCheck: (id: string, checked: boolean) => void;
  isRedHighlighted: boolean;
}

export const TrackListItem: React.FC<TrackListItemProps> = ({
  track,
  selected,
  checked,
  onSelect,
  onCheck,
  isRedHighlighted,
}) => {
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
        className={`w-full text-left px-2 py-3 rounded-lg transition-colors ${
          isRedHighlighted
            ? "bg-[#923734] dark:bg-[#a93f3b] hover:bg-[#7a2d2a] dark:hover:bg-[#8f3330]"
            : selected
            ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
            : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <div className="flex items-center gap-3">
          {img ? (
            <img src={img} alt={track.name} className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600" />
          )}
          <div className="min-w-0">
            <div
              className={`truncate font-medium ${isRedHighlighted ? "text-white" : "text-gray-900 dark:text-gray-100"}`}
            >
              {track.name}
            </div>
            <div
              className={`truncate text-xs ${isRedHighlighted ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}
            >
              {getTrackArtist(track) + (getTrackAlbum(track) ? ` • ${getTrackAlbum(track)}` : "")}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
};


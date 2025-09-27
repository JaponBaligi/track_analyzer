// src/components/ScanResultList.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { formatDuration, formatImageUrl } from "../utils/format";
import type { Track } from "../types";

type Props = {
  tracks: Track[];
  className?: string;
};

export const ScanResultList: React.FC<Props> = ({ tracks, className }) => {
  if (!tracks || tracks.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="text-sm text-center text-gray-500 dark:text-gray-400 italic px-4 py-6"
      >
        Henüz gösterilecek sonuç yok. Bir tarama başlatın.
      </motion.p>
    );
  }

  return (
    <AnimatePresence>
      <div className={cn("space-y-4", className)}>
        {tracks.map((t, idx) => (
          <motion.div
            key={t.track_id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.45, delay: idx * 0.06 }}
            whileHover={{ scale: 1.01 }}
            className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
          >
            <img
              src={formatImageUrl(t.image_url)}
              alt={t.track_name}
              className="w-24 h-24 rounded-md object-cover flex-shrink-0"
            />

            <div className="flex-1 flex flex-col text-gray-900 dark:text-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{t.track_name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {(t.artist_names || []).join(", ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-700 dark:text-white">
                    Playable
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div>Albüm: {t.album_name ?? "Single"}</div>
                <div>Süre: {t.duration_ms ? formatDuration(t.duration_ms) : "-"}</div>
                <div>Pop: {t.popularity ?? "-"}</div>
                <div className="truncate break-words">ISRC: {t.isrc ?? "-"}</div>
                <div className="truncate break-words">UPC: {t.upc ?? "-"}</div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {t.spotify_url && (
                  <a
                    href={t.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    Spotify'da aç
                  </a>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(t.track_id);
                    alert("Track ID kopyalandı: " + t.track_id);
                  }}
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ID Kopyala
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default ScanResultList;

// src/pages/Home.tsx

import React from "react";
import { motion, Variants, Easing } from "framer-motion";
import ArtistSearch from "../components/ArtistSearch";
import PlaylistCard from "../components/PlaylistCard";
import TrackList from "../components/TrackList";
import { useAppContext } from "../context/AppContext";
import UnplayableTracks from "../components/UnplayableTracks";
import RegionSelector from "../components/RegionSelector";
import { Artist, Playlist, Track } from "../types";

const Home: React.FC = () => {
  const { artistResults, playlists, trackResults, loading, error } = useAppContext();

  const easeOut: Easing = [0.33, 1, 0.68, 1];

  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.35, ease: easeOut },
    }),
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };

  return (
    <main className="container mx-auto px-4 py-6 bg-gray-0 text-gray-100 min-h-screen">
      {/* Page Header */}
      <motion.h1
        className="text-3xl font-bold mb-6 text-center text-black dark:text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
        Unplayable Track Arama
      </motion.h1>

      {/* Artist Search */}
      <section aria-label="Sanatçı Arama" className="mb-10">
        <ArtistSearch />
      </section>

      {/* Region Selector */}
      <RegionSelector />

      {/* Loading */}
      {loading && (
        <motion.section
          aria-live="polite"
          className="mb-6 text-center text-blue-400 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: easeOut }}
        >
          Yükleniyor...
        </motion.section>
      )}

      {/* Unplayable Tracks */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-10">
        <motion.div variants={fadeUpVariant}>
          <UnplayableTracks />
        </motion.div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.section
          role="alert"
          className="mb-6 text-center text-red-500 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: easeOut }}
        >
          {error}
        </motion.section>
      )}

      {/* Artist Results */}
      {artistResults.length > 0 && (
        <motion.section
          aria-label="Sanatçı Sonuçları"
          className="mb-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-100">Sanatçılar</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {artistResults.map((artist: Artist, idx: number) => (
              <motion.li
                key={artist.id}
                custom={idx}
                variants={fadeUpVariant}
                className="border rounded-xl p-4 shadow-sm bg-gray-800 border-gray-700 hover:shadow-lg transition-transform duration-150 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={`${artist.name} resmi`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                      N/A
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-medium text-gray-100">{artist.name}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-300">
                      {artist.followers.toLocaleString()} takipçi
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-300 truncate max-w-xs">
                      {artist.genres.join(", ") || "Tür bilgisi yok"}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <motion.section
          aria-label="Çalma Listeleri"
          className="mb-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-wrap gap-6 overflow-x-auto pb-4">
            {playlists
              .filter((playlist) => (playlist.tracks ?? []).some((track) => !track.is_playable))
              .map((playlist: Playlist, idx: number) => (
                <motion.div key={playlist.id} custom={idx} variants={fadeUpVariant}>
                  <PlaylistCard playlist={playlist}/>
                </motion.div>
              ))}
          </div>
        </motion.section>
      )}

      {/* Track Results */}
      {trackResults.length > 0 && (
        <section aria-label="Parçalar">
          <h2 className="text-2xl font-semibold mb-4 text-gray-100">Parçalar</h2>
          <TrackList tracks={trackResults as Track[]}/>
        </section>
      )}
    </main>
  );
};

export default Home;

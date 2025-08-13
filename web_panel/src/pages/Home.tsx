// src/pages/Home.tsx

import React from "react";
import ArtistSearch from "../components/ArtistSearch";
import PlaylistCard from "../components/PlaylistCard";
import TrackList from "../components/TrackList";
import { useAppContext } from "../context/AppContext";
import UnplayableTracks from "../components/UnplayableTracks";
import RegionSelector from "../components/RegionSelector";
import { Artist, Playlist, Track } from "../types";

const Home: React.FC = () => {
  const { artistResults, playlists, trackResults, loading, error } = useAppContext();

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Spotify Monitoring</h1>

      <section aria-label="Sanatçı Arama" className="mb-10">
        <ArtistSearch />
      </section>

      {/* Bölge seçimi için RegionSelector bileşeni burada */}
      <RegionSelector />

      {loading && (
        <section aria-live="polite" className="mb-6 text-center text-blue-600 font-semibold">
          Yükleniyor...
        </section>
      )}

      <UnplayableTracks />

      {error && (
        <section role="alert" className="mb-6 text-center text-red-600 font-semibold">
          {error}
        </section>
      )}

      {artistResults.length > 0 && (
        <section aria-label="Sanatçı Sonuçları" className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Sanatçılar</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {artistResults.map((artist: Artist) => (
              <li
                key={artist.id}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={`${artist.name} resmi`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                      N/A
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-medium">{artist.name}</p>
                    <p className="text-sm text-gray-500">
                      {artist.followers.toLocaleString()} takipçi
                    </p>
                    <p className="text-sm text-gray-600 truncate max-w-xs">
                      {artist.genres.join(", ") || "Tür bilgisi yok"}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {playlists.length > 0 && (
        <section aria-label="Çalma Listeleri" className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Çalma Listeleri</h2>
          <div className="flex flex-wrap gap-6 overflow-x-auto pb-4">
            {playlists
              .filter((playlist) => (playlist.tracks ?? []).some((track) => !track.is_playable))
              .map((playlist: Playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
          </div>
        </section>
      )}


      {trackResults.length > 0 && (
        <section aria-label="Parçalar">
          <h2 className="text-2xl font-semibold mb-4">Parçalar</h2>
          <TrackList tracks={trackResults as Track[]} />
        </section>
      )}
    </main>
  );
};

export default Home;

// web_panel/src/context/AppContext.tsx

import React, { createContext, useState, ReactNode, useMemo, useContext } from "react";
import { Playlist, Artist, Track } from "../types";

export type AppContextType = {
  artist: string;
  setArtist: (artist: string) => void;

  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;

  selectedPlaylist: Playlist | null;
  setSelectedPlaylist: (playlist: Playlist | null) => void;

  artistResults: Artist[];
  setArtistResults: (artists: Artist[]) => void;

  trackResults: Track[];
  setTrackResults: (tracks: Track[]) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;

  region: string;
  setRegion: (region: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [artist, setArtist] = useState<string>("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [trackResults, setTrackResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [region, setRegion] = useState<string>("TR"); // Default region set to Turkey

  const contextValue = useMemo(
    () => ({
      artist,
      setArtist,
      playlists,
      setPlaylists,
      selectedPlaylist,
      setSelectedPlaylist,
      artistResults,
      setArtistResults,
      trackResults,
      setTrackResults,
      loading,
      setLoading,
      error,
      setError,
      region,
      setRegion,
    }),
    [
      artist,
      playlists,
      selectedPlaylist,
      artistResults,
      trackResults,
      loading,
      error,
      region,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export { AppContext };

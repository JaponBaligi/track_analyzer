// src/api/spotify.ts
// Spotify + DB + Stream API yardımcı fonksiyonları

import axios from "./axiosInstance";
import { Artist, Playlist, Track } from "../types";

// === Artist ===
export const searchArtist = async (artistName: string): Promise<Artist[]> => {
  const { data } = await axios.get("/artists/search", { params: { name: artistName } });
  return data;
};

// Artist taraması (RapidAPI ve playlist taraması yapıyor, backend’de /artists/scan mevcut)
export const scanArtist = async (artistId: string, region?: string, depth?: number) => {
  const params: Record<string, any> = { artist_id: artistId };
  if (region) params.region = region;
  if (depth) params.depth = depth;

  const { data } = await axios.get("/artists/scan", { params });
  return data;
};

// === Playlist ===
export const getPlaylistsByArtist = async (artistId: string): Promise<Playlist[]> => {
  const { data } = await axios.get("/playlists/by-artist", { params: { artist_id: artistId } });
  return data;
};

export const getTracksByPlaylist = async (playlistId: string): Promise<Track[]> => {
  const { data } = await axios.get("/playlists/tracks", { params: { playlist_id: playlistId } });
  return data;
};

// === Track ===
export const evaluateTrack = async (trackId: string) => {
  const { data } = await axios.get("/tracks/evaluate", { params: { track_id: trackId } });
  return data;
};

// DB’de kayıtlı ama “unplayable” olan trackleri getirir
export const getUnplayableTracks = async (): Promise<Track[]> => {
  const { data } = await axios.get("/db/unplayable");
  return Array.isArray(data) ? data : data?.items ?? [];
};

// === Stream yardımcıları ===

// DB’den varsa getirir, yoksa boş döner
export const getStreamSeries = async (trackId: string) => {
  const { data } = await axios.get(`/streams/${trackId}`);
  return data;
};

// RapidAPI’den çekip veritabanına kaydeden servis (backend → POST /stream/update)
export const updateAndSaveStreamSeries = async (trackId: string) => {
  const { data } = await axios.post("/stream/update", null, {
    params: { track_id: trackId },
  });
  return data;
};

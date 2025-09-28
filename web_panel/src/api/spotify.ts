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
export const scanArtist = async (artistName: string, region?: string, depth?: number) => {
  const body: Record<string, any> = { artist_name: artistName };
  if (region) body.region = region;
  if (depth) body.max_depth = depth;

  const { data } = await axios.post("/artists/scan", body);
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

// === Playable scan (artist'in tüm parçalarını tarar ve unplayable'ları DB'ye kaydeder)
export const scanArtistPlayable = async (
  artistIdentifier: string,
  owner: string | null = null,
  market: string | null = null
) => {
  const body: Record<string, any> = { artist_identifier: artistIdentifier };
  if (owner) body.owner = owner;
  if (market) body.market = market;

  const { data } = await axios.post("/playable/artists/scan", body);
  return data;
};
// === Playable scan sonuçlarını döndürür
export const getPlayableTracksByOwner = async (): Promise<Track[]> => {
  const { data } = await axios.get("/playable/result");
  return Array.isArray(data) ? data : [];
};



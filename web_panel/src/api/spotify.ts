//api/spotify.ts

import axios from "./axiosInstance";
import { Artist, Playlist, Track } from "../types";

export const searchArtist = async (artistName: string): Promise<Artist[]> => {
  try {
    const response = await axios.get("/artists/search", {
      params: { name: artistName }
    });
    return response.data;
  } catch (error) {
    console.error("Artist search error:", error);
    throw error;
  }
};

export const scanArtist = async (artistName: string, region: string, depth: number) => {
  try {
    const response = await axios.post("/artists/scan", {
      artist_name: artistName,
      region: region,
      max_depth: depth
    });
    return response.data;
  } catch (error) {
    console.error("Artist scan error:", error);
    throw error;
  }
};

export const getPlaylists = async (): Promise<Playlist[]> => {
  try {
    const response = await axios.get("/playlists");
    return response.data;
  } catch (error) {
    console.error("Playlist fetch error:", error);
    throw error;
  }
};

export const getUnplayableTracks = async (): Promise<Track[]> => {
  try {
    const response = await axios.get("/tracks/unplayable");
    return response.data;
  } catch (error) {
    console.error("Unplayable track fetch error:", error);
    throw error;
  }
};

export const evaluateTrack = async (trackId: string) => {
  try {
    const response = await axios.get("/tracks/evaluate", {
      params: { track_id: trackId }
    });
    return response.data;
  } catch (error) {
    console.error("Track evaluation error:", error);
    throw error;
  }
};

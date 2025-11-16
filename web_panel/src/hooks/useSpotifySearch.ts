// web_panel/src/hooks/useSpotifySearch.ts

import { useAppContext } from "../context/AppContext";

type ApiPlaylist = {
  id: string;
  name: string;
  owner: string;
  image?: string;
  total_tracks?: number;
  tracks?: any[];
};

export const useSpotifySearch = () => {
  const {
    setLoading,
    setError,
    setPlaylists,
    setTrackResults,
    setArtistResults,
  } = useAppContext();

  const searchArtist = async (artistName: string) => {
    setLoading(true);
    setError(null);
    setPlaylists([]);
    setTrackResults([]);
    setArtistResults([]);

    try {
      // Playlists API çağrısı
      const playlistResponse = await fetch(
        `/api/playlists?artist=${encodeURIComponent(artistName)}`
      );
      if (!playlistResponse.ok) throw new Error("Playlists fetch failed");
      const playlistData: ApiPlaylist[] = await playlistResponse.json();

      // API'den gelen veriyi types/index.ts tiplerine uygun şekilde dönüştür
      const playlists = playlistData.map((pl) => ({
        id: pl.id,
        name: pl.name,
        owner: pl.owner,
        image_url: pl.image,
        total_tracks: pl.total_tracks,
        tracks: pl.tracks || [],
      }));

      setPlaylists(playlists);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  };

  return { searchArtist };
};

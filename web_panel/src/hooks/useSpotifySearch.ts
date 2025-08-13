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

type ApiTrack = {
  track_id: string;
  track_name: string;
  artist_name: string; // Backend tekil string olarak geliyor
  is_playable: boolean;
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

      // Eğer track API endpoint varsa buradan çekip benzer şekilde setTrackResults yapabilirsin
      // Örnek:
      // const trackResponse = await fetch(`/api/tracks?artist=${encodeURIComponent(artistName)}`);
      // if (!trackResponse.ok) throw new Error("Tracks fetch failed");
      // const trackData: ApiTrack[] = await trackResponse.json();
      // const tracks = trackData.map((t) => ({
      //   track_id: t.track_id,
      //   track_name: t.track_name,
      //   artist_names: [t.artist_name],
      //   album_name: "",
      //   duration_ms: 0,
      //   popularity: 0,
      //   is_playable: t.is_playable,
      //   spotify_url: "",
      //   image_url: null,
      // }));
      // setTrackResults(tracks);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  };

  return { searchArtist };
};

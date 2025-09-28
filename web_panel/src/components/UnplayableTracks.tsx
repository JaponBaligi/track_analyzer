// web_panel/src/components/UnplayableTracks.tsx

import React, { useEffect, useState } from "react";
import { getUnplayableTracks } from "../api/spotify";
import { Track } from "../types";
import TrackList from "./TrackList";

const UnplayableTracks: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const data = await getUnplayableTracks();
        setTracks(data);
      } catch (error) {
        console.error("Failed to load unplayable tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2">
        Yükleniyor...
      </p>
    );
  }

  if (!tracks.length) {
    return (
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 italic px-4 py-2">
        Aramaya devam et; tarih arayıp bulamayanları unutulmuşluğun sessizliğine gömer.
      </p>
    );
  }

  return (
    <div className="px-4 py-2">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
      </h2>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
      </div>
    </div>
  );
};

export default UnplayableTracks;

// src/pages/Tracks.tsx

import React from "react";
import { useAppContext } from "../context/AppContext";
import UnplayableTracks from "../components/UnplayableTracks";

const Tracks: React.FC = () => {
  const { artist } = useAppContext();

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {artist ? `${artist} için analiz sonuçları` : "Sanatçı seçilmedi"}
      </h1>
      <UnplayableTracks />
    </main>
  );
};

export default Tracks;

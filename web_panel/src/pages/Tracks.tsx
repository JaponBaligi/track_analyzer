import React from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import UnplayableTracks from "../components/UnplayableTracks";

const Tracks: React.FC = () => {
  const { artist } = useAppContext();

  return (
    <main className="container mx-auto px-4 py-6 bg-gray-100 text-gray-100 min-h-screen">
      <motion.h1
        className="text-2xl font-bold mb-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {artist ? `${artist} için analiz sonuçları` : "Sanatçı seçilmedi"}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <UnplayableTracks />
      </motion.div>
    </main>
  );
};

export default Tracks;
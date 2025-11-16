import React from "react";
import { useNavigate } from "react-router-dom";

export const DatabaseHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-semibold">Track Database</h1>
      <button
        onClick={() => navigate("/flagged-artists")}
        className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
      >
        Flagged Artists
      </button>
      <button
        onClick={() => navigate("/playable-artist")}
        className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
      >
        Playable Artists
      </button>
      <button
        onClick={() => navigate("/whitelist")}
        className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
      >
        Whitelist
      </button>
      <button
        onClick={() => navigate("/priority")}
        className="px-3 py-1.5 rounded bg-gray hover:bg-gray-600 hover:text-white text-black dark:bg-gray-700 dark:hover:bg-white dark:hover:text-black"
      >
        Priority
      </button>
    </div>
  );
};


import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 rounded transition-colors duration-200
                 bg-indigo-500 text-white hover:bg-indigo-600
                 dark:bg-yellow-500 dark:text-black dark:hover:bg-yellow-600"
    >
      {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}

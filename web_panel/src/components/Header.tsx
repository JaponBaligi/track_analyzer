// src/components/Header.tsx
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Dark modda buton renkleri daha soft yapılabilir
  const getButtonClasses = (base: string, darkBase: string) =>
    `px-3 py-1 rounded shadow-sm hover:shadow-md transition-all duration-300 ${
      theme === "light" ? base : darkBase
    }`;

  return (
    <header className="bg-gray-800 dark:bg-gray-900 text-gray-100 p-4 flex justify-between items-center shadow-md sticky top-0 z-50 transition-colors duration-300">
      
      {/* Logo / Title */}
      <h1 className="text-lg font-bold text-blue-400">🎧 Metricify</h1>

      {/* Navigation Buttons */}
      <nav className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className={getButtonClasses(
            "bg-orange-600 hover:bg-red-900 text-white",
            "bg-orange-500 hover:bg-red-900 text-white"
          )}
        >
          Unplayable Tarama
        </button>

        <button
          onClick={() => navigate("/artist-scanner")}
          className={getButtonClasses(
            "bg-indigo-600 hover:bg-indigo-700 text-white",
            "bg-indigo-500 hover:bg-indigo-600 text-white"
          )}
        >
          Playable Tarama
        </button>

        <button
          onClick={() => navigate("/db")}
          className={getButtonClasses(
            "bg-gray-700 hover:bg-gray-600 text-gray-100",
            "bg-gray-700 hover:bg-gray-600 text-gray-100"
          )}
        >
          Database
        </button>

        <button
          onClick={() => navigate("/isrc-lookup")}
          className={getButtonClasses(
            "bg-green-600 hover:bg-green-700 text-white",
            "bg-green-500 hover:bg-green-600 text-white"
          )}
        >
          ISRC Lookup
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={getButtonClasses(
            "bg-yellow-500 hover:bg-yellow-600 text-white",
            "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
          )}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        <button
          onClick={logout}
          className={getButtonClasses(
            "bg-red-600 hover:bg-red-700 text-white",
            "bg-red-500 hover:bg-red-600 text-white"
          )}
        >
          Çıkış Yap
        </button>
      </nav>
    </header>
  );
}

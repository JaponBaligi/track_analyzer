// src/components/Header.tsx
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="bg-gray-800 text-gray-100 p-4 flex justify-between items-center shadow-md sticky top-0 z-50 transition-colors duration-300">
      
      {/* Logo / Title */}
      <h1 className="text-lg font-bold text-blue-400">🎧 Metricify</h1>

      {/* Navigation Buttons */}
      
      <nav className="flex items-center gap-3">
        {/* Arama */}
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow-sm hover:shadow-md transition-all duration-300"
        >
          Arama
        </button>

        {/* Database */}
        <button
          onClick={() => navigate("/db")}
          className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1 rounded shadow-sm hover:shadow-md transition-all duration-300"
        >
          Database
        </button>

        <button
          onClick={() => navigate("/isrc-lookup")}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow-sm hover:shadow-md transition-all duration-300"
        >
          ISRC Lookup
        </button>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow-sm hover:shadow-md transition-all duration-300"
        >
          Çıkış Yap
        </button>
      </nav>
    </header>
  );
}

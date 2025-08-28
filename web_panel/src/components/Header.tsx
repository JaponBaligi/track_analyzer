import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token"); // tokenları temizle
    navigate("/login"); // login sayfasına yönlendir
  };

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">🎧 Metricify</h1>
      <nav className="space-x-4">
        {/* Arama butonu: "/" sayfasına yönlendirir */}
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
        >
          Arama
        </button>

        {/* Database sayfası */}
        <button
          onClick={() => navigate("/db")}
          className="hover:underline px-3 py-1 rounded"
        >
          Database
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

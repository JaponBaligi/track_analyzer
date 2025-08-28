import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // TODO: şifre doğrulama yap
    if (password.length > 0) {
      localStorage.setItem("token", "dummy_token"); // backend'den token alınca buraya koy
      navigate("/"); // giriş sonrası arama sayfasına yönlendir
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Login</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-4"
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
        Giriş
      </button>
    </div>
  );
}

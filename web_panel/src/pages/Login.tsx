// src/pages/Login.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

const handleLogin = async () => {
  try {
    const response = await axios.post("http://localhost:8000/api/auth/login", { password });
    const { access_token } = response.data;
    localStorage.setItem("token", access_token);
    navigate("/");
  } catch (err: any) {
    let msg = "Login başarısız";
    if (err.response?.data) {
      // Pydantic validation hatası array olarak döner
      if (Array.isArray(err.response.data)) {
        msg = err.response.data.map((e: any) => e.msg).join(", ");
      } else if (typeof err.response.data.detail === "string") {
        msg = err.response.data.detail;
      }
    }
    setError(msg);
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
        placeholder="48 haneli şifre"
      />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
        Giriş
      </button>
    </div>
  );
}

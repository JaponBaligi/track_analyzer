// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Tracks from "./pages/Tracks";
import Login from "./pages/Login";
import Database from "./pages/Database";
import Guard from "./components/Guard";

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Guard ile korunan sayfalar */}
      <Route
        path="/"
        element={
          <Guard>
            <Layout>
              <Home />
            </Layout>
          </Guard>
        }
      />

      <Route
        path="/tracks"
        element={
          <Guard>
            <Layout>
              <Tracks />
            </Layout>
          </Guard>
        }
      />

      <Route
        path="/db"
        element={
          <Guard>
            <Layout>
              <Database />
            </Layout>
          </Guard>
        }
      />

      {/* Default yönlendirme */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default App;

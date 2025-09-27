// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Tracks from "./pages/Tracks";
import Login from "./pages/Login";
import Database from "./pages/Database";
import Guard from "./components/Guard";
import FlaggedArtists from "./pages/FlaggedArtists";
import IsrcLookup from "./pages/IsrcLookup";
import ArtistScanner from "./pages/ArtistScanner"; // <- yeni import

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

      <Route
        path="/isrc-lookup"
        element={
          <Guard>
            <Layout>
              <IsrcLookup />
            </Layout>
          </Guard>
        }
      />

      <Route
        path="/flagged-artists"
        element={
          <Guard>
            <Layout>
              <FlaggedArtists />
            </Layout>
          </Guard>
        }
      />

      {/* Yeni: Artist Scanner sayfası */}
      <Route
        path="/artist-scanner"
        element={
          <Guard>
            <Layout>
              <ArtistScanner />
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

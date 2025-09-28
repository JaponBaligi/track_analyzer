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
import ArtistScanner from "./pages/ArtistScanner";
import PlayableArtists from "./pages/PlayableArtists";

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

      {/*Track List*/}
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

      {/*Database sayfası */}
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

      {/*ISRC Lookup sayfası */}
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

      {/*Artist Flag sayfası */}
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

      {/*Artist Scanner sayfası */}
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

      {/*Artist Scanner sayfası */}
      <Route
        path="/playable-artist"
        element={
          <Guard>
            <Layout>
              <PlayableArtists />
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

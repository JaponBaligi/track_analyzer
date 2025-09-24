import React, { useState } from "react";

interface TrackResult {
  image_url?: string;
  name: string;
  licensor_name: string;
  release_date?: string;
}

export default function SpotifyLookup() {
  const [trackInput, setTrackInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractTrackId = (input: string): string | null => {
    if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;
    const match = input.match(/spotify\.com\/track\/([a-zA-Z0-9]{22})/);
    return match ? match[1] : null;
  };

  const lookupLicensor = async () => {
    setResult(null);
    setError(null);

    if (!trackInput.trim()) {
      alert("Please enter a track ID or URL.");
      return;
    }

    const trackId = extractTrackId(trackInput.trim());
    if (!trackId) {
      alert("Invalid Track ID or URL");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/get_licensor?track_id=${trackId}`);
      const data = await response.json();
      setLoading(false);

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data as TrackResult);
      }
    } catch (err: unknown) {
      setLoading(false);
      setError("Network Error");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "600px", margin: "auto", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.2rem" }}>GODGOD1337</h1>
      <p className="tagline" style={{ fontSize: "1.1rem", opacity: 0.8 }}>
        Premium Spotify Distributor Lookup <span className="badge" style={{ backgroundColor: "#1db954", color: "black", padding: "0.2em 0.6em", borderRadius: "4px", fontSize: "0.8rem", marginLeft: "0.5em" }}>PRO</span>
      </p>

      <div className="glass-panel" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "1.5rem", margin: "2rem 0", backdropFilter: "blur(10px)" }}>
        <p>Enter a Spotify Track ID or URL</p>
        <div className="input-row" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <input
            type="text"
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            placeholder="e.g., 11dFghVXANMlKmJXsNCbNl or spotify.com/track/..."
            style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "none", backgroundColor: "#1e1e1e", color: "white" }}
          />
          <button
            onClick={lookupLicensor}
            style={{ backgroundColor: "#1db954", border: "none", padding: "0.75rem 1rem", borderRadius: "8px", cursor: "pointer", color: "black", fontWeight: "bold" }}
          >
            <i className="fas fa-search"></i> Lookup
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading" style={{ textAlign: "center", marginTop: "2rem" }}>
          <div className="spinner" style={{ border: "4px solid #333", borderTop: "4px solid #1db954", borderRadius: "50%", width: "36px", height: "36px", animation: "spin 1s linear infinite", margin: "auto" }}></div>
          <p>Scanning track data...</p>
        </div>
      )}

      {(error || result) && (
        <div className="glass-panel" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "1.5rem", margin: "2rem 0", backdropFilter: "blur(10px)" }}>
          {error && (
            <p style={{ color: "#ff4d4d" }}><i className="fas fa-exclamation-circle"></i> {error}</p>
          )}

          {result && (
            <div className="track-info" style={{ display: "flex", alignItems: "center", gap: "1rem", textAlign: "left", flexWrap: "wrap" }}>
              {result.image_url && (
                <img src={result.image_url} alt="Album Art" style={{ width: "100px", borderRadius: "8px" }} />
              )}
              <div>
                <p><strong>Song:</strong> {result.name}</p>
                <p><strong>Distributor:</strong> {result.licensor_name}</p>
                {result.release_date && <p><strong>Released:</strong> {result.release_date}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="footer" style={{ marginTop: "3rem", fontSize: "0.9rem", opacity: 0.6 }}>
        <p>© 2025 GODGOD1337 • Distrofinder • v31</p>
      </div>
    </div>
  );
}

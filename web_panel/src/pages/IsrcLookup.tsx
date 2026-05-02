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
    <div className="container mx-auto px-4 py-8 text-black bg-white min-h-screen dark:text-gray-100 dark:bg-gray-900">
      <h1 className="text-4xl font-extrabold mb-2 text-center">ISRC TO COMPANY LOOKUP</h1>
      <p className="text-center text-black mb-8 text-lg dark:text-gray-400">
        Premium Spotify Distributor Lookup{" "}
        <span className="inline-block bg-green-500 text-black px-2 py-0.5 rounded text-sm ml-2">PRO</span>
      </p>

      <div className="bg-gray-300/60 backdrop-blur-md rounded-xl p-6 mb-8 text-center dark:bg-gray-800/60">
        <p>Enter a Spotify Track ID or URL</p>
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            placeholder="e.g., 11dFghVXANMlKmJXsNCbNl or spotify.com/track/..."
            className="flex-1 px-4 py-2 rounded-lg bg-white-700 text-white focus:ring-2 focus:ring-green-500 border-none outline-none dark:text-gray-100"
          />
          <button
            onClick={lookupLicensor}
            className="px-4 py-2 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 transition-colors"
          >
            Lookup
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center mt-8">
          <div className="mx-auto border-4 border-gray-700 border-t-4 border-t-green-500 rounded-full w-9 h-9 animate-spin"></div>
          <p className="mt-2 text-gray-400">Scanning track data...</p>
        </div>
      )}

      {(error || result) && (
        <div className="bg-gray-800/60 backdrop-blur-md rounded-xl p-6 mt-8 text-left">
          {error && <p className="text-red-500"><i className="fas fa-exclamation-circle"></i> {error}</p>}

          {result && (
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {result.image_url && (
                <img src={result.image_url} alt="Album Art" className="w-24 rounded-lg" />
              )}
              <div className="text-gray-100">
                <p><strong>Song:</strong> {result.name}</p>
                <p><strong>Distributor:</strong> {result.licensor_name}</p>
                {result.release_date && <p><strong>Released:</strong> {result.release_date}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Spotify Track Analyzer
      </div>
    </div>
  );
}

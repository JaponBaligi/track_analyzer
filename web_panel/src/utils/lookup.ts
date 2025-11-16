// Utility functions for lookup operations

export interface LookupResult {
  licensor_name?: string;
  release_date?: string;
  error?: string;
}

/**
 * Performs a lookup for licensor information for a given track ID
 */
export async function performLookup(trackId: string): Promise<LookupResult> {
  try {
    let data: any = null;
    const win: any = window as any;

    if (win?.__LOOKUP_SERVICE && typeof win.__LOOKUP_SERVICE.getLicensor === "function") {
      data = await win.__LOOKUP_SERVICE.getLicensor(trackId);
    } else {
      const base = process.env.REACT_APP_LOOKUP_URL || "";
      const url = base
        ? `${base.replace(/\/$/, "")}/get_licensor?track_id=${encodeURIComponent(trackId)}`
        : `/get_licensor?track_id=${encodeURIComponent(trackId)}`;

      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) {
        throw new Error(`Lookup failed: ${res.status}`);
      }
      data = await res.json();
    }

    if (data?.error) {
      return { error: data.error || "Lookup error" };
    }

    return {
      licensor_name: data.licensor_name,
      release_date: data.release_date,
    };
  } catch (e: any) {
    return { error: e?.message || "Lookup failed" };
  }
}

/**
 * Whitelist distributors (must match backend)
 */
export const WHITELIST_DISTRIBUTORS = new Set([
  "distrokid",
  "toolost",
  "tunecore",
  "landr",
  "dittomusic",
  "labelengine",
  "amuse",
]);

/**
 * Checks if a distributor is whitelisted
 */
export function isWhitelisted(licensorName: string | null | undefined): boolean {
  if (!licensorName) return false;
  return WHITELIST_DISTRIBUTORS.has(licensorName.trim().toLowerCase());
}


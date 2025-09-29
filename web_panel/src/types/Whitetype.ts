// src/types/Whitetype.ts

export type DBTrack = {
  id?: string;
  name?: string;
  track_id?: string;
  track_name?: string;
  artist_names?: string | string[] | null;
  album_name?: string | null;
  duration_ms?: number | string | null;
  popularity?: number | null;
  is_playable?: number | boolean | null;
  spotify_url?: string | null;
  image_url?: string | null;
  added_at?: string | null;
  isrc?: string | null;
  upc?: string | null;
  licensor_name?: string | null;
  release_date?: string | null;
  owner?: string | null;
  genres?: string[] | null;
  [k: string]: any;
};

export type NormalizedTrack = {
  id: string;
  track_id: string;
  track_name: string;
  artist_names: string[];
  album_name?: string | null;
  duration_ms: number;
  popularity?: number | null;
  is_playable: boolean;
  spotify_url?: string | null;
  image_url?: string | null;
  added_at?: string | null;
  isrc?: string | null;
  upc?: string | null;
  licensor_name?: string | null;
  release_date?: string | null;
  owner?: string | null;
  genres?: string[];
  streamData?: {
    historicalData?: { date: string; streams: number }[];
    [k: string]: any;
  };
};

function parseArtistNames(v: string | string[] | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}

export function normalizeTrack(db: DBTrack): NormalizedTrack {
  const id = String(db.id ?? db.track_id ?? db.name ?? "");
  const track_id = String(db.track_id ?? db.id ?? "");
  const track_name = String(db.track_name ?? db.name ?? db.track_id ?? "");
  const artist_names = parseArtistNames(db.artist_names);

  const duration_ms = (() => {
    const d = db.duration_ms ?? 0;
    const n = typeof d === "string" ? parseInt(d, 10) : Number(d);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  })();

  const is_playable = (() => {
    if (typeof db.is_playable === "boolean") return db.is_playable;
    const n = Number(db.is_playable);
    return !Number.isNaN(n) ? Boolean(n) : false;
  })();

  return {
    id,
    track_id,
    track_name,
    artist_names,
    album_name: db.album_name ?? null,
    duration_ms,
    popularity: db.popularity ?? null,
    is_playable,
    spotify_url: db.spotify_url ?? null,
    image_url: db.image_url ?? null,
    added_at: db.added_at ?? null,
    isrc: db.isrc ?? null,
    upc: db.upc ?? null,
    licensor_name: db.licensor_name ?? null,
    release_date: db.release_date ?? null,
    owner: db.owner ?? null,
    genres: db.genres ?? [],
  };
}

export function normalizeList(list: (DBTrack | any)[] = []): NormalizedTrack[] {
  return list.map(normalizeTrack);
}

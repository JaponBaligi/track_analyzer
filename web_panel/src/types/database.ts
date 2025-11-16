export type StreamPoint = { date: string; streams: number };

export interface StreamState {
  loading: boolean;
  error?: string;
  data?: StreamPoint[];
  dailyAvg?: number | null;
}


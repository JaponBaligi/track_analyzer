// Utility functions for stream data calculations

import { StreamPoint } from "../types/database";

/**
 * Converts cumulative stream series to daily differences
 */
export function toDaily(series: StreamPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const diff = series[i].streams - series[i - 1].streams;
    if (diff >= 0) out.push(diff);
  }
  return out;
}

/**
 * Calculates the average of an array of numbers
 */
export function average(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

/**
 * Calculates daily average from historical stream data
 */
export function calculateDailyAverage(historical: StreamPoint[]): number | null {
  if (!historical || historical.length < 2) return null;
  const dailyDiffs: number[] = [];
  for (let i = 1; i < historical.length; i++) {
    const diff = historical[i].streams - historical[i - 1].streams;
    if (diff >= 0) dailyDiffs.push(diff);
  }
  if (dailyDiffs.length === 0) return null;
  return Math.round((dailyDiffs.reduce((a, b) => a + b, 0) / dailyDiffs.length) * 100) / 100;
}

/**
 * Calculates the range delta (difference between last and first stream value)
 */
export function calculateRangeDelta(series: StreamPoint[]): number | null {
  if (series.length <= 1) return null;
  return series[series.length - 1].streams - series[0].streams;
}


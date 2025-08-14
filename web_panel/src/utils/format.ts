// web_panel/src/utils/format.ts


// Süreyi ms cinsinden alıp dakik: saniye formatına çevirir, örn: 215000 -> "3:35"
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Büyük sayı formatı (örn: 1234567 -> "1,234,567")
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// URL kısaltma veya görsel URL için placeholder
export function formatImageUrl(url?: string | null): string {
  return url ?? "/default-image.png";  // default-image.png projenin public klasöründe olabilir
}

export function formatStreamHistory(
  history: { date: string; streams: number }[]
): { date: string; streams: number }[] {
  return history
    .map(item => ({
      date: item.date,
      streams: item.streams,
    }))
    .filter((v, i, self) => 
      i === self.findIndex(t => t.date === v.date)
    );
}

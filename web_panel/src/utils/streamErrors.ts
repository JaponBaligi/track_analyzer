// Utility functions for handling stream fetch errors

/**
 * Gets user-friendly error message for stream fetch errors
 */
export function getStreamErrorMessage(status?: number, defaultMessage?: string): string {
  if (status === 404) {
    return "Bu şarkı Soundcharts veritabanında bulunamadı. Şarkı 24 saat içinde eklenebilir.";
  }
  if (status === 403) {
    return "Soundcharts API kotası aşıldı veya fatura sorunu var. Lütfen hesabınızı kontrol edin.";
  }
  if (status === 429) {
    return "Rate limit aşıldı. Lütfen daha sonra tekrar deneyin.";
  }
  return defaultMessage || "Stream verisi alınamadı";
}


// web_panel/src/api/flaggedArtists.ts

import axiosInstance from "./axiosInstance";

// Flagged artist listesini getir
export async function fetchFlaggedArtists() {
  const res = await axiosInstance.get("/flagged-artists");
  return res.data;
}

// Yeni flagged artist ekle
export async function addFlaggedArtist(name: string) {
  try {
    const res = await axiosInstance.post("/flagged-artists", { name });
    return res.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data);
    }
    throw new Error("Failed to add");
  }
}

// Flagged artist sil
export async function deleteFlaggedArtist(id: number) {
  await axiosInstance.delete(`/flagged-artists/${id}`);
  return true;
}

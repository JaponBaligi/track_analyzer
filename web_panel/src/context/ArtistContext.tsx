// web_panel/src/context/ArtistContext.tsx

import React, { createContext, useState, useContext, ReactNode, useMemo } from "react";

type ArtistContextType = {
  artistName: string;
  setArtistName: (name: string) => void;
  scanResult: any;
  setScanResult: (result: any) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
};

const ArtistContext = createContext<ArtistContextType | undefined>(undefined);

export const useArtistContext = () => {
  const context = useContext(ArtistContext);
  if (!context) {
    throw new Error("useArtistContext must be used within ArtistProvider");
  }
  return context;
};

export const ArtistProvider = ({ children }: { children: ReactNode }) => {
  const [artistName, setArtistName] = useState<string>("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const contextValue = useMemo(
    () => ({
      artistName,
      setArtistName,
      scanResult,
      setScanResult,
      isLoading,
      setIsLoading,
    }),
    [artistName, scanResult, isLoading]
  );

  return (
    <ArtistContext.Provider value={contextValue}>
      {children}
    </ArtistContext.Provider>
  );
};

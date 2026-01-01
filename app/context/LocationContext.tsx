"use client";
import { createContext, useContext, useState } from "react";

type Coordinates = { lat: number; lng: number };
type LocationContextValue = {
  selectedAddress: string;
  setSelectedAddress: React.Dispatch<React.SetStateAction<string>>;
  coordinates: Coordinates;
  setCoordinates: React.Dispatch<React.SetStateAction<Coordinates>>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [coordinates, setCoordinates] = useState<Coordinates>({
    lat: 24.8607,
    lng: 67.0011,
  });

  return (
    <LocationContext.Provider
      value={{
        selectedAddress,
        setSelectedAddress,
        coordinates,
        setCoordinates,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
};

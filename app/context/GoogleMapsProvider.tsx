"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLoadScript } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

type GoogleMapsContextValue = {
  isLoaded: boolean;
  loadError: Error | undefined;
  apiKeyMissing: boolean;
  authFailed: boolean;
};

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  isLoaded: false,
  loadError: undefined,
  apiKeyMissing: false,
  authFailed: false,
});

function readApiKey() {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = useMemo(readApiKey, []);
  const apiKeyMissing = apiKey.length === 0;
  const [authFailed, setAuthFailed] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setAuthFailed(true);
      previous?.();
    };
    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  return (
    <GoogleMapsContext.Provider
      value={{
        isLoaded: !apiKeyMissing && isLoaded && !authFailed,
        loadError,
        apiKeyMissing,
        authFailed,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

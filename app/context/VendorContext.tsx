"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Vendor = {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
};

type VendorContextValue = {
  vendor: Vendor | null;
  setVendor: (v: Vendor | null) => void;
  openVendorModal: boolean;
  setOpenVendorModal: (open: boolean) => void;
};

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [vendor, setVendorState] = useState<Vendor | null>(null);
  const [openVendorModal, setOpenVendorModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("p2pVendor");
      if (stored) {
        setVendorState(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load vendor", err);
    }
  }, []);

  const setVendor = (v: Vendor | null) => {
    setVendorState(v);
    if (v) {
      localStorage.setItem("p2pVendor", JSON.stringify(v));
    } else {
      localStorage.removeItem("p2pVendor");
    }
  };

  const value = useMemo(
    () => ({
      vendor,
      setVendor,
      openVendorModal,
      setOpenVendorModal,
    }),
    [vendor, openVendorModal]
  );

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendorContext() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendorContext must be used inside VendorProvider");
  return ctx;
}


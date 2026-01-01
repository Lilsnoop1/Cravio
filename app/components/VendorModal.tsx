"use client";

import { useEffect, useState } from "react";
import { useVendorContext } from "../context/VendorContext";
import { useCartContext } from "../context/CartContext";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";

export default function VendorModal() {
  const { openVendorModal, setOpenVendorModal, setVendor } = useVendorContext();
  const { data: session } = useSession();
  const { ensureVendorCart, setActiveVendorId } = useCartContext();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!openVendorModal) {
      setError(null);
      setName("");
      setAddress("");
      setPhoneNumber("");
    }
  }, [openVendorModal]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!session?.user) {
      setError("Please sign in first.");
      return;
    }
    if (!name.trim() || !phoneNumber.trim()) {
      setError("Name and phone are required.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), address: address.trim(), phoneNumber: phoneNumber.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save vendor");
      }
      const vendor = await res.json();
      setVendor(vendor);
      ensureVendorCart(String(vendor.id));
      setActiveVendorId(String(vendor.id));
      setOpenVendorModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };

  if (!openVendorModal) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={() => setOpenVendorModal(false)}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 transition"
          aria-label="Close vendor modal"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-brasika">Vendor details</h2>
            <p className="text-sm text-slate-500">Required for employee orders (P2P vendors).</p>
          </div>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Name *</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Phone *</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-3 font-semibold shadow-sm hover:shadow-md transition disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save vendor"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


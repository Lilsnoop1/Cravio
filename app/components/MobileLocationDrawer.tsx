"use client";

import { X } from "lucide-react";
import LocationSelector from "./LocationSelector";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileLocationDrawer({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[98%] sm:w-[94%] max-w-2xl bg-white rounded-2xl shadow-2xl p-4 md:p-5 overflow-visible">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold text-slate-900">Select your location</p>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Close location"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        </div>
        <div className="relative overflow-visible">
          <LocationSelector allowChange />
        </div>
      </div>
    </div>
  );
}


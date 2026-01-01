"use client";

import { useEffect, useRef, useState } from "react";
import { useCartContext } from "../context/CartContext";
import { CheckCircle } from "lucide-react";

export default function BulkToast() {
  const { bulkEligible } = useCartContext();
  const [show, setShow] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prev = useRef(false);

  useEffect(() => {
    if (bulkEligible && !prev.current) {
      setShow(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShow(false), 6000);
    }
    if (!bulkEligible) {
      setShow(false);
    }
    prev.current = bulkEligible;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bulkEligible]);

  if (!show) return null;

  return (
    <div className="fixed top-3 left-1/2 z-[9999] -translate-x-1/2 px-4">
      <div className="flex items-center gap-3 rounded-xl bg-primary text-accents shadow-2xl px-4 py-3 min-w-[260px] max-w-[360px]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-sifonn text-sm font-semibold">Bulk pricing unlocked!</p>
          <p className="text-[12px] opacity-90">
            Congrats—you’re now getting bulk rates on this order.
          </p>
        </div>
      </div>
    </div>
  );
}


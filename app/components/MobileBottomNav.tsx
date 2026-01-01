"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, UserCircle, ClipboardList, ShoppingBag } from "lucide-react";
import { useCartContext } from "../context/CartContext";
import MobileCartModal from "./MobileCartModal";
import MobileSearchDrawer from "./MobileSearchDrawer";

const MobileBottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCartContext();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // listen for navbar trigger
  useEffect(() => {
    const handler = () => setIsSearchOpen(true);
    window.addEventListener("mobile-search-open", handler as EventListener);
    return () => window.removeEventListener("mobile-search-open", handler as EventListener);
  }, []);

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Hide on checkout page
  if (pathname === "/checkout") return null;

  const navItems = [
    { key: "home", label: "Home", icon: <Home className="w-5 h-5" />, onClick: () => router.push("/") },
    { key: "search", label: "Search", icon: <Search className="w-5 h-5" />, onClick: () => setIsSearchOpen(true) },
    { key: "profile", label: "Profile", icon: <UserCircle className="w-5 h-5" />, onClick: () => router.push("/account") },
    { key: "orders", label: "Orders", icon: <ClipboardList className="w-5 h-5" />, onClick: () => router.push("/orders") },
    { key: "cart", label: "Cart", icon: <ShoppingBag className="w-5 h-5" />, onClick: () => setIsCartOpen(true) },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[9997] md:hidden bg-white border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-5 text-center py-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              className="flex flex-col items-center justify-center gap-1 text-[11px] text-slate-700"
              onClick={item.onClick}
            >
              <div className="relative">
                {item.icon}
                {item.key === "cart" && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-accents rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {itemCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <MobileCartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <MobileSearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default MobileBottomNav;


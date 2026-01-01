"use client";
import { useCartContext } from "../context/CartContext";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MobileCartModal from "./MobileCartModal";

const MobileCartButton = () => {
  const { cartItems } = useCartContext();
  const pathname = usePathname();
  const [subTotal, setSubTotal] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const price = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    setSubTotal(price);
  }, [cartItems]);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  // Hide on checkout page or if cart is empty
  if (pathname === "/checkout" || cartItems.length === 0) {
    return null;
  }

  const total = subTotal;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white border-t-2 border-slate-200 shadow-2xl">
        <button
          onClick={handleClick}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 flex items-center justify-between transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-amber-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-sifonn">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
              <p className="text-lg font-bold font-brasika">Rs {total.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-sifonn">View Cart</p>
            <p className="text-xs opacity-90">Tap to checkout</p>
          </div>
        </button>
      </div>
      <MobileCartModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default MobileCartButton;


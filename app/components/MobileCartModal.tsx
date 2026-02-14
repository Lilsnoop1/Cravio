"use client";
import { useCartContext } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocation } from "../context/LocationContext";
import { useUserInfo } from "../context/UserInfoContext";
import { useLoginModal } from "@/app/context/LoginModalContext";
import { useVendorContext } from "../context/VendorContext";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, X, Plus, Minus, CheckCircle, Truck, ShoppingBag } from "lucide-react";
import type { MobileCartModalProps } from "../Data/database";
import type { Vendor } from "../Data/database";

const MAX_QUANTITY = 5000;
const MIN_QUANTITY = 1;

const MobileCartModal = ({ isOpen, onClose }: MobileCartModalProps) => {
  const { cartItems, updateQuantity, removeItem } = useCartContext();
  const router = useRouter();
  const { data: session } = useSession();
  const { selectedAddress } = useLocation();
  const { phoneNumber, city, street, building } = useUserInfo();
  const { setIsOpen } = useLoginModal();
  const { vendor, setOpenVendorModal, setVendor } = useVendorContext();
  const { ensureVendorCart, setActiveVendorId } = useCartContext();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isEmployee = role === "EMPLOYEE";
  const [subTotal, setSubTotal] = useState<number>(0);

  const consumerSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum +
          (item.product.consumerPrice ?? item.product.price ?? 0) *
            item.quantity,
        0
      ),
    [cartItems]
  );
  const bulkEligible = isEmployee || consumerSubtotal >= 20000;

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Calculate original total (before discounts) for savings display
  const originalTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + (item.product.price ?? item.product.consumerPrice ?? 0) * item.quantity,
        0
      ),
    [cartItems]
  );

  useEffect(() => {
    const consumerSubtotal = cartItems.reduce(
      (sum, item) =>
        sum +
        (item.product.consumerPrice ?? item.product.price ?? 0) *
          item.quantity,
      0
    );
    const bulkEligible = isEmployee || consumerSubtotal >= 20000;
    const saleSubtotal = cartItems.reduce((sum, item) => {
      const consumer = item.product.consumerPrice ?? item.product.price ?? 0;
      const retail = item.product.retailPrice ?? item.product.price ?? consumer;
      const bulk = item.product.bulkPrice ?? retail;
      const sale = bulkEligible ? bulk : consumer;
      return sum + sale * item.quantity;
    }, 0);
    setSubTotal(saleSubtotal);
  }, [cartItems, isEmployee]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch("/api/vendors");
        if (res.ok) {
          const data = await res.json();
          setVendors(data || []);
        }
      } catch (err) {
        console.error("Failed to load vendors", err);
      }
    };
    if (isEmployee) {
      fetchVendors();
    }
  }, [session, isEmployee]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSelectVendor = (id: string) => {
    if (!id) {
      setVendor(null);
      setActiveVendorId(null);
      return;
    }
    const selected = vendors.find((v) => String(v.id) === id);
    if (selected) {
      setVendor({ ...selected, address: selected.address ?? "" });
      setActiveVendorId(String(selected.id));
      ensureVendorCart(String(selected.id));
    }
  };

  const handleCheckout = () => {
    if (!session) {
      setIsOpen(true);
      onClose();
    } else if (role === "EMPLOYEE" && !vendor) {
      setOpenVendorModal(true);
      onClose();
    } else if (!selectedAddress || !phoneNumber || !city || !building || !street) {
      router.push("/user-info");
      onClose();
    } else {
      router.push("/checkout");
      onClose();
    }
  };

  if (!isOpen) return null;

  const savings = originalTotal - subTotal;

  const getItemPrice = (item: typeof cartItems[0]) => {
    return (bulkEligible || isEmployee)
      ? item.product.bulkPrice ?? item.product.price
      : item.product.consumerPrice ?? item.product.price;
  };

  const getOriginalPrice = (item: typeof cartItems[0]) => {
    return item.product.price ?? item.product.consumerPrice ?? 0;
  };

  const getDiscount = (item: typeof cartItems[0]) => {
    const original = getOriginalPrice(item);
    const sale = getItemPrice(item);
    if (original > sale && original > 0) {
      return Math.round(((original - sale) / original) * 100);
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-[10001] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Full-screen modal */}
      <div className="absolute inset-0 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-800" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 font-sifonn">Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Fulfillment bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Cravio Grocery</p>
              <p className="text-xs text-slate-500">Fulfilled by Cravio</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-700">Standard delivery</p>
            <p className="text-xs text-slate-500">
              {new Date(Date.now() + 86400000).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Progress bars */}
        {cartItems.length > 0 && (
          <div className="border-b border-slate-100 divide-y divide-slate-100">
            {/* Minimum order bar */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 mb-1.5">
                  {subTotal >= 3000 || isEmployee
                    ? "Yay! You can now place your order"
                    : `Add Rs ${(3000 - subTotal).toFixed(0)} more for minimum order`}
                </p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (subTotal / 3000) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <Truck className="w-6 h-6 text-primary shrink-0" />
            </div>

            {/* Bulk pricing bar */}
            {!isEmployee && (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 mb-1.5">
                    {consumerSubtotal >= 20000
                      ? "Bulk pricing unlocked!"
                      : `Add Rs ${(20000 - consumerSubtotal).toLocaleString()} more for bulk pricing`}
                  </p>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (consumerSubtotal / 20000) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-lg shrink-0">💰</span>
              </div>
            )}
          </div>
        )}

        {/* Cart Items — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-600 font-semibold">Your cart is empty</p>
              <p className="text-sm text-slate-400 mt-1">Add items to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cartItems.map((item, index) => {
                const salePrice = getItemPrice(item);
                const origPrice = getOriginalPrice(item);
                const discount = getDiscount(item);

                return (
                  <div
                    key={`${item.product.id}-${index}`}
                    className="flex items-center gap-3 px-4 py-4"
                  >
                    {/* Product image */}
                    <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 bg-white p-1">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Name + Price */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-slate-900">
                          Rs. {salePrice.toLocaleString()}
                        </span>
                        {origPrice > salePrice && (
                          <span className="text-xs text-slate-400 line-through">
                            Rs. {origPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Discount badge + Quantity controls */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {discount > 0 && (
                        <span className="bg-primary text-accents text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {discount}% OFF
                        </span>
                      )}
                      <div className="flex items-center border border-primary rounded-lg overflow-hidden">
                        <button
                          className="px-2.5 py-1.5 text-primary hover:bg-primary/10 transition-colors"
                          onClick={() =>
                            item.quantity <= 1
                              ? removeItem(item.product.id)
                              : updateQuantity(item.product.id, item.quantity - 1)
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-bold text-slate-800 min-w-[32px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          className="px-2.5 py-1.5 text-primary hover:bg-primary/10 transition-colors"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vendor selector for employees */}
        {isEmployee && cartItems.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-700 font-semibold">Vendor</span>
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  setOpenVendorModal(true);
                  onClose();
                }}
              >
                + New vendor
              </button>
            </div>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={vendor?.id ? String(vendor.id) : ""}
              onChange={(e) => handleSelectVendor(e.target.value)}
            >
              <option value="">Select vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.name} • {v.phoneNumber}
                </option>
              ))}
            </select>
            {!vendor && (
              <p className="text-xs text-red-600 mt-1">
                Select or create a vendor before checkout.
              </p>
            )}
          </div>
        )}

        {/* Sticky Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 pb-6 safe-area-bottom">
            <div className="flex items-center justify-between">
              {/* Left: total + item count + savings */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">
                    {itemCount} {itemCount === 1 ? "Item" : "Items"}
                  </span>
                </div>
                {savings > 0 && (
                  <p className="text-xs text-primary font-semibold mt-0.5">
                    You&apos;ve saved Rs. {savings.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Right: Checkout button */}
              <button
                onClick={handleCheckout}
                className="bg-primary hover:bg-primary/90 text-accents font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-sifonn text-sm"
              >
                CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCartModal;

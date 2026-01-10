 
"use client";
import { useCartContext } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocation } from "../context/LocationContext";
import { useUserInfo } from "../context/UserInfoContext";
import { useLoginModal } from "@/app/context/LoginModalContext";
import { useVendorContext } from "../context/VendorContext";
import { useEffect, useMemo, useState } from "react";
import { X, Plus, Minus, Trash2, Clock, ShoppingBag } from "lucide-react";
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

  const handleSelectVendor = (id: string) => {
    if (!id) {
      setVendor(null);
      setActiveVendorId(null);
      return;
    }
    const selected = vendors.find((v) => String(v.id) === id);
    if (selected) {
      setVendor({...selected, address: selected.address ?? ""});
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

  const handleQuantityInput = (id: string, raw: string) => {
    const value = parseInt(raw, 10);
    if (Number.isNaN(value)) return;
    const next = Math.min(Math.max(value, MIN_QUANTITY), MAX_QUANTITY);
    updateQuantity(Number(id), next);
  };

  return (
    <div className="fixed inset-0 z-[9998] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col justify-center">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-accents flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary font-brasika">Your Cart</h2>
            {cartItems.length > 0 && (
              <span className="bg-primary text-accents rounded-full px-3 py-1 text-sm font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Delivery Time */}
        <div className="px-6 py-3 bg-primary/10 border-b border-slate-200">
          <div className="flex items-center justify-center gap-2 bg-primary backdrop-blur-sm rounded-full px-4 py-2 w-fit mx-auto shadow-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-accents font-sifonn">
              Standard Delivery (15 - 30 mins)
            </span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-slate-500 mt-2">Add items to get started</p>
            </div>
          ) : (
            cartItems.map((item, index: number) => (
              <div
                key={`${item.product.id}-${index}`}
                className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100"
              >
                <div className="relative overflow-hidden rounded-lg w-20 h-20 flex-shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 mb-1 truncate text-sm">
                        {item.product.name}
                      </h3>
                      <p className="text-amber-600 font-bold">
                        Rs {(
                          (isEmployee || bulkEligible)
                            ? item.product.bulkPrice ?? item.product.price
                            : item.product.consumerPrice ?? item.product.price
                        ).toFixed(2)}{" "}
                        <span className="text-xs text-slate-500 font-normal">
                          {(isEmployee || bulkEligible) ? "bulk" : "consumer"}
                        </span>
                      </p>
                      {!isEmployee && (
                        <p className="text-xs text-slate-500">
                          Consumer: Rs {(item.product.consumerPrice ?? item.product.price).toFixed(2)} · Bulk: Rs {(item.product.bulkPrice ?? item.product.retailPrice ?? item.product.price).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Line total (applied): Rs {(
                          ((isEmployee || bulkEligible
                            ? item.product.bulkPrice ?? item.product.price
                            : item.product.consumerPrice ?? item.product.price)) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                    <button
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                      onClick={() => removeItem(item.product.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5">
                      <button
                        className="p-0.5 hover:bg-white rounded-full transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <input
                        type="number"
                        min={MIN_QUANTITY}
                        max={MAX_QUANTITY}
                        value={item.quantity}
                        onChange={(e) => handleQuantityInput(String(item.product.id), e.target.value)}
                        className="w-16 text-center text-sm font-semibold text-slate-700 bg-transparent border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        className="p-0.5 hover:bg-white rounded-full transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Total and Checkout */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 p-6 pb-20 space-y-4 bg-white">
              <div className="space-y-2.5 text-sm">
                {session?.user?.role === "EMPLOYEE" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Vendor</span>
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
                      <p className="text-xs text-red-600">
                        Select or create a vendor before checkout.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">Rs {subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-slate-800 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-amber-600">Rs {subTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {bulkEligible
                    ? "Bulk pricing applied (order ≥ Rs 20,000)."
                    : "Consumer pricing. Bulk applies automatically at Rs 20,000+. Minimum order Rs 3000."}
                </p>
              </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-sifonn"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCartModal;


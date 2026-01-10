 
"use client";

import { Clock, Plus, Minus, Trash2 } from "lucide-react";
import { useCartContext } from "../context/CartContext";
import { Product, Vendor } from "../Data/database";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocation } from "../context/LocationContext";
import { useUserInfo } from "../context/UserInfoContext";
import { useSession } from "next-auth/react";
import { useLoginModal } from "@/app/context/LoginModalContext";
import { useProduct } from "../context/ProductsContext";
import { useVendorContext } from "../context/VendorContext";

const MAX_QUANTITY = 5000;
const MIN_QUANTITY = 1;

const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeItem, addItem, CartOpen } = useCartContext();
  const [subTotal, setSubTotal] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedAddress } = useLocation();
  const { phoneNumber, city, street, building } = useUserInfo();
  const { data: session } = useSession();
  const { setIsOpen } = useLoginModal();
  const { products: ProductFetch } = useProduct();
  const { vendor, setOpenVendorModal, setVendor } = useVendorContext();
  const { ensureVendorCart, setActiveVendorId } = useCartContext();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isEmployee = role === "EMPLOYEE";

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
  const total = useMemo(() => subTotal, [subTotal]);

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
    if (role === "EMPLOYEE") {
      fetchVendors();
    }
  }, [role]);

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

  const handleQuantityInput = (id: Product["id"], raw: string) => {
    const value = parseInt(raw, 10);
    if (Number.isNaN(value)) return;
    updateQuantity(id, Math.min(Math.max(value, MIN_QUANTITY), MAX_QUANTITY));
  };

  return (
    <aside className={`${cartItems.length === 0 || !CartOpen ? 'hidden' : 'hidden md:flex'} md:flex-col sticky top-0 right-0 h-screen w-[420px] bg-white shadow-2xl z-50`}>
      <div className="p-6 border-b border-slate-200 bg-accents">
        <div className="flex items-center justify-center gap-2 mb-4 bg-primary backdrop-blur-sm rounded-full px-4 py-2 w-fit mx-auto shadow-sm">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-accents font-sifonn">
            Standard Delivery (15 - 30 mins)
          </span>
        </div>
        <h2 className="text-2xl font-bold text-primary font-brasika text-center">
          Your Order
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        <div className="space-y-4">
          {cartItems.map((item, index: number) => (
            <div
              key={`${item.product.id}-${index}`}
              className="group flex gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100"
            >
              <div className="relative overflow-hidden rounded-lg w-24 h-24 flex-shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 mb-1 truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-amber-600 font-bold text-lg">
                      Rs {(
                        (bulkEligible || isEmployee)
                          ? item.product.bulkPrice ?? item.product.price
                          : item.product.consumerPrice ?? item.product.price
                      ).toFixed(2)}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        {(bulkEligible || isEmployee) ? "bulk" : "consumer"}
                      </span>
                    </p>
                    {!isEmployee && (
                      <p className="text-xs text-slate-500">
                        Consumer: Rs{" "}
                        {(item.product.consumerPrice ?? item.product.price).toFixed(
                          2
                        )}{" "}
                        · Bulk: Rs{" "}
                        {(item.product.bulkPrice ??
                          item.product.retailPrice ??
                          item.product.price
                        ).toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Line total (applied): Rs{" "}
                      {(
                        ((bulkEligible || isEmployee)
                          ? item.product.bulkPrice ?? item.product.price
                          : item.product.consumerPrice ?? item.product.price) *
                        item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                  <button
                    className="p-2 hover:bg-red-50 rounded-full transition-colors group/delete"
                    onClick={() => removeItem(item.product.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 group-hover/delete:text-red-500 transition-colors" />
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
                      onChange={(e) => handleQuantityInput(item.product.id, e.target.value)}
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
          ))}
          {cartItems.length === 0 && (
            <div className="text-center text-slate-500 py-8">Your cart is empty</div>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="pt-6 border-t border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 text-lg">
              Popular with your order
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {ProductFetch.map((item: Product, index: number) =>
                index < 3 ? (
                  <div
                    key={item.id ?? index}
                    className="group/item cursor-pointer flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-100 hover:border-amber-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative overflow-hidden rounded-lg aspect-square">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="bg-amber-500 rounded-full p-1.5 opacity-0 group-hover/item:opacity-100 transform scale-0 group-hover/item:scale-100 transition-all duration-300 shadow-lg">
                          <Plus
                            className="w-4 h-4 text-white"
                            onClick={() => addItem(item, 1)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700 line-clamp-2 mb-1">
                        {item.name}
                      </p>
                      <p className="text-sm font-bold text-amber-600">
                        ${item.price}
                      </p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-200 p-6 space-y-4 bg-white shadow-lg">
        <div className="space-y-2.5 text-sm">
          {session?.user?.role === "EMPLOYEE" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold">Vendor</span>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => setOpenVendorModal(true)}
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
            <span className="text-amber-600">Rs {total.toFixed(2)}</span>
          </div>
          <div className="text-xs text-slate-500">
            {bulkEligible
              ? "Bulk pricing applied (order ≥ Rs 20,000)."
              : "Consumer pricing applied. Bulk pricing starts at Rs 20,000."}
          </div>
        </div>
        <button
          disabled={cartItems.length === 0}
          className="w-full disabled:cursor-not-allowed disabled:bg-gray-500 bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          onClick={() => {
            if (!session) {
              setIsOpen(true);
            } else if (!selectedAddress || !phoneNumber || !city || !building || !street) {
              router.push("/user-info");
            } else if (role === "EMPLOYEE" && !vendor) {
              setOpenVendorModal(true);
            } else {
              router.push("/checkout");
            }
          }}
        >
          Proceed to Checkout
        </button>
        <button className="text-amber-600 text-sm font-semibold hover:text-amber-700 transition-colors block text-center w-full">
          View Full Summary
        </button>
      </div>
    </aside>
  );
};

export default Cart;

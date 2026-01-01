"use client";

import React, { useContext, useState, createContext, useEffect, useMemo } from "react";
import { Product } from "../Data/database";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  CartOpen: boolean;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cartItems: CartItem[];
  activeVendorId: string | null;
  setActiveVendorId: (id: string | null) => void;
  ensureVendorCart: (id: string) => void;
  consumerSubtotal: number;
  bulkEligible: boolean;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: Product["id"], quantity: number) => void;
  removeItem: (productId: Product["id"]) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const MAX_QUANTITY = 5000;
const MIN_QUANTITY = 1;

const clampQuantity = (value: number) =>
  Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, Math.round(value || 0)));

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [CartOpen, setCartOpen] = useState(false);
  const [vendorCarts, setVendorCarts] = useState<Record<string, CartItem[]>>({
    default: [],
  });
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);

  const currentKey = activeVendorId ?? "default";
  const cartItems = vendorCarts[currentKey] ?? [];
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
  const bulkEligible = consumerSubtotal >= 20000;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (bulkEligible) {
      root.classList.add("bulk-mode");
    } else {
      root.classList.remove("bulk-mode");
    }
  }, [bulkEligible]);

  // Load cart from localStorage (support legacy shape of Product[])
  useEffect(() => {
    const stored = localStorage.getItem("cartProduct");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed.vendorCarts) {
        setVendorCarts(parsed.vendorCarts);
        setActiveVendorId(parsed.activeVendorId ?? null);
        return;
      }
      if (Array.isArray(parsed)) {
        // If legacy stored as Product[]
        type StoredItem = { product: Product; quantity?: number };
        const legacyItems: CartItem[] =
          parsed.length && !parsed[0]?.product
            ? parsed.map((p: Product) => ({ product: p, quantity: 1 }))
            : parsed.map((item: StoredItem) => ({
                product: item.product,
                quantity: clampQuantity(item?.quantity ?? 1),
              }));
        setVendorCarts({ default: legacyItems });
      }
    } catch (err) {
      console.error("Failed to parse stored cart", err);
    }
  }, []);

  // Persist cart whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "cartProduct",
      JSON.stringify({ vendorCarts, activeVendorId })
    );
  }, [vendorCarts, activeVendorId]);

  const ensureVendorCart = (id: string) => {
    setVendorCarts((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: [] };
    });
  };

  const addItem = (product: Product, quantity: number = 1) => {
    setVendorCarts((prev) => {
      const key = activeVendorId ?? "default";
      const list = prev[key] ?? [];
      const existing = list.find((item) => item.product.id === product.id);
      const nextList = existing
        ? list.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
              : item
          )
        : [...list, { product, quantity: clampQuantity(quantity) }];
      return { ...prev, [key]: nextList };
    });
  };

  const updateQuantity = (productId: Product["id"], quantity: number) => {
    const nextQty = clampQuantity(quantity);
    setVendorCarts((prev) => {
      const key = activeVendorId ?? "default";
      const list = prev[key] ?? [];
      const nextList =
        nextQty < MIN_QUANTITY
          ? list.filter((item) => item.product.id !== productId)
          : list.map((item) =>
              item.product.id === productId ? { ...item, quantity: nextQty } : item
            );
      return { ...prev, [key]: nextList };
    });
  };

  const removeItem = (productId: Product["id"]) => {
    setVendorCarts((prev) => {
      const key = activeVendorId ?? "default";
      const list = prev[key] ?? [];
      return { ...prev, [key]: list.filter((item) => item.product.id !== productId) };
    });
  };

  const clearCart = () => {
    setVendorCarts({ default: [] });
    setActiveVendorId(null);
    localStorage.removeItem("cartProduct");
  };

  const value = useMemo<CartContextValue>(
    () => ({
      CartOpen,
      setCartOpen,
      cartItems,
      activeVendorId,
      setActiveVendorId,
      ensureVendorCart,
      consumerSubtotal,
      bulkEligible,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [CartOpen, cartItems, consumerSubtotal, bulkEligible, activeVendorId, addItem, updateQuantity, removeItem, ensureVendorCart, setCartOpen, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCartContext = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
  return ctx;
};

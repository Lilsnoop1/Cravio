"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Search, Filter, ArrowUpDown } from "lucide-react";
import { useProduct } from "../context/ProductsContext";
import { useProductModal } from "../context/ProductModalContext";
import { Product } from "../Data/database";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type SortBy = "price" | "company" | "category" | "none";
type SortOrder = "asc" | "desc";

export default function MobileSearchDrawer({ isOpen, onClose }: Props) {
  const { products: ProductFetch } = useProduct();
  const { isOpen: openModal, setProduct, setIsOpen } = useProductModal();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("none");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [iconToggled, setIconToggled] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSortBy("none");
      setSortOrder("asc");
      setShowSortOptions(false);
      setIconToggled(false);
      return;
    }

    // ensure the search icon renders before morphing to X
    setIconToggled(false);
    const id = setTimeout(() => setIconToggled(true), 40);
    return () => clearTimeout(id);
  }, [isOpen]);

  const results = useMemo(() => {
    if (!ProductFetch) return [];
    const term = query.toLowerCase();
    const filtered = ProductFetch.filter((p: Product) =>
      `${p.name} ${p.company} ${p.category}`.toLowerCase().includes(term)
    );

    // Apply sorting
    if (sortBy !== "none" && filtered.length > 0) {
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
          case "price":
            aValue = a.price;
            bValue = b.price;
            break;
          case "company":
            aValue = a.company.toLowerCase();
            bValue = b.company.toLowerCase();
            break;
          case "category":
            aValue = a.category.toLowerCase();
            bValue = b.category.toLowerCase();
            break;
          default:
            return 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === "asc" ? comparison : -comparison;
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return filtered.slice(0, 20);
  }, [ProductFetch, query, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: SortBy) => {
    let newSortOrder = sortOrder;

    // If clicking the same sort option, toggle order
    if (sortBy === newSortBy) {
      newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      // Default to ascending for new sort
      newSortOrder = "asc";
    }

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setShowSortOptions(false);
  };

  const getSortLabel = () => {
    if (sortBy === "none") return "Sort";
    const orderLabel = sortOrder === "asc" ? "↑" : "↓";
    const sortLabel = sortBy.charAt(0).toUpperCase() + sortBy.slice(1);
    return `${sortLabel} ${orderLabel}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl rounded-l-3xl flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
          <button
            aria-label="Toggle search drawer"
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            onClick={() => {
              setIconToggled(false);
              onClose();
            }}
          >
            <span className="relative w-9 h-9 flex items-center justify-center">
              <Search
                className={`absolute w-5 h-5 text-slate-600 transition-all duration-200 ${iconToggled ? "opacity-0 -rotate-45 scale-75" : "opacity-100 rotate-0 scale-100"}`}
              />
              <X
                className={`absolute w-5 h-5 text-slate-700 transition-all duration-200 ${iconToggled ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-45 scale-75"}`}
              />
            </span>
          </button>
          <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200 rounded-full px-3 py-2 shadow-sm">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the store"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="p-2 rounded-full hover:bg-slate-100 flex items-center gap-1"
          >
            <Filter className="w-5 h-5 text-slate-700" />
            <span className="text-xs text-slate-700 font-medium">{getSortLabel()}</span>
          </button>
        </div>

        {/* Sort Options */}
        {showSortOptions && (
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Sort by:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSortChange("price")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                    sortBy === "price"
                      ? "bg-primary text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Price
                  {sortBy === "price" && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSortChange("company")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                    sortBy === "company"
                      ? "bg-primary text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Company
                  {sortBy === "company" && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSortChange("category")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                    sortBy === "category"
                      ? "bg-primary text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Category
                  {sortBy === "category" && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
                {(sortBy !== "none") && (
                  <button
                    onClick={() => handleSortChange("none")}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-slate-500 mt-6 text-center">No results</p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                className="w-full text-left rounded-xl border border-slate-200 px-3 py-3 hover:border-primary transition"
                onClick={() => {
                  setProduct(item);
                  setIsOpen(true);
                  onClose();
                }}
              >
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">{item.company}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


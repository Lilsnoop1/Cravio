"use client"
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import type { Product, SearchBarProps } from "../Data/database";
import { useProduct } from "../context/ProductsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductModal } from "../context/ProductModalContext";
import CatalogImage from "./CatalogImage";

const RESULT_LIMIT = 8;

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const { setProduct, setIsOpen: setModalOpen } = useProductModal();
  const { ProductFetch } = useProduct();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      const results = ProductFetch
        ? ProductFetch.filter((snack: Product) => {
            const searchTerm = query.toLowerCase();
            return (
              snack.name.toLowerCase().includes(searchTerm) ||
              snack.company.toLowerCase().includes(searchTerm) ||
              snack.category.toLowerCase().includes(searchTerm)
            );
          })
        : [];
      setFilteredResults(results);
      setDropdownOpen(results.length > 0);
    } else {
      setFilteredResults([]);
      setDropdownOpen(false);
    }
  }, [query, ProductFetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(filteredResults);
    }
    setDropdownOpen(false);
  };

  const handleReset = () => {
    setQuery("");
    setFilteredResults([]);
    setDropdownOpen(false);
    if (onSearch) {
      onSearch([]);
    }
  };

  const openProduct = (snack: Product) => {
    setProduct(snack);
    setModalOpen(true);
    setDropdownOpen(false);
  };

  const visibleResults = filteredResults.slice(0, RESULT_LIMIT);
  const extraCount = filteredResults.length - visibleResults.length;

  return (
    <div className="hidden md:block sticky z-30 py-5 px-4 md:px-6 bg-white/80 backdrop-blur top-[var(--storefront-header-height,0px)]">
      <div ref={dropdownRef} className="relative mx-auto w-full max-w-5xl">
        <form
          onSubmit={handleSearch}
          className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search snacks, confectioneries and companies"
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {query && (
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-slate-500">
              Clear
            </Button>
          )}
        </form>

        {dropdownOpen && visibleResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <ul className="max-h-96 overflow-y-auto py-1">
              {visibleResults.map((snack) => {
                const price = snack.consumerPrice ?? snack.price;
                return (
                  <li key={snack.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openProduct(snack);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-amber-50/80 transition-colors"
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <CatalogImage
                          src={snack.image}
                          alt={snack.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sifonn text-sm font-semibold text-slate-900">
                          {snack.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {snack.company}
                          {snack.category ? ` · ${snack.category}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 font-sifonn text-sm font-bold text-red-600">
                        Rs {price}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {extraCount > 0 && (
              <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                +{extraCount} more matches. Refine your search to narrow results.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

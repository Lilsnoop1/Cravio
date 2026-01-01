"use client"
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import type { Product, SearchBarProps, SortBy, SortOrder } from "../Data/database";
import { useProduct } from "../context/ProductsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductModal } from "../context/ProductModalContext";

const SearchBar = ({ onSearch, onSort }: SearchBarProps) => {
  const { isOpen, setProduct } = useProductModal();
  const { ProductFetch } = useProduct();
  const [query, setQuery] = useState("");
  const [isOpening, setIsOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("none");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      const results = ProductFetch?ProductFetch.filter((snack:Product) => {
        const searchTerm = query.toLowerCase();
        return (
          snack.name.toLowerCase().includes(searchTerm) ||
          snack.company.toLowerCase().includes(searchTerm) ||
          snack.category.toLowerCase().includes(searchTerm)
        );
      }):[];
        setFilteredResults(results);
        setIsOpen(results.length > 0);
      } else {
        setFilteredResults([]);
        setIsOpen(false);
      }
    }, [query, ProductFetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(filteredResults);
    }
    setIsOpen(false);
  };

  const handleSelectSnack = (snack: Product) => {
    setQuery(snack.name);
    setIsOpen(false);
    if (onSearch) {
      onSearch([snack]);
    }
  };

  const handleReset = () => {
    setQuery("");
    setFilteredResults([]);
    setIsOpen(false);
    if (onSearch) {
      onSearch([]);
    }
  };

  const handleSortChange = (newSortBy: SortBy) => {
    let newSortOrder = sortOrder;

    if (sortBy === newSortBy) {
      newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      newSortOrder = "asc";
    }

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);

    if (onSort) {
      onSort(newSortBy, newSortOrder);
    }
  };

  return (
    <div className="hidden md:block sticky top-0 z-40 py-5 px-4 md:px-6 bg-white/80 backdrop-blur">
      <form
        onSubmit={handleSearch}
        ref={dropdownRef as unknown as React.RefObject<HTMLFormElement>}
        className="relative mx-auto flex w-full max-w-5xl items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md"
      >
        <Search className="h-5 w-5 text-gray-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search snacks, confectioneries and companies"
          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {query && (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-gray-500">
            Clear
          </Button>
        )}

        {isOpening && filteredResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl z-50">
            {filteredResults.map((snack) => (
              <button
                key={snack.id}
                onClick={() => { setProduct(snack); setIsOpen(true); }}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
              >
                <img
                  src={snack.image}
                  alt={snack.name}
                  className="h-14 w-14 flex-shrink-0 rounded-md object-cover shadow-sm"
                />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{snack.name}</h3>
                      <div className="mt-1 flex gap-2 text-[11px] text-gray-600">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">Company: {snack.company}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">Category: {snack.category}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                      ${snack.price.toFixed(2)}
                    </span>
                  </div>
                  {snack.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{snack.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;

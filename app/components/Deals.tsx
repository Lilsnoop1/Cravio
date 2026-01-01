"use client"
import { ArrowRight, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import type { DealsCardProps, Product } from '../Data/database';
import Loading from './Loading';
import { useProduct } from '../context/ProductsContext';
import { useCartContext } from '../context/CartContext';

export default function Deals({Name, range, index}:DealsCardProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const {ProductFetch, loading} = useProduct();
  const { cartItems } = useCartContext();
  const hasCart = cartItems.length > 0;
  
  const categorySingles = useMemo(() => {
    if (!ProductFetch) return [];
    const seen = new Set<string>();
    const selected: Product[] = [];
    for (const product of ProductFetch) {
      if (!product.image) continue;
      if (seen.has(product.category)) continue;
      seen.add(product.category);
      selected.push(product);
    }
    return selected;
  }, [ProductFetch]);

  const rangedProducts = useMemo(() => {
    if (!ProductFetch) return [];
    const source = ProductFetch.filter((p: Product) => p.image);
    if (range && range.length === 2) {
      const [start, end] = range;
      return source.slice(start, end);
    }
    if (typeof index === "number") {
      return source.slice(index, index + 1);
    }
    return categorySingles;
  }, [ProductFetch, range, index, categorySingles]);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`deals-container${Name}`);
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if(loading){
    return <Loading/>
  }

  if(!rangedProducts || rangedProducts.length === 0){
    return (
      <section className="py-4 px-5">
        <div className="max-w-md lg:max-w-4xl md:max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-danson text-xl md:text-3xl font-bold text-slate-800">
                {Name}
              </h2>
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-slate-500">No products available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 px-5 sm:px-6 md:px-8 overflow-hidden">
      <div className={`w-full max-w-screen-xl mx-auto ${hasCart ? "md:max-w-[calc(100vw-460px)] md:mx-0" : ""}`}>
        <div className="flex items-center justify-between gap-3 mb-5 md:mb-6 rounded-lg bg-white shadow-sm px-4 py-3">
          <div className="space-y-1">
            <p className="uppercase text-[11px] tracking-[0.18em] text-slate-600 font-semibold">
              Limited time picks
            </p>
            <h2 className="font-danson text-2xl md:text-3xl font-bold leading-tight text-slate-900">
              {Name}
            </h2>
          </div>
          <button className="group flex items-center gap-2 text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300">
            <span className="text-sm md:text-base">View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        <div className="relative group/carousel overflow-hidden w-full max-w-screen -mx-5 sm:-mx-6 md:-mx-8 px-5 sm:px-6 md:px-8">
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>

          <div
            id={"deals-container"+Name}
            className="flex overflow-x-auto gap-3 sm:gap-4 pr-2 scrollbar-hide snap-x snap-mandatory w-full max-w-full min-w-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {rangedProducts.map((deal: Product, index:number) => (
              <ProductCard product={deal} key={index} dest="deal"/>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        </div>
      </div>
    </section>
  );
}

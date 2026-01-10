"use client"
import { useMemo, useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../Data/database';
import Loading from './Loading';
import { useProduct } from '../context/ProductsContext';
import { useCartContext } from '../context/CartContext';

export default function AllProductsGrid() {
  const { ProductFetch, loading } = useProduct();
  const { cartItems, CartOpen } = useCartContext();
  const isCartOpen = cartItems.length > 0 && CartOpen;
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Filter products with images
  const allProducts = useMemo(() => {
    if (!ProductFetch) return [];
    return ProductFetch.filter((p: Product) => p.image);
  }, [ProductFetch]);

  // Generate displayed products using modulo for seamless infinite loop
  useEffect(() => {
    if (allProducts.length === 0) {
      setDisplayedProducts([]);
      return;
    }

    const totalItems = page * itemsPerPage;
    const products: Product[] = [];
    
    // Use modulo to cycle through products infinitely
    for (let i = 0; i < totalItems; i++) {
      const productIndex = i % allProducts.length;
      products.push(allProducts[productIndex]);
    }
    
    setDisplayedProducts(products);
  }, [allProducts, page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerTarget.current || loading || allProducts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Always load more - the modulo logic handles the looping
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [page, allProducts.length, loading]);

  if (loading) {
    return <Loading />;
  }

  if (!allProducts || allProducts.length === 0) {
    return (
      <section className="py-4 px-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center py-8">
            <p className="text-slate-500">No products available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 px-5 sm:px-6 md:px-8">
      <div className={`w-full max-w-screen-xl mx-auto transition-all duration-300 ${isCartOpen ? "md:max-w-[calc(100vw-460px)] md:mx-0" : ""}`}>
        <div className="flex items-center justify-between gap-3 mb-5 md:mb-6">
          <h2 className="font-sifonn text-2xl md:text-3xl font-semibold text-slate-900">
            All Products
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {displayedProducts.map((product: Product, index: number) => (
            <ProductCard 
              key={`${product.id}-${index}`} 
              product={product} 
              dest="grid"
            />
          ))}
        </div>

        {/* Observer target for infinite scroll */}
        <div ref={observerTarget} className="h-10 w-full" />
      </div>
    </section>
  );
}


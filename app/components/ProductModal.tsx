"use client";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useProductModal } from "@/app/context/ProductModalContext";
import { useCartContext } from "../context/CartContext";
import { Product } from "../Data/database";
import { useProduct } from "../context/ProductsContext";
import { useSession } from "next-auth/react";

export default function ProductModal() {
  const {isOpen, product, setIsOpen } = useProductModal();
  const { addItem } = useCartContext();
  const { ProductFetch } = useProduct();
  const { data: session } = useSession();
  const isEmployee = session?.user?.role === "EMPLOYEE";
  if (!isOpen || !product) return null;

  const consumer = product.consumerPrice ?? product.price;
  const retail = product.originalPrice ?? product.retailPrice ?? consumer;
  const discountAmount =
    retail && consumer && retail > consumer ? retail - consumer : 0;
  const discountPercent =
    discountAmount > 0 ? Math.round((discountAmount / retail) * 100) : 0;
  const isDiscounted = !isEmployee && discountAmount > 0;
  const displayPrice = isEmployee
    ? product.bulkPrice ?? retail ?? consumer
    : consumer;

  const scrollCarousel = (containerId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10020] flex items-center justify-center p-3 md:p-4 overflow-y-auto scroll-smooth">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto overscroll-contain shadow-2xl relative my-6 md:my-8">
        <button
          onClick={()=>setIsOpen(false)}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:rotate-90"
        >
          <X className="w-6 h-6 text-slate-700" />
        </button>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8 items-start md:items-center">
            <div className="relative overflow-hidden rounded-2xl bg-slate-100 aspect-square max-h-[260px] md:max-h-none">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
                {isDiscounted && (
                  <div className="absolute top-3 left-3 bg-primary text-accents font-sifonn font-bold px-3 py-1 rounded-lg text-xs shadow-md">
                    {discountPercent}% off
                  </div>
                )}
            </div>

            <div className="flex flex-col justify-center space-y-3 md:space-y-4">
              <div>
                <h2 className="font-brasika text-xl md:text-3xl font-bold text-slate-800 mb-1">
                  {product.name}
                </h2>
                {product.company && (
                  <p className="font-sifonn text-slate-600 text-sm">
                    {product.company}
                  </p>
                )}
              </div>

                <div className="flex items-baseline gap-2 md:gap-3">
                  <span className="font-sifonn text-2xl md:text-3xl font-bold text-red-600">
                    Rs {displayPrice}
                  </span>
                  {!isEmployee && retail > consumer && (
                    <span className="font-sifonn text-lg md:text-xl text-slate-400 line-through">
                      Rs {retail}
                    </span>
                  )}
                </div>
                {product.bulkPrice && (
                  <p className="text-xs md:text-sm text-amber-700 font-semibold">
                    Bulk price: Rs {product.bulkPrice} (applies on orders ≥ Rs 20,000)
                  </p>
                )}
                {isDiscounted && (
                  <p className="text-xs md:text-sm text-red-600 font-semibold">
                    Save Rs {discountAmount.toFixed(0)} ({discountPercent}% off)
                  </p>
                )}

              <button
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-sifonn font-bold py-3 md:py-4 
              rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                onClick={() => {
                  addItem(product, 1);
                  setIsOpen(false);
                }}
              >
                Add To Cart
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 md:pt-8 mb-6 md:mb-8">
            <h3 className="font-brasika text-xl font-bold text-slate-800 mb-4">
              Product Information
            </h3>
            <p className="font-sifonn text-slate-600 leading-relaxed">
              {product.description || 'Premium quality snack made with the finest ingredients. Perfect for a quick energy boost or satisfying your cravings. Carefully crafted to deliver exceptional taste and nutritional value in every bite.'}
            </p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 md:p-6 mb-5 md:mb-6">
            <h3 className="font-brasika text-xl font-bold text-slate-800 mb-6 text-center">
              More Like This
            </h3>

            <div className="relative group/carousel">
              <button
                onClick={() => scrollCarousel('similar-products', 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>

              <div
                id="similar-products"
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
              >
                {ProductFetch?ProductFetch.map((item:Product, index:number) => (
                  <div
                    key={index}
                    className="group flex-shrink-0 w-36 snap-start"
                  >
                    <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="relative mb-3">
                        <div className="relative overflow-hidden rounded-lg bg-slate-100 aspect-square">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <button
                          className="absolute bottom-2 right-2 w-8 h-8 bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-900 transition-all duration-300"
                          onClick={() => addItem(item, 1)}
                          aria-label="Add to cart"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <p className="font-sifonn text-sm font-bold text-slate-800 mb-1">
                        Rs {item.price}
                      </p>
                      <p className="font-sifonn text-xs text-slate-600 line-clamp-2">
                        {item.name}
                      </p>
                      <p className="font-sifonn text-xs text-slate-500 mt-1">
                        {item.company}
                      </p>
                    </div>
                  </div>
                )):null}
              </div>

              <button
                onClick={() => scrollCarousel('similar-products', 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 md:p-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-brasika text-lg font-bold py-2 px-6 rounded-full w-fit mx-auto mb-6 shadow-lg">
              People Also Bought
            </div>

            <div className="relative group/carousel">
              <button
                onClick={() => scrollCarousel('also-bought', 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>

              <div
                id="also-bought"
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
              >
                {ProductFetch?ProductFetch.map((item:Product, index:number) => (
                  <div
                    key={index}
                    className="group flex-shrink-0 w-36 snap-start"
                  >
                    <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="relative mb-3">
                        <div className="relative overflow-hidden rounded-lg bg-slate-100 aspect-square">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <button
                          className="absolute bottom-2 right-2 w-8 h-8 bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-900 transition-all duration-300"
                          onClick={() => addItem(item, 1)}
                          aria-label="Add to cart"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <p className="font-sifonn text-sm font-bold text-slate-800 mb-1">
                        ${item.price}
                      </p>
                      <p className="font-sifonn text-xs text-slate-600 line-clamp-2">
                        {item.name}
                      </p>
                      <p className="font-sifonn text-xs text-slate-500 mt-1">
                        {item.company}
                      </p>
                    </div>
                  </div>
                )):null}
              </div>

              <button
                onClick={() => scrollCarousel('also-bought', 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

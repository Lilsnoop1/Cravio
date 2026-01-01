"use client";
import { useCartContext } from "@/app/context/CartContext";
import { useProductModal } from "@/app/context/ProductModalContext";
import { Plus } from "lucide-react";
import { Product } from "@/app/Data/database";
import { useSession } from "next-auth/react";

const ProductCard = ({ product, dest }: { product: Product; dest: string }) => {
  // Client-side hooks live here
  const { setProduct, setIsOpen } = useProductModal();
  const { addItem } = useCartContext();
  const { data: session } = useSession();
  const isEmployee = session?.user?.role === "EMPLOYEE";

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

  const isSlider = dest === "deal";

  return (
    <div
      className={`group h-full ${isSlider ? "flex-shrink-0 snap-start min-w-[120px] sm:min-w-[180px] max-w-[180px]" : "w-full"}`}
    >
      <div className={`bg-white rounded-lg ${isSlider ? 'p-2' : 'p-1.5 sm:p-2'} h-full shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
        <div className={`relative ${isSlider ? 'mb-2' : 'mb-1.5 sm:mb-2'}`}>
          <div className="relative overflow-hidden rounded-md bg-slate-100 aspect-square w-full">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full  object-cover group-hover:scale-105 transition-transform duration-300"
              onClick={() => {
                setProduct(product);
                setIsOpen(true);
              }}
            />

            {!isEmployee && isDiscounted ? (
              <div className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 bg-primary text-accents font-sifonn font-bold px-1 py-0.5 rounded text-[9px] sm:text-[10px] shadow-sm`}>
                {discountPercent}% off
              </div>
            ) : null}
          </div>
          <button
            className={`absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 ${isSlider ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'} bg-white rounded-full shadow-md flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all duration-300 transform hover:scale-110`}
            onClick={() => addItem(product, 1)}
            aria-label="Add to cart"
          >
            <Plus className={`${isSlider ? 'w-3 h-3' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'}`} />
          </button>
        </div>

        <div className={`space-y-0.5 sm:space-y-1 ${isSlider ? 'border-t border-slate-100 pt-1.5' : 'border-t border-slate-100 pt-1 sm:pt-1.5 sm:border-t-0'}`}>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className={`font-sifonn ${isSlider ? 'text-xs' : 'text-[11px] sm:text-xs'} font-bold text-red-600`}>
              Rs {displayPrice}
            </span>
            {!isEmployee && retail > consumer ? (
              <span className={`font-sifonn ${isSlider ? 'text-[10px]' : 'text-[9px] sm:text-[10px]'} text-slate-400 line-through`}>
                Rs {retail}
              </span>
            ) : null}
          </div>

          <h3 className={`font-sifonn ${isSlider ? 'text-[10px]' : 'text-[9px] sm:text-[10px]'} font-semibold text-slate-700 line-clamp-2 min-h-[1.4rem] sm:min-h-[1.6rem]`}>
            {product.name}
          </h3>
          {product.bulkPrice && (
            <p className={`text-[8px] sm:text-[9px] text-amber-700 font-semibold`}>
              Bulk: Rs {product.bulkPrice}
            </p>
          )}
          {!isEmployee && isDiscounted && (
            <p className={`text-[8px] sm:text-[9px] text-red-600 font-semibold`}>
              {discountPercent}% off
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
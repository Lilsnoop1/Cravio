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

  const displayPrice = isEmployee
    ? product.bulkPrice ?? retail ?? consumer
    : consumer;

  const isSlider = dest === "deal";

  return (
    <div
      className={`group h-full ${isSlider ? "flex-shrink-0 snap-start min-w-[110px] sm:min-w-[160px] max-w-[170px]" : "w-full"}`}
    >
      <div className={`bg-white rounded-lg ${isSlider ? 'p-1.5' : 'p-1.5 sm:p-2'} h-full shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
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
          </div>
          <button
            className={`absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 ${isSlider ? 'w-8 h-8' : 'w-6 h-6 sm:w-7 sm:h-7'} bg-white rounded-full shadow-md flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all duration-300 transform hover:scale-110`}
            onClick={() => addItem(product, 1)}
            aria-label="Add to cart"
          >
            <Plus className={`${isSlider ? 'w-4 h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'}`} />
          </button>
        </div>

        <div className={`space-y-0.5 sm:space-y-1 ${isSlider ? 'border-t border-slate-100 pt-1.5' : 'border-t border-slate-100 pt-1 sm:pt-1.5 sm:border-t-0'}`}>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className={`font-sifonn ${isSlider ? 'text-xs' : 'text-sm'} font-bold text-red-600`}>
              Rs {displayPrice}
            </span>
            {!isEmployee && retail > consumer ? (
              <span className={`font-sifonn ${isSlider ? 'text-[10px]' : 'text-[10px] sm:text-[11px]'} text-slate-400 line-through`}>
                Rs {retail}
              </span>
            ) : null}
          </div>

          <h3 className={`font-sifonn ${isSlider ? 'text-[11px]' : 'text-sm sm:text-[15px]'} font-semibold text-slate-800 line-clamp-2 min-h-[1.5rem] sm:min-h-[1.8rem]`}>
            {product.name}
          </h3>
          {product.bulkPrice && (
            <p className={`font-sifonn ${isSlider ? 'text-sm' : 'text-base sm:text-lg'} font-bold text-green-700`}>
              Bulk: Rs {product.bulkPrice}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
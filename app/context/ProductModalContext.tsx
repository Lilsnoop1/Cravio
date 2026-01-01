"use client"
import { createContext, useContext, useState } from "react";
import { Product } from "../Data/database";

type ProductModalValue = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  product: Product | null;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
};

const ProductModalContext = createContext<ProductModalValue | null>(null);

export function ProductModalProvider({children}:{children:React.ReactNode}) {
    const [isOpen, setIsOpen] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);

  return (
    <ProductModalContext.Provider value={{isOpen,setIsOpen,product,setProduct}}>
        {children}
    </ProductModalContext.Provider>
  )
}

export const useProductModal= ()=>{
  const ctx = useContext(ProductModalContext);
  if(!ctx) throw new Error("useProductModal must be used inside ProductModalProvider");
  return ctx;
}
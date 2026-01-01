"use client"
import { createContext, useContext, useState,useEffect } from "react";
import { CategoryFetch } from "../Data/database";
type CategoryValue = {
  categories: CategoryFetch[] | null;
  setCategories: React.Dispatch<React.SetStateAction<CategoryFetch[] | null>>;
  // legacy alias
  CategoryFetched?: CategoryFetch[] | null;
  setCategoryFetched?: React.Dispatch<React.SetStateAction<CategoryFetch[] | null>>;
};

const CategoryContext = createContext<CategoryValue | null>(null);

export function CategoryProvider({children}:{children:React.ReactNode}) {
    const [categories,setCategories] = useState<CategoryFetch[] | null>(null);
    const fetchProducts = async () => {
    try {
      const res = await fetch("/api/category"); // GET request
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);
  return (
    <CategoryContext.Provider value={{categories,setCategories, CategoryFetched: categories, setCategoryFetched: setCategories}}>
        {children}
    </CategoryContext.Provider>
  )
}

export const useCategory= ()=>{
  const ctx = useContext(CategoryContext);
  if(!ctx) throw new Error("useCategory must be used inside CategoryProvider");
  return ctx;
}
"use client";

import SearchBar from "./components/SearchBar";
import Carousel from "./components/Carousel";
import Categories from "./components/Categories";
import Deals from "./components/Deals";
import AllProductsGrid from "./components/AllProductsGrid";
import type { CategoryFetch, Company, Product } from "./Data/database";
import type { CatalogBanner } from "@/lib/catalog";

type HomeClientProps = {
  banners: CatalogBanner[];
  categories: CategoryFetch[];
  companies: Company[];
  products: Product[];
};

/** Client home tree for search, carousels, and cart interactions. */
export default function HomeClient({
  banners,
  categories,
  companies,
  products,
}: HomeClientProps) {
  return (
    <main>
      <SearchBar />
      <Carousel banners={banners} />
      <Categories categories={categories} companies={companies} />
      <Deals Name="Hot Deals - On the Clock" products={products} />
      <AllProductsGrid products={products} />
    </main>
  );
}

import HomeClient from "./HomeClient";
import { getBanners, getCategories, getCompanies, getProducts } from "@/lib/catalog";

export const revalidate = 300;

export default async function Page() {
  const [banners, categories, companies, products] = await Promise.all([
    getBanners(),
    getCategories(),
    getCompanies(),
    getProducts(),
  ]);

  return (
    <HomeClient
      banners={banners}
      categories={categories}
      companies={companies}
      products={products}
    />
  );
}

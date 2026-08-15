import { getCategories, getCompanies, getProducts } from "@/lib/catalog";
import CategoryProductsClient from "./CategoryProductsClient";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((category) => ({ categoryName: category.name }));
  } catch {
    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryName: string }>;
}) {
  const { categoryName } = await params;
  const decodedCategoryName = decodeURIComponent(categoryName);
  const categorySlug = decodedCategoryName.toLowerCase();

  const [products, companies] = await Promise.all([getProducts(), getCompanies()]);

  const categoryProducts = products.filter(
    (product) => product.category === decodedCategoryName && !product.isHidden
  );

  const companiesForCategory = companies
    .filter((company) => {
      if (company.isHidden) return false;
      if (Array.isArray(company.categories) && company.categories.length > 0) {
        return company.categories.some(
          (cat) => cat?.toLowerCase() === categorySlug
        );
      }
      return company.category?.toLowerCase() === categorySlug;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <CategoryProductsClient
      categoryName={decodedCategoryName}
      products={categoryProducts}
      companies={companiesForCategory}
    />
  );
}

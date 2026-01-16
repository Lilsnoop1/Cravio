"use client";

import type { CompanyProductsClientProps, Product } from "@/app/Data/database";
import ProductCard from "@/app/components/ProductCard";
import { useProduct } from "@/app/context/ProductsContext";
import { useCompanies } from "@/app/context/fetchCompanies";

const normalizeSlug = (slug: string) => slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function CompanyProductsClient({ companyName }: CompanyProductsClientProps) {
  const { products, loading: productsLoading } = useProduct();
  const { companies, loading: companiesLoading } = useCompanies();

  const normalizedSlug = normalizeSlug(companyName);

  // Filter products by company
  const companyProducts = products ? products.filter((product: Product) =>
    normalizeSlug(product.company) === normalizedSlug
  ) : [];

  // Find company details
  const company = companies ? companies.find((c) =>
    normalizeSlug(c.name) === normalizedSlug
  ) : null;

  if (productsLoading || companiesLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p>Loading company products...</p>
        </div>
      </div>
    );
  }

  if (!companyProducts || companyProducts.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600">Company Not Found 🙁</h1>
        <p className="mt-4 text-gray-600">
          No products found for &quot;{companyName.replace(/-/g, " ")}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/80 backdrop-blur-md flex items-center gap-3">
        {company?.image && (
          <div className="w-14 h-14 border rounded-full p-2 flex items-center justify-center bg-white">
            <img
              src={company.image}
              alt={`${company.name} Logo`}
              className="object-contain w-full h-full"
            />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-sifonn">
            {company?.name || companyName.replace(/-/g, ' ')} Products
          </h1>
          <p className="text-sm text-gray-500 font-sifonn">
            Explore the range of snacks from {company?.name || companyName.replace(/-/g, ' ')}.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mt-2 pb-24">
        {companyProducts.map(product => (
          <ProductCard key={product.id} product={product} dest="company" />
        ))}
      </div>
    </div>
  );
}

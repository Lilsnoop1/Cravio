"use client";
import React, { useState } from "react";
import { Company, Product } from "@/app/Data/database";
import ProductCard from "../../components/ProductCard";

export default function CategoryProductsClient({
  categoryName,
  products,
  companies,
}: {
  categoryName: string;
  products: Product[];
  companies: Company[];
}) {
  const [selectedCompany, setSelectedCompany] = useState<string>("All");

  const visibleProducts =
    selectedCompany === "All"
      ? products
      : products.filter((p: Product) => p.company === selectedCompany);

  return (
    <section className="py-8 pb-24 px-4 sm:px-6">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold font-sifonn mb-4">
          Category: {categoryName}
        </h1>

        {products.length === 0 ? (
          <div className="text-center py-8">
            <p>No products found in this category.</p>
          </div>
        ) : (
          <>
            {companies.length > 0 && (
              <div className="sticky top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 pb-4 pt-4 bg-white/80 backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setSelectedCompany("All")}
                    className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition ${
                      selectedCompany === "All"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-slate-700 border-slate-200 hover:border-primary"
                    }`}
                  >
                    All
                  </button>
                  {companies.map((company: Company) => (
                    <button
                      key={company.name}
                      onClick={() => setSelectedCompany(company.name)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition ${
                        selectedCompany === company.name
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-700 border-slate-200 hover:border-primary"
                      }`}
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                {visibleProducts.map((deal: Product) => (
                  <ProductCard key={deal.id} product={deal} dest="category" />
                ))}
              </div>
            ) : (
              <p>No products found in this category.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

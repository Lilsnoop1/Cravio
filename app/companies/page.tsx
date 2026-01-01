"use client"
import Link from "next/link";
import { useCompanies } from "../context/fetchCompanies";

// --- React Component ---

export default function CompaniesPage() {
  const { CompaniesFetch, loading } = useCompanies();

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-brasika mb-8 py-5 text-center text-gray-800">
          Our Snack Manufacturers
        </h1>
        <div className="text-center py-8">
          <p>Loading companies...</p>
        </div>
      </div>
    );
  }

  if (!CompaniesFetch || CompaniesFetch.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-brasika mb-8 py-5 text-center text-gray-800">
          Our Snack Manufacturers
        </h1>
        <div className="text-center py-8">
          <p>No companies available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-4xl font-brasika mb-6 text-center text-gray-800">
        Our Snack Manufacturers
      </h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 sm:gap-4 md:gap-5">
        {CompaniesFetch.map(company => (
  <div
    key={company.name}
    className="group flex-shrink-0"
  >
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      
      <Link href={`/companies/${company.name.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="relative mb-4">
          <div className="relative overflow-hidden rounded-xl bg-slate-100 aspect-square flex items-center justify-center">
            {company.image ? (
              <img
                src={company.image}
                alt={`${company.name} Logo`}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h2 className="font-sifonn text-sm font-semibold text-slate-700 line-clamp-2 min-h-[2.5rem]">
            {company.name}
          </h2>

          <p className="text-[11px] text-amber-700 font-semibold">
            {company.productCount} {company.productCount === 1 ? 'Product' : 'Products'} Listed
          </p>
        </div>
      </Link>

    </div>
  </div>
))}

      </div>
    </div>
  );
}
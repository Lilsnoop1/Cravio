import { CompanyProductsClient } from "./CompanyProductsClient";
import { companySlug, getCompanies, getProducts, normalizeSlug } from "@/lib/catalog";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const companies = await getCompanies();
    return companies.map((company) => ({
      companydata: companySlug(company.name),
    }));
  } catch {
    return [];
  }
}

export default async function CompanyProductsPage({
  params,
}: {
  params: Promise<{ companydata: string }>;
}) {
  const { companydata } = await params;
  const normalizedSlug = normalizeSlug(companydata);

  const [products, companies] = await Promise.all([getProducts(), getCompanies()]);

  const company =
    companies.find((c) => normalizeSlug(c.name) === normalizedSlug) ?? null;

  const companyProducts = products.filter(
    (product) => normalizeSlug(product.company) === normalizedSlug
  );

  return (
    <CompanyProductsClient
      companyName={companydata}
      company={company}
      products={companyProducts}
    />
  );
}

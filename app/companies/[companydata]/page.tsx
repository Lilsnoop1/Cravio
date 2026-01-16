import type { CompanyPageProps } from '@/app/Data/database';
import { CompanyProductsClient } from './CompanyProductsClient';

const normalizeSlug = (slug: string) => slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default async function CompanyProductsPage({ params }: { params: Promise<{ companydata: string }> }) {
  const { companydata } = await params;
  const companyName = companydata;

  return (
    <CompanyProductsClient companyName={companyName} />
  );
}
import type { CompanyPageProps } from '@/app/Data/database';
import { CompanyProductsClient } from './CompanyProductsClient';

const normalizeSlug = (slug: string) => slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function CompanyProductsPage({ params }: CompanyPageProps) {
  const companyName = params.companydata;

  return (
    <CompanyProductsClient companyName={companyName} />
  );
}
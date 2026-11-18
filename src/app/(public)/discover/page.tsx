import React from "react";
import {
  getSchemeDiscoveryCatalogue,
  parseSchemeFilterParams,
} from "@/services/scheme/scheme-service";
import { SchemeCatalogClient } from "@/components/schemes/SchemeCatalogClient";

export const dynamic = "force-dynamic";

interface DiscoverPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialFilters = parseSchemeFilterParams(resolvedSearchParams);

  // Fetch the full active, verified catalogue from Supabase so client filters
  // and category counts operate seamlessly over all verified records
  const catalogue = await getSchemeDiscoveryCatalogue({});

  return (
    <SchemeCatalogClient
      categories={catalogue.categories}
      allSchemes={catalogue.schemes}
      initialFilters={initialFilters}
    />
  );
}

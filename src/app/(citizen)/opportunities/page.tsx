import React from "react";
import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/infrastructure/supabase/server";
import { getCitizenSchemeEvaluations } from "@/services/scheme/scheme-service";
import { OpportunitiesClient } from "@/components/schemes/OpportunitiesClient";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  let result;
  try {
    result = await getCitizenSchemeEvaluations();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/login?next=/opportunities");
    }
    throw err;
  }

  return (
    <OpportunitiesClient
      entries={result.entries}
      counts={result.counts}
      isOnboardingComplete={result.completion.isOnboardingComplete}
    />
  );
}

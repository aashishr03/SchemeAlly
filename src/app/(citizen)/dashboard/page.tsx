import React from "react";
import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/infrastructure/supabase/server";
import { getCitizenSchemeEvaluations } from "@/services/scheme/scheme-service";
import { DashboardOverviewClient } from "@/components/dashboard/DashboardOverviewClient";

export const dynamic = "force-dynamic";

export default async function CitizenDashboardPage() {
  let result;
  try {
    result = await getCitizenSchemeEvaluations();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/login?next=/dashboard");
    }
    throw err;
  }

  return (
    <DashboardOverviewClient
      profile={result.profile}
      completion={result.completion}
      evaluation={{
        counts: result.counts,
        topEntries: result.entries
          .filter(
            (e) =>
              e.evaluation.outcome === "ELIGIBLE" ||
              e.evaluation.outcome === "POTENTIAL_MATCH"
          )
          .slice(0, 3),
        totalEvaluated: result.totalEvaluated,
      }}
    />
  );
}

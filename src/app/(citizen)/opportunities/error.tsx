"use client";

import React from "react";
import { useRouteErrorCopy, RouteErrorState } from "@/components/ui/route-error-state";

export default function OpportunitiesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useRouteErrorCopy();
  return (
    <RouteErrorState
      title={t.opportunitiesPage.error.title}
      description={t.opportunitiesPage.error.description}
      retryLabel={t.opportunitiesPage.error.retryButton}
      onRetry={reset}
      backHref="/dashboard"
      backLabel={t.nav.dashboard}
    />
  );
}

"use client";

import React from "react";
import { useRouteErrorCopy, RouteErrorState } from "@/components/ui/route-error-state";

export default function SchemeDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useRouteErrorCopy();
  return (
    <RouteErrorState
      title={t.schemeDetail.error.title}
      description={t.schemeDetail.error.description}
      retryLabel={t.schemeDetail.error.retryButton}
      onRetry={reset}
      backHref="/discover"
      backLabel={t.schemeDetail.backToCatalogue}
    />
  );
}

"use client";

import React from "react";
import { useRouteErrorCopy, RouteErrorState } from "@/components/ui/route-error-state";

export default function DiscoverError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useRouteErrorCopy();
  return (
    <RouteErrorState
      title={t.discoverPage.error.title}
      description={t.discoverPage.error.description}
      retryLabel={t.discoverPage.error.retryButton}
      onRetry={reset}
    />
  );
}

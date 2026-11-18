"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RouteErrorStateProps {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
  backHref?: string;
  backLabel?: string;
}

export function RouteErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  backHref,
  backLabel,
}: RouteErrorStateProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Card
        variant="glass"
        role="alert"
        className="mx-auto max-w-lg p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-extrabold text-[#0b172a]">{title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button type="button" variant="default" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{retryLabel}</span>
          </Button>
          {backHref && backLabel && (
            <Button asChild variant="secondary">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>{backLabel}</span>
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/** Convenience hook-backed wrappers so each route's error.tsx stays tiny. */
export function useRouteErrorCopy() {
  const { t } = useLanguage();
  return t;
}

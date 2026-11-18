"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Building2, Landmark } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSchemeDetailHref } from "@/services/scheme/schema";
import { SavedSchemeAction } from "@/components/schemes/SavedSchemeAction";
import { useSavedSchemes } from "@/components/schemes/SavedSchemesProvider";

export default function SavedSchemesPage() {
  const { locale, t } = useLanguage();
  const { items, isLoading, error, refresh } = useSavedSchemes();
  const text = t.savedSchemes.page;
  const isTa = locale === "ta";

  if (isLoading) {
    return (
      <div
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        role="status"
      >
        <p className="text-sm font-medium text-slate-600">{text.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Card
          variant="glass"
          className="mx-auto max-w-2xl space-y-4 p-6 text-center sm:p-8"
          role="alert"
        >
          <h1 className="text-2xl font-extrabold text-[#0b172a]">
            {text.errorTitle}
          </h1>
          <p className="text-sm text-slate-600">{error}</p>
          <Button type="button" onClick={() => void refresh()}>
            {text.retry}
          </Button>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <EmptyState
          badge={text.badge}
          title={text.emptyTitle}
          description={text.emptyDescription}
          icon={Bookmark}
          primaryActionLabel={text.discover}
          primaryActionHref="/discover"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="max-w-3xl space-y-3">
        <Badge variant="emeraldSoft">{text.badge}</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0b172a] sm:text-4xl">
          {text.title}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          {text.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map(({ scheme, savedAt }) => {
          const title = isTa ? scheme.name_ta : scheme.name_en;
          const category = isTa
            ? scheme.category.name_ta
            : scheme.category.name_en;
          const description = isTa
            ? scheme.short_description_ta
            : scheme.short_description_en;

          return (
            <Card
              key={scheme.id}
              variant="glass"
              data-testid={`saved-scheme-${scheme.slug}`}
              className="flex flex-col justify-between gap-5 p-5 sm:p-6"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{category}</Badge>
                  <Badge
                    variant={
                      scheme.government_level === "state"
                        ? "emeraldSoft"
                        : "default"
                    }
                  >
                    <Landmark className="h-3 w-3" aria-hidden="true" />
                    {scheme.government_level === "state"
                      ? text.jurisdictionState
                      : text.jurisdictionCentral}
                  </Badge>
                </div>
                <h2 className="text-lg font-extrabold leading-snug text-[#0b172a]">
                  {title}
                </h2>
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {isTa ? scheme.department_ta : scheme.department_en}
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
                <time
                  className="block text-xs text-slate-500"
                  dateTime={savedAt}
                >
                  {new Intl.DateTimeFormat(isTa ? "ta-IN" : "en-IN", {
                    dateStyle: "medium",
                  }).format(new Date(savedAt))}
                </time>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-4">
                <Button asChild size="sm">
                  <Link href={getSchemeDetailHref(scheme.slug)}>
                    {text.viewDetails}
                  </Link>
                </Button>
                <SavedSchemeAction
                  scheme={scheme}
                  mode="remove"
                  variant="outline"
                  size="sm"
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

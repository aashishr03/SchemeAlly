"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  EligibilityOutcome,
  EligibilityOutcomeCounts,
  SchemeEvaluationEntry,
} from "@/core/eligibility";
import { SchemeEvaluationCard } from "./SchemeEvaluationCard";

interface OpportunitiesClientProps {
  entries: SchemeEvaluationEntry[];
  counts: EligibilityOutcomeCounts;
  isOnboardingComplete: boolean;
}

type OutcomeFilter = EligibilityOutcome | "all";

const OUTCOME_FILTERS: {
  key: OutcomeFilter;
  labelKey:
    | "all"
    | "potentialMatch"
    | "eligible"
    | "insufficient"
    | "notEligible";
  icon: LucideIcon;
}[] = [
  { key: "all", labelKey: "all", icon: CircleHelp },
  {
    key: "ELIGIBLE",
    labelKey: "eligible",
    icon: CheckCircle2,
  },
  {
    key: "POTENTIAL_MATCH",
    labelKey: "potentialMatch",
    icon: AlertCircle,
  },
  {
    key: "INSUFFICIENT_INFORMATION",
    labelKey: "insufficient",
    icon: CircleHelp,
  },
  {
    key: "NOT_ELIGIBLE",
    labelKey: "notEligible",
    icon: XCircle,
  },
];

export function OpportunitiesClient({
  entries,
  counts,
  isOnboardingComplete,
}: OpportunitiesClientProps) {
  const { locale, t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<OutcomeFilter>("all");
  const text = t.opportunitiesPage;
  const isTa = locale === "ta";
  const totalEvaluated = Object.values(counts).reduce(
    (total, count) => total + count,
    0
  );

  const visibleEntries = useMemo(
    () =>
      activeFilter === "all"
        ? entries
        : entries.filter((entry) => entry.evaluation.outcome === activeFilter),
    [activeFilter, entries]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-7">
      <header className="max-w-3xl space-y-3">
        <Badge variant="emeraldSoft">{text.badge}</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0b172a]">
          {text.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {text.subtitle}
        </p>
      </header>

      <Card
        variant="subtle"
        data-testid="opportunities-safety-notice"
        className="flex items-start gap-3 p-4 sm:p-5 border-amber-200/80 bg-amber-50/80"
      >
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-amber-950">
          {text.safetyNotice}
        </p>
      </Card>

      {!isOnboardingComplete && (
        <Card
          variant="glass"
          data-testid="opportunities-onboarding-banner"
          className="flex flex-col gap-4 border border-emerald-200/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="space-y-1.5">
            <h2 className="font-bold text-[#0b172a]">
              {text.onboardingBannerTitle}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {text.onboardingBannerDescription}
            </p>
          </div>
          <Button asChild variant="emerald" className="shrink-0">
            <Link href="/profile">{text.onboardingBannerCta}</Link>
          </Button>
        </Card>
      )}

      <section aria-label={text.title} className="space-y-5">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={isTa ? "வடிகட்டி" : "Filter opportunities by outcome"}
        >
          {OUTCOME_FILTERS.map(({ key, labelKey, icon: Icon }) => {
            const count = key === "all" ? totalEvaluated : counts[key];
            const selected = activeFilter === key;

            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveFilter(key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[#0b172a] bg-[#0b172a] text-white"
                    : "border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{text.tabs[labelKey]}</span>
                <span className="tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {visibleEntries.length > 0 ? (
          <div
            data-testid="opportunities-grid"
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            {visibleEntries.map((entry) => (
              <SchemeEvaluationCard key={entry.scheme.id} entry={entry} />
            ))}
          </div>
        ) : (
          <Card
            variant="glass"
            data-testid={
              activeFilter === "all"
                ? "opportunities-empty"
                : "opportunities-empty-tab"
            }
            className="space-y-3 p-6 text-center sm:p-8"
          >
            <h2 className="text-lg font-extrabold text-[#0b172a]">
              {activeFilter === "all"
                ? t.emptyStates.opportunities.title
                : text.emptyTab.title}
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600">
              {activeFilter === "all"
                ? t.emptyStates.opportunities.description
                : text.emptyTab.description}
            </p>
            {activeFilter !== "all" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveFilter("all")}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {text.emptyTab.showAllButton}
              </Button>
            ) : (
              <Button asChild variant="emerald">
                <Link href="/profile">{t.emptyStates.opportunities.primaryAction}</Link>
              </Button>
            )}
          </Card>
        )}
      </section>
    </div>
  );
}
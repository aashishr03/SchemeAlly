"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles, UserCheck } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
  ProfileCompletionSummary,
  ProfileRow,
} from "@/services/profile/schema";
import { SchemeEvaluationCard } from "@/components/schemes/SchemeEvaluationCard";
import type {
  EligibilityOutcomeCounts,
  SchemeEvaluationEntry,
} from "@/core/eligibility";

export interface DashboardEvaluationSummary {
  counts: EligibilityOutcomeCounts;
  topEntries: SchemeEvaluationEntry[];
  totalEvaluated: number;
}

interface DashboardOverviewClientProps {
  profile: ProfileRow;
  completion: ProfileCompletionSummary;
  evaluation?: DashboardEvaluationSummary;
}

export function DashboardOverviewClient({
  profile,
  completion,
  evaluation,
}: DashboardOverviewClientProps) {
  const { t } = useLanguage();

  const displayName = profile.full_name?.trim();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Welcome & Profile Status Header Card */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <Badge variant="emeraldSoft">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.nav.dashboard}</span>
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]">
              {displayName
                ? `${t.dashboardShell.welcomePrefix} ${displayName}`
                : t.dashboardShell.welcomeToSchemeAlly}
            </h1>
            <p className="text-sm text-slate-600">
              {t.dashboardShell.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="emerald">
              <Link href="/profile">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                <span>{t.dashboardShell.updateProfileCta}</span>
              </Link>
            </Button>
            <Button asChild variant="glass">
              <Link href="/discover">
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>{t.nav.discover}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Completion & Summary Strip */}
        <div className="glass-card-inner rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-[#0b172a]">
                {t.dashboardShell.profileCardTitle}
              </span>
              <Badge
                variant={
                  completion.isOnboardingComplete ? "emeraldSoft" : "amberSoft"
                }
              >
                {completion.isOnboardingComplete
                  ? t.profilePage.onboardingCompleteBadge
                  : t.profilePage.onboardingIncompleteBadge}
              </Badge>
            </div>
            <span className="text-sm font-extrabold text-[#0e8a4f]">
              {completion.percentage}%
            </span>
          </div>

          <Progress
            value={completion.percentage}
            aria-label={t.profilePage.completionLabel}
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 text-xs text-slate-600">
            <p>
              {completion.isOnboardingComplete
                ? t.dashboardShell.profileReadyPrompt
                : t.dashboardShell.completeOnboardingPrompt}
            </p>
            <div className="flex flex-wrap items-center gap-4 shrink-0 font-semibold text-[#0b172a]">
              {completion.derivedAge !== null && (
                <span>
                  {t.profilePage.derivedAgeLabel}: {completion.derivedAge}{" "}
                  {t.profilePage.yearsOld}
                </span>
              )}
              {profile.state && <span>{profile.state}</span>}
              {profile.district && <span>{profile.district}</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Real profile-driven evaluation summary */}
      <Card
        variant="glass"
        data-testid="dashboard-evaluation-summary"
        className="p-6 sm:p-8 space-y-6"
      >
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[#0b172a]">
            {t.dashboardShell.evaluationSummaryTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {t.dashboardShell.evaluationSummarySubtitle}
          </p>
        </div>

        {evaluation ? (
          <>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  {
                    key: "ELIGIBLE",
                    label: t.dashboardShell.stats.eligibleLabel,
                    hint: t.dashboardShell.stats.eligibleHint,
                  },
                  {
                    key: "POTENTIAL_MATCH",
                    label: t.dashboardShell.stats.potentialMatchLabel,
                    hint: t.dashboardShell.stats.potentialMatchHint,
                  },
                  {
                    key: "INSUFFICIENT_INFORMATION",
                    label: t.dashboardShell.stats.insufficientLabel,
                    hint: t.dashboardShell.stats.insufficientHint,
                  },
                  {
                    key: "NOT_ELIGIBLE",
                    label: t.dashboardShell.stats.notEligibleLabel,
                    hint: t.dashboardShell.stats.notEligibleHint,
                  },
                ] as const
              ).map((stat) => (
                <div
                  key={stat.key}
                  data-testid={`dashboard-stat-${stat.key}`}
                  className="rounded-2xl bg-white/90 border border-slate-200/80 p-4 space-y-1"
                >
                  <dt className="text-xs font-bold text-slate-600">
                    {stat.label}
                  </dt>
                  <dd className="text-2xl font-extrabold text-[#0b172a]">
                    {evaluation.counts[stat.key]}
                  </dd>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {stat.hint}
                  </p>
                </div>
              ))}
            </dl>

            {evaluation.topEntries.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#0b172a]">
                    {t.dashboardShell.topOpportunitiesTitle}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {t.dashboardShell.topOpportunitiesSubtitle}
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {evaluation.topEntries.map((entry) => (
                    <SchemeEvaluationCard
                      key={entry.scheme.id}
                      entry={entry}
                      detailed={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                data-testid="dashboard-no-matches"
                className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 space-y-1"
              >
                <h3 className="text-sm font-extrabold text-[#0b172a]">
                  {t.dashboardShell.noMatchesYetTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t.dashboardShell.noMatchesYetDescription}
                </p>
              </div>
            )}

            <Button asChild variant="default" size="sm">
              <Link href="/opportunities">
                <span>{t.dashboardShell.viewAllOpportunitiesCta}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link href="/opportunities">
              <span>{t.nav.opportunities}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </Card>
    </div>
  );
}

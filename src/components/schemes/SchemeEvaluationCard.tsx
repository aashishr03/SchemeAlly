"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Info,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SchemeEvaluationEntry } from "@/core/eligibility";
import type { EligibilityOutcome } from "@/core/eligibility";
import { getSchemeDetailHref } from "@/services/scheme/schema";

export function outcomeBadgeVariant(
  outcome: EligibilityOutcome
): "emeraldSoft" | "amberSoft" | "outline" {
  if (outcome === "ELIGIBLE") return "emeraldSoft";
  if (outcome === "POTENTIAL_MATCH") return "amberSoft";
  return "outline";
}

const OUTCOME_CARD_TONE: Record<EligibilityOutcome, string> = {
  ELIGIBLE: "border-[#b7e7ce]",
  POTENTIAL_MATCH: "border-amber-300/90",
  INSUFFICIENT_INFORMATION: "border-slate-300/80",
  NOT_ELIGIBLE: "border-rose-200/90",
};

interface SchemeEvaluationCardProps {
  entry: SchemeEvaluationEntry;
  /** Show the full condition-by-condition reasons (opportunities page). */
  detailed?: boolean;
}

export function SchemeEvaluationCard({
  entry,
  detailed = true,
}: SchemeEvaluationCardProps) {
  const { locale, t } = useLanguage();
  const isTa = locale === "ta";
  const { scheme, evaluation } = entry;

  const name = isTa ? scheme.name_ta : scheme.name_en;
  const department = isTa ? scheme.department_ta : scheme.department_en;
  const officialUrl =
    scheme.official_application_url || scheme.official_source_url;
  const detailHref = getSchemeDetailHref(scheme.slug);
  const text = t.opportunitiesPage.card;

  return (
    <Card
      variant="glass"
      data-testid={`opportunity-card-${scheme.slug}`}
      data-outcome={evaluation.outcome}
      className={`p-5 sm:p-6 space-y-4 border ${OUTCOME_CARD_TONE[evaluation.outcome]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h3 className="text-base sm:text-lg font-extrabold text-[#0b172a] leading-snug">
            <Link
              href={detailHref}
              className="hover:text-[#0e8a4f] transition-colors"
            >
              {name}
            </Link>
          </h3>
          <p className="text-xs font-medium text-slate-500">{department}</p>
        </div>
        <Badge
          variant={outcomeBadgeVariant(evaluation.outcome)}
          data-testid="opportunity-outcome-badge"
        >
          {isTa ? evaluation.outcomeTitle_ta : evaluation.outcomeTitle_en}
        </Badge>
      </div>

      <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
        {isTa
          ? evaluation.outcomeDescription_ta
          : evaluation.outcomeDescription_en}
      </p>

      {detailed && (
        <div className="grid grid-cols-1 gap-3">
          {evaluation.passedConditions.length > 0 && (
            <ReasonList
              heading={`${text.passedHeading} (${evaluation.passedConditions.length})`}
              tone="text-[#0b6e3f]"
              icon={
                <CheckCircle2
                  className="h-3.5 w-3.5 text-[#0e8a4f] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              }
              items={evaluation.passedConditions.map((c) => ({
                id: c.id,
                text: isTa ? c.explanation_ta : c.explanation_en,
              }))}
            />
          )}
          {evaluation.failedConditions.length > 0 && (
            <ReasonList
              heading={`${text.failedHeading} (${evaluation.failedConditions.length})`}
              tone="text-rose-700"
              icon={
                <XCircle
                  className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              }
              items={evaluation.failedConditions.map((c) => ({
                id: c.id,
                text: isTa ? c.explanation_ta : c.explanation_en,
              }))}
            />
          )}
          {evaluation.missingConditions.length > 0 && (
            <ReasonList
              heading={`${text.missingHeading} (${evaluation.missingConditions.length})`}
              tone="text-slate-700"
              icon={
                <Info
                  className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              }
              items={evaluation.missingConditions.map((c) => ({
                id: c.id,
                text: isTa ? c.explanation_ta : c.explanation_en,
              }))}
            />
          )}
          {evaluation.outcome === "POTENTIAL_MATCH" &&
            evaluation.unverifiedAdditionalConditions.length > 0 && (
              <ReasonList
                heading={`${text.unverifiedHeading} (${evaluation.unverifiedAdditionalConditions.length})`}
                tone="text-amber-800"
                icon={
                  <AlertCircle
                    className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                }
                items={evaluation.unverifiedAdditionalConditions.map((c) => ({
                  id: c.id,
                  text: isTa ? c.label_ta : c.label_en,
                }))}
              />
            )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
        <Button asChild variant="default" size="sm">
          <Link href={detailHref}>
            <span>{text.viewSchemeCta}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
        {evaluation.outcome === "INSUFFICIENT_INFORMATION" && (
          <Button asChild variant="emerald" size="sm">
            <Link href="/profile">
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{text.updateProfileCta}</span>
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary" size="sm">
          <a href={officialUrl} target="_blank" rel="noopener noreferrer">
            <span>{text.officialPortalCta}</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </Card>
  );
}

function ReasonList({
  heading,
  tone,
  icon,
  items,
}: {
  heading: string;
  tone: string;
  icon: React.ReactNode;
  items: { id: string; text: string }[];
}) {
  return (
    <div className="rounded-xl bg-white/90 border border-slate-200/80 p-3.5 space-y-2">
      <p className={`text-xs font-bold ${tone}`}>{heading}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2 text-xs text-slate-700"
          >
            {icon}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

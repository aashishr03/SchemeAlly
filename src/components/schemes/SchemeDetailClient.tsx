"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Globe,
  Info,
  Landmark,
  ListChecks,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SavedSchemeAction } from "./SavedSchemeAction";
import {
  evaluateSchemeEligibility,
  type EvaluableCitizenProfile,
  type SchemeEligibilityEvaluationResult,
} from "@/core/eligibility";
import {
  extractAdditionalConditionsFromRootGroup,
  getSchemeDetailHref,
  type AdditionalVerificationCondition,
  type SchemeDetailItem,
  type TargetAudienceTag,
} from "@/services/scheme/schema";

interface SchemeDetailClientProps {
  scheme: SchemeDetailItem;
  profile?: EvaluableCitizenProfile | null;
  evaluation?: SchemeEligibilityEvaluationResult | null;
}

function formatIsoDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 10);
}

export function SchemeDetailClient({
  scheme,
  profile,
  evaluation: externalEvaluation,
}: SchemeDetailClientProps) {
  const { locale, t } = useLanguage();
  const isTa = locale === "ta";

  const title = isTa ? scheme.name_ta : scheme.name_en;
  const secondaryTitle = isTa ? scheme.name_en : scheme.name_ta;
  const categoryName = isTa ? scheme.category.name_ta : scheme.category.name_en;
  const department = isTa ? scheme.department_ta : scheme.department_en;
  const shortDesc = isTa
    ? scheme.short_description_ta
    : scheme.short_description_en;
  const detailedDesc = isTa
    ? scheme.detailed_description_ta
    : scheme.detailed_description_en;
  const benefits = isTa ? scheme.benefits_ta : scheme.benefits_en;
  const instructions = isTa
    ? scheme.application_instructions_ta
    : scheme.application_instructions_en;

  const eligibilitySummary = scheme.eligibility_rule
    ? isTa
      ? scheme.eligibility_rule.summary_ta
      : scheme.eligibility_rule.summary_en
    : null;

  const additionalConditions: AdditionalVerificationCondition[] = useMemo(() => {
    if (!scheme.eligibility_rule) return [];
    if (
      Array.isArray(scheme.eligibility_rule.additional_conditions) &&
      scheme.eligibility_rule.additional_conditions.length > 0
    ) {
      return scheme.eligibility_rule.additional_conditions;
    }
    return extractAdditionalConditionsFromRootGroup(
      scheme.eligibility_rule.root_group
    );
  }, [scheme.eligibility_rule]);

  const activeEvaluation: SchemeEligibilityEvaluationResult | null =
    useMemo(() => {
      if (externalEvaluation) {
        return externalEvaluation;
      }
      if (profile !== null && profile !== undefined && scheme.eligibility_rule) {
        return evaluateSchemeEligibility(
          profile,
          scheme.eligibility_rule.root_group,
          {
            ruleVersion: scheme.eligibility_rule.rule_version,
          }
        );
      }
      return null;
    }, [externalEvaluation, profile, scheme.eligibility_rule]);

  const isUnauthenticatedVisitor =
    !activeEvaluation && (profile === null || profile === undefined);

  const officialApplicationUrl =
    scheme.official_application_url || scheme.official_source_url;
  const schemeDetailHref = getSchemeDetailHref(scheme.slug);
  const verifiedDateStr = formatIsoDate(scheme.last_verified_at);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back to Catalogue Link */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#0b172a] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t.schemeDetail.backToCatalogue}</span>
        </Link>
      </div>

      {/* Hero Overview Card */}
      <Card variant="glass" className="p-6 sm:p-9 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                scheme.government_level === "state" ? "emeraldSoft" : "default"
              }
              className="gap-1.5"
            >
              <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {scheme.government_level === "state"
                  ? t.schemeDetail.tnGovernment
                  : t.schemeDetail.centralGovernment}
              </span>
            </Badge>
            <Badge variant="outline">{categoryName}</Badge>
            <Badge variant="outline">
              {scheme.state_code === "TN"
                ? t.schemeDetail.stateCoverageTN
                : t.schemeDetail.stateCoverageAll}
            </Badge>
          </div>

          {scheme.is_verified && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-300/80">
              <Globe
                className="h-3.5 w-3.5 shrink-0 text-[#0e8a4f]"
                aria-hidden="true"
              />
              <span>
                {t.schemeDetail.verifiedSourceBadge}
                {verifiedDateStr
                  ? ` · ${t.schemeDetail.lastVerifiedLabel} ${verifiedDateStr}`
                  : ""}
              </span>
            </div>
          )}
        </div>

        {scheme.is_verified && (
          <div
            data-testid="verified-source-scope-note"
            className="rounded-xl bg-slate-50/90 border border-slate-200/80 px-3.5 py-2.5 flex items-start gap-2 text-xs text-slate-600"
          >
            <Info
              className="h-4 w-4 text-slate-500 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{t.schemeDetail.verifiedSourceScopeNote}</span>
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0b172a] leading-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            {secondaryTitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
          <Building2
            className="h-4 w-4 text-[#0e8a4f] shrink-0"
            aria-hidden="true"
          />
          <span>
            {t.schemeDetail.departmentLabel}:{" "}
            <strong className="font-extrabold text-[#0b172a]">
              {department}
            </strong>
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          {shortDesc}
        </p>

        {/* Audience Pills */}
        {scheme.target_audiences.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {scheme.target_audiences.map((aud) => {
              const label =
                t.discoverPage.filters.audiences[aud as TargetAudienceTag] ??
                aud;
              return (
                <span
                  key={aud}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Primary Action Bar */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
          <Button asChild variant="emerald" size="lg">
            <a
              href={officialApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{t.schemeDetail.primaryApplyCta}</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>

          <Button asChild variant="secondary" size="lg">
            <a
              href={scheme.official_source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>{t.schemeDetail.officialSourceCta}</span>
            </a>
          </Button>

          <Button asChild variant="ghost" size="default">
            <Link href="/profile">
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              <span>{t.schemeDetail.checkProfileCta}</span>
            </Link>
          </Button>
          <SavedSchemeAction
            scheme={scheme}
            variant="outline"
            size="default"
          />
        </div>
      </Card>

      {/* Benefits & Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          variant="glass"
          className="p-6 sm:p-7 space-y-3 border-[#b7e7ce]/90 bg-[#e6f6ee]/45"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b6e3f]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <h2>{t.schemeDetail.sections.benefitsTitle}</h2>
          </div>
          <p className="text-sm sm:text-base font-semibold text-[#0b172a] leading-relaxed">
            {benefits}
          </p>
        </Card>

        <Card variant="glass" className="p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Landmark className="h-4 w-4 text-[#0e8a4f]" aria-hidden="true" />
            <h2>{t.schemeDetail.sections.overviewTitle}</h2>
          </div>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {detailedDesc}
          </p>
        </Card>
      </div>

      {/* Structured Eligibility Conditions Card */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardCheck
                className="h-5 w-5 text-[#0e8a4f]"
                aria-hidden="true"
              />
              <h2 className="text-xl font-extrabold text-[#0b172a]">
                {t.schemeDetail.sections.eligibilityTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.schemeDetail.sections.eligibilitySubtitle}
            </p>
          </div>

          {scheme.eligibility_rule && (
            <Badge variant="emeraldSoft">
              {t.schemeDetail.sections.ruleVersionPrefix} v
              {scheme.eligibility_rule.rule_version}
            </Badge>
          )}
        </div>

        {/* Unauthenticated Visitor Prompt */}
        {isUnauthenticatedVisitor && (
          <div
            data-testid="scheme-unauthenticated-evaluation-prompt"
            className="rounded-2xl bg-slate-50/95 border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#0b172a]">
                {t.schemeDetail.sections.signInToEvaluateTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.schemeDetail.sections.signInToEvaluateDescription}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button asChild variant="emerald" size="sm">
                <Link
                  href={`/login?next=${encodeURIComponent(schemeDetailHref)}`}
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.schemeDetail.sections.signInToEvaluateCta}</span>
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/register">
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.schemeDetail.sections.registerToEvaluateCta}</span>
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Live Profile Evaluation Banner & Breakdown (when profile or evaluation is present) */}
        {activeEvaluation && (
          <div
            data-testid="scheme-profile-evaluation-banner"
            data-outcome={activeEvaluation.outcome}
            className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${
              activeEvaluation.outcome === "ELIGIBLE"
                ? "bg-[#e6f6ee]/80 border-[#b7e7ce]"
                : activeEvaluation.outcome === "POTENTIAL_MATCH"
                  ? "bg-amber-50/90 border-amber-300/90"
                  : activeEvaluation.outcome === "NOT_ELIGIBLE"
                    ? "bg-rose-50/80 border-rose-200/90"
                    : "bg-slate-100/90 border-slate-300/80"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t.schemeDetail.sections.yourEvaluationTitle}
                </span>
                <Badge
                  variant={
                    activeEvaluation.outcome === "ELIGIBLE"
                      ? "emeraldSoft"
                      : activeEvaluation.outcome === "POTENTIAL_MATCH"
                        ? "amberSoft"
                        : "outline"
                  }
                  data-testid="scheme-evaluation-outcome-title"
                >
                  {isTa
                    ? activeEvaluation.outcomeTitle_ta
                    : activeEvaluation.outcomeTitle_en}
                </Badge>
              </div>
              <p
                data-testid="scheme-evaluation-outcome-description"
                className="text-sm font-semibold text-[#0b172a]"
              >
                {isTa
                  ? activeEvaluation.outcomeDescription_ta
                  : activeEvaluation.outcomeDescription_en}
              </p>
            </div>

            {/* Condition-by-Condition Breakdown */}
            <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-200/70">
              {activeEvaluation.passedConditions.length > 0 && (
                <div
                  data-testid="evaluation-passed-conditions"
                  className="rounded-xl bg-white/90 border border-[#b7e7ce]/80 p-3.5 space-y-2"
                >
                  <p className="text-xs font-bold text-[#0b6e3f]">
                    {t.schemeDetail.sections.passedConditionsHeading} (
                    {activeEvaluation.passedConditions.length})
                  </p>
                  <ul className="space-y-1.5">
                    {activeEvaluation.passedConditions.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-[#0e8a4f] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          {isTa ? item.explanation_ta : item.explanation_en}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeEvaluation.failedConditions.length > 0 && (
                <div
                  data-testid="evaluation-failed-conditions"
                  className="rounded-xl bg-white/90 border border-rose-200/90 p-3.5 space-y-2"
                >
                  <p className="text-xs font-bold text-rose-700">
                    {t.schemeDetail.sections.failedConditionsHeading} (
                    {activeEvaluation.failedConditions.length})
                  </p>
                  <ul className="space-y-1.5">
                    {activeEvaluation.failedConditions.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <XCircle
                          className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          {isTa ? item.explanation_ta : item.explanation_en}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeEvaluation.missingConditions.length > 0 && (
                <div
                  data-testid="evaluation-missing-conditions"
                  className="rounded-xl bg-white/90 border border-slate-300/80 p-3.5 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-700">
                      {t.schemeDetail.sections.missingConditionsHeading} (
                      {activeEvaluation.missingConditions.length})
                    </p>
                    <Button asChild variant="emerald" size="sm">
                      <Link href="/profile">
                        <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {t.schemeDetail.sections.updateProfileToCompleteCta}
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <ul className="space-y-1.5">
                    {activeEvaluation.missingConditions.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <Info
                          className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          {isTa ? item.explanation_ta : item.explanation_en}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeEvaluation.outcome === "POTENTIAL_MATCH" &&
                activeEvaluation.unverifiedAdditionalConditions.length > 0 && (
                  <div
                    data-testid="evaluation-unverified-conditions"
                    className="rounded-xl bg-white/90 border border-amber-300/80 p-3.5 space-y-2"
                  >
                    <p className="text-xs font-bold text-amber-800">
                      {t.schemeDetail.sections.unverifiedConditionsHeading} (
                      {activeEvaluation.unverifiedAdditionalConditions.length})
                    </p>
                    <ul className="space-y-1.5">
                      {activeEvaluation.unverifiedAdditionalConditions.map(
                        (item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2 text-xs text-slate-700"
                          >
                            <AlertCircle
                              className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span>
                              {isTa ? item.label_ta : item.label_en}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        )}

        {eligibilitySummary && (
          <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-4 text-sm font-medium text-slate-800 leading-relaxed">
            {eligibilitySummary}
          </div>
        )}

        {/* 1. Basic Profile Conditions (Automatically Checked) */}
        {scheme.eligibility_rule &&
          scheme.eligibility_rule.conditions.length > 0 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0b172a]">
                  {t.schemeDetail.sections.basicProfileConditionsTitle}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {scheme.eligibility_rule.root_logical_operator === "OR"
                    ? t.schemeDetail.sections.logicalAnyRequired
                    : t.schemeDetail.sections.logicalAllRequired}
                </p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.eligibility_rule.conditions.map((cond) => {
                  const condLabel = isTa ? cond.label_ta : cond.label_en;
                  return (
                    <li
                      key={cond.id}
                      className="rounded-2xl bg-white/95 border border-slate-200/80 p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2
                          className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-[#0b172a] leading-snug">
                          {condLabel}
                        </span>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {cond.groupOperator === "OR"
                          ? t.schemeDetail.sections.groupOrTag
                          : t.schemeDetail.sections.groupAndTag}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        {/* 2. Additional Scheme-Specific Conditions Requiring Verification */}
        {additionalConditions.length > 0 && (
          <div
            data-testid="additional-verification-conditions-section"
            className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-4 sm:p-5 space-y-3.5"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className="h-4 w-4 text-amber-700 shrink-0"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-extrabold text-[#0b172a]">
                  {t.schemeDetail.sections.additionalVerificationTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {t.schemeDetail.sections.additionalVerificationSubtitle}
              </p>
            </div>

            <ul className="space-y-2.5">
              {additionalConditions.map((addCond) => {
                const addLabel = isTa ? addCond.label_ta : addCond.label_en;
                return (
                  <li
                    key={addCond.id}
                    data-testid={`additional-condition-${addCond.id}`}
                    className="rounded-xl bg-white/95 border border-amber-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle
                        className="h-4 w-4 text-amber-600 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-[#0b172a] leading-snug">
                        {addLabel}
                      </span>
                    </div>

                    <Badge
                      variant="amberSoft"
                      className="shrink-0 self-start sm:self-center"
                    >
                      {t.schemeDetail.sections.additionalVerificationTag}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Transparent Outcomes Guide */}
        <div
          data-testid="eligibility-outcomes-guide"
          className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-4 space-y-2.5"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.schemeDetail.sections.outcomesGuideTitle}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="h-3.5 w-3.5 text-[#0e8a4f] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{t.schemeDetail.sections.outcomeEligible}</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle
                className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{t.schemeDetail.sections.outcomePotentialMatch}</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle
                className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{t.schemeDetail.sections.outcomeNotEligible}</span>
            </li>
            <li className="flex items-start gap-2">
              <Info
                className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{t.schemeDetail.sections.outcomeInsufficient}</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-500 pt-2 border-t border-slate-200/70">
          {t.schemeDetail.sections.eligibilityDisclaimer}
        </p>
      </Card>

      {/* Required Documents Checklist Card */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck2
              className="h-5 w-5 text-[#0e8a4f]"
              aria-hidden="true"
            />
            <h2 className="text-xl font-extrabold text-[#0b172a]">
              {t.schemeDetail.sections.documentsTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {t.schemeDetail.sections.documentsSubtitle}
          </p>
        </div>

        {scheme.required_documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {scheme.required_documents.map((doc) => {
              const docName = isTa ? doc.name_ta : doc.name_en;
              const docDesc = isTa ? doc.description_ta : doc.description_en;

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl bg-white/95 border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0b172a]">
                        {docName}
                      </h3>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                        {doc.document_type_code}
                      </span>
                    </div>
                    {docDesc && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {docDesc}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge
                      variant={doc.is_mandatory ? "emeraldSoft" : "outline"}
                    >
                      {doc.is_mandatory
                        ? t.schemeDetail.sections.mandatoryBadge
                        : t.schemeDetail.sections.optionalBadge}
                    </Badge>
                    {doc.requires_unexpired && (
                      <Badge variant="amberSoft">
                        {t.schemeDetail.sections.unexpiredRequiredBadge}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-600">
            {t.schemeDetail.sections.noDocumentsConfigured}
          </p>
        )}
      </Card>

      {/* Step-by-Step Application Procedure Card */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-[#0e8a4f]" aria-hidden="true" />
          <h2 className="text-xl font-extrabold text-[#0b172a]">
            {t.schemeDetail.sections.stepsTitle}
          </h2>
        </div>

        {scheme.application_steps.length > 0 && (
          <ol className="space-y-4">
            {scheme.application_steps.map((step) => {
              const stepTitle = isTa ? step.title_ta : step.title_en;
              const stepDesc = isTa
                ? step.description_ta
                : step.description_en;

              return (
                <li
                  key={step.id}
                  className="rounded-2xl bg-white/95 border border-slate-200/80 p-4 flex items-start gap-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0b172a] text-xs font-extrabold text-white">
                    {String(step.step_number).padStart(2, "0")}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#0b172a]">
                      {stepTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {stepDesc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-4 space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.schemeDetail.sections.instructionsTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {instructions}
          </p>
        </div>
      </Card>

      {/* Official Government Sources & Verification Record */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-5 w-5 text-[#0e8a4f]"
            aria-hidden="true"
          />
          <h2 className="text-xl font-extrabold text-[#0b172a]">
            {t.schemeDetail.sections.sourcesTitle}
          </h2>
        </div>

        <div className="space-y-3">
          {scheme.sources.map((src) => (
            <div
              key={src.id}
              className="rounded-2xl bg-white/95 border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#0b172a]">
                  {src.source_title}
                </p>
                <p className="text-xs text-slate-500 break-all">
                  {src.source_url} · {t.schemeDetail.sections.sourceVerifiedOn}{" "}
                  {formatIsoDate(src.verified_at)}
                </p>
              </div>

              <Button asChild variant="secondary" size="sm" className="shrink-0">
                <a
                  href={src.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{t.schemeDetail.sections.openSourceLink}</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

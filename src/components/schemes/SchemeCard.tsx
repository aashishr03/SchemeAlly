"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  FileText,
  Globe,
  Landmark,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SavedSchemeAction } from "./SavedSchemeAction";
import {
  getSchemeDetailHref,
  type SchemeListItem,
  type TargetAudienceTag,
} from "@/services/scheme/schema";

interface SchemeCardProps {
  scheme: SchemeListItem;
}

function formatVerificationDate(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 10);
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  const { locale, t } = useLanguage();
  const isTa = locale === "ta";

  const title = isTa ? scheme.name_ta : scheme.name_en;
  const secondaryTitle = isTa ? scheme.name_en : scheme.name_ta;
  const categoryName = isTa ? scheme.category.name_ta : scheme.category.name_en;
  const department = isTa ? scheme.department_ta : scheme.department_en;
  const shortDesc = isTa
    ? scheme.short_description_ta
    : scheme.short_description_en;
  const benefits = isTa ? scheme.benefits_ta : scheme.benefits_en;

  const officialUrl =
    scheme.official_application_url || scheme.official_source_url;
  const detailHref = getSchemeDetailHref(scheme.slug);
  const verifiedDateStr = formatVerificationDate(scheme.last_verified_at);

  return (
    <Card
      variant="glass"
      data-testid={`scheme-card-${scheme.slug}`}
      className="flex flex-col justify-between p-6 sm:p-7 transition-all duration-200 hover:shadow-md hover:border-slate-300/90"
    >
      <div className="space-y-4">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                scheme.government_level === "state" ? "emeraldSoft" : "default"
              }
              className="gap-1.5"
            >
              <Landmark className="h-3 w-3" aria-hidden="true" />
              <span>
                {scheme.government_level === "state"
                  ? t.discoverPage.card.tnGovBadge
                  : t.discoverPage.card.centralGovBadge}
              </span>
            </Badge>
            <Badge variant="outline">{categoryName}</Badge>
          </div>

          {scheme.is_verified && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-300/80"
              title={`${t.discoverPage.card.verifiedOnPrefix} ${verifiedDateStr} — ${t.discoverPage.verificationNotice}`}
            >
              <Globe className="h-3 w-3 shrink-0 text-[#0e8a4f]" aria-hidden="true" />
              <span>
                {t.discoverPage.card.verifiedBadge}
                {verifiedDateStr ? ` · ${verifiedDateStr}` : ""}
              </span>
            </span>
          )}
          <SavedSchemeAction scheme={scheme} variant="outline" />
        </div>

        {/* Title & Department */}
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0b172a] leading-snug">
            <Link
              href={detailHref}
              className="hover:text-[#0e8a4f] transition-colors"
            >
              {title}
            </Link>
          </h2>
          <p className="text-xs font-medium text-slate-500 line-clamp-1">
            {secondaryTitle}
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-slate-600">
            <Building2
              className="h-3.5 w-3.5 text-slate-400 shrink-0"
              aria-hidden="true"
            />
            <span className="line-clamp-1">{department}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-sm text-slate-600 leading-relaxed">{shortDesc}</p>

        {/* Key Benefit Highlight Box */}
        <div className="rounded-2xl bg-[#e6f6ee]/70 border border-[#b7e7ce]/80 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0b6e3f]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.discoverPage.card.keyBenefitLabel}</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#0b172a] leading-relaxed">
            {benefits}
          </p>
        </div>
      </div>

      {/* Footer Meta & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-200/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-1.5">
            {scheme.target_audiences.map((aud) => {
              const audLabel =
                t.discoverPage.filters.audiences[
                  aud as TargetAudienceTag
                ] ?? aud;
              return (
                <span
                  key={aud}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  {audLabel}
                </span>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
            <FileText
              className="h-3.5 w-3.5 text-[#0e8a4f]"
              aria-hidden="true"
            />
            <span>
              {scheme.mandatory_documents_count}{" "}
              {t.discoverPage.card.mandatoryDocsSuffix}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            asChild
            variant="default"
            size="sm"
            className="flex-1 justify-center"
          >
            <Link href={detailHref}>
              <span>{t.discoverPage.card.viewDetailsCta}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>

          <Button
            asChild
            variant="secondary"
            size="sm"
            className="justify-center"
          >
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{t.discoverPage.card.officialPortalCta}</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

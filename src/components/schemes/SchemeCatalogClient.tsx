"use client";

import React, { useMemo, useState } from "react";
import {
  Compass,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchemeCard } from "./SchemeCard";
import {
  filterSchemes,
  TARGET_AUDIENCE_OPTIONS,
  type GovernmentLevelFilter,
  type SchemeCategorySummary,
  type SchemeFilterParams,
  type SchemeListItem,
  type StateCoverageFilter,
  type TargetAudienceFilter,
} from "@/services/scheme/schema";

interface SchemeCatalogClientProps {
  categories: SchemeCategorySummary[];
  allSchemes: SchemeListItem[];
  initialFilters: SchemeFilterParams;
}

export function SchemeCatalogClient({
  categories,
  allSchemes,
  initialFilters,
}: SchemeCatalogClientProps) {
  const { locale, t } = useLanguage();
  const isTa = locale === "ta";

  const [searchQuery, setSearchQuery] = useState(initialFilters.q);
  const [selectedCategory, setSelectedCategory] = useState(
    initialFilters.category
  );
  const [selectedLevel, setSelectedLevel] = useState<GovernmentLevelFilter>(
    initialFilters.level
  );
  const [selectedState, setSelectedState] = useState<StateCoverageFilter>(
    initialFilters.state
  );
  const [selectedAudience, setSelectedAudience] =
    useState<TargetAudienceFilter>(initialFilters.audience);
  const [sortOrder, setSortOrder] = useState<"name" | "recent">("name");

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== "all" ||
    selectedLevel !== "all" ||
    selectedState !== "all" ||
    selectedAudience !== "all";

  const filteredSchemes = useMemo(() => {
    return filterSchemes(allSchemes, {
      q: searchQuery,
      category: selectedCategory,
      level: selectedLevel,
      state: selectedState,
      audience: selectedAudience,
    });
  }, [
    allSchemes,
    searchQuery,
    selectedCategory,
    selectedLevel,
    selectedState,
    selectedAudience,
  ]);

  const sortedSchemes = useMemo(
    () =>
      [...filteredSchemes].sort((a, b) => {
        if (sortOrder === "recent") {
          const dateOrder = (b.last_verified_at ?? "").localeCompare(
            a.last_verified_at ?? ""
          );
          if (dateOrder !== 0) return dateOrder;
        }

        const nameA = isTa ? a.name_ta : a.name_en;
        const nameB = isTa ? b.name_ta : b.name_en;
        return nameA.localeCompare(nameB, isTa ? "ta-IN" : "en-IN");
      }),
    [filteredSchemes, isTa, sortOrder]
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSelectedState("all");
    setSelectedAudience("all");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Section */}
      <div className="space-y-3 max-w-3xl">
        <Badge variant="emeraldSoft">{t.discoverPage.badge}</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0b172a]">
          {t.discoverPage.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {t.discoverPage.subtitle}
        </p>
      </div>

      {/* Search & Primary Filters Card */}
      <Card variant="glass" className="p-5 sm:p-6 space-y-5">
        {/* Search Input + Jurisdiction Pills */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.discoverPage.searchPlaceholder}
              aria-label={t.discoverPage.searchAriaLabel}
              className="pl-10 pr-10 h-11 bg-white/95"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t.discoverPage.clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Government Level Toggle Group */}
          <div
            role="group"
            aria-label={t.discoverPage.filters.levelLabel}
            className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/80"
          >
            {(
              [
                { value: "all", label: t.discoverPage.filters.levelAll },
                { value: "state", label: t.discoverPage.filters.levelState },
                { value: "central", label: t.discoverPage.filters.levelCentral },
              ] as const
            ).map((opt) => {
              const active = selectedLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedLevel(opt.value)}
                  aria-pressed={active}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#0b172a] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0b172a] hover:bg-white/70"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.discoverPage.filters.categoryLabel}</span>
          </div>

          <div
            role="group"
            aria-label={t.discoverPage.filters.categoryLabel}
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                selectedCategory === "all"
                  ? "bg-[#0e8a4f] text-white border-[#0e8a4f] shadow-xs"
                  : "bg-white/90 text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span>{t.discoverPage.filters.categoryAll}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedCategory === "all"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {allSchemes.length}
              </span>
            </button>

            {categories.map((cat) => {
              const active = selectedCategory === cat.slug;
              const catLabel = isTa ? cat.name_ta : cat.name_en;
              const count = cat.scheme_count ?? 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                    active
                      ? "bg-[#0e8a4f] text-white border-[#0e8a4f] shadow-xs"
                      : "bg-white/90 text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span>{catLabel}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <details className="group border-t border-slate-200/70 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-1 py-2 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91] [&::-webkit-details-marker]:hidden">
            <span>{t.discoverPage.filters.advancedFilters}</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="discover-audience-filter"
                className="block text-xs font-bold text-slate-600"
              >
                {t.discoverPage.filters.audienceLabel}
              </label>
              <select
                id="discover-audience-filter"
                value={selectedAudience}
                onChange={(e) =>
                  setSelectedAudience(e.target.value as TargetAudienceFilter)
                }
                className="flex h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-[#0b172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]"
              >
                <option value="all">{t.discoverPage.filters.audienceAll}</option>
                {TARGET_AUDIENCE_OPTIONS.map((aud) => (
                  <option key={aud} value={aud}>
                    {t.discoverPage.filters.audiences[aud]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="discover-state-filter"
                className="block text-xs font-bold text-slate-600"
              >
                {t.discoverPage.filters.stateLabel}
              </label>
              <select
                id="discover-state-filter"
                value={selectedState}
                onChange={(e) =>
                  setSelectedState(e.target.value as StateCoverageFilter)
                }
                className="flex h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-[#0b172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]"
              >
                <option value="all">{t.discoverPage.filters.stateAll}</option>
                <option value="TN">{t.discoverPage.filters.stateTN}</option>
                <option value="ALL">{t.discoverPage.filters.statePanIndia}</option>
              </select>
            </div>
          </div>
        </details>
      </Card>

      {/* Results Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-xs sm:text-sm font-semibold text-slate-700"
          aria-live="polite"
          aria-atomic="true"
        >
          {t.discoverPage.resultsSummary.showing}{" "}
          <span className="font-extrabold text-[#0b172a]">
            {filteredSchemes.length}
          </span>{" "}
          {t.discoverPage.resultsSummary.of}{" "}
          <span className="font-extrabold text-[#0b172a]">
            {allSchemes.length}
          </span>{" "}
          {t.discoverPage.resultsSummary.verifiedSchemes}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="discover-sort"
            className="text-xs font-semibold text-slate-600"
          >
            {t.discoverPage.sortLabel}
          </label>
          <select
            id="discover-sort"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value === "recent" ? "recent" : "name")
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0b172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]"
          >
            <option value="name">{t.discoverPage.sortByName}</option>
            <option value="recent">{t.discoverPage.sortByRecent}</option>
          </select>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.discoverPage.clearAllFilters}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Scheme Cards Grid or Empty Filter State */}
      {filteredSchemes.length > 0 ? (
        <div
          data-testid="scheme-catalogue-grid"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {sortedSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      ) : (
        <Card
          variant="glass"
          className="mx-auto max-w-xl p-8 sm:p-10 text-center space-y-4"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f] border border-[#b7e7ce]/70">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <Badge variant="emeraldSoft">{t.discoverPage.noMatches.badge}</Badge>
          <h2 className="text-xl font-extrabold text-[#0b172a]">
            {t.discoverPage.noMatches.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t.discoverPage.noMatches.description}
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="emerald"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{t.discoverPage.noMatches.resetButton}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Source Verification Guarantee Banner */}
      <div className="rounded-2xl bg-white/80 border border-slate-200/80 p-4 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck
          className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <span>{t.discoverPage.verificationNotice}</span>
      </div>
    </div>
  );
}

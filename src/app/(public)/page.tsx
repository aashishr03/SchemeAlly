"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Check,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  GraduationCap,
  Landmark,
  Briefcase,
  HeartPulse,
  Sprout,
  Users,
  Home,
  Store,
  HandHeart,
  SlidersHorizontal,
  MessageSquareText,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import type { ProfileCompletionSummary } from "@/services/profile/schema";

export default function LandingPage() {
  const { t } = useLanguage();
  const { user } = useAuthSession();
  const [profileStatus, setProfileStatus] = useState<{
    userId: string;
    isComplete: boolean;
  } | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;

    void fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load profile (HTTP ${response.status}).`);
        }

        const result: { completion: ProfileCompletionSummary } =
          await response.json();
        if (active) {
          setProfileStatus({
            userId,
            isComplete: result.completion.isOnboardingComplete,
          });
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load homepage profile status.", error);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const hasCompleteProfile =
    user !== null &&
    profileStatus?.userId === user.id &&
    profileStatus?.isComplete === true;

  const categories = [
    {
      key: "education",
      icon: GraduationCap,
      iconColor: "text-slate-800 bg-slate-100",
      name: t.opportunitiesPreview.categories.education.name,
      description: t.opportunitiesPreview.categories.education.description,
    },
    {
      key: "financial-assistance",
      icon: Landmark,
      iconColor: "text-amber-700 bg-amber-50",
      name: t.opportunitiesPreview.categories.financial.name,
      description: t.opportunitiesPreview.categories.financial.description,
    },
    {
      key: "employment",
      icon: Briefcase,
      iconColor: "text-sky-800 bg-sky-50",
      name: t.opportunitiesPreview.categories.employment.name,
      description: t.opportunitiesPreview.categories.employment.description,
    },
    {
      key: "healthcare",
      icon: HeartPulse,
      iconColor: "text-rose-700 bg-rose-50",
      name: t.opportunitiesPreview.categories.healthcare.name,
      description: t.opportunitiesPreview.categories.healthcare.description,
    },
    {
      key: "agriculture",
      icon: Sprout,
      iconColor: "text-emerald-700 bg-emerald-50",
      name: t.opportunitiesPreview.categories.agriculture.name,
      description: t.opportunitiesPreview.categories.agriculture.description,
    },
    {
      key: "women-child-welfare",
      icon: Users,
      iconColor: "text-purple-700 bg-purple-50",
      name: t.opportunitiesPreview.categories.womenChild.name,
      description: t.opportunitiesPreview.categories.womenChild.description,
    },
    {
      key: "housing",
      icon: Home,
      iconColor: "text-indigo-700 bg-indigo-50",
      name: t.opportunitiesPreview.categories.housing.name,
      description: t.opportunitiesPreview.categories.housing.description,
    },
    {
      key: "small-business",
      icon: Store,
      iconColor: "text-teal-700 bg-teal-50",
      name: t.opportunitiesPreview.categories.smallBusiness.name,
      description: t.opportunitiesPreview.categories.smallBusiness.description,
    },
    {
      key: "social-welfare",
      icon: HandHeart,
      iconColor: "text-orange-700 bg-orange-50",
      name: t.opportunitiesPreview.categories.socialWelfare.name,
      description: t.opportunitiesPreview.categories.socialWelfare.description,
    },
  ];

  const steps = [
    t.howItWorks.steps.step1,
    t.howItWorks.steps.step2,
    t.howItWorks.steps.step3,
    t.howItWorks.steps.step4,
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-12 space-y-16 sm:space-y-20">
      {/* 1. HERO SECTION (Modeled after Reference Screenshot 1) */}
      <section aria-labelledby="hero-heading" className="pt-2 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 pt-2">
            <Badge variant="glass" className="px-4 py-1.5 text-xs font-semibold text-slate-700">
              <span
                className="h-2 w-2 rounded-full bg-[#0e8a4f]"
                aria-hidden="true"
              />
              <span>{t.hero.badge}</span>
            </Badge>

            <h1
              id="hero-heading"
              className="text-4xl sm:text-6xl lg:text-[4.15rem] font-extrabold tracking-tight text-[#0b172a] leading-[1.06]"
            >
              {t.hero.headlinePrefix}{" "}
              <span className="font-serif-accent italic font-semibold text-[#0e8a4f] block sm:inline">
                {t.hero.headlineAccent}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              {t.hero.supportingText}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Button asChild variant="default" size="lg">
                <Link href="/opportunities">
                  <span>{t.hero.primaryCta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>

              <Button asChild variant="glass" size="lg">
                <Link href="/discover">{t.hero.secondaryCta}</Link>
              </Button>
            </div>

            {/* Process Flow Breadcrumb */}
            <div className="pt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-medium text-slate-500">
              <span>{t.hero.flowSteps.profile}</span>
              <ArrowDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
              <span>{t.hero.flowSteps.intelligence}</span>
              <ArrowDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
              <span>{t.hero.flowSteps.benefits}</span>
              <ArrowDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
              <span className="text-[#0b172a] font-semibold">
                {t.hero.flowSteps.nextSteps}
              </span>
            </div>
          </div>

          {/* Right Hero Column: Eligibility & Readiness Workspace Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <Card variant="glass" className="p-6 sm:p-7 space-y-5">
              {/* Top Row: Label, Title & Honest Status Pill */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.hero.workspacePreview.headerLabel}
                  </p>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0b172a] mt-0.5">
                    {t.hero.workspacePreview.title}
                  </h2>
                </div>
                <Badge variant="emeraldSoft" className="shrink-0">
                  {t.hero.workspacePreview.statusBadge}
                </Badge>
              </div>

              {/* Inner Readiness & Criteria Box */}
              <div className="glass-card-inner rounded-2xl p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#0b172a]">
                      {t.hero.workspacePreview.readinessLabel}
                    </span>
                    <span className="text-slate-500">
                      {t.hero.workspacePreview.readinessStatus}
                    </span>
                  </div>
                  {/* Segmented readiness bar indicator */}
                  <div
                    className="grid grid-cols-4 gap-1.5"
                    aria-hidden="true"
                  >
                    <div className="h-2 rounded-full bg-[#0e8a4f]/35" />
                    <div className="h-2 rounded-full bg-slate-200/90" />
                    <div className="h-2 rounded-full bg-slate-200/90" />
                    <div className="h-2 rounded-full bg-slate-200/90" />
                  </div>
                </div>

                {/* Rule & Document Check Items */}
                <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{t.hero.workspacePreview.checkItems.ruleEngine}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{t.hero.workspacePreview.checkItems.jurisdiction}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{t.hero.workspacePreview.checkItems.explainable}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-amber-700 font-medium">
                    <AlertCircle
                      className="h-4 w-4 text-amber-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{t.hero.workspacePreview.checkItems.documentAlert}</span>
                  </li>
                </ul>
              </div>

              {/* Document Category Badges Row */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-900 ring-2 ring-white">
                    ID
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f6ee] text-[10px] font-bold text-[#0b7241] ring-2 ring-white">
                    IC
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 ring-2 ring-white">
                    SC
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600">
                  {t.hero.workspacePreview.docChipsLabel}
                </p>
              </div>

              {/* Primary Emerald Action Button */}
              <Button asChild variant="emerald" className="w-full justify-center h-11">
                <Link href="/profile">
                  {hasCompleteProfile
                    ? t.hero.workspacePreview.updateProfileActionButton
                    : t.hero.workspacePreview.completeProfileActionButton}
                </Link>
              </Button>
            </Card>

            {/* Secondary "Your next step" Callout Card */}
            <Card variant="glass" className="p-4 sm:px-5 flex items-center gap-3.5 rounded-2xl">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b172a] shadow-2xs border border-slate-200/60">
                <Sparkles className="h-4 w-4 text-[#0e8a4f]" aria-hidden="true" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#0b172a]">
                  {t.hero.workspacePreview.nextStepTitle}
                </p>
                <p className="text-slate-600 mt-0.5">
                  {t.hero.workspacePreview.nextStepBody}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 2. POPULAR SCHEME CATEGORIES & PERSONALIZED OPPORTUNITIES (Modeled after Reference Screenshot 2) */}
      <section aria-labelledby="opportunities-heading">
        <Card variant="glass" className="p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2
                id="opportunities-heading"
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]"
              >
                {t.opportunitiesPreview.title}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {t.opportunitiesPreview.subtitle}
              </p>
            </div>

            <Badge variant="outline" className="self-start sm:self-center px-4 py-1.5">
              {t.opportunitiesPreview.statusPill}
            </Badge>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.key}
                  href={`/discover?category=${category.key}`}
                  className="group glass-card-inner rounded-2xl p-5 flex flex-col justify-between hover:border-[#0e8a4f]/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${category.iconColor}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold text-[#0e8a4f] group-hover:translate-x-0.5 transition-transform">
                      {t.opportunitiesPreview.exploreAction}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#0b172a]">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Honest Personalized Opportunities Empty-State Prompt */}
          <div className="rounded-2xl bg-[#e6f6ee]/70 border border-[#b7e7ce]/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs sm:text-sm font-medium text-[#0b172a]">
              {t.opportunitiesPreview.emptyPrompt}
            </p>
            <Link
              href="/opportunities"
              className="text-xs font-bold text-[#0b7241] hover:underline shrink-0 inline-flex items-center gap-1"
            >
              <span>{t.hero.primaryCta}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </section>

      {/* 3. TRUST PILLARS TRIO (Modeled after Reference Screenshot 2 bottom cards) */}
      <section aria-label="Core product principles">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card variant="glass" className="p-6 sm:p-7 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f6ee] text-[#0e8a4f]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[#0b172a]">
              {t.trustPillars.privacy.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t.trustPillars.privacy.description}
            </p>
          </Card>

          <Card variant="glass" className="p-6 sm:p-7 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f6ee] text-[#0e8a4f]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[#0b172a]">
              {t.trustPillars.explainable.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t.trustPillars.explainable.description}
            </p>
          </Card>

          <Card variant="glass" className="p-6 sm:p-7 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f6ee] text-[#0e8a4f]">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[#0b172a]">
              {t.trustPillars.readyForAction.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t.trustPillars.readyForAction.description}
            </p>
          </Card>
        </div>
      </section>

      {/* 4. HOW SCHEMEALLY WORKS */}
      <section aria-labelledby="how-it-works-heading" className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <Badge variant="emeraldSoft">{t.howItWorks.badge}</Badge>
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]"
          >
            {t.howItWorks.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => (
            <Card key={step.number} variant="glass" className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0b172a] text-xs font-bold text-white">
                  {step.number}
                </span>
                <h3 className="text-base font-bold text-[#0b172a] leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. ELIGIBILITY & DOCUMENT READINESS EXPLAINER */}
      <section aria-labelledby="readiness-heading" className="space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="emeraldSoft">{t.readinessSection.badge}</Badge>
          <h2
            id="readiness-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]"
          >
            {t.readinessSection.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.readinessSection.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deterministic Eligibility Engine Card */}
          <Card variant="glass" className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b172a] text-white">
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#0b172a]">
                {t.readinessSection.eligibilityCard.title}
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {t.readinessSection.eligibilityCard.description}
            </p>

            <div className="glass-card-inner rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.readinessSection.eligibilityCard.outcomesTitle}
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0e8a4f] mt-1.5 shrink-0" />
                  <span>{t.readinessSection.eligibilityCard.outcomes.eligible}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>
                    {t.readinessSection.eligibilityCard.outcomes.insufficient}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <span>
                    {t.readinessSection.eligibilityCard.outcomes.verification}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>
                    {t.readinessSection.eligibilityCard.outcomes.notEligible}
                  </span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Application Readiness Tracker Card */}
          <Card variant="glass" className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e8a4f] text-white">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#0b172a]">
                {t.readinessSection.readinessCard.title}
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {t.readinessSection.readinessCard.description}
            </p>

            <div className="glass-card-inner rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0e8a4f]">
                  {t.readinessSection.readinessCard.formulaLabel}
                </p>
                <p className="text-xs sm:text-sm font-mono font-semibold text-[#0b172a] mt-1">
                  {t.readinessSection.readinessCard.formulaText}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/70 pt-2.5">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0e8a4f] shrink-0 mt-0.5" />
                  <span>{t.readinessSection.readinessCard.rules.rule1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0e8a4f] shrink-0 mt-0.5" />
                  <span>{t.readinessSection.readinessCard.rules.rule2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0e8a4f] shrink-0 mt-0.5" />
                  <span>{t.readinessSection.readinessCard.rules.rule3}</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. AI ALLY INTRODUCTION */}
      <section aria-labelledby="ai-ally-heading">
        <Card variant="glass" className="p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <Badge variant="emeraldSoft">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.aiAllySection.badge}</span>
              </Badge>

              <h2
                id="ai-ally-heading"
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]"
              >
                {t.aiAllySection.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t.aiAllySection.subtitle}
              </p>

              <ul className="space-y-2.5 text-sm text-slate-700 pt-1">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-1" />
                  <span>{t.aiAllySection.capabilities.explain}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-1" />
                  <span>{t.aiAllySection.capabilities.missing}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-1" />
                  <span>{t.aiAllySection.capabilities.citations}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-1" />
                  <span>{t.aiAllySection.capabilities.safety}</span>
                </li>
              </ul>

              <div className="pt-2">
                <Button asChild variant="default">
                  <Link href="/assistant">
                    <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                    <span>{t.aiAllySection.cta}</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="glass-card-inner rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t.aiAllySection.samplePromptLabel}
                </p>
                <div className="space-y-2.5">
                  <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3.5 text-xs sm:text-sm text-[#0b172a] font-medium">
                    &ldquo;{t.aiAllySection.samplePrompts.q1}&rdquo;
                  </div>
                  <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3.5 text-xs sm:text-sm text-[#0b172a] font-medium">
                    &ldquo;{t.aiAllySection.samplePrompts.q2}&rdquo;
                  </div>
                  <div className="rounded-xl bg-[#e6f6ee]/60 border border-[#b7e7ce]/80 p-3.5 text-xs sm:text-sm text-[#0b7241] font-medium">
                    &ldquo;{t.aiAllySection.samplePrompts.q3}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

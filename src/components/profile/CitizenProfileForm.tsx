"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  calculateAgeFromDob,
  calculateProfileCompletion,
  EDUCATION_LEVEL_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  GENDER_OPTIONS,
  INDIAN_STATES,
  type ProfileRow,
  SOCIAL_CATEGORY_OPTIONS,
  TAMIL_NADU_DISTRICTS,
} from "@/services/profile/schema";
import type { PreferredLanguage } from "@/types/database";

export interface CitizenProfileFormProps {
  initialProfile: ProfileRow;
  userEmail?: string;
}

function booleanToSelectValue(val: boolean | null | undefined): string {
  if (val === true) return "yes";
  if (val === false) return "no";
  return "";
}

function selectValueToBoolean(val: string): boolean | null {
  if (val === "yes") return true;
  if (val === "no") return false;
  return null;
}

export function CitizenProfileForm({
  initialProfile,
  userEmail,
}: CitizenProfileFormProps) {
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    initialProfile.date_of_birth ?? ""
  );
  const [gender, setGender] = useState(initialProfile.gender ?? "");
  const [stateName, setStateName] = useState(
    initialProfile.state ?? "Tamil Nadu"
  );
  const [district, setDistrict] = useState(initialProfile.district ?? "");
  const [occupation, setOccupation] = useState(initialProfile.occupation ?? "");
  const [educationLevel, setEducationLevel] = useState(
    initialProfile.education_level ?? ""
  );
  const [employmentStatus, setEmploymentStatus] = useState(
    initialProfile.employment_status ?? ""
  );
  const [isStudent, setIsStudent] = useState(
    booleanToSelectValue(initialProfile.is_student)
  );
  const [annualIncome, setAnnualIncome] = useState(
    initialProfile.annual_household_income !== null &&
      initialProfile.annual_household_income !== undefined
      ? String(initialProfile.annual_household_income)
      : ""
  );
  const [householdSize, setHouseholdSize] = useState(
    initialProfile.household_size !== null &&
      initialProfile.household_size !== undefined
      ? String(initialProfile.household_size)
      : ""
  );
  const [socialCategory, setSocialCategory] = useState(
    initialProfile.social_category ?? ""
  );
  const [isFarmer, setIsFarmer] = useState(
    booleanToSelectValue(initialProfile.is_farmer)
  );
  const [landHoldingAcres, setLandHoldingAcres] = useState(
    initialProfile.land_holding_acres !== null &&
      initialProfile.land_holding_acres !== undefined
      ? String(initialProfile.land_holding_acres)
      : ""
  );
  const [isBusinessOwner, setIsBusinessOwner] = useState(
    booleanToSelectValue(initialProfile.is_business_owner)
  );
  const [hasDisability, setHasDisability] = useState(
    booleanToSelectValue(initialProfile.has_disability)
  );
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(
    initialProfile.preferred_language ?? locale
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const liveDraftProfile = useMemo<Partial<ProfileRow>>(
    () => ({
      full_name: fullName.trim() || null,
      date_of_birth: dateOfBirth.trim() || null,
      gender: gender || null,
      state: stateName.trim() || null,
      district: district.trim() || null,
      occupation: occupation.trim() || null,
      education_level: educationLevel || null,
      employment_status: employmentStatus || null,
      is_student: selectValueToBoolean(isStudent),
      annual_household_income:
        annualIncome.trim() !== "" && !Number.isNaN(Number(annualIncome))
          ? Number(annualIncome)
          : null,
      household_size:
        householdSize.trim() !== "" && !Number.isNaN(Number(householdSize))
          ? Number(householdSize)
          : null,
      social_category: socialCategory || null,
      is_farmer: selectValueToBoolean(isFarmer),
      land_holding_acres:
        landHoldingAcres.trim() !== "" &&
        !Number.isNaN(Number(landHoldingAcres))
          ? Number(landHoldingAcres)
          : null,
      is_business_owner: selectValueToBoolean(isBusinessOwner),
      has_disability: selectValueToBoolean(hasDisability),
      preferred_language: preferredLanguage,
    }),
    [
      fullName,
      dateOfBirth,
      gender,
      stateName,
      district,
      occupation,
      educationLevel,
      employmentStatus,
      isStudent,
      annualIncome,
      householdSize,
      socialCategory,
      isFarmer,
      landHoldingAcres,
      isBusinessOwner,
      hasDisability,
      preferredLanguage,
    ]
  );

  const completion = useMemo(
    () => calculateProfileCompletion(liveDraftProfile),
    [liveDraftProfile]
  );

  const derivedAge = useMemo(
    () => calculateAgeFromDob(dateOfBirth),
    [dateOfBirth]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(liveDraftProfile),
      });

      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.error ?? "Failed to save profile.");
        return;
      }

      setLocale(preferredLanguage);
      setSuccessMessage(t.profilePage.savedSuccess);
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectClassName =
    "flex h-11 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-2.5 text-sm text-[#0b172a] shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e8a4f] focus-visible:border-[#0e8a4f]";

  return (
    <div className="space-y-8">
      {/* Header & Completion Summary Card */}
      <Card variant="glass" className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="emeraldSoft">
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.profilePage.badge}</span>
              </Badge>
              {userEmail && (
                <Badge variant="outline" className="text-xs">
                  {userEmail}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]">
              {t.profilePage.title}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {t.profilePage.subtitle}
            </p>
          </div>

          <div className="glass-card-inner rounded-2xl p-4 sm:p-5 min-w-[260px] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#0b172a]">
                {t.profilePage.completionLabel}
              </span>
              <span className="text-[#0e8a4f]">{completion.percentage}%</span>
            </div>
            <Progress
              value={completion.percentage}
              aria-label={t.profilePage.completionLabel}
            />
            <p className="text-[11px] font-medium text-slate-600">
              {completion.isOnboardingComplete
                ? t.profilePage.onboardingCompleteBadge
                : t.profilePage.onboardingIncompleteBadge}
            </p>
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div className="rounded-2xl bg-[#e6f6ee]/75 border border-[#b7e7ce]/80 px-4 py-3.5 flex items-start gap-3 text-xs sm:text-sm text-[#0b172a]">
          <ShieldCheck
            className="h-5 w-5 text-[#0e8a4f] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{t.profilePage.privacyBanner}</span>
        </div>
      </Card>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200/90 p-4 flex items-start gap-3 text-sm font-medium text-rose-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-2xl bg-[#e6f6ee] border border-[#b7e7ce] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm font-semibold text-[#0b7241]"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0e8a4f]" />
            <span>{successMessage}</span>
          </div>
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard">
              <span>{t.profilePage.goToDashboard}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* SECTION 1: Basic Personal Information */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b172a]">
              {t.profilePage.sections.personal.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.profilePage.sections.personal.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-full-name">
                {t.profilePage.fields.fullName}
              </Label>
              <Input
                id="profile-full-name"
                name="full_name"
                type="text"
                placeholder={t.profilePage.fields.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="profile-dob">
                  {t.profilePage.fields.dateOfBirth}
                </Label>
                {derivedAge !== null && (
                  <span className="text-[11px] font-bold text-[#0e8a4f]">
                    {t.profilePage.derivedAgeLabel}: {derivedAge}{" "}
                    {t.profilePage.yearsOld}
                  </span>
                )}
              </div>
              <Input
                id="profile-dob"
                name="date_of_birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-gender">
                {t.profilePage.fields.gender}
              </Label>
              <select
                id="profile-gender"
                name="gender"
                className={selectClassName}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">
                  {t.profilePage.options.selectPlaceholder}
                </option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {t.profilePage.options.gender[opt]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* SECTION 2: Residence & Jurisdiction */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b172a]">
              {t.profilePage.sections.residence.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.profilePage.sections.residence.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-state">
                {t.profilePage.fields.state}
              </Label>
              <select
                id="profile-state"
                name="state"
                className={selectClassName}
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
              >
                <option value="">
                  {t.profilePage.options.selectPlaceholder}
                </option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-district">
                {t.profilePage.fields.district}
              </Label>
              {stateName === "Tamil Nadu" ? (
                <select
                  id="profile-district"
                  name="district"
                  className={selectClassName}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="">
                    {t.profilePage.options.selectPlaceholder}
                  </option>
                  {TAMIL_NADU_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="profile-district"
                  name="district"
                  type="text"
                  placeholder={t.profilePage.fields.district}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              )}
            </div>
          </div>
        </Card>

        {/* SECTION 3: Education & Occupation */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b172a]">
              {t.profilePage.sections.educationEmployment.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.profilePage.sections.educationEmployment.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-education">
                {t.profilePage.fields.educationLevel}
              </Label>
              <select
                id="profile-education"
                name="education_level"
                className={selectClassName}
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="">
                  {t.profilePage.options.selectPlaceholder}
                </option>
                {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {t.profilePage.options.education[opt]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-employment">
                {t.profilePage.fields.employmentStatus}
              </Label>
              <select
                id="profile-employment"
                name="employment_status"
                className={selectClassName}
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
              >
                <option value="">
                  {t.profilePage.options.selectPlaceholder}
                </option>
                {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {t.profilePage.options.employment[opt]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-student">
                {t.profilePage.fields.isStudent}
              </Label>
              <select
                id="profile-student"
                name="is_student"
                className={selectClassName}
                value={isStudent}
                onChange={(e) => setIsStudent(e.target.value)}
              >
                <option value="">{t.profilePage.options.boolean.unset}</option>
                <option value="yes">{t.profilePage.options.boolean.yes}</option>
                <option value="no">{t.profilePage.options.boolean.no}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-occupation">
                {t.profilePage.fields.occupation}
              </Label>
              <Input
                id="profile-occupation"
                name="occupation"
                type="text"
                placeholder={t.profilePage.fields.occupationPlaceholder}
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* SECTION 4: Household & Financial Context */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b172a]">
              {t.profilePage.sections.householdIncome.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.profilePage.sections.householdIncome.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-income">
                {t.profilePage.fields.annualHouseholdIncome}
              </Label>
              <Input
                id="profile-income"
                name="annual_household_income"
                type="number"
                min={0}
                step="1000"
                placeholder={t.profilePage.fields.annualHouseholdIncomePlaceholder}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-household-size">
                {t.profilePage.fields.householdSize}
              </Label>
              <Input
                id="profile-household-size"
                name="household_size"
                type="number"
                min={1}
                max={50}
                placeholder={t.profilePage.fields.householdSizePlaceholder}
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* SECTION 5: Optional Category, Agriculture & Livelihood Details */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b172a]">
              {t.profilePage.sections.additionalEligibility.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.profilePage.sections.additionalEligibility.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-social-category">
                {t.profilePage.fields.socialCategory}
              </Label>
              <select
                id="profile-social-category"
                name="social_category"
                className={selectClassName}
                value={socialCategory}
                onChange={(e) => setSocialCategory(e.target.value)}
              >
                <option value="">
                  {t.profilePage.options.selectPlaceholder}
                </option>
                {SOCIAL_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {t.profilePage.options.socialCategory[opt]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-farmer">
                {t.profilePage.fields.isFarmer}
              </Label>
              <select
                id="profile-farmer"
                name="is_farmer"
                className={selectClassName}
                value={isFarmer}
                onChange={(e) => setIsFarmer(e.target.value)}
              >
                <option value="">{t.profilePage.options.boolean.unset}</option>
                <option value="yes">{t.profilePage.options.boolean.yes}</option>
                <option value="no">{t.profilePage.options.boolean.no}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-land-acres">
                {t.profilePage.fields.landHoldingAcres}
              </Label>
              <Input
                id="profile-land-acres"
                name="land_holding_acres"
                type="number"
                min={0}
                step="0.1"
                placeholder={t.profilePage.fields.landHoldingAcresPlaceholder}
                value={landHoldingAcres}
                onChange={(e) => setLandHoldingAcres(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-business">
                {t.profilePage.fields.isBusinessOwner}
              </Label>
              <select
                id="profile-business"
                name="is_business_owner"
                className={selectClassName}
                value={isBusinessOwner}
                onChange={(e) => setIsBusinessOwner(e.target.value)}
              >
                <option value="">{t.profilePage.options.boolean.unset}</option>
                <option value="yes">{t.profilePage.options.boolean.yes}</option>
                <option value="no">{t.profilePage.options.boolean.no}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-disability">
                {t.profilePage.fields.hasDisability}
              </Label>
              <select
                id="profile-disability"
                name="has_disability"
                className={selectClassName}
                value={hasDisability}
                onChange={(e) => setHasDisability(e.target.value)}
              >
                <option value="">{t.profilePage.options.boolean.unset}</option>
                <option value="yes">{t.profilePage.options.boolean.yes}</option>
                <option value="no">{t.profilePage.options.boolean.no}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-language">
                {t.profilePage.fields.preferredLanguage}
              </Label>
              <select
                id="profile-language"
                name="preferred_language"
                className={selectClassName}
                value={preferredLanguage}
                onChange={(e) =>
                  setPreferredLanguage(
                    e.target.value === "ta" ? "ta" : "en"
                  )
                }
              >
                <option value="en">English (EN)</option>
                <option value="ta">தமிழ் (TA)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Save Action Bar */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button asChild variant="glass" type="button">
            <Link href="/dashboard">{t.profilePage.goToDashboard}</Link>
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="lg"
            disabled={isSaving}
          >
            <span>
              {isSaving
                ? t.profilePage.savingButton
                : t.profilePage.saveButton}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </div>
  );
}

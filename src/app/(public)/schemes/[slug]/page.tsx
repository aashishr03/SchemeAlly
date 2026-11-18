import React from "react";
import { getSchemeDetailsBySlug } from "@/services/scheme/scheme-service";
import { getAuthenticatedCitizenProfile } from "@/services/profile/profile-service";
import { SchemeDetailClient } from "@/components/schemes/SchemeDetailClient";
import SchemeNotFound from "./not-found";

export const dynamic = "force-dynamic";

interface SchemeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SchemeDetailPage({
  params,
}: SchemeDetailPageProps) {
  const { slug } = await params;
  const scheme = await getSchemeDetailsBySlug(slug);

  if (!scheme) {
    return <SchemeNotFound />;
  }

  let citizenProfile = null;
  try {
    const authProfile = await getAuthenticatedCitizenProfile();
    if (authProfile) {
      citizenProfile = authProfile.profile;
    }
  } catch {
    citizenProfile = null;
  }

  return <SchemeDetailClient scheme={scheme} profile={citizenProfile} />;
}

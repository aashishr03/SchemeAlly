import React from "react";
import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/infrastructure/supabase/server";
import { getAuthenticatedCitizenProfile } from "@/services/profile/profile-service";
import { CitizenProfileForm } from "@/components/profile/CitizenProfileForm";

export const dynamic = "force-dynamic";

export default async function CitizenProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let profileData;
  try {
    profileData = await getAuthenticatedCitizenProfile();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/login?next=/profile");
    }
    throw err;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <CitizenProfileForm
        initialProfile={profileData.profile}
        userEmail={profileData.email}
        emailVerified={params.email_verified === "1"}
      />
    </div>
  );
}

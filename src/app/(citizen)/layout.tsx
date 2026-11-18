import React from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { getAuthenticatedServerUser } from "@/infrastructure/supabase/server";

export const dynamic = "force-dynamic";

export default async function CitizenProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const user = await getAuthenticatedServerUser();
  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}

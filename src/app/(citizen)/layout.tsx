import React from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";

export const dynamic = "force-dynamic";

export default async function CitizenProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  return <>{children}</>;
}

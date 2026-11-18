"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { SavedSchemesProvider } from "@/components/schemes/SavedSchemesProvider";
import { isProtectedCitizenRoute } from "@/services/auth/route-access";

export function AuthenticatedAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, isTransitioning } = useAuthSession();
  const isPrivatePage = isProtectedCitizenRoute(pathname ?? "");
  const shouldHidePrivateContent =
    isPrivatePage && (!user || isTransitioning);

  return (
    <SavedSchemesProvider
      key={user?.id ?? "anonymous"}
      initialAuthenticated={Boolean(user)}
    >
      <Navbar />
      <main className="flex-1">
        {shouldHidePrivateContent ? (
          <div
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"
            role="status"
          >
            {t.auth.sessionRedirecting}
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </SavedSchemesProvider>
  );
}

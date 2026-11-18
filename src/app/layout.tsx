import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { getAuthenticatedServerUser } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { AuthenticatedAppShell } from "@/components/layout/AuthenticatedAppShell";

export const metadata: Metadata = {
  title: "SchemeAlly — Your Ally for Government Benefits",
  description:
    "Discover government schemes that may suit your situation, understand your eligibility, prepare required documents, and find your next step.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticatedUser = isSupabaseConfigured()
    ? await getAuthenticatedServerUser()
    : null;
  const fullName = authenticatedUser?.user_metadata?.full_name;
  const initialUser = authenticatedUser
    ? {
        id: authenticatedUser.id,
        email: authenticatedUser.email ?? null,
        displayName:
          typeof fullName === "string" && fullName.trim()
            ? fullName.trim()
            : null,
      }
    : null;

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <LanguageProvider>
          <AuthSessionProvider initialUser={initialUser}>
            <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
          </AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/client";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, toggleLocale, t } = useLanguage();
  const { user } = useAuthSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPathname, setMobileMenuPathname] = useState(pathname);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const isMobileMenuOpen =
    mobileMenuOpen && mobileMenuPathname === pathname;

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(false);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase authentication is not configured.");
      }

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("The server could not clear the session.");
      }

      const { error } = await createBrowserSupabaseClient().auth.signOut({
        scope: "local",
      });
      if (error) throw error;
    } catch {
      setSignOutError(true);
      setIsSigningOut(false);
      return;
    }

    setMobileMenuOpen(false);
    setIsSigningOut(false);
    router.replace("/login");
  };

  const signInHref =
    pathname && pathname !== "/" && pathname !== "/login"
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/discover", label: t.nav.discover },
    { href: "/opportunities", label: t.nav.opportunities },
    { href: "/saved", label: t.nav.saved },
    { href: "/assistant", label: t.nav.assistant },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Main navigation"
          className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 shadow-sm px-3.5 sm:px-5 py-2.5"
        >
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e8a4f] rounded-full pr-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0b172a] text-white font-extrabold text-lg shadow-sm group-hover:bg-[#162542] transition-colors">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-[#0b172a] leading-none">
                {t.brand.name}
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-1 leading-none">
                {t.brand.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 rounded-full bg-slate-100/75 p-1 border border-slate-200/50">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-white text-[#0b172a] font-semibold shadow-xs"
                      : "text-slate-600 hover:text-[#0b172a] hover:bg-white/60"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions: Language Switcher & Auth / Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={t.nav.languageToggleLabel}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-2 text-xs font-semibold text-[#0b172a] shadow-2xs hover:bg-white transition-colors cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span
                className={cn(
                  locale === "en" ? "text-[#0b172a] font-bold" : "text-slate-500"
                )}
              >
                EN
              </span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span
                className={cn(
                  locale === "ta" ? "text-[#0e8a4f] font-bold" : "text-slate-500"
                )}
              >
                தமிழ்
              </span>
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  asChild
                  variant="glass"
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold"
                >
                  <Link href="/profile" aria-label={t.nav.profile}>
                    <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{user.displayName || user.email || t.nav.profile}</span>
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="h-9 px-3.5 text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.nav.signOut}</span>
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3.5 text-xs font-semibold"
                >
                  <Link href="/register">{t.auth.login.registerLink}</Link>
                </Button>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="h-9 px-5 text-xs font-semibold"
                >
                  <Link href={signInHref}>{t.nav.signIn}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isMobileMenuOpen) {
                  setMobileMenuOpen(false);
                } else {
                  setMobileMenuPathname(pathname);
                  setMobileMenuOpen(true);
                }
              }}
              aria-expanded={isMobileMenuOpen}
              aria-controls={
                isMobileMenuOpen ? "mobile-primary-navigation" : undefined
              }
              aria-label={isMobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-[#0b172a] hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* Responsive Mobile / Tablet Navigation Drawer */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-primary-navigation"
            aria-label={t.nav.mobileNavigationLabel}
            className="mt-2 rounded-2xl bg-white border border-slate-200 p-3 shadow-lg lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]",
                      active
                        ? "bg-[#e6f6ee] text-[#0b7241] font-semibold"
                        : "text-slate-700 hover:bg-slate-100/80"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {user && (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]"
                >
                  {user.displayName || user.email || t.nav.profile}
                </Link>
              )}

              <div className="pt-2 mt-1 border-t border-slate-200/70 sm:hidden">
                {user ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>{t.nav.signOut}</span>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/register">{t.auth.login.registerLink}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="default"
                      className="w-full justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href={signInHref}>{t.nav.signIn}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
        {signOutError && (
          <p
            className="mx-auto mt-2 max-w-7xl px-4 text-sm text-red-700"
            role="alert"
          >
            {t.nav.signOutError}
          </p>
        )}
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/45 backdrop-blur-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Row: Disclaimer & Source-Grounded Badge (matches reference screenshot 2) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200/60">
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            {t.footer.disclaimer}
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-[#0e8a4f]" aria-hidden="true" />
            <span>{t.footer.badge}</span>
          </div>
        </div>

        {/* Bottom Row: Useful Links & Copyright */}
        <div className="pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-500">
          <p>{t.footer.copyright}</p>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-5">
            <Link
              href="/discover"
              className="hover:text-[#0b172a] transition-colors font-medium"
            >
              {t.footer.links.discover}
            </Link>
            <Link
              href="/trust"
              className="hover:text-[#0b172a] transition-colors font-medium"
            >
              {t.footer.links.trust}
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#0b172a] transition-colors font-medium"
            >
              {t.footer.links.privacy}
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#0b172a] transition-colors font-medium"
            >
              {t.footer.links.terms}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

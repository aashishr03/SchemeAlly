"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { EmptyState } from "@/components/ui/empty-state";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <EmptyState
        badge={t.footer.links.privacy}
        title={t.legal.privacyTitle}
        description={t.legal.privacyIntro}
        icon={ShieldCheck}
        primaryActionLabel={t.emptyStates.discover.primaryAction}
        primaryActionHref="/"
      />
    </div>
  );
}

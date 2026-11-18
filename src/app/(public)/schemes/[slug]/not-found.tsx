"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Compass } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SchemeNotFound() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Card
        variant="glass"
        className="mx-auto max-w-xl p-8 sm:p-10 text-center space-y-5"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <Badge variant="amberSoft">{t.schemeDetail.notFound.badge}</Badge>
        <h1 className="text-2xl font-extrabold text-[#0b172a]">
          {t.schemeDetail.notFound.title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t.schemeDetail.notFound.description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild variant="emerald">
            <Link href="/discover">
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>{t.schemeDetail.notFound.backToDiscover}</span>
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{t.schemeDetail.notFound.backToHome}</span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

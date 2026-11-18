import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  badge?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export function EmptyState({
  badge,
  title,
  description,
  icon: Icon,
  primaryActionLabel,
  primaryActionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: EmptyStateProps) {
  return (
    <Card
      variant="glass"
      className="mx-auto max-w-2xl p-8 sm:p-12 text-center flex flex-col items-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f] border border-[#b7e7ce]/70">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>

      {badge && (
        <Badge variant="emeraldSoft" className="mb-3">
          {badge}
        </Badge>
      )}

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a] mb-3">
        {title}
      </h1>

      <p className="text-base text-slate-600 leading-relaxed max-w-xl mb-8">
        {description}
      </p>

      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryActionLabel && primaryActionHref && (
            <Button asChild variant="default">
              <Link href={primaryActionHref}>
                {primaryActionLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {secondaryActionLabel && secondaryActionHref && (
            <Button asChild variant="glass">
              <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

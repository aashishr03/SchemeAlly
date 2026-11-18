"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, LoaderCircle, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { SchemeListItem } from "@/services/scheme/schema";
import {
  SavedSchemesRequestError,
  useSavedSchemes,
} from "./SavedSchemesProvider";

interface SavedSchemeActionProps {
  scheme: SchemeListItem;
  mode?: "toggle" | "remove";
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

export function SavedSchemeAction({
  scheme,
  mode = "toggle",
  variant = "secondary",
  size = "sm",
  className,
}: SavedSchemeActionProps) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const { isSaved, isPending, isLoading, save, remove } = useSavedSchemes();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const saved = isSaved(scheme.id);
  const pending = isPending(scheme.id);
  const query = typeof window === "undefined" ? "" : window.location.search;
  const returnPath =
    pathname === "/saved"
      ? "/saved"
      : `${pathname ?? "/discover"}${query ? `?${query}` : ""}`;

  const handleClick = async () => {
    setFeedback(null);
    setActionError(null);
    try {
      if (mode === "remove" || saved) {
        await remove(scheme.id);
        setFeedback(t.savedSchemes.action.removed);
      } else {
        await save(scheme);
        setFeedback(t.savedSchemes.action.saved);
      }
    } catch (error) {
      if (error instanceof SavedSchemesRequestError && error.status === 401) {
        router.push(`/login?next=${encodeURIComponent(returnPath)}`);
        return;
      }
      setActionError(t.savedSchemes.action.error);
    }
  };

  const label =
    mode === "remove"
      ? t.savedSchemes.action.remove
      : saved
        ? t.savedSchemes.action.savedLabel
        : t.savedSchemes.action.save;

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => void handleClick()}
        disabled={isLoading || pending}
        aria-pressed={mode === "toggle" ? saved : undefined}
        aria-label={`${label}: ${locale === "ta" ? scheme.name_ta : scheme.name_en}`}
        aria-busy={pending}
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : mode === "remove" ? (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        ) : saved ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{label}</span>
      </Button>
      {(feedback || actionError) && (
        <span
          role={actionError ? "alert" : "status"}
          className={`text-xs ${actionError ? "text-rose-700" : "text-emerald-700"}`}
        >
          {actionError ?? feedback}
        </span>
      )}
    </div>
  );
}

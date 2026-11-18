"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/client";
import { ForgotPasswordInputSchema } from "@/services/auth/schema";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = ForgotPasswordInputSchema.safeParse({ email });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo }
      );

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to request password reset right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Card
          variant="glass"
          className="mx-auto max-w-md p-8 text-center space-y-5"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f]">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <Badge variant="emeraldSoft">{t.auth.forgotPassword.badge}</Badge>
          <h1 className="text-2xl font-extrabold text-[#0b172a]">
            {t.auth.forgotPassword.sentTitle}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t.auth.forgotPassword.sentDescription}
          </p>
          <Button asChild variant="default" className="w-full justify-center">
            <Link href="/login">{t.auth.forgotPassword.backToLogin}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <Card variant="glass" className="mx-auto max-w-md p-7 sm:p-9 space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f] border border-[#b7e7ce]/70">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <Badge variant="emeraldSoft">{t.auth.forgotPassword.badge}</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]">
            {t.auth.forgotPassword.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t.auth.forgotPassword.subtitle}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-200/90 p-3.5 flex items-start gap-2.5 text-xs font-medium text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">
              {t.auth.forgotPassword.emailLabel}
            </Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t.auth.forgotPassword.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting}
            className="w-full justify-center h-11"
          >
            <span>
              {isSubmitting
                ? t.auth.forgotPassword.submittingButton
                : t.auth.forgotPassword.submitButton}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-200/70 text-center text-xs">
          <Link
            href="/login"
            className="font-bold text-[#0e8a4f] hover:underline"
          >
            {t.auth.forgotPassword.backToLogin}
          </Link>
        </div>
      </Card>
    </div>
  );
}

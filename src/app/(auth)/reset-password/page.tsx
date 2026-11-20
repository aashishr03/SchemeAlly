"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/client";
import { ResetPasswordInputSchema } from "@/services/auth/schema";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = ResetPasswordInputSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setUpdated(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to update password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (updated) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Card
          variant="glass"
          className="mx-auto max-w-md p-8 text-center space-y-5"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f]">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <Badge variant="emeraldSoft">{t.auth.resetPassword.badge}</Badge>
          <h1 className="text-2xl font-extrabold text-[#0b172a]">
            {t.auth.resetPassword.successTitle}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t.auth.resetPassword.successDescription}
          </p>
          <Button asChild variant="emerald" className="w-full justify-center">
            <Link href="/dashboard">{t.auth.resetPassword.goToDashboard}</Link>
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
          <Badge variant="emeraldSoft">{t.auth.resetPassword.badge}</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]">
            {t.auth.resetPassword.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t.auth.resetPassword.subtitle}
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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="reset-password">
                {t.auth.resetPassword.passwordLabel}
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? t.auth.hidePassword : t.auth.showPassword
                }
                className="inline-flex min-h-8 items-center gap-1 rounded px-2 text-xs font-semibold text-[#245b91] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>
                  {showPassword ? t.auth.hidePassword : t.auth.showPassword}
                </span>
              </button>
            </div>
            <Input
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder={t.auth.resetPassword.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm-password">
              {t.auth.resetPassword.confirmPasswordLabel}
            </Label>
            <Input
              id="reset-confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder={t.auth.resetPassword.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="emerald"
            disabled={isSubmitting}
            className="w-full justify-center h-11"
          >
            <span>
              {isSubmitting
                ? t.auth.resetPassword.submittingButton
                : t.auth.resetPassword.submitButton}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

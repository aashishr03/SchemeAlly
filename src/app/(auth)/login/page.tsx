"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/client";
import {
  ForgotPasswordInputSchema,
  LoginInputSchema,
  sanitizeRedirectPath,
} from "@/services/auth/schema";

function LoginFormContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = sanitizeRedirectPath(
    searchParams?.get("next"),
    "/dashboard"
  );
  const search = searchParams?.toString() ?? "";
  const callbackError = searchParams?.get("error") === "auth_callback_failed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    callbackError ? t.auth.login.callbackError : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResendConfirmation] = useState(callbackError);
  const [isResendingConfirmation, setIsResendingConfirmation] =
    useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!callbackError) return;

    const params = new URLSearchParams(search);
    params.delete("error");
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login");
  }, [callbackError, router, search]);

  const handleResendConfirmation = async () => {
    setErrorMessage(null);
    setResendMessage(null);

    const parsed = ForgotPasswordInputSchema.safeParse({ email });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid email.");
      return;
    }

    setIsResendingConfirmation(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsed.data.email,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setResendMessage(t.auth.login.confirmationResent);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to resend the confirmation email."
      );
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = LoginInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to sign in right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="glass" className="mx-auto max-w-md p-7 sm:p-9 space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f] border border-[#b7e7ce]/70">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <Badge variant="emeraldSoft">{t.auth.login.badge}</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]">
          {t.auth.login.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {t.auth.login.subtitle}
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
          <Label htmlFor="login-email">{t.auth.login.emailLabel}</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t.auth.login.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t.auth.login.passwordLabel}</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#0e8a4f] hover:underline"
            >
              {t.auth.login.forgotPasswordLink}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder={t.auth.login.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={
                showPassword ? t.auth.hidePassword : t.auth.showPassword
              }
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-[#163d68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91]"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting}
          className="w-full justify-center h-11 mt-2"
        >
          <span>
            {isSubmitting
              ? t.auth.login.submittingButton
              : t.auth.login.submitButton}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {showResendConfirmation && (
        <div className="space-y-2 text-center">
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={isResendingConfirmation}
            className="text-xs font-semibold text-[#0e8a4f] hover:underline disabled:opacity-60"
          >
            {isResendingConfirmation
              ? t.auth.login.resendingConfirmation
              : t.auth.login.resendConfirmation}
          </button>
          {resendMessage && (
            <p role="status" className="text-xs text-[#0b7241]">
              {resendMessage}
            </p>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-slate-200/70 text-center text-xs text-slate-600">
        <span>{t.auth.login.noAccountPrompt} </span>
        <Link
          href="/register"
          className="font-bold text-[#0e8a4f] hover:underline"
        >
          {t.auth.login.registerLink}
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <Suspense fallback={<div className="mx-auto max-w-md h-96" />}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

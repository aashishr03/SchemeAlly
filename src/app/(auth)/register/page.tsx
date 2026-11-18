"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, UserPlus } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/client";
import { RegisterInputSchema } from "@/services/auth/schema";

export default function RegisterPage() {
  const { locale, t } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] =
    useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = RegisterInputSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const callbackUrl = `${window.location.origin}/auth/callback?next=/profile`;

      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: parsed.data.fullName,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        // Persist initial full_name and preferred_language into public.profiles
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: parsed.data.fullName,
            preferred_language: locale,
          }),
        });
        router.push("/profile");
        router.refresh();
        return;
      }

      setAwaitingEmailConfirmation(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to create account right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (awaitingEmailConfirmation) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Card
          variant="glass"
          className="mx-auto max-w-md p-8 text-center space-y-5"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f]">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <Badge variant="emeraldSoft">{t.auth.register.badge}</Badge>
          <h1 className="text-2xl font-extrabold text-[#0b172a]">
            {t.auth.register.checkEmailTitle}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t.auth.register.checkEmailDescription}
          </p>
          <Button asChild variant="default" className="w-full justify-center">
            <Link href="/login">{t.auth.register.loginLink}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Card variant="glass" className="mx-auto max-w-lg p-7 sm:p-9 space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f6ee] text-[#0e8a4f] border border-[#b7e7ce]/70">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <Badge variant="emeraldSoft">{t.auth.register.badge}</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b172a]">
            {t.auth.register.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t.auth.register.subtitle}
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
            <Label htmlFor="register-full-name">
              {t.auth.register.fullNameLabel}
            </Label>
            <Input
              id="register-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder={t.auth.register.fullNamePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-email">{t.auth.register.emailLabel}</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t.auth.register.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-password">
              {t.auth.register.passwordLabel}
            </Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder={t.auth.register.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-confirm-password">
              {t.auth.register.confirmPasswordLabel}
            </Label>
            <Input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder={t.auth.register.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="rounded-2xl bg-[#e6f6ee]/70 border border-[#b7e7ce]/80 p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
            <ShieldCheck
              className="h-4 w-4 text-[#0e8a4f] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{t.auth.register.privacyNotice}</span>
          </div>

          <Button
            type="submit"
            variant="emerald"
            disabled={isSubmitting}
            className="w-full justify-center h-11"
          >
            <span>
              {isSubmitting
                ? t.auth.register.submittingButton
                : t.auth.register.submitButton}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-200/70 text-center text-xs text-slate-600">
          <span>{t.auth.register.hasAccountPrompt} </span>
          <Link
            href="/login"
            className="font-bold text-[#0e8a4f] hover:underline"
          >
            {t.auth.register.loginLink}
          </Link>
        </div>
      </Card>
    </div>
  );
}

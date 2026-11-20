"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/client";
import {
  isGuestOnlyAuthRoute,
  isProtectedCitizenRoute,
} from "@/services/auth/route-access";
import { sanitizeRedirectPath } from "@/services/auth/schema";

export interface AuthSessionUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

interface AuthSessionContextValue {
  user: AuthSessionUser | null;
  isTransitioning: boolean;
}

interface AuthSessionProviderProps {
  children: React.ReactNode;
  initialUser: AuthSessionUser | null;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function toAuthSessionUser(user: User | null): AuthSessionUser | null {
  if (!user) return null;
  const fullName = user.user_metadata?.full_name;
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      typeof fullName === "string" && fullName.trim()
        ? fullName.trim()
        : null,
  };
}

export function AuthSessionProvider({
  children,
  initialUser,
}: AuthSessionProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [clientSession, setClientSession] = useState<{
    serverUserId: string | null;
    user: AuthSessionUser | null;
  } | null>(null);
  const [transitionTargetId, setTransitionTargetId] = useState<string | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(
    () => Boolean(initialUser) || !isSupabaseConfigured()
  );
  const lastAuthenticatedUserId = useRef(initialUser?.id ?? null);
  const initialUserIdRef = useRef(initialUser?.id ?? null);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  const user =
    clientSession?.serverUserId === (initialUser?.id ?? null)
      ? clientSession.user
      : initialUser;
  const hasInitialUser = Boolean(initialUser);
  const isTransitioning =
    transitionTargetId !== null && initialUser?.id !== transitionTargetId;

  const applyUser = useCallback((nextUser: AuthSessionUser | null) => {
    const previousUserId = lastAuthenticatedUserId.current;
    const currentPath = pathnameRef.current ?? "/";
    const currentRouter = routerRef.current;

    if (nextUser) {
      if (previousUserId && previousUserId !== nextUser.id) {
        setTransitionTargetId(
          isProtectedCitizenRoute(currentPath) ? nextUser.id : null
        );
        if (isGuestOnlyAuthRoute(currentPath)) {
          const nextPath = sanitizeRedirectPath(
            new URLSearchParams(window.location.search).get("next"),
            "/dashboard"
          );
          currentRouter.replace(nextPath);
        }
        currentRouter.refresh();
      } else {
        setTransitionTargetId(null);
      }
      lastAuthenticatedUserId.current = nextUser.id;
      setClientSession({
        serverUserId: initialUserIdRef.current,
        user: nextUser,
      });
      return;
    }

    setTransitionTargetId(null);
    setClientSession({
      serverUserId: initialUserIdRef.current,
      user: null,
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    let active = true;
    let authEventVersion = 0;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventVersion += 1;
      setIsInitialized(true);
      applyUser(toAuthSessionUser(session?.user ?? null));
    });

    if (!hasInitialUser) {
      const initialEventVersion = authEventVersion;
      void supabase.auth.getUser().then(({ data, error }) => {
        if (!active || authEventVersion !== initialEventVersion) return;
        applyUser(error ? null : toAuthSessionUser(data.user));
        setIsInitialized(true);
      });
    }

    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted && isProtectedCitizenRoute(pathnameRef.current ?? "")) {
        document.body.style.visibility = "hidden";
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !isProtectedCitizenRoute(pathnameRef.current ?? "")) {
        return;
      }

      void supabase.auth.getUser().then(({ data, error }) => {
        const restoredUser = error ? null : toAuthSessionUser(data.user);
        if (
          !restoredUser ||
          (lastAuthenticatedUserId.current &&
            lastAuthenticatedUserId.current !== restoredUser.id)
        ) {
          setClientSession({
            serverUserId: initialUserIdRef.current,
            user: null,
          });
          document.body.style.visibility = "";
          const currentPath = pathnameRef.current ?? "/dashboard";
          routerRef.current.replace(
            `/login?next=${encodeURIComponent(currentPath)}`
          );
          return;
        }

        lastAuthenticatedUserId.current = restoredUser.id;
        setClientSession({
          serverUserId: initialUserIdRef.current,
          user: restoredUser,
        });
        document.body.style.visibility = "";
      });
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [applyUser, hasInitialUser]);

  useEffect(() => {
    const currentPath = pathname ?? "/";
    if (
      isInitialized &&
      !user &&
      isProtectedCitizenRoute(currentPath)
    ) {
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, [isInitialized, pathname, router, user]);

  useEffect(() => {
    pathnameRef.current = pathname;
    routerRef.current = router;
    initialUserIdRef.current = initialUser?.id ?? null;
    if (initialUser) {
      lastAuthenticatedUserId.current = initialUser.id;
    }
  }, [initialUser, pathname, router]);

  return (
    <AuthSessionContext.Provider value={{ user, isTransitioning }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  return (
    useContext(AuthSessionContext) ?? {
      user: null,
      isTransitioning: false,
    }
  );
}

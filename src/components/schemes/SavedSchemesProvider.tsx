"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { SchemeListItem } from "@/services/scheme/schema";

export interface SavedSchemeItem {
  scheme: SchemeListItem;
  savedAt: string;
}

interface SavedSchemesContextValue {
  items: SavedSchemeItem[];
  isLoading: boolean;
  error: string | null;
  isSaved: (schemeId: string) => boolean;
  isPending: (schemeId: string) => boolean;
  save: (scheme: SchemeListItem) => Promise<void>;
  remove: (schemeId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface SavedSchemesProviderProps {
  children: React.ReactNode;
  initialAuthenticated: boolean;
}

interface SavedSchemesResponse {
  savedSchemes: SavedSchemeItem[];
  error?: { code?: string; message?: string };
}

export class SavedSchemesRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "SavedSchemesRequestError";
  }
}

const SavedSchemesContext = createContext<SavedSchemesContextValue | null>(null);

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as SavedSchemesResponse;
    return body.error?.message ?? "Could not update saved schemes.";
  } catch {
    return "Could not update saved schemes.";
  }
}

export function SavedSchemesProvider({
  children,
  initialAuthenticated,
}: SavedSchemesProviderProps) {
  const pathname = usePathname();
  const [items, setItems] = useState<SavedSchemeItem[]>([]);
  const [isLoading, setIsLoading] = useState(initialAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [reloadCounter, setReloadCounter] = useState(0);

  const refresh = useCallback(async () => {
    if (!initialAuthenticated) return;
    setIsLoading(true);
    setError(null);
    setReloadCounter((counter) => counter + 1);
  }, [initialAuthenticated]);

  useEffect(() => {
    const needsSavedSchemes =
      pathname === "/discover" ||
      pathname === "/saved" ||
      pathname?.startsWith("/schemes/");
    if (!initialAuthenticated || !needsSavedSchemes) return;

    let active = true;
    fetch("/api/saved-schemes", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new SavedSchemesRequestError(
            response.status,
            await readErrorMessage(response)
          );
        }
        const result = (await response.json()) as SavedSchemesResponse;
        if (!Array.isArray(result.savedSchemes)) {
          throw new Error("The saved schemes response was invalid.");
        }
        return result.savedSchemes;
      })
      .then((savedSchemes) => {
        if (active) setItems(savedSchemes);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load saved schemes."
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialAuthenticated, pathname, reloadCounter]);

  const setPending = useCallback((schemeId: string, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(schemeId);
      else next.delete(schemeId);
      return next;
    });
  }, []);

  const save = useCallback(
    async (scheme: SchemeListItem) => {
      setPending(scheme.id, true);
      setError(null);
      try {
        const response = await fetch(
          `/api/saved-schemes/${encodeURIComponent(scheme.id)}`,
          { method: "PUT" }
        );
        if (!response.ok) {
          throw new SavedSchemesRequestError(
            response.status,
            await readErrorMessage(response)
          );
        }
        setItems((current) =>
          current.some((item) => item.scheme.id === scheme.id)
            ? current
            : [{ scheme, savedAt: new Date().toISOString() }, ...current]
        );
      } finally {
        setPending(scheme.id, false);
      }
    },
    [setPending]
  );

  const remove = useCallback(
    async (schemeId: string) => {
      setPending(schemeId, true);
      setError(null);
      try {
        const response = await fetch(
          `/api/saved-schemes/${encodeURIComponent(schemeId)}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          throw new SavedSchemesRequestError(
            response.status,
            await readErrorMessage(response)
          );
        }
        setItems((current) =>
          current.filter((item) => item.scheme.id !== schemeId)
        );
      } finally {
        setPending(schemeId, false);
      }
    },
    [setPending]
  );

  const value = useMemo<SavedSchemesContextValue>(
    () => ({
      items,
      isLoading,
      error,
      isSaved: (schemeId) =>
        items.some((item) => item.scheme.id === schemeId),
      isPending: (schemeId) => pendingIds.has(schemeId),
      save,
      remove,
      refresh,
    }),
    [items, isLoading, error, pendingIds, save, remove, refresh]
  );

  return (
    <SavedSchemesContext.Provider value={value}>
      {children}
    </SavedSchemesContext.Provider>
  );
}

export function useSavedSchemes(): SavedSchemesContextValue {
  const context = useContext(SavedSchemesContext);
  if (!context) {
    throw new Error("useSavedSchemes must be used within SavedSchemesProvider");
  }
  return context;
}

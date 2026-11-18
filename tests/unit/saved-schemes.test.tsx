import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AppSupabaseClient } from "@/types/database";
import type {
  SchemeDetailItem,
  SchemeListItem,
} from "@/services/scheme/schema";

vi.mock("server-only", () => ({}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/discover",
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

import { SavedSchemesRepository } from "@/infrastructure/repositories/saved-schemes-repository";
import {
  InvalidSavedSchemeIdError,
  saveAuthenticatedScheme,
} from "@/services/saved-schemes/saved-schemes-service";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import SavedSchemesPage from "@/app/(citizen)/saved/page";
import { SavedSchemeAction } from "@/components/schemes/SavedSchemeAction";
import { SavedSchemesProvider } from "@/components/schemes/SavedSchemesProvider";
import { SchemeCard } from "@/components/schemes/SchemeCard";
import { SchemeDetailClient } from "@/components/schemes/SchemeDetailClient";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SCHEME_ID = "22222222-2222-4222-8222-222222222222";
const CATEGORY_ID = "33333333-3333-4333-8333-333333333333";

const SCHEME: SchemeListItem = {
  id: SCHEME_ID,
  slug: "demo-scheme",
  category_id: CATEGORY_ID,
  category: {
    id: CATEGORY_ID,
    slug: "education",
    name_en: "Education",
    name_ta: "கல்வி",
    icon: null,
  },
  name_en: "Demo Scheme",
  name_ta: "மாதிரி திட்டம்",
  short_description_en: "A verified scheme description.",
  short_description_ta: "சரிபார்க்கப்பட்ட திட்ட விவரம்.",
  benefits_en: "Benefit",
  benefits_ta: "நன்மை",
  department_en: "Department",
  department_ta: "துறை",
  government_level: "state",
  state_code: "TN",
  target_audiences: [],
  official_source_url: "https://example.gov.in",
  official_application_url: null,
  last_verified_at: "2026-11-16T00:00:00Z",
  is_verified: true,
  status: "active",
  mandatory_documents_count: 0,
};

const DETAIL_SCHEME: SchemeDetailItem = {
  ...SCHEME,
  detailed_description_en: "Scheme detail.",
  detailed_description_ta: "திட்ட விவரம்.",
  application_instructions_en: "Apply online.",
  application_instructions_ta: "இணையத்தில் விண்ணப்பிக்கவும்.",
  eligibility_rule: null,
  required_documents: [],
  application_steps: [],
  sources: [],
};

function renderWithSavedSchemes(ui: React.ReactNode) {
  return render(
    <LanguageProvider>
      <SavedSchemesProvider initialAuthenticated>{ui}</SavedSchemesProvider>
    </LanguageProvider>
  );
}

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("SavedSchemesRepository", () => {
  it("lists records filtered to the authenticated user's ID", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ scheme_id: SCHEME_ID, created_at: "2026-11-16T00:00:00Z" }],
        error: null,
      }),
    };
    const supabase = {
      from: vi.fn().mockReturnValue(query),
    } as unknown as AppSupabaseClient;

    await expect(
      new SavedSchemesRepository(supabase).listByUserId(USER_ID)
    ).resolves.toEqual([
      { scheme_id: SCHEME_ID, created_at: "2026-11-16T00:00:00Z" },
    ]);
    expect(supabase.from).toHaveBeenCalledWith("saved_schemes");
    expect(query.eq).toHaveBeenCalledWith("user_id", USER_ID);
  });

  it("saves idempotently and validates schemes are published", async () => {
    const schemeQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: SCHEME_ID },
        error: null,
      }),
    };
    const savedQuery = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    const supabase = {
      from: vi.fn((table: string) =>
        table === "schemes" ? schemeQuery : savedQuery
      ),
    } as unknown as AppSupabaseClient;

    await new SavedSchemesRepository(supabase).saveForUserId(USER_ID, SCHEME_ID);
    await new SavedSchemesRepository(supabase).saveForUserId(USER_ID, SCHEME_ID);

    expect(schemeQuery.eq).toHaveBeenNthCalledWith(1, "id", SCHEME_ID);
    expect(schemeQuery.eq).toHaveBeenNthCalledWith(2, "status", "active");
    expect(schemeQuery.eq).toHaveBeenNthCalledWith(3, "is_verified", true);
    expect(savedQuery.upsert).toHaveBeenCalledWith(
      { user_id: USER_ID, scheme_id: SCHEME_ID },
      { onConflict: "user_id,scheme_id", ignoreDuplicates: true }
    );
    expect(savedQuery.upsert).toHaveBeenCalledTimes(2);
  });

  it("removes only the requested scheme belonging to the current user", async () => {
    const deleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    deleteQuery.eq
      .mockReturnValueOnce(deleteQuery)
      .mockResolvedValueOnce({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue(deleteQuery),
    } as unknown as AppSupabaseClient;

    await new SavedSchemesRepository(supabase).removeForUserId(
      USER_ID,
      SCHEME_ID
    );

    expect(deleteQuery.eq).toHaveBeenNthCalledWith(1, "user_id", USER_ID);
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(2, "scheme_id", SCHEME_ID);
  });

  it("rejects database errors instead of reporting a successful list", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "database unavailable" },
      }),
    };
    const supabase = {
      from: vi.fn().mockReturnValue(query),
    } as unknown as AppSupabaseClient;

    await expect(
      new SavedSchemesRepository(supabase).listByUserId(USER_ID)
    ).rejects.toThrow("Failed to fetch saved schemes");
  });

  it("rejects malformed scheme IDs after verifying the current session", async () => {
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: USER_ID } },
          error: null,
        }),
      },
    } as unknown as AppSupabaseClient;

    await expect(saveAuthenticatedScheme("not-a-uuid", client)).rejects.toBeInstanceOf(
      InvalidSavedSchemeIdError
    );
  });
});

describe("Saved Schemes UI", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("synchronizes save state between the catalogue card and detail page", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response({ savedSchemes: [] }))
      .mockResolvedValueOnce(response({ saved: true }))
      .mockResolvedValueOnce(response({ saved: false }));

    renderWithSavedSchemes(
      <>
        <SchemeCard scheme={SCHEME} />
        <SchemeDetailClient scheme={DETAIL_SCHEME} />
      </>
    );
    const saveButtons = await screen.findAllByRole("button", {
      name: "Save Scheme: Demo Scheme",
    });

    fireEvent.click(saveButtons[0]);
    expect(await screen.findByText("Scheme saved.")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Saved: Demo Scheme" })
    ).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Saved: Demo Scheme" })[0]);
    expect(
      await screen.findByText("Scheme removed from saved schemes.")
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Save Scheme: Demo Scheme" })
    ).toHaveLength(2);
  });

  it("shows a useful empty state when the user has no saved schemes", async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({ savedSchemes: [] })
    );

    renderWithSavedSchemes(<SavedSchemesPage />);

    expect(
      await screen.findByRole("heading", { name: "No saved schemes yet" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Discover Schemes" })
    ).toHaveAttribute("href", "/discover");
  });

  it("renders saved scheme details and removes them from the saved list", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        response({
          savedSchemes: [
            { scheme: SCHEME, savedAt: "2026-11-16T00:00:00.000Z" },
          ],
        })
      )
      .mockResolvedValueOnce(response({ saved: false }));

    renderWithSavedSchemes(<SavedSchemesPage />);

    expect(
      await screen.findByRole("heading", { name: "Demo Scheme" })
    ).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Tamil Nadu Government")).toBeInTheDocument();
    expect(screen.getByText("A verified scheme description.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove: Demo Scheme" })
    );
    expect(
      await screen.findByRole("heading", { name: "No saved schemes yet" })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/saved-schemes/${SCHEME_ID}`,
      { method: "DELETE" }
    );
  });

  it("shows an error and retries loading saved schemes", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        response(
          { error: { message: "Could not load saved schemes." } },
          500
        )
      )
      .mockResolvedValueOnce(response({ savedSchemes: [] }));

    renderWithSavedSchemes(<SavedSchemesPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Unable to load saved schemes",
      })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(
      await screen.findByRole("heading", { name: "No saved schemes yet" })
    ).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("redirects an unauthenticated save attempt to login with a return path", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response({ error: { message: "Sign in." } }, 401))
      .mockResolvedValueOnce(response({ saved: true }));

    render(
      <LanguageProvider>
        <SavedSchemesProvider initialAuthenticated={false}>
          <SavedSchemeAction scheme={SCHEME} />
        </SavedSchemesProvider>
      </LanguageProvider>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Save Scheme: Demo Scheme" })
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/login?next=%2Fdiscover")
    );
  });
});

import { NextResponse, type NextRequest } from "next/server";
import { SavedSchemeNotFoundError } from "@/infrastructure/repositories/saved-schemes-repository";
import { UnauthorizedError } from "@/infrastructure/supabase/server";
import {
  InvalidSavedSchemeIdError,
  removeAuthenticatedSavedScheme,
  saveAuthenticatedScheme,
} from "@/services/saved-schemes/saved-schemes-service";

interface SavedSchemeRouteContext {
  params: Promise<{ schemeId: string }>;
}

export const dynamic = "force-dynamic";

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function unauthorizedResponse() {
  return privateJson(
    { error: { code: "UNAUTHENTICATED", message: "Sign in to save schemes." } },
    401
  );
}

export async function PUT(
  _request: NextRequest,
  { params }: SavedSchemeRouteContext
) {
  try {
    const { schemeId } = await params;
    await saveAuthenticatedScheme(schemeId);
    return privateJson({ saved: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof InvalidSavedSchemeIdError) {
      return privateJson(
        { error: { code: "INVALID_SCHEME_ID", message: error.message } },
        400
      );
    }
    if (error instanceof SavedSchemeNotFoundError) {
      return privateJson(
        { error: { code: "SCHEME_NOT_FOUND", message: error.message } },
        404
      );
    }
    console.error(
      "[Saved schemes] Failed to save scheme:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return privateJson(
      { error: { code: "SAVE_FAILED", message: "Could not save this scheme." } },
      500
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: SavedSchemeRouteContext
) {
  try {
    const { schemeId } = await params;
    await removeAuthenticatedSavedScheme(schemeId);
    return privateJson({ saved: false });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof InvalidSavedSchemeIdError) {
      return privateJson(
        { error: { code: "INVALID_SCHEME_ID", message: error.message } },
        400
      );
    }
    console.error(
      "[Saved schemes] Failed to remove saved scheme:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return privateJson(
      { error: { code: "REMOVE_FAILED", message: "Could not remove this saved scheme." } },
      500
    );
  }
}

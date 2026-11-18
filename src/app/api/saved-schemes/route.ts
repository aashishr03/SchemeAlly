import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/infrastructure/supabase/server";
import { listAuthenticatedSavedSchemes } from "@/services/saved-schemes/saved-schemes-service";

export const dynamic = "force-dynamic";

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET() {
  try {
    const savedSchemes = await listAuthenticatedSavedSchemes();
    return privateJson({ savedSchemes });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return privateJson(
        {
          error: {
            code: "UNAUTHENTICATED",
            message: "Sign in to view saved schemes.",
          },
        },
        401
      );
    }
    console.error(
      "[Saved schemes] Failed to list saved schemes:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return privateJson(
      {
        error: {
          code: "SAVED_SCHEMES_UNAVAILABLE",
          message: "Could not load saved schemes.",
        },
      },
      500
    );
  }
}

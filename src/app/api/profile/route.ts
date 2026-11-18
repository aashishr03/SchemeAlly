import { NextResponse, type NextRequest } from "next/server";
import { UnauthorizedError } from "@/infrastructure/supabase/server";
import {
  getAuthenticatedCitizenProfile,
  updateAuthenticatedCitizenProfile,
} from "@/services/profile/profile-service";

export const dynamic = "force-dynamic";

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET() {
  try {
    const result = await getAuthenticatedCitizenProfile();
    return privateJson(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return privateJson({ error: err.message }, 401);
    }
    return privateJson(
      {
        error:
          err instanceof Error ? err.message : "Failed to load citizen profile.",
      },
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateAuthenticatedCitizenProfile(body);
    return privateJson(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return privateJson({ error: err.message }, 401);
    }
    return privateJson(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to update citizen profile.",
      },
      400
    );
  }
}

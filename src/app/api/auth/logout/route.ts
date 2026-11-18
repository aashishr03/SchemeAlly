import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      console.error("[Auth] Failed to sign out the current session.");
      return NextResponse.json(
        { ok: false, error: "Failed to sign out." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to sign out." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

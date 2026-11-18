import type { AppSupabaseClient } from "@/types/database";

export interface SavedSchemeRecord {
  scheme_id: string;
  created_at: string;
}

export class SavedSchemeNotFoundError extends Error {
  constructor() {
    super("The requested scheme is unavailable.");
    this.name = "SavedSchemeNotFoundError";
  }
}

export class SavedSchemesRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByUserId(userId: string): Promise<SavedSchemeRecord[]> {
    const { data, error } = await this.supabase
      .from("saved_schemes")
      .select("scheme_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch saved schemes: ${error.message}`);
    }

    return data ?? [];
  }

  async saveForUserId(userId: string, schemeId: string): Promise<void> {
    const { data: scheme, error: schemeError } = await this.supabase
      .from("schemes")
      .select("id")
      .eq("id", schemeId)
      .eq("status", "active")
      .eq("is_verified", true)
      .maybeSingle();

    if (schemeError) {
      throw new Error(`Failed to validate scheme: ${schemeError.message}`);
    }
    if (!scheme) {
      throw new SavedSchemeNotFoundError();
    }

    const { error } = await this.supabase.from("saved_schemes").upsert(
      { user_id: userId, scheme_id: schemeId },
      { onConflict: "user_id,scheme_id", ignoreDuplicates: true }
    );

    if (error) {
      throw new Error(`Failed to save scheme: ${error.message}`);
    }
  }

  async removeForUserId(userId: string, schemeId: string): Promise<void> {
    const { error } = await this.supabase
      .from("saved_schemes")
      .delete()
      .eq("user_id", userId)
      .eq("scheme_id", schemeId);

    if (error) {
      throw new Error(`Failed to remove saved scheme: ${error.message}`);
    }
  }
}

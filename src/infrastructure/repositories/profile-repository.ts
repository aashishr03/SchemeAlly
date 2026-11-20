import type { AppSupabaseClient, Database } from "@/types/database";
import type {
  CitizenProfileUpdateInput,
  ProfileRow,
} from "@/services/profile/schema";

export class ProfileRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async getByUserId(authenticatedUserId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch citizen profile: ${error.message}`);
    }

    return data;
  }

  async upsertByUserId(
    authenticatedUserId: string,
    updates: CitizenProfileUpdateInput
  ): Promise<ProfileRow> {
    const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: authenticatedUserId,
      ...updates,
    };

    const { data, error } = await this.supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to save citizen profile: ${error?.message ?? "Unknown error"}`
      );
    }

    return data;
  }

  async updateByUserId(
    authenticatedUserId: string,
    updates: CitizenProfileUpdateInput
  ): Promise<ProfileRow> {
    if (Object.keys(updates).length === 0) {
      const existingProfile = await this.getByUserId(authenticatedUserId);
      return existingProfile ?? this.insertByUserId(authenticatedUserId, updates);
    }

    const { data, error } = await this.supabase
      .from("profiles")
      .update(updates)
      .eq("id", authenticatedUserId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to save citizen profile: ${error.message}`);
    }

    return data ?? this.insertByUserId(authenticatedUserId, updates);
  }

  private async insertByUserId(
    authenticatedUserId: string,
    updates: CitizenProfileUpdateInput
  ): Promise<ProfileRow> {
    const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: authenticatedUserId,
      ...updates,
    };

    const { data, error } = await this.supabase
      .from("profiles")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to save citizen profile: ${error?.message ?? "Unknown error"}`
      );
    }

    return data;
  }
}

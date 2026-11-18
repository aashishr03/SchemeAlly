export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRoleType = "citizen" | "admin";
export type PreferredLanguage = "en" | "ta";
export type GovernmentLevel = "central" | "state";
export type SchemeStatus = "active" | "archived";

export type DocumentStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "NEEDS_REVIEW"
  | "VERIFIED_AGAINST_REQUIREMENTS"
  | "DOES_NOT_MEET_REQUIREMENT"
  | "INVALID"
  | "REJECTED";

export type ApplicationStatus =
  | "NOT_STARTED"
  | "PREPARING_DOCUMENTS"
  | "READY_TO_APPLY"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CLOSED";

export type ChatMessageRole = "user" | "assistant";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          date_of_birth: string | null;
          gender: string | null;
          state: string | null;
          district: string | null;
          occupation: string | null;
          education_level: string | null;
          employment_status: string | null;
          is_student: boolean | null;
          annual_household_income: number | null;
          household_size: number | null;
          social_category: string | null;
          is_farmer: boolean | null;
          land_holding_acres: number | null;
          is_business_owner: boolean | null;
          has_disability: boolean | null;
          preferred_language: PreferredLanguage;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          state?: string | null;
          district?: string | null;
          occupation?: string | null;
          education_level?: string | null;
          employment_status?: string | null;
          is_student?: boolean | null;
          annual_household_income?: number | null;
          household_size?: number | null;
          social_category?: string | null;
          is_farmer?: boolean | null;
          land_holding_acres?: number | null;
          is_business_owner?: boolean | null;
          has_disability?: boolean | null;
          preferred_language?: PreferredLanguage;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          state?: string | null;
          district?: string | null;
          occupation?: string | null;
          education_level?: string | null;
          employment_status?: string | null;
          is_student?: boolean | null;
          annual_household_income?: number | null;
          household_size?: number | null;
          social_category?: string | null;
          is_farmer?: boolean | null;
          land_holding_acres?: number | null;
          is_business_owner?: boolean | null;
          has_disability?: boolean | null;
          preferred_language?: PreferredLanguage;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: UserRoleType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: UserRoleType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: UserRoleType;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheme_categories: {
        Row: {
          id: string;
          slug: string;
          name_en: string;
          name_ta: string;
          description_en: string | null;
          description_ta: string | null;
          icon: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_en: string;
          name_ta: string;
          description_en?: string | null;
          description_ta?: string | null;
          icon?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name_en?: string;
          name_ta?: string;
          description_en?: string | null;
          description_ta?: string | null;
          icon?: string | null;
          display_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      schemes: {
        Row: {
          id: string;
          slug: string;
          category_id: string;
          name_en: string;
          name_ta: string;
          short_description_en: string;
          short_description_ta: string;
          detailed_description_en: string;
          detailed_description_ta: string;
          benefits_en: string;
          benefits_ta: string;
          department_en: string;
          department_ta: string;
          government_level: GovernmentLevel;
          state_code: string;
          target_audiences: string[];
          application_instructions_en: string;
          application_instructions_ta: string;
          official_source_url: string;
          official_application_url: string | null;
          last_verified_at: string | null;
          is_verified: boolean;
          status: SchemeStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          category_id: string;
          name_en: string;
          name_ta: string;
          short_description_en: string;
          short_description_ta: string;
          detailed_description_en: string;
          detailed_description_ta: string;
          benefits_en: string;
          benefits_ta: string;
          department_en: string;
          department_ta: string;
          government_level: GovernmentLevel;
          state_code: string;
          target_audiences?: string[];
          application_instructions_en: string;
          application_instructions_ta: string;
          official_source_url: string;
          official_application_url?: string | null;
          last_verified_at?: string | null;
          is_verified?: boolean;
          status?: SchemeStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          category_id?: string;
          name_en?: string;
          name_ta?: string;
          short_description_en?: string;
          short_description_ta?: string;
          detailed_description_en?: string;
          detailed_description_ta?: string;
          benefits_en?: string;
          benefits_ta?: string;
          department_en?: string;
          department_ta?: string;
          government_level?: GovernmentLevel;
          state_code?: string;
          target_audiences?: string[];
          application_instructions_en?: string;
          application_instructions_ta?: string;
          official_source_url?: string;
          official_application_url?: string | null;
          last_verified_at?: string | null;
          is_verified?: boolean;
          status?: SchemeStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheme_eligibility_rules: {
        Row: {
          id: string;
          scheme_id: string;
          rule_version: number;
          is_active: boolean;
          root_group: Json;
          summary_en: string | null;
          summary_ta: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scheme_id: string;
          rule_version?: number;
          is_active?: boolean;
          root_group: Json;
          summary_en?: string | null;
          summary_ta?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rule_version?: number;
          is_active?: boolean;
          root_group?: Json;
          summary_en?: string | null;
          summary_ta?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheme_required_documents: {
        Row: {
          id: string;
          scheme_id: string;
          document_type_code: string;
          name_en: string;
          name_ta: string;
          description_en: string | null;
          description_ta: string | null;
          is_mandatory: boolean;
          requires_unexpired: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scheme_id: string;
          document_type_code: string;
          name_en: string;
          name_ta: string;
          description_en?: string | null;
          description_ta?: string | null;
          is_mandatory?: boolean;
          requires_unexpired?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          document_type_code?: string;
          name_en?: string;
          name_ta?: string;
          description_en?: string | null;
          description_ta?: string | null;
          is_mandatory?: boolean;
          requires_unexpired?: boolean;
          display_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheme_application_steps: {
        Row: {
          id: string;
          scheme_id: string;
          step_number: number;
          title_en: string;
          title_ta: string;
          description_en: string;
          description_ta: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scheme_id: string;
          step_number: number;
          title_en: string;
          title_ta: string;
          description_en: string;
          description_ta: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          step_number?: number;
          title_en?: string;
          title_ta?: string;
          description_en?: string;
          description_ta?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheme_sources: {
        Row: {
          id: string;
          scheme_id: string;
          source_title: string;
          source_url: string;
          source_type: string;
          verified_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          scheme_id: string;
          source_title: string;
          source_url: string;
          source_type?: string;
          verified_at: string;
          created_at?: string;
        };
        Update: {
          source_title?: string;
          source_url?: string;
          source_type?: string;
          verified_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          document_type_code: string;
          file_name: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          status: DocumentStatus;
          issue_date: string | null;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type_code: string;
          file_name: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          status?: DocumentStatus;
          issue_date?: string | null;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          document_type_code?: string;
          file_name?: string;
          storage_path?: string;
          mime_type?: string;
          file_size_bytes?: number;
          status?: DocumentStatus;
          issue_date?: string | null;
          expiry_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_extractions: {
        Row: {
          id: string;
          document_id: string;
          extracted_document_type: string | null;
          applicant_name: string | null;
          date_of_birth: string | null;
          annual_income: number | null;
          issuing_authority: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          education_details: string | null;
          legibility: string | null;
          raw_extracted_json: Json;
          user_corrected_json: Json | null;
          reviewed_by_user_at: string | null;
          model_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          extracted_document_type?: string | null;
          applicant_name?: string | null;
          date_of_birth?: string | null;
          annual_income?: number | null;
          issuing_authority?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          education_details?: string | null;
          legibility?: string | null;
          raw_extracted_json?: Json;
          user_corrected_json?: Json | null;
          reviewed_by_user_at?: string | null;
          model_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          extracted_document_type?: string | null;
          applicant_name?: string | null;
          date_of_birth?: string | null;
          annual_income?: number | null;
          issuing_authority?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          education_details?: string | null;
          legibility?: string | null;
          raw_extracted_json?: Json;
          user_corrected_json?: Json | null;
          reviewed_by_user_at?: string | null;
          model_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_schemes: {
        Row: {
          id: string;
          user_id: string;
          scheme_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheme_id: string;
          created_at?: string;
        };
        Update: {
          scheme_id?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          scheme_id: string;
          status: ApplicationStatus;
          user_reference_number: string | null;
          personal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheme_id: string;
          status?: ApplicationStatus;
          user_reference_number?: string | null;
          personal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: ApplicationStatus;
          user_reference_number?: string | null;
          personal_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_checklist_items: {
        Row: {
          id: string;
          application_id: string;
          required_document_id: string;
          linked_document_id: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          required_document_id: string;
          linked_document_id?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          linked_document_id?: string | null;
          is_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          scheme_id: string | null;
          title: string;
          language: PreferredLanguage;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheme_id?: string | null;
          title: string;
          language?: PreferredLanguage;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          scheme_id?: string | null;
          title?: string;
          language?: PreferredLanguage;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: ChatMessageRole;
          content: string;
          sources_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: ChatMessageRole;
          content: string;
          sources_json?: Json;
          created_at?: string;
        };
        Update: {
          content?: string;
          sources_json?: Json;
        };
        Relationships: [];
      };
      knowledge_documents: {
        Row: {
          id: string;
          scheme_id: string;
          title: string;
          source_url: string;
          language: PreferredLanguage;
          verified_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scheme_id: string;
          title: string;
          source_url: string;
          language?: PreferredLanguage;
          verified_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          source_url?: string;
          language?: PreferredLanguage;
          verified_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      knowledge_chunks: {
        Row: {
          id: string;
          knowledge_document_id: string;
          scheme_id: string;
          chunk_index: number;
          content: string;
          language: PreferredLanguage;
          source_url: string;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          knowledge_document_id: string;
          scheme_id: string;
          chunk_index: number;
          content: string;
          language?: PreferredLanguage;
          source_url: string;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          chunk_index?: number;
          content?: string;
          language?: PreferredLanguage;
          source_url?: string;
          embedding?: number[] | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title_en: string;
          title_ta: string;
          body_en: string;
          body_ta: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title_en: string;
          title_ta: string;
          body_en: string;
          body_ta: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_scheme_knowledge: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_scheme_id?: string | null;
          filter_language?: string | null;
        };
        Returns: {
          chunk_id: string;
          scheme_id: string;
          scheme_slug: string;
          scheme_name_en: string;
          scheme_name_ta: string;
          content: string;
          language: string;
          source_url: string;
          last_verified_at: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type AppSupabaseClient = import("@supabase/supabase-js").SupabaseClient<Database>;



-- ============================================================================
-- Migration 001: Initial Schema, Extensions, Constraints, and Indexes
-- Project: SchemeAlly
-- ============================================================================

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION
  WHEN OTHERS THEN NULL;
END
$$;

CREATE EXTENSION IF NOT EXISTS "vector";

-- Updated_at timestamp trigger function with fixed search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. USER DATA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'transgender', 'other', 'prefer_not_to_say')),
  state TEXT,
  district TEXT,
  occupation TEXT,
  education_level TEXT,
  employment_status TEXT,
  is_student BOOLEAN,
  annual_household_income NUMERIC(12, 2) CHECK (annual_household_income IS NULL OR annual_household_income >= 0),
  household_size INTEGER CHECK (household_size IS NULL OR (household_size >= 1 AND household_size <= 50)),
  social_category TEXT,
  is_farmer BOOLEAN,
  land_holding_acres NUMERIC(8, 2) CHECK (land_holding_acres IS NULL OR land_holding_acres >= 0),
  is_business_owner BOOLEAN,
  has_disability BOOLEAN,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatically provision citizen profile and role when a user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 2. SCHEME CATALOGUE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheme_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  description_en TEXT,
  description_ta TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_scheme_categories_updated_at
BEFORE UPDATE ON public.scheme_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES public.scheme_categories(id) ON DELETE RESTRICT,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  short_description_en TEXT NOT NULL,
  short_description_ta TEXT NOT NULL,
  detailed_description_en TEXT NOT NULL,
  detailed_description_ta TEXT NOT NULL,
  benefits_en TEXT NOT NULL,
  benefits_ta TEXT NOT NULL,
  department_en TEXT NOT NULL,
  department_ta TEXT NOT NULL,
  government_level TEXT NOT NULL CHECK (government_level IN ('central', 'state')),
  state_code TEXT NOT NULL DEFAULT 'TN',
  target_audiences TEXT[] NOT NULL DEFAULT '{}',
  application_instructions_en TEXT NOT NULL,
  application_instructions_ta TEXT NOT NULL,
  official_source_url TEXT NOT NULL CHECK (official_source_url ~ '^https?://'),
  official_application_url TEXT CHECK (official_application_url IS NULL OR official_application_url ~ '^https?://'),
  last_verified_at TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_verified_schemes_have_timestamp CHECK (
    is_verified = false OR last_verified_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_schemes_category_id ON public.schemes(category_id);
CREATE INDEX IF NOT EXISTS idx_schemes_status_verified ON public.schemes(status, is_verified);
CREATE INDEX IF NOT EXISTS idx_schemes_gov_level_state ON public.schemes(government_level, state_code);

CREATE TRIGGER trg_schemes_updated_at
BEFORE UPDATE ON public.schemes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.scheme_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  rule_version INTEGER NOT NULL DEFAULT 1 CHECK (rule_version >= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  root_group JSONB NOT NULL,
  summary_en TEXT,
  summary_ta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (scheme_id, rule_version),
  CONSTRAINT chk_root_group_is_group_node CHECK (
    jsonb_typeof(root_group) = 'object'
    AND (root_group ->> 'type') = 'GROUP'
    AND (root_group ->> 'logicalOperator') IN ('AND', 'OR')
    AND jsonb_typeof(root_group -> 'children') = 'array'
  )
);

CREATE INDEX IF NOT EXISTS idx_scheme_eligibility_rules_scheme_active
ON public.scheme_eligibility_rules(scheme_id, is_active);

CREATE TRIGGER trg_scheme_eligibility_rules_updated_at
BEFORE UPDATE ON public.scheme_eligibility_rules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.scheme_required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  document_type_code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  description_en TEXT,
  description_ta TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  requires_unexpired BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (scheme_id, document_type_code)
);

CREATE INDEX IF NOT EXISTS idx_scheme_required_documents_scheme_id
ON public.scheme_required_documents(scheme_id);

CREATE TRIGGER trg_scheme_required_documents_updated_at
BEFORE UPDATE ON public.scheme_required_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.scheme_application_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1),
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ta TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (scheme_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_scheme_application_steps_scheme_id
ON public.scheme_application_steps(scheme_id, step_number);

CREATE TRIGGER trg_scheme_application_steps_updated_at
BEFORE UPDATE ON public.scheme_application_steps
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.scheme_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL CHECK (source_url ~ '^https?://'),
  source_type TEXT NOT NULL DEFAULT 'official_portal',
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_scheme_sources_scheme_id
ON public.scheme_sources(scheme_id);

-- ============================================================================
-- 3. CITIZEN DOCUMENTS & EXTRACTIONS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type_code TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (
    mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    )
  ),
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (
    status IN (
      'UPLOADED',
      'PROCESSING',
      'NEEDS_REVIEW',
      'VERIFIED_AGAINST_REQUIREMENTS',
      'DOES_NOT_MEET_REQUIREMENT',
      'INVALID',
      'REJECTED'
    )
  ),
  issue_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_type_status
ON public.documents(user_id, document_type_code, status);

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Child table: ownership enforced via document_id -> documents.user_id
CREATE TABLE IF NOT EXISTS public.document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE REFERENCES public.documents(id) ON DELETE CASCADE,
  extracted_document_type TEXT,
  applicant_name TEXT,
  date_of_birth DATE,
  annual_income NUMERIC(12, 2) CHECK (annual_income IS NULL OR annual_income >= 0),
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  education_details TEXT,
  legibility TEXT CHECK (legibility IS NULL OR legibility IN ('CLEAR', 'PARTIAL', 'ILLEGIBLE')),
  raw_extracted_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_corrected_json JSONB,
  reviewed_by_user_at TIMESTAMPTZ,
  model_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_document_extractions_document_id
ON public.document_extractions(document_id);

CREATE TRIGGER trg_document_extractions_updated_at
BEFORE UPDATE ON public.document_extractions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. USER ACTIVITY TABLES (SAVED SCHEMES & APPLICATIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, scheme_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_schemes_user_id ON public.saved_schemes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_schemes_scheme_id ON public.saved_schemes(scheme_id);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (
    status IN (
      'NOT_STARTED',
      'PREPARING_DOCUMENTS',
      'READY_TO_APPLY',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'CLOSED'
    )
  ),
  user_reference_number TEXT,
  personal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, scheme_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_scheme_id ON public.applications(scheme_id);

CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Child table: ownership enforced via application_id -> applications.user_id
-- and linked_document_id -> documents.user_id
CREATE TABLE IF NOT EXISTS public.application_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  required_document_id UUID NOT NULL REFERENCES public.scheme_required_documents(id) ON DELETE CASCADE,
  linked_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (application_id, required_document_id)
);

CREATE INDEX IF NOT EXISTS idx_application_checklist_items_application_id
ON public.application_checklist_items(application_id);
CREATE INDEX IF NOT EXISTS idx_application_checklist_items_linked_document_id
ON public.application_checklist_items(linked_document_id);

CREATE TRIGGER trg_application_checklist_items_updated_at
BEFORE UPDATE ON public.application_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. AI ALLY CONVERSATIONS & KNOWLEDGE BASE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id UUID REFERENCES public.schemes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id
ON public.chat_conversations(user_id);

CREATE TRIGGER trg_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Child table: ownership enforced via conversation_id -> chat_conversations.user_id
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
ON public.chat_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL CHECK (source_url ~ '^https?://'),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_scheme_id
ON public.knowledge_documents(scheme_id);

CREATE TRIGGER trg_knowledge_documents_updated_at
BEFORE UPDATE ON public.knowledge_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  source_url TEXT NOT NULL CHECK (source_url ~ '^https?://'),
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (knowledge_document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_scheme_id
ON public.knowledge_chunks(scheme_id);

-- ============================================================================
-- 6. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_ta TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON public.notifications(user_id, is_read);

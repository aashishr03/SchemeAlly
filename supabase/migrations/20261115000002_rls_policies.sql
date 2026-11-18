-- ============================================================================
-- Migration 002: Row Level Security (RLS) Policies & Grants
-- Project: SchemeAlly
-- ============================================================================

-- Enable RLS across all 16 application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_application_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners unless bypassed by Postgres superuser / service_role
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.schemes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_eligibility_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_required_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_application_steps FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.saved_schemes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.applications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.application_checklist_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. DIRECT USER-OWNED TABLES
-- ============================================================================

-- profiles: id = auth.uid()
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = id);

-- user_roles: citizens can only read their own role; cannot insert/update/delete roles
CREATE POLICY "user_roles_select_own"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- documents: user_id = auth.uid()
CREATE POLICY "documents_select_own"
ON public.documents FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own"
ON public.documents FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_delete_own"
ON public.documents FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- saved_schemes: user_id = auth.uid()
CREATE POLICY "saved_schemes_select_own"
ON public.saved_schemes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "saved_schemes_insert_own"
ON public.saved_schemes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_schemes_delete_own"
ON public.saved_schemes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- applications: user_id = auth.uid()
CREATE POLICY "applications_select_own"
ON public.applications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own"
ON public.applications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_delete_own"
ON public.applications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- chat_conversations: user_id = auth.uid()
CREATE POLICY "chat_conversations_select_own"
ON public.chat_conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "chat_conversations_insert_own"
ON public.chat_conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_conversations_update_own"
ON public.chat_conversations FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_conversations_delete_own"
ON public.chat_conversations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- notifications: user_id = auth.uid()
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 2. CHILD USER-OWNED TABLES (OWNERSHIP VIA PARENT RELATIONSHIP)
-- ============================================================================

-- document_extractions -> documents -> user_id
CREATE POLICY "document_extractions_select_via_parent"
ON public.document_extractions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_extractions.document_id
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "document_extractions_insert_via_parent"
ON public.document_extractions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_extractions.document_id
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "document_extractions_update_via_parent"
ON public.document_extractions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_extractions.document_id
      AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_extractions.document_id
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "document_extractions_delete_via_parent"
ON public.document_extractions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_extractions.document_id
      AND d.user_id = auth.uid()
  )
);

-- application_checklist_items -> applications -> user_id
-- Plus verification that linked_document_id (if set) belongs to the same user
CREATE POLICY "application_checklist_items_select_via_parent"
ON public.application_checklist_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_checklist_items.application_id
      AND a.user_id = auth.uid()
  )
);

CREATE POLICY "application_checklist_items_insert_via_parent"
ON public.application_checklist_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_checklist_items.application_id
      AND a.user_id = auth.uid()
  )
  AND (
    application_checklist_items.linked_document_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = application_checklist_items.linked_document_id
        AND d.user_id = auth.uid()
    )
  )
);

CREATE POLICY "application_checklist_items_update_via_parent"
ON public.application_checklist_items FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_checklist_items.application_id
      AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_checklist_items.application_id
      AND a.user_id = auth.uid()
  )
  AND (
    application_checklist_items.linked_document_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = application_checklist_items.linked_document_id
        AND d.user_id = auth.uid()
    )
  )
);

CREATE POLICY "application_checklist_items_delete_via_parent"
ON public.application_checklist_items FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_checklist_items.application_id
      AND a.user_id = auth.uid()
  )
);

-- chat_messages -> chat_conversations -> user_id
CREATE POLICY "chat_messages_select_via_parent"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "chat_messages_insert_via_parent"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "chat_messages_delete_via_parent"
ON public.chat_messages FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

-- ============================================================================
-- 3. SCHEME CATALOGUE & KNOWLEDGE BASE (READ-ONLY FOR CITIZENS, VERIFIED ONLY)
-- ============================================================================

-- scheme_categories: public read access
CREATE POLICY "scheme_categories_read_published"
ON public.scheme_categories FOR SELECT TO anon, authenticated
USING (true);

-- schemes: citizens and anonymous visitors can only read active, verified schemes
CREATE POLICY "schemes_read_active_verified"
ON public.schemes FOR SELECT TO anon, authenticated
USING (status = 'active' AND is_verified = true);

-- scheme_eligibility_rules: read active rules for active, verified schemes
CREATE POLICY "scheme_eligibility_rules_read_active_verified"
ON public.scheme_eligibility_rules FOR SELECT TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.schemes s
    WHERE s.id = scheme_eligibility_rules.scheme_id
      AND s.status = 'active'
      AND s.is_verified = true
  )
);

-- scheme_required_documents: read documents for active, verified schemes
CREATE POLICY "scheme_required_documents_read_active_verified"
ON public.scheme_required_documents FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schemes s
    WHERE s.id = scheme_required_documents.scheme_id
      AND s.status = 'active'
      AND s.is_verified = true
  )
);

-- scheme_application_steps: read steps for active, verified schemes
CREATE POLICY "scheme_application_steps_read_active_verified"
ON public.scheme_application_steps FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schemes s
    WHERE s.id = scheme_application_steps.scheme_id
      AND s.status = 'active'
      AND s.is_verified = true
  )
);

-- scheme_sources: read sources for active, verified schemes
CREATE POLICY "scheme_sources_read_active_verified"
ON public.scheme_sources FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schemes s
    WHERE s.id = scheme_sources.scheme_id
      AND s.status = 'active'
      AND s.is_verified = true
  )
);

-- knowledge_documents: read knowledge documents for active, verified schemes
CREATE POLICY "knowledge_documents_read_active_verified"
ON public.knowledge_documents FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schemes s
    WHERE s.id = knowledge_documents.scheme_id
      AND s.status = 'active'
      AND s.is_verified = true
  )
);

-- knowledge_chunks: read knowledge chunks for active, verified schemes
CREATE POLICY "knowledge_chunks_read_active_verified"
ON public.knowledge_chunks FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schemes s
    WHERE s.id = knowledge_chunks.scheme_id
      AND s.status = 'active'
      AND s.is_verified = true
  )
);

-- Table-level privilege hardening:
-- Revoke write privileges on catalogue/knowledge tables from anon and authenticated roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.scheme_categories,
  public.schemes,
  public.scheme_eligibility_rules,
  public.scheme_required_documents,
  public.scheme_application_steps,
  public.scheme_sources,
  public.knowledge_documents,
  public.knowledge_chunks,
  public.user_roles
FROM anon, authenticated;

GRANT SELECT ON
  public.scheme_categories,
  public.schemes,
  public.scheme_eligibility_rules,
  public.scheme_required_documents,
  public.scheme_application_steps,
  public.scheme_sources,
  public.knowledge_documents,
  public.knowledge_chunks
TO anon, authenticated;

-- Revoke all access to private citizen tables from anonymous role
REVOKE ALL ON
  public.profiles,
  public.user_roles,
  public.documents,
  public.document_extractions,
  public.saved_schemes,
  public.applications,
  public.application_checklist_items,
  public.chat_conversations,
  public.chat_messages,
  public.notifications
FROM anon;

-- Grant appropriate DML privileges to authenticated role (subject to FORCE ROW LEVEL SECURITY)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles,
  public.documents,
  public.document_extractions,
  public.saved_schemes,
  public.applications,
  public.application_checklist_items,
  public.chat_conversations,
  public.chat_messages,
  public.notifications
TO authenticated;

GRANT SELECT ON public.user_roles TO authenticated;


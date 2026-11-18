-- ============================================================================
-- Migration 003: Private Citizen Document Storage & Hardened Vector Search RPC
-- Project: SchemeAlly
-- ============================================================================

-- ============================================================================
-- 1. PRIVATE STORAGE BUCKET: citizen-documents
-- ============================================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'citizen-documents',
  'citizen-documents',
  false,
  10485760, -- 10 MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies on storage.objects for citizen-documents
-- Object path format: {user_id}/{document_id}/{file_name}
DROP POLICY IF EXISTS "citizen_documents_select_own" ON storage.objects;
CREATE POLICY "citizen_documents_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'citizen-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "citizen_documents_insert_own" ON storage.objects;
CREATE POLICY "citizen_documents_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'citizen-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
  )
);

DROP POLICY IF EXISTS "citizen_documents_update_own" ON storage.objects;
CREATE POLICY "citizen_documents_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'citizen-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'citizen-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "citizen_documents_delete_own" ON storage.objects;
CREATE POLICY "citizen_documents_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'citizen-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 2. PGVECTOR INDEX & HARDENED match_scheme_knowledge FUNCTION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
ON public.knowledge_chunks
USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.match_scheme_knowledge(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_scheme_id UUID DEFAULT NULL,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  scheme_id UUID,
  scheme_slug TEXT,
  scheme_name_en TEXT,
  scheme_name_ta TEXT,
  content TEXT,
  language TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id AS chunk_id,
    s.id AS scheme_id,
    s.slug AS scheme_slug,
    s.name_en AS scheme_name_en,
    s.name_ta AS scheme_name_ta,
    kc.content,
    kc.language,
    kc.source_url,
    s.last_verified_at,
    (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.knowledge_chunks kc
  INNER JOIN public.schemes s
    ON s.id = kc.scheme_id
  WHERE s.status = 'active'
    AND s.is_verified = true
    AND kc.embedding IS NOT NULL
    AND (filter_scheme_id IS NULL OR kc.scheme_id = filter_scheme_id)
    AND (filter_language IS NULL OR kc.language = filter_language)
    AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kc.embedding <=> query_embedding ASC
  LIMIT LEAST(GREATEST(match_count, 1), 25);
END;
$$;

-- Restrict execution permissions on match_scheme_knowledge
REVOKE ALL ON FUNCTION public.match_scheme_knowledge(vector(768), FLOAT, INT, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_scheme_knowledge(vector(768), FLOAT, INT, UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_scheme_knowledge(vector(768), FLOAT, INT, UUID, TEXT) TO authenticated, service_role;

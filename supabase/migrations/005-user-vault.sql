-- ============================================================
-- 005: User Vault (Document Storage)
-- Target: DATA instance (jbmhfpkzbgyeodsqhprx.supabase.co)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vault_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    tool_slug TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vault_user
    ON public.vault_documents (user_id, created_at DESC);

-- RLS
ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vault documents"
    ON public.vault_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault documents"
    ON public.vault_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault documents"
    ON public.vault_documents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault documents"
    ON public.vault_documents FOR DELETE
    USING (auth.uid() = user_id);

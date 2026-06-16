-- ── Tabela de logs ──────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.pdf_novo_aluno_links (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_email               TEXT        NOT NULL,
  activecampaign_contact_id   TEXT,
  storage_bucket              TEXT        NOT NULL DEFAULT 'pdf-novo-aluno',
  storage_path                TEXT        NOT NULL,
  pdf_url                     TEXT        NOT NULL,
  field_perstag               TEXT        NOT NULL DEFAULT 'PDF_NOVO_ALUNO',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdf_novo_aluno_links_contact_email
  ON public.pdf_novo_aluno_links (contact_email);

ALTER TABLE public.pdf_novo_aluno_links ENABLE ROW LEVEL SECURITY;

-- ── Bucket público ────────────────────────────────────────────────────────────
-- Execute no SQL Editor do Supabase:

INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-novo-aluno', 'pdf-novo-aluno', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── Políticas (anon key) ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Allow anon upload pdf novo aluno'
  ) THEN
    CREATE POLICY "Allow anon upload pdf novo aluno"
      ON storage.objects FOR INSERT TO anon
      WITH CHECK (bucket_id = 'pdf-novo-aluno');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Allow public read pdf novo aluno'
  ) THEN
    CREATE POLICY "Allow public read pdf novo aluno"
      ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'pdf-novo-aluno');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'pdf_novo_aluno_links'
      AND policyname = 'Allow anon insert pdf novo aluno links'
  ) THEN
    CREATE POLICY "Allow anon insert pdf novo aluno links"
      ON public.pdf_novo_aluno_links FOR INSERT TO anon
      WITH CHECK (true);
  END IF;
END$$;

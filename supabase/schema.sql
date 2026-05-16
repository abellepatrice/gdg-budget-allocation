-- ============================================================
-- BudgetWatch KE — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- Enable pgvector for future embedding support
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Counties ──────────────────────────────────────────────────
CREATE TABLE public.counties (
  id          uuid    NOT NULL DEFAULT gen_random_uuid(),
  name        text    NOT NULL,
  code        text    UNIQUE,
  created_at  timestamp without time zone DEFAULT now(),
  CONSTRAINT counties_pkey PRIMARY KEY (id)
);

-- Seed Kenya's 47 counties
INSERT INTO public.counties (name, code) VALUES
  ('Mombasa', 'MSA'), ('Kwale', 'KWL'), ('Kilifi', 'KLF'), ('Tana River', 'TNR'),
  ('Lamu', 'LMU'), ('Taita-Taveta', 'TTV'), ('Garissa', 'GRS'), ('Wajir', 'WJR'),
  ('Mandera', 'MND'), ('Marsabit', 'MRS'), ('Isiolo', 'ISL'), ('Meru', 'MRU'),
  ('Tharaka-Nithi', 'TRN'), ('Embu', 'EMB'), ('Kitui', 'KTU'), ('Machakos', 'MKS'),
  ('Makueni', 'MKN'), ('Nyandarua', 'NYN'), ('Nyeri', 'NYR'), ('Kirinyaga', 'KRY'),
  ('Murang''a', 'MRG'), ('Kiambu', 'KMB'), ('Turkana', 'TRK'), ('West Pokot', 'WPK'),
  ('Samburu', 'SMB'), ('Trans Nzoia', 'TNZ'), ('Uasin Gishu', 'USG'), ('Elgeyo-Marakwet', 'ELM'),
  ('Nandi', 'NND'), ('Baringo', 'BRN'), ('Laikipia', 'LKP'), ('Nakuru', 'NKR'),
  ('Narok', 'NRK'), ('Kajiado', 'KJD'), ('Kericho', 'KRC'), ('Bomet', 'BMT'),
  ('Kakamega', 'KKM'), ('Vihiga', 'VHG'), ('Bungoma', 'BNG'), ('Busia', 'BSA'),
  ('Siaya', 'SYA'), ('Kisumu', 'KSM'), ('Homa Bay', 'HMB'), ('Migori', 'MGR'),
  ('Kisii', 'KSI'), ('Nyamira', 'NYM'), ('Nairobi', 'NBI')
ON CONFLICT (code) DO NOTHING;

-- ── Budget Documents ──────────────────────────────────────────
CREATE TABLE public.budget_documents (
  id            uuid    NOT NULL DEFAULT gen_random_uuid(),
  county_id     uuid,
  title         text,
  fiscal_year   text,
  document_type text,   -- 'budget', 'supplementary', 'estimates', 'report'
  file_url      text,
  uploaded_at   timestamp without time zone DEFAULT now(),
  CONSTRAINT budget_documents_pkey PRIMARY KEY (id),
  CONSTRAINT budget_documents_county_id_fkey
    FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE SET NULL
);

CREATE INDEX idx_budget_documents_county ON public.budget_documents(county_id);
CREATE INDEX idx_budget_documents_year   ON public.budget_documents(fiscal_year);

-- ── Budget Chunks (RAG) ───────────────────────────────────────
CREATE TABLE public.budget_chunks (
  id          uuid    NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid,
  chunk_text  text,
  embedding   vector(768),   -- for future semantic search
  page_number integer,
  created_at  timestamp without time zone DEFAULT now(),
  CONSTRAINT budget_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT budget_chunks_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.budget_documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_budget_chunks_document ON public.budget_chunks(document_id);

-- ── Allocations ───────────────────────────────────────────────
CREATE TABLE public.allocations (
  id          uuid    NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid,
  department  text,
  ward        text,
  amount      numeric,
  fiscal_year text,
  created_at  timestamp without time zone DEFAULT now(),
  CONSTRAINT allocations_pkey PRIMARY KEY (id),
  CONSTRAINT allocations_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.budget_documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_allocations_document ON public.allocations(document_id);

-- ── Amendment Flags ───────────────────────────────────────────
CREATE TABLE public.amendment_flags (
  id                  uuid    NOT NULL DEFAULT gen_random_uuid(),
  original_document   uuid,
  revised_document    uuid,
  department          text,
  old_amount          numeric,
  new_amount          numeric,
  percentage_change   numeric,
  risk_level          text,   -- 'HIGH', 'MEDIUM', 'LOW'
  created_at          timestamp without time zone DEFAULT now(),
  CONSTRAINT amendment_flags_pkey PRIMARY KEY (id),
  CONSTRAINT amendment_flags_original_document_fkey
    FOREIGN KEY (original_document) REFERENCES public.budget_documents(id) ON DELETE CASCADE,
  CONSTRAINT amendment_flags_revised_document_fkey
    FOREIGN KEY (revised_document) REFERENCES public.budget_documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_amendment_flags_original ON public.amendment_flags(original_document);
CREATE INDEX idx_amendment_flags_revised  ON public.amendment_flags(revised_document);
CREATE INDEX idx_amendment_flags_risk     ON public.amendment_flags(risk_level);

-- ── SMS Digests ───────────────────────────────────────────────
CREATE TABLE public.sms_digests (
  id          uuid    NOT NULL DEFAULT gen_random_uuid(),
  county_id   uuid,
  message     text,
  created_at  timestamp without time zone DEFAULT now(),
  CONSTRAINT sms_digests_pkey PRIMARY KEY (id),
  CONSTRAINT sms_digests_county_id_fkey
    FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE SET NULL
);

CREATE INDEX idx_sms_digests_county ON public.sms_digests(county_id);

-- ── Row Level Security (Optional — enable for production) ─────
-- ALTER TABLE public.counties          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.budget_documents  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.budget_chunks     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.allocations       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.amendment_flags   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sms_digests       ENABLE ROW LEVEL SECURITY;

-- For MVP/hackathon: allow public read, service-key write
-- CREATE POLICY "Public read" ON public.budget_documents FOR SELECT USING (true);

-- ── Done ─────────────────────────────────────────────────────
-- Your BudgetWatch KE database is ready!

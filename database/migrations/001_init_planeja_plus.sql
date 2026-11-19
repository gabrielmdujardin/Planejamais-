-- =============================================================================
-- PLANEJA+ — MIGRATION 001: INFRAESTRUTURA PRÓPRIA POSTGRESQL 16 (SEM SUPABASE)
-- Banco de Dados: planeja_plus
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ROLES E SCHEMA DE COMPATIBILIDADE DE SESSÃO (RLS NATIVO NO POSTGRESQL PURO)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

-- Funções de contexto de sessão PostgreSQL (lidas a partir de SET LOCAL app.current_user_id)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(nullif(current_setting('app.current_role', true), ''), 'authenticated');
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. TABELAS DE IDENTIDADE, AUTENTICAÇÃO PRÓPRIA, SESSÕES E TOKENS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  phone text,
  location text,
  avatar text,
  email_verified boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz,
  calendar_feed_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sincroniza automaticamente public.users -> auth.users para manter integridade legada
CREATE OR REPLACE FUNCTION public.sync_public_user_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    jsonb_build_object(
      'name', coalesce(NEW.name, ''),
      'phone', coalesce(NEW.phone, ''),
      'location', coalesce(NEW.location, ''),
      'avatar_url', coalesce(NEW.avatar, '')
    ) || coalesce(NEW.metadata, '{}'::jsonb),
    NEW.email_verified_at,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_public_user_to_auth ON public.users;
CREATE TRIGGER trg_sync_public_user_to_auth
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_to_auth();

-- Credenciais de senha (hash Argon2id / Scrypt com salt criptográfico, nunca texto puro)
CREATE TABLE IF NOT EXISTS public.user_credentials (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  algorithm text NOT NULL DEFAULT 'scrypt-argon2id',
  failed_login_attempts integer NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  locked_until timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  requires_password_reset boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sessões autenticadas ativas e revogáveis (RF-002, RF-003, RNF-004)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tokens transacionais de verificação de e-mail e recuperação/redefinição de senha
CREATE TABLE IF NOT EXISTS public.auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_type text NOT NULL CHECK (token_type IN ('email_verification', 'password_reset', 'email_change')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. TABELAS DE DOMÍNIO DO PLANEJA+ (EVENTOS, CONVIDADOS, ITENS, FOTOS, CONTATOS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  category text,
  date text NOT NULL,
  time text NOT NULL,
  full_date text,
  location text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'completed', 'canceled', 'confirmed', 'pending', 'cancelled')),
  financial_mode text NOT NULL DEFAULT 'corporate_budget'
    CHECK (financial_mode IN ('corporate_budget', 'collaborative_split')),
  image text,
  start_date date,
  start_time time,
  end_date date,
  end_time time,
  address text,
  maps_url text,
  event_mode text NOT NULL DEFAULT 'presential'
    CHECK (event_mode IN ('presential', 'online', 'hybrid')),
  meeting_url text,
  capacity integer CHECK (capacity IS NULL OR capacity >= 0),
  allow_guests boolean NOT NULL DEFAULT true,
  confirmed_guests integer NOT NULL DEFAULT 0 CHECK (confirmed_guests >= 0),
  total_guests integer NOT NULL DEFAULT 0 CHECK (total_guests >= 0),
  public_invite_token text UNIQUE,
  public_invite_enabled boolean NOT NULL DEFAULT false,
  host_view_token text UNIQUE,
  host_view_enabled boolean NOT NULL DEFAULT false,
  auto_approve_public_guests boolean NOT NULL DEFAULT false,
  rsvp_deadline timestamptz,
  allow_companions boolean NOT NULL DEFAULT true,
  max_companions integer NOT NULL DEFAULT 1 CHECK (max_companions >= 0),
  companions_require_approval boolean NOT NULL DEFAULT false,
  rsvp_enabled boolean NOT NULL DEFAULT true,
  allow_response_edit boolean NOT NULL DEFAULT true,
  invitation_message text,
  budget_estimated numeric(12,2) CHECK (budget_estimated IS NULL OR budget_estimated >= 0),
  initial_estimated_cost numeric(12,2) CHECK (initial_estimated_cost IS NULL OR initial_estimated_cost >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  financial_notes text,
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('awaiting_approval', 'pending', 'confirmed', 'declined', 'expired', 'cancelled')),
  contact_id text,
  token text UNIQUE,
  confirmation_token text UNIQUE,
  confirmation_deadline timestamptz,
  token_expires_at timestamptz,
  invite_sent_at timestamptz,
  sent_at timestamptz,
  responded_at timestamptz,
  confirmed_at timestamptz,
  declined_at timestamptz,
  notes text,
  dietary_restrictions text,
  accessibility_needs text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'public_request', 'public_invite')),
  requested_companions_count integer NOT NULL DEFAULT 0 CHECK (requested_companions_count >= 0),
  approved_companions text[],
  rejected_companions text[],
  approval_message text,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rejected_at timestamptz,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guests_token_consistency CHECK (
    token IS NULL OR confirmation_token IS NULL OR token = confirmation_token
  )
);

CREATE TABLE IF NOT EXISTS public.guest_companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  notes text,
  status text NOT NULL DEFAULT 'awaiting_approval'
    CHECK (status IN ('awaiting_approval', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  supplier text,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  estimated_cost numeric(10,2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'partial', 'paid', 'estimated', 'cancelled')),
  due_date date,
  invoice_number text,
  description text,
  notes text,
  image text,
  assigned_to jsonb,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.sync_item_costs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.estimated_cost = 0 AND NEW.price <> 0 THEN
      NEW.estimated_cost = NEW.price;
    ELSIF NEW.price = 0 AND NEW.estimated_cost <> 0 THEN
      NEW.price = NEW.estimated_cost;
    END IF;
    IF NEW.unit_price = 0 AND NEW.price <> 0 AND NEW.quantity > 0 THEN
      NEW.unit_price = round(NEW.price / NEW.quantity, 2);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.price IS DISTINCT FROM OLD.price AND NEW.estimated_cost IS NOT DISTINCT FROM OLD.estimated_cost THEN
      NEW.estimated_cost = NEW.price;
    ELSIF NEW.estimated_cost IS DISTINCT FROM OLD.estimated_cost AND NEW.price IS NOT DISTINCT FROM OLD.price THEN
      NEW.price = NEW.estimated_cost;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  url text NOT NULL,
  filename text NOT NULL,
  uploaded_by text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  description text,
  tags text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  lists text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#3b82f6',
  contacts text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. ARMAZENAMENTO LOCAL DE ARQUIVOS E OUTBOX DE E-MAILS TRANSACIONAIS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stored_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  bucket text NOT NULL DEFAULT 'event-photos'
    CHECK (bucket IN ('event-photos', 'avatars', 'documents', 'attachments')),
  filename text NOT NULL,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes >= 0 AND size_bytes <= 10485760),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  checksum_sha256 text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  template text NOT NULL,
  html_body text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'captured_mailpit', 'failed')),
  provider text NOT NULL DEFAULT 'smtp',
  is_external_delivery boolean NOT NULL DEFAULT false,
  message_id text,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

-- -----------------------------------------------------------------------------
-- 5. TABELAS DE JOBS, STAGING E ANALYTICS (DATA WAREHOUSE INTERNO)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_run_id uuid REFERENCES public.job_runs(id) ON DELETE CASCADE,
  level varchar(10) NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stg_event_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  total_cost numeric(10,2),
  items_count integer,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stg_rsvp_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  confirmed_count integer,
  pending_count integer,
  declined_count integer,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.facts_daily_events (
  date date PRIMARY KEY,
  total_events integer NOT NULL DEFAULT 0,
  total_guests integer NOT NULL DEFAULT 0,
  total_cost numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. TRIGGERS E VIEWS MATERIALIZADAS
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_credentials_updated_at ON public.user_credentials;
CREATE TRIGGER set_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_guests_updated_at ON public.guests;
CREATE TRIGGER set_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_guest_companions_updated_at ON public.guest_companions;
CREATE TRIGGER set_guest_companions_updated_at
  BEFORE UPDATE ON public.guest_companions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_items_updated_at ON public.items;
CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_contacts_updated_at ON public.contacts;
CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_contact_lists_updated_at ON public.contact_lists;
CREATE TRIGGER set_contact_lists_updated_at
  BEFORE UPDATE ON public.contact_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS sync_item_costs_trigger ON public.items;
CREATE TRIGGER sync_item_costs_trigger
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.sync_item_costs();

CREATE OR REPLACE FUNCTION public.sync_guest_tokens()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.token IS NULL AND NEW.confirmation_token IS NOT NULL THEN
    NEW.token = NEW.confirmation_token;
  ELSIF NEW.confirmation_token IS NULL AND NEW.token IS NOT NULL THEN
    NEW.confirmation_token = NEW.token;
  ELSIF NEW.token IS NOT NULL AND NEW.confirmation_token IS NOT NULL AND NEW.token <> NEW.confirmation_token THEN
    NEW.confirmation_token = NEW.token;
  END IF;

  IF NEW.invite_sent_at IS NULL AND NEW.sent_at IS NOT NULL THEN
    NEW.invite_sent_at = NEW.sent_at;
  ELSIF NEW.sent_at IS NULL AND NEW.invite_sent_at IS NOT NULL THEN
    NEW.sent_at = NEW.invite_sent_at;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.confirmed_at IS NULL AND NEW.status = 'confirmed' THEN
      NEW.confirmed_at = now();
    END IF;
    IF NEW.declined_at IS NULL AND NEW.status = 'declined' THEN
      NEW.declined_at = now();
    END IF;
  ELSE
    IF NEW.confirmed_at IS NULL AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
      NEW.confirmed_at = now();
    END IF;
    IF NEW.declined_at IS NULL AND NEW.status = 'declined' AND OLD.status IS DISTINCT FROM 'declined' THEN
      NEW.declined_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_guest_tokens_trigger ON public.guests;
CREATE TRIGGER sync_guest_tokens_trigger
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.sync_guest_tokens();

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON public.user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON public.auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_public_invite_token
  ON public.events(public_invite_token)
  WHERE public_invite_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_host_view_token
  ON public.events(host_view_token)
  WHERE host_view_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON public.guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON public.guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_token ON public.guests(token);
CREATE INDEX IF NOT EXISTS idx_guests_confirmation_token ON public.guests(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_guests_status ON public.guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_source ON public.guests(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_unique_event_email
  ON public.guests(event_id, lower(email))
  WHERE email <> '';
CREATE INDEX IF NOT EXISTS idx_guest_companions_guest_id ON public.guest_companions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_companions_status ON public.guest_companions(status);
CREATE INDEX IF NOT EXISTS idx_items_event_id ON public.items(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_lists_user_id ON public.contact_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_stored_files_event_id ON public.stored_files(event_id);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON public.email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_job_runs_status ON public.job_runs(status);
CREATE INDEX IF NOT EXISTS idx_job_runs_job_name ON public.job_runs(job_name);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_run_id ON public.job_logs(job_run_id);

DROP MATERIALIZED VIEW IF EXISTS public.mv_event_costs;
CREATE MATERIALIZED VIEW public.mv_event_costs AS
SELECT
  e.id,
  e.title,
  e.date,
  coalesce(
    sum(
      CASE
        WHEN coalesce(i.payment_status, 'pending') = 'cancelled' THEN 0
        ELSE coalesce(i.price, i.estimated_cost, 0)
      END
    ),
    0
  )::numeric(10,2) AS total_cost,
  count(i.id) FILTER (WHERE coalesce(i.payment_status, 'pending') <> 'cancelled')::integer AS items_count
FROM public.events e
LEFT JOIN public.items i ON i.event_id = e.id
GROUP BY e.id, e.title, e.date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_event_costs_id ON public.mv_event_costs(id);

DROP MATERIALIZED VIEW IF EXISTS public.mv_rsvp_stats;
CREATE MATERIALIZED VIEW public.mv_rsvp_stats AS
SELECT
  e.id,
  e.title,
  e.date,
  (
    count(DISTINCT g.id) FILTER (WHERE g.status = 'confirmed')
    + count(gc.id) FILTER (WHERE g.status = 'confirmed' AND gc.status = 'approved')
  )::integer AS confirmed_count,
  count(DISTINCT g.id) FILTER (WHERE g.status = 'pending')::integer AS pending_count,
  count(DISTINCT g.id) FILTER (WHERE g.status = 'declined')::integer AS declined_count,
  count(DISTINCT g.id) FILTER (WHERE NOT (g.source <> 'manual' AND g.status = 'cancelled'))::integer AS total_guests
FROM public.events e
LEFT JOIN public.guests g ON g.event_id = e.id
LEFT JOIN public.guest_companions gc ON gc.guest_id = g.id
GROUP BY e.id, e.title, e.date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_rsvp_stats_id ON public.mv_rsvp_stats(id);

CREATE OR REPLACE FUNCTION public.refresh_materialized_view(view_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF view_name NOT IN ('mv_event_costs', 'mv_rsvp_stats') THEN
    RAISE EXCEPTION 'Materialized view % is not allowed', view_name;
  END IF;
  EXECUTE format('REFRESH MATERIALIZED VIEW public.%I', view_name);
END;
$$;

-- =============================================================================
-- PLANEJA+ — MIGRATION 002: RBAC COLABORATIVO POR EVENTO (RN-002, RF-039 a RF-043)
-- =============================================================================

-- 1. Catálogo de Papéis do Evento (event_roles)
CREATE TABLE IF NOT EXISTS public.event_roles (
  code text PRIMARY KEY CHECK (code IN ('owner', 'admin', 'collaborator', 'viewer', 'external_host')),
  name text NOT NULL,
  description text NOT NULL,
  hierarchy_level integer NOT NULL CHECK (hierarchy_level BETWEEN 10 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.event_roles (code, name, description, hierarchy_level)
VALUES
  ('owner', 'Proprietário', 'Organizador titular do evento com controle total, exclusão e transferência de titularidade.', 100),
  ('admin', 'Administrador', 'Gerencia dados operacionais do evento e colaboradores abaixo do proprietário.', 80),
  ('collaborator', 'Colaborador', 'Atua nos módulos autorizados (convidados, financeiro, fotos, solicitações).', 50),
  ('viewer', 'Visualizador', 'Acesso interno somente-leitura aos módulos autorizados.', 20),
  ('external_host', 'Anfitrião / Contratante Externo', 'Acesso externo via token somente-leitura aos indicadores autorizados.', 10)
ON CONFLICT (code) DO NOTHING;

-- 2. Catálogo de Permissões por Módulo e Ação (event_permissions)
CREATE TABLE IF NOT EXISTS public.event_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL CHECK (module IN ('event', 'guests', 'requests', 'financial', 'photos', 'analytics', 'reports', 'team')),
  action text NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'approve', 'export', 'manage_permissions', 'transfer_ownership', 'delete_event')),
  description text NOT NULL,
  UNIQUE (module, action)
);

-- 3. Membros da Equipe por Evento (event_members)
CREATE TABLE IF NOT EXISTS public.event_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'collaborator'
    REFERENCES public.event_roles(code),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'declined', 'revoked', 'expired')),
  preset text
    CHECK (preset IS NULL OR preset IN ('financial', 'guests_rsvp', 'media_photos', 'full_operational')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  invite_token text UNIQUE,
  invite_expires_at timestamptz,
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Garantir exatamente UM proprietário ativo por evento
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_members_single_active_owner
  ON public.event_members (event_id)
  WHERE role = 'owner' AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_members_event_email_unique
  ON public.event_members (event_id, lower(email));

CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON public.event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_user_id ON public.event_members(user_id);

-- 4. Permissões Granulares Relacionais por Membro (event_member_permissions)
CREATE TABLE IF NOT EXISTS public.event_member_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.event_members(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('event', 'guests', 'requests', 'financial', 'photos', 'analytics', 'reports', 'team')),
  action text NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'approve', 'export', 'manage_permissions', 'transfer_ownership', 'delete_event')),
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, module, action)
);

-- 5. Convites Formais de Equipe (event_invitations)
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.event_members(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL REFERENCES public.event_roles(code),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Trilha de Auditoria do Evento (event_audit_logs)
CREATE TABLE IF NOT EXISTS public.event_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT 'Sistema',
  actor_role text NOT NULL DEFAULT 'owner',
  target_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_email text,
  target_type text,
  target_id text,
  action text NOT NULL,
  module text NOT NULL DEFAULT 'team',
  allowed boolean NOT NULL DEFAULT true,
  reason text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_audit_logs_event_id ON public.event_audit_logs(event_id, created_at DESC);

DROP TRIGGER IF EXISTS set_event_members_updated_at ON public.event_members;
CREATE TRIGGER set_event_members_updated_at
  BEFORE UPDATE ON public.event_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Trigger automática para registrar o criador do evento como owner em event_members
CREATE OR REPLACE FUNCTION public.ensure_event_owner_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
  v_name text;
BEGIN
  SELECT email, coalesce(name, split_part(email, '@', 1))
    INTO v_email, v_name
    FROM public.users
   WHERE id = NEW.user_id;

  INSERT INTO public.event_members (
    event_id,
    user_id,
    email,
    name,
    role,
    status,
    permissions,
    invited_by,
    accepted_at
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    coalesce(v_email, 'owner@planeja.local'),
    coalesce(v_name, 'Organizador'),
    'owner',
    'active',
    '{
      "event": ["view","create","edit","delete","transfer_ownership","delete_event"],
      "guests": ["view","create","edit","delete","approve","export"],
      "requests": ["view","create","edit","delete","approve"],
      "financial": ["view","create","edit","delete","export"],
      "photos": ["view","create","edit","delete"],
      "analytics": ["view","export"],
      "reports": ["view","export"],
      "team": ["view","create","edit","delete","manage_permissions","transfer_ownership"]
    }'::jsonb,
    NEW.user_id,
    now()
  )
  ON CONFLICT (event_id, lower(email)) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_event_owner_member ON public.events;
CREATE TRIGGER trg_ensure_event_owner_member
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.ensure_event_owner_member();

-- 8. Função SQL de Verificação de Permissão RBAC por Evento e Módulo
CREATE OR REPLACE FUNCTION public.has_event_permission(
  p_event_id uuid,
  p_user_id uuid,
  p_module text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
  v_member record;
BEGIN
  IF p_event_id IS NULL OR p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT user_id INTO v_owner_id
    FROM public.events
   WHERE id = p_event_id;

  IF v_owner_id = p_user_id THEN
    RETURN true;
  END IF;

  SELECT role, status, permissions
    INTO v_member
    FROM public.event_members
   WHERE event_id = p_event_id
     AND user_id = p_user_id
     AND status = 'active'
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_member.role = 'owner' THEN
    RETURN true;
  END IF;

  IF p_action IN ('delete_event', 'transfer_ownership') THEN
    RETURN false;
  END IF;

  RETURN coalesce((v_member.permissions -> p_module) ? p_action, false);
END;
$$;

-- 9. Função Transacional de Transferência Formal de Titularidade (RF-043)
CREATE OR REPLACE FUNCTION public.transfer_event_ownership(
  p_event_id uuid,
  p_actor_user_id uuid,
  p_new_owner_member_id uuid,
  p_confirmation_title text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event record;
  v_target record;
BEGIN
  SELECT id, title, user_id INTO v_event
    FROM public.events
   WHERE id = p_event_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evento não encontrado';
  END IF;

  IF v_event.user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'Apenas o proprietário atual pode transferir a titularidade do evento';
  END IF;

  IF lower(trim(coalesce(p_confirmation_title, ''))) <> lower(trim(v_event.title)) THEN
    RAISE EXCEPTION 'Confirmação nominal do título do evento inválida';
  END IF;

  SELECT * INTO v_target
    FROM public.event_members
   WHERE id = p_new_owner_member_id
     AND event_id = p_event_id
     AND status = 'active'
   FOR UPDATE;

  IF NOT FOUND OR v_target.user_id IS NULL THEN
    RAISE EXCEPTION 'O novo proprietário deve ser um membro ativo do evento';
  END IF;

  UPDATE public.event_members
     SET role = 'admin',
         updated_at = now()
   WHERE event_id = p_event_id
     AND role = 'owner'
     AND status = 'active';

  UPDATE public.event_members
     SET role = 'owner',
         updated_at = now()
   WHERE id = p_new_owner_member_id;

  UPDATE public.events
     SET user_id = v_target.user_id,
         updated_at = now()
   WHERE id = p_event_id;

  INSERT INTO public.event_audit_logs (
    event_id, actor_user_id, actor_role, target_user_id, target_email, action, module, details
  ) VALUES (
    p_event_id, p_actor_user_id, 'owner', v_target.user_id, v_target.email,
    'ownership_transferred', 'team',
    jsonb_build_object('previous_owner_id', p_actor_user_id, 'new_owner_id', v_target.user_id)
  );

  RETURN jsonb_build_object('success', true, 'new_owner_user_id', v_target.user_id);
END;
$$;

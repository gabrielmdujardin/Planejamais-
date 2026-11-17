-- Migration 20261117000100: Gerenciamento Colaborativo RBAC por Evento e Auditoria (RN-002, RF-039 a RF-043)
-- Compatível com PostgreSQL local e Supabase, preservando integralmente os registros existentes.

create table if not exists public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'collaborator'
    check (role in ('owner', 'admin', 'collaborator', 'viewer')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'revoked', 'expired', 'declined')),
  permissions jsonb not null default '{}'::jsonb,
  invited_by uuid references auth.users(id) on delete set null,
  invite_token text unique,
  invite_expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicidade de vínculo por e-mail por evento
create unique index if not exists idx_event_members_event_email_unique
  on public.event_members (event_id, lower(email));

-- Unicidade de vínculo por usuário autenticado por evento
create unique index if not exists idx_event_members_event_user_unique
  on public.event_members (event_id, user_id)
  where user_id is not null;

-- Restrição inviolável: exatamente um proprietário ativo por evento (RN-002)
create unique index if not exists idx_event_members_single_active_owner
  on public.event_members (event_id)
  where role = 'owner' and status = 'active';

create index if not exists idx_event_members_event_id on public.event_members(event_id);
create index if not exists idx_event_members_user_id on public.event_members(user_id);
create index if not exists idx_event_members_invite_token on public.event_members(invite_token) where invite_token is not null;

drop trigger if exists set_event_members_updated_at on public.event_members;
create trigger set_event_members_updated_at
  before update on public.event_members
  for each row execute function public.set_updated_at();

-- Tabela de auditoria de operações e permissões por evento (RF-043)
create table if not exists public.event_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  actor_role text not null default 'anonymous',
  action text not null,
  target_type text,
  target_id text,
  allowed boolean not null default true,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_audit_logs_event_id on public.event_audit_logs(event_id, created_at desc);

-- Retrocompatibilidade automática: popula proprietários de todos os eventos já existentes sem excluir dados
insert into public.event_members (
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
select
  e.id as event_id,
  e.user_id,
  coalesce(u.email, 'owner-' || e.user_id::text || '@planejamais.local') as email,
  coalesce(u.name, 'Proprietário') as name,
  'owner' as role,
  'active' as status,
  jsonb_build_object(
    'event', jsonb_build_array('view', 'create', 'edit', 'delete', 'delete_event', 'transfer_ownership'),
    'guests', jsonb_build_array('view', 'create', 'edit', 'delete', 'approve', 'export'),
    'requests', jsonb_build_array('view', 'approve', 'delete'),
    'financial', jsonb_build_array('view', 'create', 'edit', 'delete', 'export'),
    'photos', jsonb_build_array('view', 'create', 'edit', 'delete'),
    'analytics', jsonb_build_array('view', 'export'),
    'reports', jsonb_build_array('view', 'export'),
    'team', jsonb_build_array('view', 'create', 'edit', 'delete', 'manage_permissions', 'transfer_ownership')
  ) as permissions,
  e.user_id as invited_by,
  e.created_at as accepted_at
from public.events e
left join public.users u on u.id = e.user_id
on conflict do nothing;

-- Trigger para registrar automaticamente o criador como 'owner' em public.event_members ao criar novo evento
create or replace function public.ensure_event_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_name text;
begin
  select email, name into v_email, v_name from public.users where id = new.user_id;
  insert into public.event_members (
    event_id,
    user_id,
    email,
    name,
    role,
    status,
    permissions,
    invited_by,
    accepted_at
  ) values (
    new.id,
    new.user_id,
    coalesce(v_email, 'owner-' || new.user_id::text || '@planejamais.local'),
    coalesce(v_name, 'Proprietário'),
    'owner',
    'active',
    jsonb_build_object(
      'event', jsonb_build_array('view', 'create', 'edit', 'delete', 'delete_event', 'transfer_ownership'),
      'guests', jsonb_build_array('view', 'create', 'edit', 'delete', 'approve', 'export'),
      'requests', jsonb_build_array('view', 'approve', 'delete'),
      'financial', jsonb_build_array('view', 'create', 'edit', 'delete', 'export'),
      'photos', jsonb_build_array('view', 'create', 'edit', 'delete'),
      'analytics', jsonb_build_array('view', 'export'),
      'reports', jsonb_build_array('view', 'export'),
      'team', jsonb_build_array('view', 'create', 'edit', 'delete', 'manage_permissions', 'transfer_ownership')
    ),
    new.user_id,
    now()
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_event_owner_member on public.events;
create trigger trg_ensure_event_owner_member
  after insert on public.events
  for each row execute function public.ensure_event_owner_member();

-- Função auxiliar de autorização RBAC no banco para políticas RLS
create or replace function public.has_event_permission(
  p_event_id uuid,
  p_user_id uuid,
  p_module text,
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_role text;
  v_status text;
  v_expires timestamptz;
  v_perms jsonb;
begin
  if p_user_id is null or p_event_id is null then
    return false;
  end if;

  select user_id into v_owner_id from public.events where id = p_event_id;
  if v_owner_id = p_user_id then
    return true;
  end if;

  select role, status, invite_expires_at, permissions
    into v_role, v_status, v_expires, v_perms
    from public.event_members
   where event_id = p_event_id
     and user_id = p_user_id
   limit 1;

  if v_role is null or v_status <> 'active' then
    return false;
  end if;

  if v_expires is not null and v_expires < now() then
    return false;
  end if;

  if v_role = 'owner' then
    return true;
  end if;

  if p_action in ('delete_event', 'transfer_ownership') then
    return false;
  end if;

  if v_role = 'viewer' and p_action <> 'view' then
    return false;
  end if;

  if v_perms ? p_module then
    return (v_perms -> p_module) ? p_action;
  end if;

  return false;
end;
$$;

-- Função transacional para transferência segura de titularidade (RN-002 / RF-042)
create or replace function public.transfer_event_ownership(
  p_event_id uuid,
  p_current_owner_id uuid,
  p_new_owner_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_owner uuid;
  v_target_member_id uuid;
begin
  select user_id into v_current_owner
    from public.events
   where id = p_event_id
   for update;

  if v_current_owner is null or v_current_owner <> p_current_owner_id then
    raise exception 'Somente o proprietário atual pode transferir a titularidade do evento.';
  end if;

  select id into v_target_member_id
    from public.event_members
   where event_id = p_event_id
     and user_id = p_new_owner_user_id
     and status = 'active'
   for update;

  if v_target_member_id is null then
    raise exception 'O novo proprietário deve ser um membro ativo da equipe do evento.';
  end if;

  -- Rebaixa o proprietário anterior para admin primeiro para respeitar o índice único parcial
  update public.event_members
     set role = 'admin',
         updated_at = now()
   where event_id = p_event_id
     and user_id = p_current_owner_id
     and role = 'owner';

  -- Promove o novo proprietário
  update public.event_members
     set role = 'owner',
         updated_at = now()
   where id = v_target_member_id;

  -- Atualiza a coluna titular em public.events
  update public.events
     set user_id = p_new_owner_user_id,
         updated_at = now()
   where id = p_event_id;

  insert into public.event_audit_logs (
    event_id,
    actor_user_id,
    actor_role,
    action,
    target_type,
    target_id,
    allowed,
    details
  ) values (
    p_event_id,
    p_current_owner_id,
    'owner',
    'team.ownership_transferred',
    'user',
    p_new_owner_user_id::text,
    true,
    jsonb_build_object('previous_owner_id', p_current_owner_id, 'new_owner_id', p_new_owner_user_id)
  );

  return true;
end;
$$;

alter table public.event_members enable row level security;
alter table public.event_audit_logs enable row level security;

drop policy if exists "Members can view team of their events" on public.event_members;
create policy "Members can view team of their events" on public.event_members
  for select to authenticated
  using (public.has_event_permission(event_id, auth.uid(), 'team', 'view') or user_id = auth.uid());

drop policy if exists "Authorized members can manage team" on public.event_members;
create policy "Authorized members can manage team" on public.event_members
  for all to authenticated
  using (public.has_event_permission(event_id, auth.uid(), 'team', 'edit'))
  with check (public.has_event_permission(event_id, auth.uid(), 'team', 'create'));

drop policy if exists "Members can view audit logs of their events" on public.event_audit_logs;
create policy "Members can view audit logs of their events" on public.event_audit_logs
  for select to authenticated
  using (public.has_event_permission(event_id, auth.uid(), 'team', 'view'));

drop policy if exists "Members can insert audit logs for their events" on public.event_audit_logs;
create policy "Members can insert audit logs for their events" on public.event_audit_logs
  for insert to authenticated
  with check (public.has_event_permission(event_id, auth.uid(), 'event', 'view') or actor_user_id = auth.uid());

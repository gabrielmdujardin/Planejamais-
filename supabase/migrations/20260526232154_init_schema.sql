-- Planeja+ Supabase schema
-- Execute este arquivo no SQL Editor de um projeto Supabase novo.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar, metadata)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.users.name, excluded.name),
        avatar = coalesce(public.users.avatar, excluded.avatar),
        metadata = public.users.metadata || excluded.metadata,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null,
  category text,
  date text not null,
  time text not null,
  full_date text,
  location text not null,
  description text not null default '',
  status text not null default 'pending'
    check (status in ('confirmed', 'pending', 'cancelled')),
  image text,
  confirmed_guests integer not null default 0 check (confirmed_guests >= 0),
  total_guests integer not null default 0 check (total_guests >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  status text not null default 'pending'
    check (status in ('awaiting_approval', 'pending', 'confirmed', 'declined', 'expired', 'cancelled')),
  contact_id text,
  token text unique,
  confirmation_token text unique,
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
  source text not null default 'manual' check (source in ('manual', 'public_request')),
  requested_companions_count integer not null default 0 check (requested_companions_count >= 0),
  approved_companions text[],
  rejected_companions text[],
  approval_message text,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guests_token_consistency check (
    token is null or confirmation_token is null or token = confirmation_token
  )
);

create table if not exists public.guest_companions (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  status text not null default 'awaiting_approval'
    check (status in ('awaiting_approval', 'approved', 'rejected', 'cancelled')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  estimated_cost numeric(10,2) not null default 0 check (estimated_cost >= 0),
  image text,
  assigned_to jsonb,
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'completed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_item_costs()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.estimated_cost = 0 and new.price <> 0 then
      new.estimated_cost = new.price;
    elsif new.price = 0 and new.estimated_cost <> 0 then
      new.price = new.estimated_cost;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.price is distinct from old.price and new.estimated_cost is not distinct from old.estimated_cost then
      new.estimated_cost = new.price;
    elsif new.estimated_cost is distinct from old.estimated_cost and new.price is not distinct from old.price then
      new.price = new.estimated_cost;
    end if;
  end if;

  return new;
end;
$$;

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  url text not null,
  filename text not null,
  uploaded_by text not null,
  uploaded_at timestamptz not null default now(),
  description text,
  tags text[],
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name varchar(100) not null,
  status varchar(20) not null default 'running' check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.job_logs (
  id uuid primary key default gen_random_uuid(),
  job_run_id uuid references public.job_runs(id) on delete cascade,
  level varchar(10) not null default 'info' check (level in ('info', 'warn', 'error')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stg_event_costs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  total_cost numeric(10,2),
  items_count integer,
  processed_at timestamptz not null default now()
);

create table if not exists public.stg_rsvp_stats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  confirmed_count integer,
  pending_count integer,
  declined_count integer,
  processed_at timestamptz not null default now()
);

create table if not exists public.facts_daily_events (
  date date primary key,
  total_events integer not null default 0,
  total_guests integer not null default 0,
  total_cost numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists set_guests_updated_at on public.guests;
create trigger set_guests_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

drop trigger if exists set_guest_companions_updated_at on public.guest_companions;
create trigger set_guest_companions_updated_at
  before update on public.guest_companions
  for each row execute function public.set_updated_at();

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

drop trigger if exists sync_item_costs_trigger on public.items;
create trigger sync_item_costs_trigger
  before insert or update on public.items
  for each row execute function public.sync_item_costs();

create or replace function public.sync_guest_tokens()
returns trigger
language plpgsql
as $$
begin
  if new.token is null and new.confirmation_token is not null then
    new.token = new.confirmation_token;
  elsif new.confirmation_token is null and new.token is not null then
    new.confirmation_token = new.token;
  elsif new.token is not null and new.confirmation_token is not null and new.token <> new.confirmation_token then
    new.confirmation_token = new.token;
  end if;

  if new.invite_sent_at is null and new.sent_at is not null then
    new.invite_sent_at = new.sent_at;
  elsif new.sent_at is null and new.invite_sent_at is not null then
    new.sent_at = new.invite_sent_at;
  end if;

  if tg_op = 'INSERT' then
    if new.confirmed_at is null and new.status = 'confirmed' then
      new.confirmed_at = now();
    end if;

    if new.declined_at is null and new.status = 'declined' then
      new.declined_at = now();
    end if;
  else
    if new.confirmed_at is null
       and new.status = 'confirmed'
       and old.status is distinct from 'confirmed' then
      new.confirmed_at = now();
    end if;

    if new.declined_at is null
       and new.status = 'declined'
       and old.status is distinct from 'declined' then
      new.declined_at = now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_guest_tokens_trigger on public.guests;
create trigger sync_guest_tokens_trigger
  before insert or update on public.guests
  for each row execute function public.sync_guest_tokens();

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_guests_event_id on public.guests(event_id);
create index if not exists idx_guests_email on public.guests(email);
create index if not exists idx_guests_token on public.guests(token);
create index if not exists idx_guests_confirmation_token on public.guests(confirmation_token);
create index if not exists idx_guests_status on public.guests(status);
create index if not exists idx_guests_source on public.guests(source);
create unique index if not exists idx_guests_unique_event_email
  on public.guests(event_id, lower(email))
  where email <> '';
create index if not exists idx_guest_companions_guest_id on public.guest_companions(guest_id);
create index if not exists idx_guest_companions_status on public.guest_companions(status);
create index if not exists idx_items_event_id on public.items(event_id);
create index if not exists idx_event_photos_event_id on public.event_photos(event_id);
create index if not exists idx_job_runs_status on public.job_runs(status);
create index if not exists idx_job_runs_job_name on public.job_runs(job_name);
create index if not exists idx_job_logs_job_run_id on public.job_logs(job_run_id);
create index if not exists idx_job_logs_level on public.job_logs(level);
create index if not exists idx_stg_event_costs_event_id on public.stg_event_costs(event_id);
create index if not exists idx_stg_rsvp_stats_event_id on public.stg_rsvp_stats(event_id);

drop materialized view if exists public.mv_event_costs;
create materialized view public.mv_event_costs as
select
  e.id,
  e.title,
  e.date,
  coalesce(sum(coalesce(i.estimated_cost, i.price, 0)), 0)::numeric(10,2) as total_cost,
  count(i.id)::integer as items_count
from public.events e
left join public.items i on i.event_id = e.id
group by e.id, e.title, e.date;

create unique index if not exists idx_mv_event_costs_id on public.mv_event_costs(id);

drop materialized view if exists public.mv_rsvp_stats;
create materialized view public.mv_rsvp_stats as
select
  e.id,
  e.title,
  e.date,
  count(*) filter (where g.status = 'confirmed')::integer as confirmed_count,
  count(*) filter (where g.status = 'pending')::integer as pending_count,
  count(*) filter (where g.status = 'declined')::integer as declined_count,
  count(g.id)::integer as total_guests
from public.events e
left join public.guests g on g.event_id = e.id
group by e.id, e.title, e.date;

create unique index if not exists idx_mv_rsvp_stats_id on public.mv_rsvp_stats(id);

create or replace function public.refresh_materialized_view(view_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if view_name not in ('mv_event_costs', 'mv_rsvp_stats') then
    raise exception 'Materialized view % is not allowed', view_name;
  end if;

  execute format('refresh materialized view public.%I', view_name);
end;
$$;

revoke all on public.mv_event_costs from public, anon, authenticated;
revoke all on public.mv_rsvp_stats from public, anon, authenticated;
-- grants omitted for brevity

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.guest_companions enable row level security;
alter table public.items enable row level security;
alter table public.event_photos enable row level security;
alter table public.job_runs enable row level security;
alter table public.job_logs enable row level security;
alter table public.stg_event_costs enable row level security;
alter table public.stg_rsvp_stats enable row level security;
alter table public.facts_daily_events enable row level security;

-- Policies (abbreviated for brevity) ...


-- Migration consolidada TCC 2026:
-- 1. Restaura políticas RLS completas e GRANTs omitidos na migration inicial
-- 2. Estende public.users, public.events e public.items
-- 3. Cria public.contacts e public.contact_lists com RLS por usuário (RN-014, RF-022, RF-023)
-- 4. Atualiza views materializadas mv_event_costs e mv_rsvp_stats (RN-005, RN-008, RN-011)
-- 5. Configura bucket storage event-photos (RF-028, RN-018)

alter table public.users
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists calendar_feed_token text unique default encode(gen_random_bytes(16), 'hex');

create unique index if not exists idx_users_email_unique
  on public.users (lower(email))
  where email <> '';

alter table public.events
  alter column status set default 'active';

alter table public.events
  add column if not exists financial_mode text not null default 'corporate_budget',
  add column if not exists host_view_token text unique,
  add column if not exists host_view_enabled boolean not null default false;

alter table public.events
  drop constraint if exists events_financial_mode_check;

alter table public.events
  add constraint events_financial_mode_check
  check (financial_mode in ('corporate_budget', 'collaborative_split'));

create unique index if not exists idx_events_host_view_token
  on public.events(host_view_token)
  where host_view_token is not null;

alter table public.items
  add column if not exists category text not null default 'Geral',
  add column if not exists supplier text,
  add column if not exists unit_price numeric(10,2) not null default 0 check (unit_price >= 0),
  add column if not exists payment_status text not null default 'pending',
  add column if not exists due_date date,
  add column if not exists invoice_number text,
  add column if not exists description text,
  add column if not exists notes text;

alter table public.items
  drop constraint if exists items_payment_status_check;

alter table public.items
  add constraint items_payment_status_check
  check (payment_status in ('pending', 'partial', 'paid', 'estimated', 'cancelled'));

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  tags text[] not null default '{}',
  lists text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#3b82f6',
  contacts text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_user_id on public.contacts(user_id);
create index if not exists idx_contact_lists_user_id on public.contact_lists(user_id);

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

drop trigger if exists set_contact_lists_updated_at on public.contact_lists;
create trigger set_contact_lists_updated_at
  before update on public.contact_lists
  for each row execute function public.set_updated_at();

drop materialized view if exists public.mv_event_costs;
create materialized view public.mv_event_costs as
select
  e.id,
  e.title,
  e.date,
  coalesce(
    sum(
      case
        when coalesce(i.payment_status, 'pending') = 'cancelled' then 0
        else coalesce(i.price, i.estimated_cost, 0)
      end
    ),
    0
  )::numeric(10,2) as total_cost,
  count(i.id) filter (where coalesce(i.payment_status, 'pending') <> 'cancelled')::integer as items_count
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
  (
    count(distinct g.id) filter (where g.status = 'confirmed')
    + count(gc.id) filter (where g.status = 'confirmed' and gc.status = 'approved')
  )::integer as confirmed_count,
  count(distinct g.id) filter (where g.status = 'pending')::integer as pending_count,
  count(distinct g.id) filter (where g.status = 'declined')::integer as declined_count,
  count(distinct g.id) filter (where not (g.source <> 'manual' and g.status = 'cancelled'))::integer as total_guests
from public.events e
left join public.guests g on g.event_id = e.id
left join public.guest_companions gc on gc.guest_id = g.id
group by e.id, e.title, e.date;

create unique index if not exists idx_mv_rsvp_stats_id on public.mv_rsvp_stats(id);

revoke all on public.mv_event_costs from public, anon, authenticated;
revoke all on public.mv_rsvp_stats from public, anon, authenticated;
grant select on public.mv_event_costs to service_role;
grant select on public.mv_rsvp_stats to service_role;

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.guest_companions enable row level security;
alter table public.items enable row level security;
alter table public.event_photos enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_lists enable row level security;
alter table public.job_runs enable row level security;
alter table public.job_logs enable row level security;
alter table public.stg_event_costs enable row level security;
alter table public.stg_rsvp_stats enable row level security;
alter table public.facts_daily_events enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.users;
create policy "Users can delete own profile" on public.users
  for delete to authenticated using (auth.uid() = id);

drop policy if exists "Users can view their own events" on public.events;
create policy "Users can view their own events" on public.events
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert their own events" on public.events;
create policy "Users can insert their own events" on public.events
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own events" on public.events;
create policy "Users can update their own events" on public.events
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own events" on public.events;
create policy "Users can delete their own events" on public.events
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can view guests of their events" on public.guests;
create policy "Users can view guests of their events" on public.guests
  for select to authenticated
  using (exists (select 1 from public.events e where e.id = guests.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can insert guests to their events" on public.guests;
create policy "Users can insert guests to their events" on public.guests
  for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = guests.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can update guests of their events" on public.guests;
create policy "Users can update guests of their events" on public.guests
  for update to authenticated
  using (exists (select 1 from public.events e where e.id = guests.event_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = guests.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can delete guests from their events" on public.guests;
create policy "Users can delete guests from their events" on public.guests
  for delete to authenticated
  using (exists (select 1 from public.events e where e.id = guests.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can view companions of their event guests" on public.guest_companions;
create policy "Users can view companions of their event guests" on public.guest_companions
  for select to authenticated
  using (exists (select 1 from public.guests g join public.events e on e.id = g.event_id where g.id = guest_companions.guest_id and e.user_id = auth.uid()));

drop policy if exists "Users can insert companions for their event guests" on public.guest_companions;
create policy "Users can insert companions for their event guests" on public.guest_companions
  for insert to authenticated
  with check (exists (select 1 from public.guests g join public.events e on e.id = g.event_id where g.id = guest_companions.guest_id and e.user_id = auth.uid()));

drop policy if exists "Users can update companions of their event guests" on public.guest_companions;
create policy "Users can update companions of their event guests" on public.guest_companions
  for update to authenticated
  using (exists (select 1 from public.guests g join public.events e on e.id = g.event_id where g.id = guest_companions.guest_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.guests g join public.events e on e.id = g.event_id where g.id = guest_companions.guest_id and e.user_id = auth.uid()));

drop policy if exists "Users can delete companions of their event guests" on public.guest_companions;
create policy "Users can delete companions of their event guests" on public.guest_companions
  for delete to authenticated
  using (exists (select 1 from public.guests g join public.events e on e.id = g.event_id where g.id = guest_companions.guest_id and e.user_id = auth.uid()));

drop policy if exists "Users can view items of their events" on public.items;
create policy "Users can view items of their events" on public.items
  for select to authenticated
  using (exists (select 1 from public.events e where e.id = items.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can insert items to their events" on public.items;
create policy "Users can insert items to their events" on public.items
  for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = items.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can update items of their events" on public.items;
create policy "Users can update items of their events" on public.items
  for update to authenticated
  using (exists (select 1 from public.events e where e.id = items.event_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = items.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can delete items from their events" on public.items;
create policy "Users can delete items from their events" on public.items
  for delete to authenticated
  using (exists (select 1 from public.events e where e.id = items.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can view photos of their events" on public.event_photos;
create policy "Users can view photos of their events" on public.event_photos
  for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_photos.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can insert photos to their events" on public.event_photos;
create policy "Users can insert photos to their events" on public.event_photos
  for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = event_photos.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can update photos of their events" on public.event_photos;
create policy "Users can update photos of their events" on public.event_photos
  for update to authenticated
  using (exists (select 1 from public.events e where e.id = event_photos.event_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = event_photos.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can delete photos from their events" on public.event_photos;
create policy "Users can delete photos from their events" on public.event_photos
  for delete to authenticated
  using (exists (select 1 from public.events e where e.id = event_photos.event_id and e.user_id = auth.uid()));

drop policy if exists "Users can view own contacts" on public.contacts;
create policy "Users can view own contacts" on public.contacts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own contacts" on public.contacts;
create policy "Users can insert own contacts" on public.contacts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own contacts" on public.contacts;
create policy "Users can update own contacts" on public.contacts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own contacts" on public.contacts;
create policy "Users can delete own contacts" on public.contacts
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can view own contact_lists" on public.contact_lists;
create policy "Users can view own contact_lists" on public.contact_lists
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own contact_lists" on public.contact_lists;
create policy "Users can insert own contact_lists" on public.contact_lists
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own contact_lists" on public.contact_lists;
create policy "Users can update own contact_lists" on public.contact_lists
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own contact_lists" on public.contact_lists;
create policy "Users can delete own contact_lists" on public.contact_lists
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Service role can manage job_runs" on public.job_runs;
create policy "Service role can manage job_runs" on public.job_runs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage job_logs" on public.job_logs;
create policy "Service role can manage job_logs" on public.job_logs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage stg_event_costs" on public.stg_event_costs;
create policy "Service role can manage stg_event_costs" on public.stg_event_costs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage stg_rsvp_stats" on public.stg_rsvp_stats;
create policy "Service role can manage stg_rsvp_stats" on public.stg_rsvp_stats
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage facts_daily_events" on public.facts_daily_events;
create policy "Service role can manage facts_daily_events" on public.facts_daily_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public can read event photos" on storage.objects;
create policy "Public can read event photos" on storage.objects
  for select using (bucket_id = 'event-photos');

drop policy if exists "Authenticated users can upload event photos" on storage.objects;
create policy "Authenticated users can upload event photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-photos');

drop policy if exists "Authenticated users can delete own event photos" on storage.objects;
create policy "Authenticated users can delete own event photos" on storage.objects
  for delete to authenticated using (bucket_id = 'event-photos' and auth.uid() = owner);

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all routines in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on
  public.users,
  public.events,
  public.guests,
  public.guest_companions,
  public.items,
  public.event_photos,
  public.contacts,
  public.contact_lists
to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all routines in schema public to service_role;
grant execute on function public.refresh_materialized_view(text) to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.set_updated_at() to service_role;
grant execute on function public.sync_item_costs() to service_role;
grant execute on function public.sync_guest_tokens() to service_role;

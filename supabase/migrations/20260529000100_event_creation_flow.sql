alter table public.events
  drop constraint if exists events_status_check;

alter table public.events
  add constraint events_status_check
  check (status in ('draft', 'active', 'completed', 'canceled', 'confirmed', 'pending', 'cancelled'));

alter table public.events
  add column if not exists start_date date,
  add column if not exists start_time time,
  add column if not exists end_date date,
  add column if not exists end_time time,
  add column if not exists address text,
  add column if not exists maps_url text,
  add column if not exists event_mode text not null default 'presential',
  add column if not exists meeting_url text,
  add column if not exists capacity integer check (capacity is null or capacity >= 0),
  add column if not exists allow_guests boolean not null default true,
  add column if not exists companions_require_approval boolean not null default false,
  add column if not exists rsvp_enabled boolean not null default true,
  add column if not exists allow_response_edit boolean not null default true,
  add column if not exists invitation_message text,
  add column if not exists budget_estimated numeric(12,2) check (budget_estimated is null or budget_estimated >= 0),
  add column if not exists initial_estimated_cost numeric(12,2) check (initial_estimated_cost is null or initial_estimated_cost >= 0),
  add column if not exists currency text not null default 'BRL',
  add column if not exists financial_notes text,
  add column if not exists visibility text not null default 'private';

alter table public.events
  drop constraint if exists events_event_mode_check;

alter table public.events
  add constraint events_event_mode_check
  check (event_mode in ('presential', 'online', 'hybrid'));

alter table public.events
  drop constraint if exists events_visibility_check;

alter table public.events
  add constraint events_visibility_check
  check (visibility in ('private', 'public'));

create index if not exists idx_events_start_date on public.events(start_date);

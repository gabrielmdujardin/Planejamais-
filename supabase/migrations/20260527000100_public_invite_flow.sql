alter table public.events
  add column if not exists public_invite_token text unique,
  add column if not exists public_invite_enabled boolean not null default false,
  add column if not exists auto_approve_public_guests boolean not null default false,
  add column if not exists rsvp_deadline timestamptz,
  add column if not exists allow_companions boolean not null default true,
  add column if not exists max_companions integer not null default 1 check (max_companions >= 0);

alter table public.guests
  drop constraint if exists guests_source_check;

alter table public.guests
  add constraint guests_source_check
  check (source in ('manual', 'public_request', 'public_invite'));

create unique index if not exists idx_events_public_invite_token
  on public.events(public_invite_token)
  where public_invite_token is not null;

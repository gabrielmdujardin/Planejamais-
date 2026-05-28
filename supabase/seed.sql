-- Seed minimo para Planeja+
-- Este projeto depende principalmente de usuarios reais do Supabase Auth.
-- Crie usuarios pela tela Authentication do Supabase ou pelo fluxo de cadastro da aplicacao.

-- Opcional: se voce ja criou um usuario no Auth, sincronize perfis ausentes.
insert into public.users (id, email, name, avatar, metadata)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name'),
  au.raw_user_meta_data->>'avatar_url',
  coalesce(au.raw_user_meta_data, '{}'::jsonb)
from auth.users au
on conflict (id) do nothing;

refresh materialized view public.mv_event_costs;
refresh materialized view public.mv_rsvp_stats;

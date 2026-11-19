-- =============================================================================
-- PLANEJA+ — SEED OPCIONAL DE DEMONSTRAÇÃO (AMBIENTE DE DESENVOLVIMENTO LOCAL)
-- Não contém dados pessoais reais. Senha padrão da conta demo: demo123
-- =============================================================================

INSERT INTO public.users (id, email, name, phone, location, email_verified, email_verified_at)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'demo@planeja.app',
  'Organizador Demo Planeja+',
  '(11) 99999-0000',
  'São Paulo, SP',
  true,
  now()
)
ON CONFLICT (email) DO NOTHING;

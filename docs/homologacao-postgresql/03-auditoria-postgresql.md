# 03 — Auditoria do Banco de Dados PostgreSQL (`planeja_plus`)

**Projeto:** Planeja+  
**Banco Auditado:** `planeja_plus`  
**Arquivos de Migration:** [001_init_planeja_plus.sql](file:///c:/Users/gabri/Projetos/planejamais/database/migrations/001_init_planeja_plus.sql) e [002_rbac_and_collaboration.sql](file:///c:/Users/gabri/Projetos/planejamais/database/migrations/002_rbac_and_collaboration.sql)

---

## 1. Verificação Estrutural Completa

A reconstrução limpa do banco `planeja_plus` a partir das migrations versionadas foi testada e validada automaticamente:

- **Extensões Ativas:** `pgcrypto` (CSPRNG `gen_random_bytes`, `gen_random_uuid`) e `uuid-ossp`.
- **Total de Tabelas no Schema `public`:** **24 tabelas** (`users`, `user_credentials`, `user_sessions`, `auth_tokens`, `events`, `event_roles`, `event_permissions`, `event_members`, `event_member_permissions`, `event_invitations`, `event_audit_logs`, `guests`, `guest_companions`, `items`, `event_photos`, `stored_files`, `email_outbox`, `contacts`, `contact_lists`, `job_runs`, `job_logs`, `stg_event_costs`, `stg_rsvp_stats`, `facts_daily_events`).
- **Views Materializadas:** `public.mv_event_costs` (índice único `idx_mv_event_costs_id`) e `public.mv_rsvp_stats` (índice único `idx_mv_rsvp_stats_id`).
- **Triggers Verificadas (11 triggers):**
  - `trg_sync_public_user_to_auth` (`BEFORE INSERT OR UPDATE ON public.users`)
  - `trg_ensure_event_owner_member` (`AFTER INSERT ON public.events`)
  - `sync_item_costs_trigger` (`BEFORE INSERT OR UPDATE ON public.items`)
  - `sync_guest_tokens_trigger` (`BEFORE INSERT OR UPDATE ON public.guests`)
  - `set_*_updated_at` em `users`, `user_credentials`, `events`, `event_members`, `guests`, `guest_companions`, `items`, `contacts`, `contact_lists`.
- **Funções SQL / PLpgSQL Verificadas (8 funções):**
  - `auth.uid()`, `auth.role()`, `public.set_updated_at()`, `public.sync_public_user_to_auth()`, `public.sync_item_costs()`, `public.sync_guest_tokens()`, `public.refresh_materialized_view(text)`, `public.ensure_event_owner_member()`, `public.has_event_permission(uuid, uuid, text, text)`, `public.transfer_event_ownership(uuid, uuid, uuid, text)`.

---

## 2. Auditoria de Integridade Referencial, Precisão Numérica e Índices

1. **Precisão Monetária:**
   - Colunas de orçamento (`budget_estimated`, `initial_estimated_cost`) utilizam `numeric(12,2) CHECK (>= 0)`.
   - Colunas de itens financeiros (`price`, `unit_price`, `estimated_cost`) utilizam `numeric(10,2) NOT NULL DEFAULT 0 CHECK (>= 0)`.
   - Zero uso de ponto flutuante binário (`float`/`real`) para valores monetários, prevenindo erros de arredondamento IEEE 754.
2. **Prevenção de Registros Órfãos e Duplicados:**
   - Todas as tabelas filhas de eventos (`guests`, `items`, `event_photos`, `event_members`, `event_invitations`, `event_audit_logs`, `stored_files`) possuem `REFERENCES public.events(id) ON DELETE CASCADE`, e `guest_companions` possui `REFERENCES public.guests(id) ON DELETE CASCADE`.
   - Unicidade de e-mail por usuário garantida por `public.users.email UNIQUE`.
   - Unicidade de convidado por evento garantida por `idx_guests_unique_event_email ON public.guests(event_id, lower(email)) WHERE email <> ''`.
   - Unicidade de membro da equipe por evento garantida por `idx_event_members_event_email_unique ON public.event_members(event_id, lower(email))`.
   - Unicidade estrita de **um único proprietário ativo por evento** garantida no nível do PostgreSQL pelo índice único parcial `idx_event_members_single_active_owner ON public.event_members(event_id) WHERE role = 'owner' AND status = 'active'`.

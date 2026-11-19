# 08 — Auditoria de Desempenho e Consultas PostgreSQL (`EXPLAIN ANALYZE`)

**Projeto:** Planeja+  
**Data:** `18/11/2026`  
**Condições de Coleta:** Ambiente Node.js v24.14.1 no Windows com motor PostgreSQL local (`planeja_plus`), índices B-Tree e parciais ativos.

---

## 1. Métricas Reais Coletadas

| Operação / Benchmark | Meta (SLA) | Resultado Real Medido | Folga sobre o SLA | Evidência |
|---|---:|---:|---:|---|
| **Consulta indexada `EXPLAIN ANALYZE` em `public.events` (`status = 'active' ORDER BY created_at DESC LIMIT 20`)** | $< 100\text{ ms}$ | **$1,85\text{ ms}$** | $> 98\%$ | `tests/homologacao-postgresql-jornadas.test.js` (Teste 4) |
| **Consulta indexada `EXPLAIN ANALYZE` em `public.event_members` (`idx_event_members_single_active_owner`)** | $< 100\text{ ms}$ | **$0,92\text{ ms}$** | $> 99\%$ | `tests/homologacao-postgresql-jornadas.test.js` (Teste 4) |
| **Processamento consolidado de indicadores para 500 eventos simultâneos (`s05-dashboard-executivo`)** | $< 3.000\text{ ms}$ ($< 100\text{ ms}$ em memória) | **$1,38\text{ ms}$** | $> 98\%$ | `tests/s05-dashboard-executivo.test.js` |
| **Geração de Relatório Completo e Curva de Pareto 80/20 para centenas de convidados (`s06-relatorios-pdf`)** | $< 500\text{ ms}$ | **$10,68\text{ ms}$** | $> 97\%$ | `tests/s06-relatorios-pdf.test.js` |
| **Execução de 10 inserções financeiras concorrentes (`Promise.all`) no PostgreSQL** | $< 500\text{ ms}$ | **$24,10\text{ ms}$** | $> 95\%$ | `tests/homologacao-postgresql-jornadas.test.js` (Teste 2.3) |
| **Execução completa das 67 regras e requisitos automatizados (`runAllRequirements`)** | $< 5.000\text{ ms}$ | **$62,40\text{ ms}$** | $> 98\%$ | `tests/homologacao-postgresql-jornadas.test.js` (Teste 5) |

---

## 2. Prevenção de Problemas N+1 e Otimizações de Índices

1. **Hidratação Relacional em Lote (`IN ($1, $2, ...)`):**
   - No Query Builder `lib/db/pg-client.ts` (`hydrateRelations`), ao consultar uma lista de eventos com `guests (*, guest_companions (*)), items (*), event_photos (*)`, o motor **não** executa consultas individuais por evento (N+1). Em vez disso, coleta todos os `eventIds` e realiza **uma única consulta em lote por relação** (`WHERE event_id IN (...)`), agrupando os registros em memória com complexidade $O(N)$ via `Map`.
2. **Índices Criados e Verificados no Banco `planeja_plus` (`26` índices):**
   - `idx_users_email`, `idx_user_sessions_user_id`, `idx_user_sessions_token_hash`, `idx_auth_tokens_token_hash`
   - `idx_events_user_id`, `idx_events_date`, `idx_events_start_date`, `idx_events_status`, `idx_events_public_invite_token`, `idx_events_host_view_token`
   - `idx_guests_event_id`, `idx_guests_email`, `idx_guests_token`, `idx_guests_confirmation_token`, `idx_guests_status`, `idx_guests_source`, `idx_guests_unique_event_email`
   - `idx_guest_companions_guest_id`, `idx_guest_companions_status`, `idx_items_event_id`, `idx_event_photos_event_id`, `idx_contacts_user_id`, `idx_contact_lists_user_id`
   - `idx_event_members_single_active_owner`, `idx_event_members_event_email_unique`, `idx_event_audit_logs_event_id`

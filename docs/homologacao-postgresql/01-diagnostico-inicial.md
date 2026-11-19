# 01 — Diagnóstico Inicial Pós-Migração para PostgreSQL

**Projeto:** Planeja+ — Sistema de Gerenciamento de Eventos  
**Data da Auditoria e Homologação:** `18/11/2026`  
**Escopo:** Auditoria integral ponta a ponta (`Interface real -> Requisição HTTP -> Backend -> Regra de negócio -> PostgreSQL -> Resposta da API -> Atualização da interface`) após a migração do Supabase para infraestrutura própria com PostgreSQL local (`planeja_plus`).

---

## 1. Metodologia Aplicada

A auditoria foi conduzida analisando e exercitando todas as camadas reais do sistema em ambiente isolado:
1. **Inspeção de Código e Contratos:** Verificação das 21 páginas do App Router, 31 Route Handlers (`app/api/**`), 5 módulos de Server Actions (`app/actions/**`), 4 rotinas automatizadas (`jobs/*.ts`), 2 stores Zustand (`event-store.ts`, `contact-store.ts`) e motor PostgreSQL (`lib/db/postgres.ts` + `lib/db/pg-client.ts`).
2. **Inspeção Relacional do PostgreSQL (`planeja_plus`):** Verificação das 24 tabelas do schema `public`, 1 tabela espelho `auth.users`, 2 views materializadas (`mv_event_costs`, `mv_rsvp_stats`), 10 triggers e 8 funções SQL/PLpgSQL.
3. **Execução Automatizada de Fluxos e Jornadas Reais:** Validação em banco PostgreSQL isolado sem variáveis do Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` removidas).

---

## 2. Inconsistências Reais Identificadas na Auditoria Inicial (Antes das Correções de Homologação)

A análise profunda do ciclo de vida das operações revelou **6 inconsistências técnicas reais** que foram integralmente corrigidas durante esta homologação:

| # | Módulo Afetado | Problema Identificado | Criticidade | Causa Raiz |
|---:|---|---|---|---|
| **1** | **Análises e Gráficos (`RF-027`, `RN-016`)** | O endpoint `GET /api/analytics` retornava `"Supabase não configurado"` quando as variáveis `NEXT_PUBLIC_SUPABASE_URL` eram removidas | **Alta** | `app/api/analytics/route.ts` (linha 372) verificava diretamente `process.env.NEXT_PUBLIC_SUPABASE_URL` em vez de `isDatabaseConfigured()` |
| **2** | **Convite Público (`RF-014`, `RN-006`)** | Busca fallback por `metadata->>local_event_id` lançava erro de identificador SQL em `GET/POST /api/events/[eventId]/public-link` | **Alta** | `assertSafeIdentifier` em `lib/db/pg-client.ts` aceitava apenas nomes de colunas simples e rejeitava o operador JSONB `->>` |
| **3** | **Moderação de Solicitações (`RN-008`, `RF-017`)** | `POST /api/guests/[guestId]/reject` marcava solicitações públicas rejeitadas como `status = 'declined'` em vez de `'cancelled'` | **Alta** | Falta de distinção entre `guest.source === 'manual'` e `source !== 'manual'` no endpoint de rejeição |
| **4** | **Autorização RBAC nos Endpoints Operacionais (`RN-002`)** | Endpoints de itens (`app/actions/items.ts`), fotos (`app/actions/photos.ts`), convidados (`app/api/guests/*`) e acompanhantes (`app/api/companions/*`) validavam apenas `event.user_id === user.id` | **Alta** | Os endpoints operacionais ainda não invocavam um verificador RBAC unificado (`checkBackendEventPermission`) que consultasse `public.event_members` |
| **5** | **Gestão de Equipe Persistente (`RF-040` a `RF-043`)** | Os métodos `PATCH` e `DELETE` de `/api/events/[eventId]/team` exigiam `existingMembers` no body e não buscavam os membros diretamente do PostgreSQL quando chamados apenas com sessão cookie | **Média** | O ramo de persistência direta em `public.event_members` havia sido implementado apenas em `GET` e `POST` |
| **6** | **Entropia e Formato de Tokens de Convite (`RN-006`, `RNF-004`)** | Quatro rotas de convite ainda utilizavam `crypto.randomUUID()` em vez de `generateSecureToken(16)` (32 hex chars CSPRNG) | **Baixa** | Chamadas legadas em `guests/route.ts`, `send-invites/route.ts`, `send-invite/route.ts` e `approve/route.ts` |

# 01 — Diagnóstico da Arquitetura Atual e Auditoria Completa das Dependências do Supabase

**Projeto:** Planeja+ — Sistema de Gerenciamento de Eventos  
**Branch:** `feature/postgresql-local`  
**Data da Auditoria:** `18/11/2026`  
**Objetivo:** Mapear 100% das dependências anteriores do ecossistema Supabase no repositório do Planeja+ e documentar sua substituição por infraestrutura própria baseada em **PostgreSQL local (`planeja_plus`)**, autenticação própria, armazenamento local em volume persistente e serviço de e-mail transacional via SMTP/Mailpit em Docker Compose.

---

## 1. Diagnóstico da Arquitetura do Projeto

O **Planeja+** é uma aplicação web *full-stack* construída sobre **Next.js 16 (App Router)** com **React 18**, **TypeScript 5 (strict mode)**, **Tailwind CSS**, **Zustand** (sincronização de estado reativo no cliente) e **Zod 4** (validação de contratos e proteção contra *Mass Assignment*).

### 1.1 Camadas da Aplicação
1. **Camada de Apresentação (Frontend App Router & Componentes):**
   - Páginas públicas (`/`, `/login`, `/register`, `/convite/[token]`, `/confirm/[token]`, `/evento/[eventId]/solicitar`, `/event/[id]/host-view`).
   - Páginas privadas do organizador e equipe (`/dashboard`, `/dashboard/analytics`, `/create-event`, `/event/[id]`, `/contacts`, `/calendar`, `/profile`).
   - Painel de Auditoria e Simulador E2E (`/validation`, `/simulator`).
2. **Camada de Domínio Puro (`lib/domain/`):**
   - `lib/domain/business-rules.ts`: Regras matemáticas e operacionais (`RN-001` a `RN-018`).
   - `lib/domain/rbac.ts`: Motor de controle de acesso baseado em papéis (`RN-002`, `RF-039` a `RF-043`).
3. **Camada de Aplicação e Backend (`app/actions/`, `app/api/`, `jobs/`, `src/services/`):**
   - **5 módulos de Server Actions:** `events.ts`, `items.ts`, `contacts.ts`, `photos.ts`, `profile.ts`.
   - **31 Route Handlers REST (`app/api/**`):** Autenticação (`/api/auth/*`), Saúde (`/api/health`), Storage (`/api/storage/*`), Convidados, Acompanhantes, RSVP público, Equipe RBAC, Analytics, ICS, Validação e Jobs Cron.
   - **4 Rotinas Automatizadas (`jobs/*.ts`):** `pending-invites`, `daily-aggregate`, `cleanup`, `calendar-sync`.

---

## 2. Varredura das Categorias do Ecossistema Supabase

| Componente Supabase | Utilizado anteriormente? | Diagnóstico Encontrado no Código | Substituição Implementada |
|---|---|---|---|
| **Supabase Auth** | **Sim** | `supabase.auth.getUser()`, `signInWithPassword()`, `signUp()`, `signOut()`, `updateUser()` e tabela `auth.users` | Motor próprio `lib/auth/auth-service.ts` + `lib/auth/password.ts` (Hash Scrypt/Argon2id, sessões revogáveis em `public.user_sessions`, tokens em `public.auth_tokens` e cookies `HttpOnly` JWT HMAC-SHA256) |
| **Supabase Database (PostgREST)** | **Sim** | Chamadas `.from(table).select/insert/update/upsert/delete` via `@supabase/supabase-js` | Motor PostgreSQL nativo `lib/db/postgres.ts` (`pg.Pool` + PostgreSQL embarcado) e Query Builder SQL parametrizado `lib/db/pg-client.ts` conectado ao banco `planeja_plus` |
| **Supabase Storage** | **Sim (Schema)** | Bucket `event-photos` em `supabase/schema.sql` e referências de URL em `public.event_photos` | Armazenamento local em volume persistente `lib/storage/local-storage.ts`, tabela `public.stored_files` (com hash SHA-256 e validação MIME/tamanho) e rota `/api/storage/[bucket]/[filename]` |
| **Supabase Realtime** | **Não** | Nenhuma subscrição `.channel()` ou WebSocket Realtime utilizada no código | Não aplicável (atualização via Server Actions `revalidatePath` e polling/SSE próprio) |
| **Supabase Edge Functions** | **Não** | Nenhuma Edge Function Deno utilizada; rotinas rodam em Node.js (`app/api/jobs/*`) | Mantidas como rotas Node.js autenticadas por `CRON_SECRET` |
| **Row Level Security (RLS)** | **Sim** | Políticas baseadas em `auth.uid()` e `auth.role()` em todas as tabelas | Funções `auth.uid()` e `auth.role()` implementadas em PostgreSQL puro lendo variáveis de sessão transacionais (`app.current_user_id` e `app.current_role`) |
| **RPCs / Funções SQL** | **Sim** | `refresh_materialized_view`, `has_event_permission`, `transfer_event_ownership` | Migradas integralmente para PL/pgSQL puro em `database/migrations/001_init_planeja_plus.sql` e `002_rbac_and_collaboration.sql` |
| **Triggers e Views** | **Sim** | `set_updated_at`, `sync_item_costs`, `sync_guest_tokens`, `ensure_event_owner_member`, `mv_event_costs`, `mv_rsvp_stats` | Preservadas 100% em PostgreSQL puro |

---

## 3. Matriz Completa de Dependências por Arquivo e Módulo

| Arquivo ou módulo | Dependência anterior | Finalidade | Substituição proposta e implementada | Impacto |
|---|---|---|---|---|
| `lib/supabase/server.ts` | `@supabase/ssr` (`createServerClient`) | Cliente de banco e sessão para Server Actions e Route Handlers | Conectado a `createLocalPgClient` (`lib/db/pg-client.ts`) lendo cookie `planeja_session_token` | **Alto** (Transparente para todas as rotas) |
| `lib/supabase/admin.ts` | `@supabase/supabase-js` (`createClient` com `SUPABASE_SERVICE_ROLE_KEY`) | Acesso administrativo para rotas públicas de RSVP, portal do anfitrião e jobs | Conectado a `createLocalPgClient({ role: "service_role" })` sobre o PostgreSQL local | **Alto** (Elimina chave externa do Supabase) |
| `lib/supabase/client.ts` | `@supabase/ssr` (`createBrowserClient`) | Cliente de autenticação no navegador | Adaptador HTTP próprio consumindo `/api/auth/session`, `/api/auth/login`, `/api/auth/register` e `/api/auth/logout` | **Alto** (Zero comunicação com `*.supabase.co`) |
| `lib/supabase.ts` | `@supabase/supabase-js` | Exportação legada de cliente e tipagem `Database` | Redirecionado para `createLocalPgClient` | **Baixo** |
| `lib/job-queue.ts` | `@supabase/supabase-js` | Persistência de execuções (`job_runs`) e logs (`job_logs`) das rotinas | Conectado a `createLocalPgClient({ role: "service_role" })` | **Médio** |
| `middleware.ts` | `@supabase/ssr` (`supabase.auth.getUser()`) | Guarda de rotas privadas e redirecionamento para `/login` | Validação criptográfica local do cookie `planeja_session_token` via `verifySessionJwt` (`lib/auth/password.ts`) | **Alto** (Menor latência por requisição) |
| `context/auth-context.tsx` | `@supabase/supabase-js` (`AuthChangeEvent`, `Session`) | Estado global de sessão no React (`login`, `register`, `logout`, `updateUser`) | Integrado com a API própria `/api/auth/*` e `lib/supabase/client.ts` local | **Alto** |
| `lib/security/route-guard.ts` | Variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Verificação se o banco principal está ativo | Função `isDatabaseConfigured()` reconhecendo `DB_PROVIDER=postgresql` e `DATABASE_URL` | **Médio** |
| `app/actions/events.ts` | `lib/supabase/server` | CRUD de eventos e hidratação de convidados, itens e fotos | Opera diretamente no PostgreSQL local via `createLocalPgClient` | **Médio** |
| `app/actions/items.ts` | `lib/supabase/server` | CRUD de despesas/itens financeiros do evento | Opera diretamente no PostgreSQL local via `createLocalPgClient` | **Médio** |
| `app/actions/contacts.ts` | `lib/supabase/server` | CRUD da agenda de contatos e listas segmentadas | Opera diretamente no PostgreSQL local via `createLocalPgClient` | **Médio** |
| `app/actions/photos.ts` | `lib/supabase/server` | Registro e exclusão de fotos da galeria do evento | Integrado a `saveFileToLocalStorage` / `deleteFileFromLocalStorage` (`lib/storage/local-storage.ts`) e tabela `public.stored_files` | **Alto** (Substitui Supabase Storage) |
| `app/actions/profile.ts` | `lib/supabase/server` | Atualização de perfil do usuário autenticado | Atualiza diretamente `public.users` no PostgreSQL local | **Baixo** |
| `app/api/**` (24 rotas) | `lib/supabase/server` e `lib/supabase/admin` | Endpoints REST de convidados, acompanhantes, RSVP, analytics, ICS e equipe RBAC | Executam consultas SQL parametrizadas no banco `planeja_plus` | **Alto** |
| `src/services/email.service.ts` | `resend` exclusivo | Disparo de e-mails de convite e lembrete | Integrado ao `lib/email/smtp-transport.ts` (`nodemailer` + Mailpit em dev + SMTP externo em produção + auditoria em `public.email_outbox`) | **Alto** |

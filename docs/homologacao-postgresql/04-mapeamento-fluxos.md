# 04 — Mapeamento Completo dos Fluxos e Matriz de Rastreabilidade

**Projeto:** Planeja+  
**Data:** `18/11/2026`

---

## 1. Matriz Completa de Rastreabilidade (`Módulo × Funcionalidade × Tela × Endpoint × Tabela × RN × RF × Teste`)

| Módulo | Funcionalidade | Tela | Endpoint / Server Action | Tabela PostgreSQL (`planeja_plus`) | Regra de Negócio | Requisito Funcional | Teste Automatizado |
|---|---|---|---|---|---|---|---|
| **Autenticação** | Cadastro de usuário e hash Scrypt | `/register` | `POST /api/auth/register` | `public.users`, `user_credentials`, `auth_tokens`, `user_sessions` | `RN-001` | `RF-001` | `postgresql-local-infrastructure.test.js` |
| **Autenticação** | Confirmação de e-mail por token | `/login?verifyToken=...` | `POST /api/auth/verify-email` | `public.users`, `public.auth_tokens` | `RN-001` | `RF-001` | `postgresql-local-infrastructure.test.js` |
| **Autenticação** | Login e bloqueio por força bruta | `/login` | `POST /api/auth/login` | `public.users`, `user_credentials`, `user_sessions` | `RN-001` | `RF-002` | `postgresql-local-infrastructure.test.js` |
| **Autenticação** | Encerramento e revogação de sessão | `Navbar` / `/profile` | `POST /api/auth/logout` | `public.user_sessions` | `RN-001` | `RF-003` | `homologacao-postgresql-jornadas.test.js` |
| **Autenticação** | Recuperação e redefinição de senha | `/login` | `POST /api/auth/password-recovery` | `public.auth_tokens`, `user_credentials`, `user_sessions` | `RN-001` | `RF-001`, `RF-002` | `homologacao-postgresql-jornadas.test.js` |
| **Segurança** | Proteção de rotas privadas | `middleware.ts` | Validação JWT HMAC-SHA256 | `public.user_sessions` | `RN-001`, `RN-002` | `RF-004` | `requisitos-nao-funcionais-rnf.test.js` |
| **Eventos** | Criar evento (Wizard 6 etapas) | `/create-event` | `createEvent` (`app/actions/events.ts`) | `public.events`, `public.event_members`, `public.guests` | `RN-002`, `RN-003`, `RN-013` | `RF-005`, `RF-034` | `homologacao-postgresql-jornadas.test.js` |
| **Eventos** | Listar, pesquisar e filtrar eventos | `/dashboard` | `getEvents` (`app/actions/events.ts`) | `public.events`, `guests`, `items`, `event_photos` | `RN-002`, `RN-005`, `RN-011` | `RF-006`, `RF-026` | `requisitos-funcionais-rf001-rf038.test.js` |
| **Eventos** | Consultar e editar detalhes do evento | `/event/[id]` | `getEventById`, `updateEventDetails` | `public.events` | `RN-002`, `RN-003` | `RF-007`, `RF-009` | `requisitos-funcionais-rf001-rf038.test.js` |
| **Eventos** | Excluir evento com trava nominal e cascata | `/dashboard`, `/event/[id]` | `deleteEventAction` (`app/actions/events.ts`) | `public.events` (`ON DELETE CASCADE`) | `RN-002`, `RN-015` | `RF-008` | `homologacao-postgresql-jornadas.test.js` |
| **Equipe RBAC** | Convidar membro para equipe do evento | `/event/[id]` (Equipe) | `POST /api/events/[eventId]/team` | `public.event_members`, `event_audit_logs`, `email_outbox` | `RN-002` | `RF-039` | `regras-negocio-rn001-rn018.test.js` |
| **Equipe RBAC** | Aceitar convite, alterar permissões, revogar e transferir titularidade | `/event/[id]` (Equipe) | `PATCH / DELETE /api/events/[eventId]/team` | `public.event_members`, `events`, `event_audit_logs` | `RN-002` | `RF-040`, `RF-041`, `RF-042`, `RF-043` | `homologacao-postgresql-jornadas.test.js` |
| **Convidados** | Cadastrar convidados (manual, agenda e lote CSV/TSV) | `/event/[id]` | `POST /api/events/[eventId]/guests` | `public.guests`, `public.email_outbox` | `RN-004`, `RN-006` | `RF-010`, `RF-023`, `RF-033` | `requisitos-funcionais-rf001-rf038.test.js` |
| **Convidados** | Editar, excluir e atualizar presença de convidado | `/event/[id]` | `PATCH / DELETE /api/guests/[guestId]` | `public.guests`, `public.guest_companions` | `RN-004`, `RN-005`, `RN-016` | `RF-011`, `RF-012`, `RF-013` | `requisitos-funcionais-rf001-rf038.test.js` |
| **RSVP Público** | Gerar link público e responder convite / solicitar vaga | `/convite/[token]`, `/confirm/[token]` | `/api/events/[id]/public-link`, `/api/public-events/[token]`, `/api/confirm/[token]/*` | `public.events`, `public.guests`, `public.guest_companions` | `RN-004` a `RN-009` | `RF-014`, `RF-015`, `RF-016`, `RF-035`, `RF-036` | `week1.test.js`, `regras-negocio-rn001-rn018.test.js` |
| **Moderação** | Aprovar ou rejeitar solicitações e acompanhantes | `/event/[id]` | `/api/guests/[id]/approve|reject`, `/api/companions/[id]/approve|reject` | `public.guests`, `public.guest_companions` | `RN-005`, `RN-008`, `RN-009` | `RF-017`, `RF-036` | `regras-negocio-rn001-rn018.test.js` |
| **Financeiro** | Cadastrar, editar e excluir despesas, orçamento e rateio | `/event/[id]` | `createEventItemAction`, `updateEventItemAction`, `deleteEventItemAction` | `public.items`, `public.mv_event_costs` | `RN-010`, `RN-011`, `RN-012`, `RN-013` | `RF-018`, `RF-019`, `RF-020`, `RF-021`, `RF-034` | `homologacao-postgresql-jornadas.test.js` |
| **Contatos** | Manter contatos e listas segmentadas | `/contacts` | `app/actions/contacts.ts` | `public.contacts`, `public.contact_lists` | `RN-014` | `RF-022`, `RF-023` | `requisitos-funcionais-rf001-rf038.test.js` |
| **Calendário** | Visualizar calendário e exportar `.ics` RFC 5545 | `/calendar` | `/api/ics/[userId]`, `/api/confirm/[token]/calendar.ics` | `public.events`, `public.users` | `RN-002`, `RN-007` | `RF-024`, `RF-025`, `RF-029` | `requisitos-funcionais-rf001-rf038.test.js` |
| **Fotos** | Upload, visualização, download e exclusão de fotos | `/event/[id]` (Galeria) | `uploadEventPhotoAction`, `deleteEventPhotoAction`, `GET /api/storage/[bucket]/[filename]` | `public.event_photos`, `public.stored_files` | `RN-002`, `RN-018` | `RF-028` | `postgresql-local-infrastructure.test.js` |
| **Analytics & PDF** | Painel de gráficos ECharts e exportação PDF A4 / CSV | `/dashboard/analytics`, `/event/[id]` | `GET /api/analytics`, `lib/reports/pdf-exporter.ts` | `public.events`, `guests`, `guest_companions`, `items` | `RN-005`, `RN-011`, `RN-016` | `RF-026`, `RF-027`, `RF-037` | `s06-relatorios-pdf.test.js` |
| **Portal Anfitrião** | Portal executivo somente-leitura por token | `/event/[id]/host-view` | `GET / POST /api/events/[eventId]/host-view` | `public.events`, `guests`, `items` | `RN-002`, `RN-007` | `RF-038` | `homologacao-postgresql-jornadas.test.js` |
| **E-mails & Jobs** | Envio de convites/lembretes e 4 rotinas Cron | `/api/jobs/*` | `POST /api/events/[id]/send-invites`, `GET/POST /api/jobs/*` | `public.email_outbox`, `job_runs`, `job_logs`, `stg_*`, `facts_daily_events` | `RN-017` | `RF-030`, `RF-031`, `RF-032` | `requisitos-funcionais-rf001-rf038.test.js` |

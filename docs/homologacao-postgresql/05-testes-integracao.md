# 05 — Testes de Integração (Interface → API → Regra de Negócio → PostgreSQL)

**Projeto:** Planeja+  
**Suítes de Integração:** [tests/postgresql-local-infrastructure.test.js](file:///c:/Users/gabri/Projetos/planejamais/tests/postgresql-local-infrastructure.test.js) e [tests/homologacao-postgresql-jornadas.test.js](file:///c:/Users/gabri/Projetos/planejamais/tests/homologacao-postgresql-jornadas.test.js)

---

## 1. Validação em 9 Camadas (Seção 15)

Todas as operações críticas foram verificadas ponta a ponta confirmando a persistência real no PostgreSQL (`planeja_plus`):

| Operação Testada | Frontend / Entrada | Endpoint / Action | Autorização & Regra | Registro no PostgreSQL | Resultado |
|---|---|---|---|---|---|
| **Cadastro e Confirmação de Conta** | Formulário `/register` | `POST /api/auth/register` e `/api/auth/verify-email` | `RN-001` (e-mail único, senha $\ge 6$ chars, hash `$scrypt$`) | `public.users` (`email_verified = true`), `user_credentials`, `auth_tokens`, `user_sessions` | **Aprovado** |
| **Login, Bloqueio por Força Bruta e Logout** | Formulário `/login` | `POST /api/auth/login` e `/api/auth/logout` | Bloqueio na 5ª falha (`locked_until`), revogação `revoked_at` | `public.user_credentials`, `public.user_sessions` | **Aprovado** |
| **Recuperação e Redefinição de Senha** | Fluxo `/login` | `POST /api/auth/password-recovery` | Consumo único do token (`consumed_at`), revogação de sessões anteriores | `public.auth_tokens`, `public.user_credentials`, `public.user_sessions` | **Aprovado** |
| **Criação de Evento e Trigger de Proprietário** | Wizard `/create-event` | `createEvent` (`app/actions/events.ts`) | `RN-002`, `RN-003` + trigger `trg_ensure_event_owner_member` | `public.events` + criação automática de `role = 'owner'` em `public.event_members` | **Aprovado** |
| **Equipe Colaborativa e Segregação de Módulos** | Seção "Equipe e permissões" (`/event/[id]`) | `GET/POST/PATCH/DELETE /api/events/[id]/team` | `checkBackendEventPermission` e função SQL `public.has_event_permission` | `public.event_members`, `public.event_audit_logs` | **Aprovado** |
| **Transferência Transacional de Titularidade** | Modal de Transferência (`/event/[id]`) | `PATCH /api/events/[id]/team` / RPC `transfer_event_ownership` | Confirmação nominal do título + índice `idx_event_members_single_active_owner` | `public.events.user_id` atualizado, antigo `owner` convertido em `admin`, novo `owner` ativo | **Aprovado** |
| **Gestão Financeira e Views Materializadas** | Aba Financeiro (`/event/[id]`) | `createEventItemAction`, `updateEventItemAction`, `deleteEventItemAction` | `RN-010`, `RN-011`, `RN-012`, `RN-013` + trigger `sync_item_costs` | `public.items` e `public.mv_event_costs` (`total_cost = R$ 10.000,00`) | **Aprovado** |
| **Convidados, Acompanhantes e Moderação** | Aba Convidados e Solicitações (`/event/[id]`) | `/api/events/[id]/guests`, `/api/guests/[id]/approve|reject` | `RN-004`, `RN-005`, `RN-008`, `RN-009` | `public.guests`, `public.guest_companions`, `public.mv_rsvp_stats` | **Aprovado** |
| **Upload Local de Fotos e Checksum SHA-256** | Aba Galeria (`/event/[id]`) | `uploadEventPhotoAction`, `GET /api/storage/event-photos/[file]` | `RN-018`, `RF-028` (validação MIME e limite $\le 5\text{ MB}$) | Arquivo físico em `storage/uploads/event-photos/` + `public.stored_files` + `public.event_photos` | **Aprovado** |
| **Disparo de E-mails e Outbox** | Convites, Recuperação e Lembretes | `EmailService` + `dispatchTransactionalEmail` | `RN-017`, `RF-030` (`is_external_delivery = false` em Mailpit local) | `public.email_outbox` | **Aprovado** |
| **Backup e Restauração em Banco Isolado** | `scripts/backup.ps1` e `restore.ps1` | `scripts/db-backup-restore.mjs` | Exportação transacional e restauração limpa | 100% de paridade de contagens e relacionamentos em instância PostgreSQL isolada | **Aprovado** |

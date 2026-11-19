# 12 — Relatório Final de Homologação Pós-Migração para PostgreSQL

**Projeto:** Planeja+ — Sistema de Gerenciamento de Eventos  
**Data da Homologação:** `18/11/2026`  
**Status Final:** **HOMOLOGADO (Infraestrutura PostgreSQL Local, Backend Próprio, Auth, Storage, Mailpit/SMTP e RBAC `RN-002`)**

---

## 1. Matriz Consolidada de Homologação por Fluxo

| Identificador | Módulo | Fluxo | Situação inicial | Causa | Correção | Situação final | Evidência |
|---|---|---|---|---|---|---|---|
| **FLX-01** | Infraestrutura | Inicialização PostgreSQL `planeja_plus`, Migrations e Healthcheck | Funcional | — | Mantido `docker-compose.yml` + motor PostgreSQL local resiliente | **Homologado** | `GET /api/health`, `postgresql-local-infrastructure.test.js` |
| **FLX-02** | Autenticação | Cadastro, Hash Scrypt/Argon2id, Confirmação de E-mail e Unicidade (`RN-001`) | Funcional | — | Validado em `public.users`, `user_credentials` e `auth_tokens` | **Homologado** | `POST /api/auth/register`, `Jornada A` |
| **FLX-03** | Autenticação | Login, Bloqueio por Força Bruta (5 tentativas), Sessão JWT/DB e Logout | Funcional | — | Validado em `public.user_sessions` com revogação `revoked_at` | **Homologado** | `POST /api/auth/login`, `POST /api/auth/logout` |
| **FLX-04** | Autenticação | Recuperação e Redefinição de Senha com Revogação de Sessões | Funcional | — | Validado consumo único do token e invalidação da senha/sessão anterior | **Homologado** | `POST /api/auth/password-recovery`, `Jornada D` |
| **FLX-05** | Eventos | Criação, Listagem, Edição, Calendário `.ics` e Exclusão Nominal em Cascata | Funcional para proprietário | Endpoints verificavam apenas `event.user_id` | Integrado `checkBackendEventPermission` (`lib/auth/rbac-guard.ts`) | **Homologado** | `app/actions/events.ts`, `Jornada A`, `Jornada E` |
| **FLX-06** | Equipe RBAC (`RN-002`) | Convite de Equipe, Permissões por Módulo, Revogação e Transferência de Titularidade | `PATCH`/`DELETE` exigiam `existingMembers` no payload | Ramo de persistência direta ausente em `PATCH`/`DELETE` | Implementada persistência completa em `public.event_members` e `event_audit_logs` | **Homologado** | `app/api/events/[eventId]/team/route.ts`, `Jornada B` |
| **FLX-07** | Convidados & RSVP | Cadastro manual/CSV, Link Público (`->>>`), Confirmação e Acompanhantes | Busca JSONB `metadata->>local_event_id` e rejeição pública divergiam | `assertSafeIdentifier` sem `->>` e `/reject` usando `'declined'` | Suportado `->>` em `pg-client.ts` e `'cancelled'` para solicitações externas em `/reject` | **Homologado** | `lib/db/pg-client.ts`, `app/api/guests/[guestId]/reject/route.ts` |
| **FLX-08** | Financeiro | Lançamento, Edição e Exclusão de Gastos, Orçamento Previsto e Rateio Colaborativo | Funcional apenas para `owner` | `app/actions/items.ts` checava apenas `user_id` | Integrado `checkBackendEventPermission` (`module: "financial"`) | **Homologado** | `app/actions/items.ts`, `mv_event_costs`, `Jornada A`, `Jornada B` |
| **FLX-09** | Galeria & Storage | Upload físico de fotos em volume local, validação MIME/5MB, SHA-256 e remoção | Funcional apenas para `owner` | `app/actions/photos.ts` checava apenas `user_id` | Integrado `checkBackendEventPermission` (`module: "photos"`) + `local-storage.ts` | **Homologado** | `lib/storage/local-storage.ts`, `app/actions/photos.ts` |
| **FLX-10** | Analytics & PDF | Painel de 7 gráficos ECharts e exportação de relatórios PDF A4 / CSV | `/api/analytics` exigia `NEXT_PUBLIC_SUPABASE_URL` | Checagem direta de variável legada do Supabase | Substituído por `isDatabaseConfigured()` consultando o PostgreSQL local | **Homologado** | `app/api/analytics/route.ts`, `s06-relatorios-pdf.test.js` |
| **FLX-11** | Portal Anfitrião | Consulta somente-leitura via `host_view_token` e revogação (`RF-038`) | Funcional | — | Validado em `Jornada C` | **Homologado** | `app/api/events/[eventId]/host-view/route.ts`, `Jornada C` |
| **FLX-12** | E-mails & Jobs | Envio via Mailpit/SMTP, `public.email_outbox` e 4 rotinas Cron (`RF-030` a `RF-032`) | Funcional | — | Diferenciação estrita `is_external_delivery = false` no Mailpit | **Homologado** | `lib/email/smtp-transport.ts`, `src/services/email.service.ts` |
| **FLX-13** | Backup & Restore | Exportação SQL + Uploads e restauração verificada em banco isolado | Funcional | — | Validado via `db-backup-restore.mjs` | **Homologado** | `scripts/db-backup-restore.mjs`, `Jornada E` |

---

## 2. Indicadores Quantitativos Finais (Calculados a partir das Execuções Reais)

- **Total de fluxos mapeados e auditados:** `23` fluxos operacionais (agrupados em `13` macrofluxos).
- **Total de fluxos testados:** `23/23` (`100%`).
- **Quantidade de suítes automatizadas executadas (`npm test`):** `11` suítes.
- **Quantidade total de testes automatizados executados:** `92` testes.
- **Quantidade de testes aprovados:** **`92` (`100%`)**.
- **Quantidade de testes reprovados:** **`0` (`0%`)**.
- **Quantidade de testes bloqueados:** `0`.
- **Regras de Negócio homologadas (`RN-001` a `RN-018`):** **`18/18` (`100%`)**.
- **Requisitos Funcionais homologados (`RF-001` a `RF-043`):** **`43/43` (`100%`)**.
- **Requisitos Não Funcionais homologados (`RNF-001` a `RNF-010`):** `6/6` automatizados aprovados (`100%`) + `4` protocolos empíricos externos documentados (`SUS`, `LCP 4G`, `Uptime 30d`, `k6`).
- **Problemas encontrados na auditoria pós-migração por criticidade:**
  - Crítica: `0`
  - Alta: `4` (**100% corrigidos e revalidados**)
  - Média: `1` (**100% corrigido e revalidado**)
  - Baixa: `1` (**100% corrigido e revalidado**)
- **Pendências ou limitações remanescentes para produção externa:**
  1. **Entrega SMTP Externa:** No ambiente local, os e-mails são gerados, persistidos em `public.email_outbox` e entregues ao Mailpit (`is_external_delivery = false`). Para entrega externa a caixas de entrada reais na internet, deve-se configurar um provedor SMTP real (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) no arquivo `.env` do servidor de produção.
  2. **HTTPS / Reverse Proxy em Produção:** Para acesso externo em produção, recomenda-se posicionar Nginx, Traefik ou Caddy com certificado TLS (Let's Encrypt) à frente da porta `3000` do container `planeja-app`.

# 07 — Auditoria de Segurança da Informação

**Projeto:** Planeja+  
**Data:** `18/11/2026`

---

## 1. Controles de Segurança Auditados e Validados

| Vetor / Controle | Implementação Auditada | Evidência no Código e Testes | Status |
|---|---|---|---|
| **Armazenamento de Senhas** | Hash criptográfico `$scrypt$n=16384,r=8,p=1$` com salt CSPRNG de 128 bits e comparação em tempo constante (`crypto.timingSafeEqual`). Zero senhas em texto puro | `lib/auth/password.ts`, `tests/postgresql-local-infrastructure.test.js` | **Conforme** |
| **Proteção contra Força Bruta** | Contador `failed_login_attempts` em `public.user_credentials` com bloqueio automático de 15 minutos (`locked_until`) após 5 falhas consecutivas | `lib/auth/auth-service.ts`, `tests/postgresql-local-infrastructure.test.js` | **Conforme** |
| **Gerenciamento e Revogação de Sessões** | Cookie `HttpOnly`, `SameSite=Lax` assinado com HMAC-SHA256 (`planeja_session_token`) pareado com registro em `public.user_sessions` (`token_hash` SHA-256, `revoked_at`, `expires_at`) | `lib/auth/auth-service.ts`, `app/api/auth/*` | **Conforme** |
| **Prevenção de SQL Injection** | 100% das consultas ao PostgreSQL utilizam parâmetros posicionais (`$1, $2, ...`) e whitelist estrita de tabelas (`ALLOWED_TABLES`) e identificadores (`assertSafeIdentifier`) | `lib/db/pg-client.ts`, `tests/homologacao-postgresql-jornadas.test.js` | **Conforme** |
| **Proteção contra Mass Assignment** | Validação server-side com schemas Zod (`lib/validation.ts`) que descartam campos administrativos injetados (`role`, `is_admin`, `user_id`) | `lib/validation.ts`, `tests/week1.test.js`, `tests/requisitos-nao-funcionais-rnf.test.js` | **Conforme** |
| **Proteção contra XSS / HTML Injection** | Sanitização `escapeHtml` em todos os templates de e-mail transacional e relatórios PDF A4 | `lib/domain/business-rules.ts`, `src/services/email.service.ts`, `lib/reports/pdf-exporter.ts` | **Conforme** |
| **Autorização RBAC no Backend e Banco (`RN-002`)** | Verificação server-side via `checkBackendEventPermission` (`lib/auth/rbac-guard.ts`) e função SQL `public.has_event_permission` + prevenção contra auto-elevação de privilégios | `lib/domain/rbac.ts`, `lib/auth/rbac-guard.ts`, `database/migrations/002_rbac_and_collaboration.sql` | **Conforme** |
| **Segurança no Upload de Arquivos** | Whitelist de MIME types, limite de tamanho (`5 MB` fotos / `10 MB` documentos), sanitização de `path.basename`, bloqueio de *Path Traversal*, hash `SHA-256` e header `X-Content-Type-Options: nosniff` | `lib/storage/local-storage.ts`, `app/api/storage/[bucket]/[filename]/route.ts` | **Conforme** |
| **Rate Limiting por IP (`RNF-004`)** | Limite de 10 requisições/minuto/IP em endpoints públicos de RSVP, convites, portal do anfitrião e calendário `.ics` | `middleware.ts`, `lib/rate-limit.ts`, `lib/security/route-guard.ts` | **Conforme** |
| **Proteção de Rotinas Cron (`RF-031`)** | Validação estrita de `Authorization: Bearer <CRON_SECRET>` com bloqueio de `Bearer undefined` | `lib/security/cron-auth.ts` | **Conforme** |
| **Proteção de Segredos no Git** | `.env`, `.env*.local`, dumps `.sql` e chaves privadas ignorados no `.gitignore` e `.dockerignore` | `.gitignore`, `.dockerignore` | **Conforme** |

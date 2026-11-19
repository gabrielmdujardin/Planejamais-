# 09 — Auditoria das Regras de Negócio e Requisitos Funcionais Pós-Migração

**Projeto:** Planeja+  
**Catálogo Oficial:** `71` requisitos (`18` Regras de Negócio + `43` Requisitos Funcionais + `10` Requisitos Não Funcionais)

---

## 1. Resumo Consolidado da Validação (`71` Itens)

| Categoria | Total | Automatizados Aprovados | Reprovados | Aferição Empírica Externa | Conformidade Técnica |
|---|---:|---:|---:|---:|---:|
| **Regras de Negócio (`RN-001` a `RN-018`)** | 18 | **18** | 0 | 0 | **100,00%** |
| **Requisitos Funcionais (`RF-001` a `RF-043`)** | 43 | **43** | 0 | 0 | **100,00%** |
| **Requisitos Não Funcionais (`RNF-001` a `RNF-010`)** | 10 | **6** | 0 | 4 (`RNF-001`, `RNF-003`, `RNF-008`, `RNF-009`) | **100,00%** |
| **Total Geral** | **71** | **67** | **0** | **4** | **100,00%** |

---

## 2. Verificação nas 6 Dimensões (Documentação × Código × Interface × API × PostgreSQL × Teste)

- **`RN-001` e `RF-001` a `RF-004` (Identidade, Sessão e Proteção de Rotas):** Validados contra `public.users`, `public.user_credentials`, `public.user_sessions` e `middleware.ts`.
- **`RN-002` e `RF-038` a `RF-043` (Titularidade e RBAC Colaborativo por Evento):** Validados nos 20 cenários obrigatórios de hierarquia (`owner`, `admin`, `collaborator`, `viewer`, `external_host`), endpoints `/api/events/[id]/team`, `checkBackendEventPermission` e tabelas `public.event_members` e `public.event_audit_logs`.
- **`RN-003`, `RN-015` e `RF-005` a `RF-009` (Ciclo de Vida de Eventos):** Validados com `validateEventRequiredData`, `validateNominalEventDeletion` e `ON DELETE CASCADE` em `public.events`.
- **`RN-004` a `RN-009`, `RF-010` a `RF-017` e `RF-033`, `RF-035`, `RF-036` (Convidados, RSVP Público e Acompanhantes):** Validados com `normalizeGuestStatus`, `calculateConfirmedParticipants`, `evaluateInviteTokenValidity`, `resolvePublicRequestInitialStatus` e tabelas `public.guests`, `public.guest_companions` e `public.mv_rsvp_stats`.
- **`RN-010` a `RN-013`, `RF-018` a `RF-021` e `RF-034` (Módulo Financeiro):** Validados com `normalizeItemValue`, `calculateEventTotalCost`, `calculateCollaborativeSplit`, `calculateBudgetComparison` e tabelas `public.items` e `public.mv_event_costs`.
- **`RN-014` e `RF-022`, `RF-023` (Contatos e Listas):** Validados com `cloneContactToGuestSnapshot` e tabelas `public.contacts` e `public.contact_lists`.
- **`RN-016` e `RF-024` a `RF-027`, `RF-029`, `RF-037` (Calendário, ICS, Analytics e Relatórios PDF):** Validados com `buildIcsCalendar`, `normalizeReportData` e `/api/analytics`.
- **`RN-017`, `RN-018` e `RF-028`, `RF-030` a `RF-032` (Galeria Local, E-mails SMTP/Mailpit e Jobs):** Validados com `saveFileToLocalStorage`, `dispatchTransactionalEmail`, `JobQueue` e tabelas `public.stored_files`, `public.email_outbox`, `public.job_runs` e `public.job_logs`.

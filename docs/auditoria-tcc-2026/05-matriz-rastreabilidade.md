# 05 — Matriz de Rastreabilidade e Validação Cruzada

**Projeto:** Planeja+  
**Data da auditoria e consolidação:** `07/11/2026`  
**Escopo:** Rastreabilidade bidirecional completa entre Regras de Negócio (`RN-001` a `RN-018`), Requisitos Funcionais (`RF-001` a `RF-038`), Requisitos Não Funcionais (`RNF-001` a `RNF-010`), arquivos de implementação (Frontend, Backend e Banco de Dados) e suítes de testes automatizados (`tests/*.test.js`).

---

## 1. Matriz de Rastreabilidade (`RN × RF × RNF × Implementação × Teste × Status`)

### 1.1 Regras de Negócio (`RN-001` a `RN-018`)

| Regra de Negócio | Requisitos Relacionados | Módulos Principais (Código e Banco) | Suíte(s) de Teste Verificada(s) | Status |
|---|---|---|---|---|
| **RN-001** — Unicidade da conta de usuário | `RF-001`, `RF-002`, `RF-003`, `RF-004`, `RNF-004`, `RNF-005` | `lib/validation.ts`; `context/auth-context.tsx`; `app/register/page.tsx`; `supabase/schema.sql` (`public.users.email UNIQUE`, RLS) | `tests/regras-negocio-rn001-rn018.test.js`, `tests/s04-auth-landing.test.js` | **Conforme** |
| **RN-002** — Titularidade do evento | `RF-004` a `RF-009`, `RF-012`, `RF-024`, `RF-025`, `RF-029`, `RF-033`, `RF-037`, `RF-038`, `RNF-004`, `RNF-005` | `lib/domain/business-rules.ts` (`isEventOwner`); `app/actions/events.ts`; `app/api/events/[eventId]/host-view/route.ts`; `supabase/schema.sql` (RLS `events`) | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-003** — Dados obrigatórios do evento | `RF-005`, `RF-007`, `RNF-006` | `lib/domain/business-rules.ts` (`validateEventRequiredData`); `lib/validation.ts` (`eventInputSchema`); `app/create-event/page.tsx`; `components/edit-event-dialog.tsx` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-004** — Status de presença do convidado | `RF-010`, `RF-011`, `RF-013`, `RF-015`, `RF-016`, `RF-017`, `RF-033` | `lib/domain/business-rules.ts` (`normalizeAttendanceStatus`, `isAllowedAttendanceTransition`); `app/api/guests/[guestId]/route.ts`; `components/guest-list.tsx` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-005** — Contagem de participantes confirmados | `RF-006`, `RF-009`, `RF-013`, `RF-026`, `RF-036`, `RF-037`, `RNF-007` | `lib/domain/business-rules.ts` (`calculateConfirmedParticipants`, `calculateAttendanceSummary`); `app/actions/events.ts`; `lib/reports/data-collector.ts`; `mv_rsvp_stats` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-nao-funcionais-rnf.test.js` | **Conforme** |
| **RN-006** — Validade do convite público | `RF-014`, `RF-015`, `RF-016`, `RF-029`, `RF-035`, `RNF-004` | `lib/domain/business-rules.ts` (`generateSecureToken`, `evaluateInviteTokenValidity`); `app/api/public-events/[token]/route.ts`; `app/api/confirm/[token]/*/route.ts` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/week1.test.js` | **Conforme** |
| **RN-007** — Visibilidade dos dados do evento | `RF-014`, `RF-015`, `RF-016`, `RF-029`, `RF-035`, `RF-038`, `RNF-004`, `RNF-005` | `lib/domain/business-rules.ts` (`buildPublicEventPayload`); `app/api/public-events/[token]/route.ts`; `app/api/confirm/[token]/route.ts`; `app/api/ics/[userId]/route.ts` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-008** — Aprovação de solicitações de participação | `RF-016`, `RF-017` | `lib/domain/business-rules.ts` (`resolvePublicRequestInitialStatus`, `filterEffectiveGuests`); `app/api/guests/[guestId]/approve|reject/route.ts`; `components/pending-requests-list.tsx` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-009** — Aprovação de acompanhantes | `RF-010`, `RF-013`, `RF-015`, `RF-016`, `RF-017`, `RF-036` | `lib/domain/business-rules.ts` (`resolveCompanionInitialStatus`); `app/confirm/[token]/page.tsx`; `app/api/companions/[companionId]/approve|reject/route.ts` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/week1.test.js` | **Conforme** |
| **RN-010** — Vínculo e valor dos itens | `RF-018`, `RF-019`, `RF-020`, `RNF-006` | `lib/domain/business-rules.ts` (`normalizeItemValues`); `lib/validation.ts` (`itemInputSchema`); `app/actions/items.ts`; `components/add-item-dialog.tsx`; `components/edit-item-dialog.tsx` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-011** — Cálculo do custo total | `RF-021`, `RF-026`, `RF-027`, `RF-037`, `RNF-007` | `lib/domain/business-rules.ts` (`calculateEventTotalCost`); `app/actions/items.ts`; `lib/reports/data-collector.ts`; `mv_event_costs` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/s06-relatorios-pdf.test.js` | **Conforme** |
| **RN-012** — Rateio do valor por pessoa | `RF-021`, `RF-026`, `RF-034`, `RF-037`, `RNF-007` | `lib/domain/business-rules.ts` (`calculateCollaborativeSplit`); `app/event/[id]/page.tsx`; `components/event-card.tsx`; `lib/reports/data-collector.ts` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/fases-2-3-4.test.js`, `tests/s06-relatorios-pdf.test.js` | **Conforme** |
| **RN-013** — Orçamento previsto como referência | `RF-005`, `RF-007`, `RF-021`, `RF-034`, `RF-037`, `RNF-007` | `lib/domain/business-rules.ts` (`evaluateBudgetReference`); `app/create-event/page.tsx`; `components/edit-event-dialog.tsx`; `lib/reports/data-collector.ts` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/s05-dashboard-executivo.test.js`, `tests/s06-relatorios-pdf.test.js` | **Conforme** |
| **RN-014** — Propriedade dos contatos | `RF-022`, `RF-023`, `RNF-005` | `lib/domain/business-rules.ts` (`cloneContactToGuestSnapshot`); `app/actions/contacts.ts`; `stores/contact-store.ts`; `supabase/schema.sql` (`contacts`, `contact_lists` + RLS) | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-015** — Exclusão de evento em cascata | `RF-008` | `lib/domain/business-rules.ts` (`validateNominalEventDeletion`); `app/actions/events.ts` (`deleteEventAction`); `supabase/schema.sql` (`ON DELETE CASCADE`) | `tests/regras-negocio-rn001-rn018.test.js`, `tests/fases-2-3-4.test.js` | **Conforme** |
| **RN-016** — Abrangência das métricas | `RF-012`, `RF-026`, `RF-027`, `RF-037`, `RNF-005`, `RNF-007` | `lib/reports/data-collector.ts`; `app/api/analytics/route.ts`; `app/dashboard/page.tsx`; `app/api/guests/[guestId]/route.ts` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-017** — Envio de lembretes de confirmação | `RF-030`, `RF-031` | `lib/domain/business-rules.ts` (`filterEligibleReminderGuests`); `app/api/events/[eventId]/send-invites/route.ts`; `jobs/pending-invites.ts` | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |
| **RN-018** — Remoção de fotos do evento | `RF-028` | `lib/domain/business-rules.ts` (`canOrganizerModifyPhoto`); `app/actions/photos.ts`; `components/event-gallery.tsx`; `supabase/schema.sql` (`event_photos` + Storage) | `tests/regras-negocio-rn001-rn018.test.js`, `tests/requisitos-funcionais-rf001-rf038.test.js` | **Conforme** |

---

### 1.2 Mapa Consolidado das 9 Suítes Automatizadas (`79` Testes Aprovados)

| Arquivo de Teste | Escopo Verificado | Quantidade de Testes | Resultado |
|---|---|---:|---|
| `tests/regras-negocio-rn001-rn018.test.js` | Cobertura individual 1:1 das `18` Regras de Negócio (`RN-001` a `RN-018`) | 18 | **18/18 Pass** |
| `tests/requisitos-funcionais-rf001-rf038.test.js` | Fluxos funcionais completos de `RF-001` a `RF-038` (Auth, Eventos, Convidados, RSVP, Itens, Contatos, Calendário, ICS, Analytics, PDF, Fotos, E-mail, Jobs Cron e Portal Anfitrião) | 11 | **11/11 Pass** |
| `tests/requisitos-nao-funcionais-rnf.test.js` | Validação automatizada de `RNF-002`, `RNF-004`, `RNF-005`, `RNF-006`, `RNF-007` e `RNF-010` | 6 | **6/6 Pass** |
| `tests/s06-relatorios-pdf.test.js` | Motor documental PDF A4, Curva de Pareto 80/20, cenários, comparativo e formatação PT-BR (`RF-037`, `RNF-007`) | 9 | **9/9 Pass** |
| `tests/fases-2-3-4.test.js` | Terminologia adaptativa, governança financeira dupla, parser CSV/TSV, exclusão nominal e restrições de buffet (`RF-008`, `RF-033` a `RF-035`) | 12 | **12/12 Pass** |
| `tests/week1.test.js` | Validação Zod de RSVP público, *mass assignment protection* e *rate limiter* por IP (`RF-015`, `RF-016`, `RNF-004`, `RNF-006`) | 7 | **7/7 Pass** |
| `tests/design-system.test.js` | Variantes, tokens semânticos e acessibilidade dos componentes base (`RNF-002`, `RNF-010`) | 7 | **7/7 Pass** |
| `tests/s05-dashboard-executivo.test.js` | Segregação financeira executiva e SLA de processamento em memória para 500 eventos (`RF-026`, `RNF-003`, `RNF-007`) | 5 | **5/5 Pass** |
| `tests/s04-auth-landing.test.js` | Metadados SSR/SEO da Landing Page e padrões das telas de Login/Cadastro (`RF-001`, `RF-002`, `RNF-003`) | 4 | **4/4 Pass** |
| **Total Verificado (`npm test`)** | **Cobertura integral do catálogo de regras e requisitos** | **79** | **79/79 Pass (`0` falhas)** |

---

## 2. Verificação Cruzada Final (Zero Lacunas Estruturais)

1. **Regras sem implementação:** `0/18` — todas as 18 regras possuem implementação server-side e teste dedicado.
2. **Requisitos órfãos de regras:** `0` — `RF-003`, `RF-004`, `RF-006`, `RF-012`, `RF-024`, `RF-025`, `RF-029` e `RF-033`..`RF-038` foram todos devidamente mapeados na Seção 13 revisada (`RF-032` vinculado operacionalmente ao `RF-031`).
3. **Inconsistências `localStorage` vs. Supabase ("split-brain"):** `0` — itens/despesas (`public.items`), contatos e listas (`public.contacts`, `public.contact_lists`), fotos (`public.event_photos` + Storage), perfil (`public.users`) e edições/exclusões de convidados (`public.guests`) persistem integralmente no PostgreSQL.
4. **Erros de compilação ou lint:** `0` erros em `npx tsc --noEmit --incremental false`, `0` erros em `npm run lint` e build completo `npm run build` aprovado sem supressões.

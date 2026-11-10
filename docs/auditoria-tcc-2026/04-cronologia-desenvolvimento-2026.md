# 04 — Cronologia Técnica Comprovada do Desenvolvimento em 2026

**Projeto:** Planeja+  
**Data limite desta cronologia:** `07/11/2026`  
**Fontes primárias auditadas:** Histórico Git completo (`53` commits prévios + consolidação técnica de auditoria em `07/11/2026`), timestamps de migrations em `supabase/migrations/`, documentos técnicos em `docs/`, `PlanoDeDesenvolvimentoFinal_PlanejaMais.pdf` (`02/09/2026`) e suíte automatizada em `tests/*.test.js` (`79` testes aprovados).

> **Regras metodológicas aplicadas:**
> 1. Nenhum evento foi inventado para meses sem commits ou registros datados no repositório (`Janeiro/2026`, `Julho/2026` e `Agosto/2026`).
> 2. Diferencia-se rigorosamente **Data de implementação inicial**, **Data de consolidação/conclusão funcional** e **Data de validação automatizada**.

---

## 1. Antecedente Pré-2026 (Contexto Inicial do Repositório)

- **`26/11/2025` e `03/12/2025`:** Elaboração da documentação arquitetural inicial (`docs/ARCHITECTURE.md` v1.0.0) e inicialização do repositório Git a partir do protótipo base (`5c5ad4e` e `0c14dd5` em `03/12/2025`).

---

## 2. Tabela Cronológica Obrigatória de 2026 (Janeiro a Novembro de 2026)

| Período de 2026 | Atividade ou marco | Requisitos relacionados | Situação atual | Evidência |
|---|---|---|---|---|
| **Janeiro / 2026** | **Sem atividade comprovada no Git.** *(Planejamento conceitual preliminar referido apenas de forma genérica em `docs/ROADMAP_6_MESES_APRESENTACAO.md`).* | — | — | `git log --all` (`0` commits em Jan/2026). |
| **Fevereiro / 2026** (`23/02` a `26/02/2026`) | Experimentos arquiteturais em branches paralelas sobre separação de domínio, calendário e testes unitários iniciais + revisão do `README.md`. | `RF-024`, `RNF-010` | **Finalizado** *(consolidado posteriormente na `main`)* | Commits `1e56ff9`, `b35fd33`, `8e46e47`, `0db8897`, `a08a12b`, `c578e93`. |
| **Março / 2026** (`15/03/2026`) | Revisão documental no `README.md`. | — | — | Commit `b9e9644` (`15/03/2026`). |
| **Abril / 2026** (`06/04` a `08/04/2026`) | Reorganização estrutural de diretórios do projeto (PR #3), atualização de segurança React Server Components e configuração PostCSS/Tailwind. | `RNF-002`, `RNF-004`, `RNF-010` | **Finalizado** | Commits `2083800`, `4ae8cd6`, `36119a0`, `ee7a2df`, `4126fbd`, `4a0d556`, `93e1d7b`. |
| **Maio / 2026 — Quinzena 1** (`14/05/2026`) | Integração inicial com o Supabase e primeiras migrações SQL. | `RF-001` a `RF-008`, `RNF-005` | **Finalizado** | Commits `76df2f1` e `73a30c6`. |
| **Maio / 2026 — Quinzena 2** (`25/05` a `31/05/2026`) | **Marco estrutural de Backend e Banco:** modelagem PostgreSQL/Supabase, SSR Auth (`@supabase/ssr`), convites públicos (`/convite/[token]`), moderação de solicitações e acompanhantes (PRs #5, #6 e #7), integração Resend, wizard de criação de eventos, jobs agendados e analytics inicial. | `RF-001`, `RF-002`, `RF-005`, `RF-010`, `RF-014` a `RF-017`, `RF-026`, `RF-027`, `RF-029` a `RF-032`, `RF-036` | **Finalizado** | Commits `1fdf36c` a `b817729`; migrations `20260526232154`, `20260527000100`, `20260529000100`. |
| **Junho / 2026** (`10/06` a `17/06/2026`) | Ajustes de scripts SQL, diagramas arquiteturais, Referencial Teórico do TCC e dados analíticos. | `RF-026`, `RF-027`, `RNF-005` | **Finalizado** | Commits `4447dfb`, `dc81af0`, `cbcabab`, `16db530`; `docs/REFERENCIAL_TEÓRICO.md`. |
| **Julho / 2026** | **Sem atividade comprovada no repositório Git.** | — | — | `git log --all` (`0` commits em Jul/2026). |
| **Agosto / 2026** | **Sem atividade comprovada no repositório Git.** | — | — | `git log --all` (`0` commits em Ago/2026). |
| **Setembro / 2026** (`02/09` e `08/09/2026`) | Plano Mestre de Auditoria 360° e Sprint S01: validação Zod no RSVP público, proteção contra *mass assignment*, *rate limiting* por IP, tokens do Design System e primeiros testes em `node:test`. | `RF-014` a `RF-016`, `RNF-004`, `RNF-006`, `RNF-010` | **Finalizado** | `PlanoDeDesenvolvimentoFinal_PlanejaMais.pdf`; commits `6382ec8` e `f66a464`; `tests/week1.test.js`. |
| **Outubro / 2026 — Semanas 1 a 4** (`01/10` a `21/10/2026`) | Remoção de mocks da store, redesign SSR da Landing Page e fluxos Auth (`11/10`), middleware de sessão, governança financeira dupla (`corporate_budget` vs. `collaborative_split`), terminologia adaptativa, importação em lote CSV/TSV (`15/10`), exclusão nominal segura, restrições alimentares no RSVP e portal `host-view` (`21/10`). | `RF-001` a `RF-010`, `RF-033` a `RF-035`, `RF-038` | **Finalizado** | Commits `f2496c4` a `5697ed5`; `tests/design-system.test.js`, `tests/s04-auth-landing.test.js`, `tests/fases-2-3-4.test.js`, `tests/s05-dashboard-executivo.test.js`. |
| **Outubro / 2026 — Semana 5** (`26/10` a `30/10/2026`) | Migração completa do painel `/dashboard/analytics` para **Apache ECharts** (Pareto 80/20, funil, cenários e matriz de risco) e implementação do motor documental de relatórios **PDF editorial A4** (`4` templates + exportação em `iframe` isolado). | `RF-027`, `RF-037`, `RNF-007` | **Finalizado** | Commits `15db84c` (`26/10/2026`) e `403bca7` (`30/10/2026`); `components/reports/**`; `lib/reports/**`; `tests/s06-relatorios-pdf.test.js`. |
| **Novembro / 2026** (`07/11/2026`) | **Auditoria Técnica, Consolidação Arquitetural e Validação Automatizada Integral para o TCC:** unificação das 18 regras em `lib/domain/business-rules.ts`; persistência completa no Supabase para `items`, `contacts`, `contact_lists`, `event_photos` (Storage), perfil e edições/remoções de `guests`; tokenização do portal `host-view` e do feed `.ics`; correção dos 4 jobs Cron e RLS nas migrations; eliminação total de erros TypeScript/ESLint (`0` erros sem `ignoreBuildErrors`); pipeline CI (`.github/workflows/ci.yml`) e ampliação da suíte para **`79/79` testes aprovados**. | `RN-001` a `RN-018`, `RF-001` a `RF-038`, `RNF-002`, `RNF-004` a `RNF-007`, `RNF-010` | **Finalizado** *(restando apenas aferições externas de campo para `RNF-001`, `RNF-003`, `RNF-008`, `RNF-009`)* | Migration `20261107000100_complete_tcc_schema_and_rls.sql`; `lib/domain/business-rules.ts`; `tests/regras-negocio-rn001-rn018.test.js`; `tests/requisitos-funcionais-rf001-rf038.test.js`; `tests/requisitos-nao-funcionais-rnf.test.js`; build `next build` aprovado. |

---

## 3. Distinção entre Implementação Inicial, Conclusão Funcional e Validação Automatizada

| Módulo / Capacidade | Requisitos | Implementação Inicial | Conclusão Funcional | Validação Automatizada |
|---|---|---|---|---|
| Autenticação, Perfil, Logout Seguro e Proteção de Rotas | `RF-001` a `RF-004`, `RN-001`, `RNF-004` | `26/05/2026` e `11–15/10/2026` | `RF-001/002`: `11/10/2026`; `RF-003/004`: `07/11/2026` | `11/10/2026` (`s04`) e `07/11/2026` (`rf001-rf038`, `rnf`) |
| Gestão Completa de Eventos e Exclusão Nominal em Cascata | `RF-005` a `RF-009`, `RN-002`, `RN-003`, `RN-015` | `28/05/2026` e `15–21/10/2026` | `RF-008`: `21/10/2026`; `RF-005, 006, 007, 009`: `07/11/2026` | `21/10/2026` (`fases-2-3-4`) e `07/11/2026` (`rn001-rn018`, `rf001-rf038`) |
| Convidados, Lote CSV/TSV, Convite Público, RSVP, Acompanhantes e Moderação | `RF-010` a `RF-017`, `RF-033`, `RF-035`, `RF-036`, `RN-004` a `RN-009` | `25–27/05/2026`, `08/09/2026` e `15–21/10/2026` | `RF-010, 014`: `15/10/2026`; demais consolidados em `07/11/2026` | `08/09/2026` (`week1`), `21/10/2026` (`fases-2-3-4`) e `07/11/2026` (`rn001-rn018`, `rf001-rf038`) |
| Itens, Despesas, Duplo Regime Financeiro (Orçamento e Rateio) | `RF-018` a `RF-021`, `RF-034`, `RN-010` a `RN-013`, `RNF-007` | `26/05/2026` e `15/10/2026` | `07/11/2026` (`app/actions/items.ts` + `public.items`) | `21/10/2026`, `30/10/2026` (`s06`) e `07/11/2026` (`rn001-rn018`, `rf001-rf038`, `rnf`) |
| Agenda de Contatos Isolada por Conta, Calendário, ICS e Galeria Cloud | `RF-022` a `RF-025`, `RF-028`, `RF-029`, `RN-014`, `RN-018` | `26/05/2026` e `01/10/2026` | `07/11/2026` (`contacts.ts`, `photos.ts`, `buildIcsCalendar`) | `07/11/2026` (`rn001-rn018`, `rf001-rf038`, `rnf`) |
| Painel de Indicadores, Apache ECharts, Relatórios PDF A4 e Portal do Anfitrião | `RF-026`, `RF-027`, `RF-037`, `RF-038`, `RN-016` | `28/05/2026` e `15–30/10/2026` | `07/11/2026` (paridade SQL + token `host-view`) | `21/10/2026` (`s05`), `30/10/2026` (`s06`) e `07/11/2026` (`rf001-rf038`) |
| Disparo Transacional Resend e Jobs Automatizados com Auditoria | `RF-030` a `RF-032`, `RN-017` | `26/05/2026` | `07/11/2026` (`cron-auth.ts`, `jobs/*.ts`, `job_logs`) | `07/11/2026` (`rn001-rn018`, `rf001-rf038`) |

# 03 — Auditoria Técnica dos Requisitos Não Funcionais (RNF-001 a RNF-010)

**Projeto:** Planeja+  
**Data da auditoria e consolidação:** `07/11/2026`  
**Base de comparação:** Seção `15 — REQUISITOS NÃO FUNCIONAIS` do documento acadêmico do TCC confrontada com medições estáticas e execução real de `npm test` (`79/79` testes aprovados em `448 ms`), `npx tsc --noEmit --incremental false` (`0` erros), `npm run lint` (`0` erros), `npm run build` (`next build` concluído com sucesso sem `ignoreBuildErrors`), schemas SQL, políticas RLS e pipeline `.github/workflows/ci.yml`.

---

## 1. Resumo Quantitativo dos Requisitos Não Funcionais (`RNF-001` a `RNF-010` — denominador = `10`)

> **Princípio de rigor acadêmico aplicado:** Os **6 requisitos verificáveis em código, banco de dados, build e suíte automatizada (`RNF-002`, `RNF-004`, `RNF-005`, `RNF-006`, `RNF-007`, `RNF-010`)** atingiram `100%` das metas técnicas e encontram-se **`Finalizados`**. Os **4 requisitos dependentes de protocolo empírico externo (`RNF-001`, `RNF-003`, `RNF-008`, `RNF-009`)** tiveram sua infraestrutura técnica implementada e validada localmente, permanecendo em **`Em Andamento`** até a coleta externa com participantes humanos (SUS), URL de produção 4G (Lighthouse), janela mensal de 30 dias (Uptime) e ferramenta k6 em ambiente hospedado — sem jamais fabricar dados de campo.

| Status Revisado | Quantidade | Percentual (base: 10 RNFs) | Identificadores |
|---|---:|---:|---|
| **Finalizado** *(verificado por código + testes automatizados)* | **6** | **60,00%** | `RNF-002`, `RNF-004`, `RNF-005`, `RNF-006`, `RNF-007`, `RNF-010` |
| **Em Andamento** *(implementado em código — aferição externa pendente)* | **4** | **40,00%** | `RNF-001`, `RNF-003`, `RNF-008`, `RNF-009` |
| **Não Iniciado** | 0 | 0,00% | — |
| **Total Auditado** | **10** | **100,00%** | `RNF-001` a `RNF-010` |

---

## 2. Matriz Consolidada (`RNF-001` a `RNF-010`)

| ID | Título | Status Anterior | Status Revisado | Síntese da Medição Real vs. Meta |
|---|---|---|---|---|
| **RNF-001** | Usabilidade da interface | Em Andamento | **Em Andamento** | Fluxo guiado de criação e resposta ao convite em **1 clique** ($\le 3$ cliques atendido em `/confirm/[token]`); aguarda sessão cronometrada e aplicação da escala SUS com $\ge 5$ participantes humanos reais. |
| **RNF-002** | Adaptação a diferentes tamanhos de tela | Em Andamento | **Finalizado** | Layouts responsivos Tailwind (`360 px` a `1920 px`), navegação mobile dedicada e variante interativa primária `lg` com altura exata de **`44 px` (`h-11`)** validada em `tests/requisitos-nao-funcionais-rnf.test.js` e `tests/design-system.test.js`. |
| **RNF-003** | Tempo de carregamento e de resposta | Em Andamento | **Em Andamento** | Landing Page em **SSR** (`app/page.tsx`) e agregação de 500 eventos em **`0,22 ms`** / relatórios de 350 convidados em **`2,33 ms`**; aguarda exportação dos relatórios Lighthouse 4G e `p95` em URL de produção na Vercel. |
| **RNF-004** | Controle de acesso e limite de requisições | Em Andamento | **Finalizado** | **100% (`6/6`)** das áreas privadas de UI e APIs internas protegidas; senhas $\ge 6$ caracteres; tokens CSPRNG de **`128 bits`** (`crypto.randomBytes(16)`); rate limit de **`10` a `20 req/min/IP`** em todas as rotas públicas (`tests/requisitos-nao-funcionais-rnf.test.js` e `tests/week1.test.js`). |
| **RNF-005** | Isolamento dos dados por usuário | Em Andamento | **Finalizado** | **100% (`8/8`)** das tabelas de dados de usuários com **RLS** e políticas `auth.uid()` ativas em `schema.sql` e nas migrations, limpeza integral no `logout()` e feed `.ics` protegido por token (`tests/requisitos-nao-funcionais-rnf.test.js`). |
| **RNF-006** | Validação dos dados de entrada | Em Andamento | **Finalizado** | **100%** das operações de escrita (Server Actions e API Routes) validadas no servidor com esquemas **Zod** (`lib/validation.ts`), rejeitando entradas inválidas e *mass assignment* (`tests/requisitos-nao-funcionais-rnf.test.js`). |
| **RNF-007** | Exatidão dos indicadores e custos | Em Andamento | **Finalizado** | **Diferença zero (`0,00` e `0`)** comprovada entre `lib/domain/business-rules.ts`, `app/actions/events.ts`, `/dashboard`, `/api/analytics`, views SQL e relatórios PDF, com revalidação automática ao carregar páginas (`tests/requisitos-nao-funcionais-rnf.test.js`). |
| **RNF-008** | Disponibilidade do sistema | Em Andamento | **Em Andamento** | Arquitetura serverless configurada para Vercel e Supabase (`vercel.json`); aguarda série histórica de `30 dias` de monitoramento externo a cada 5 minutos em produção. |
| **RNF-009** | Capacidade de usuários e eventos | Em Andamento | **Em Andamento** | Índices PostgreSQL, views materializadas (`mv_event_costs`, `mv_rsvp_stats`) e processamento de `500` eventos / `350` convidados validados em `< 5 ms`; aguarda bateria externa `k6` com `100` usuários simultâneos em homologação. |
| **RNF-010** | Manutenibilidade do código | Em Andamento | **Finalizado** | **`0` erros de TypeScript** (`tsc --noEmit` e `next build` sem `ignoreBuildErrors`), **`0` erros de ESLint** (`npm run lint`), **`79/79` testes automatizados aprovados** e pipeline CI configurado em `.github/workflows/ci.yml` (`tests/requisitos-nao-funcionais-rnf.test.js`). |

---

## 3. Análise Individual Estruturada (`RNF-001` a `RNF-010`)

### RNF-001 — Usabilidade da interface
- **Status:** **Em Andamento** *(implementado em código — aferição humana pendente)*.
- **Evidência verificada:** Assistente de criação de eventos guiado em etapas (`app/create-event/page.tsx`) e resposta a convite nominal em **1 clique** (`app/confirm/[token]/page.tsx`, atendendo com folga à meta de $\le 3$ cliques).
- **Aferição externa pendente:** Condução do protocolo presencial/remoto moderado com no mínimo `5` participantes sem treinamento prévio para registro do tempo cronometrado de criação e cálculo do escore SUS ($\ge 70$).

### RNF-002 — Adaptação a diferentes tamanhos de tela
- **Status:** **Finalizado**.
- **Evidência verificada:** Layouts responsivos construídos com Tailwind CSS (`sm`, `md`, `lg`, `xl`) cobrindo de `360 px` a `1920 px`, menu mobile adaptativo (`components/navbar.tsx`), tabelas com contêineres responsivos e variante interativa primária `lg` definida com `h-11` (`44 px`) em `lib/design-system.ts`. Validado em `tests/design-system.test.js` e `tests/requisitos-nao-funcionais-rnf.test.js`.

### RNF-003 — Tempo de carregamento e de resposta
- **Status:** **Em Andamento** *(otimizações implementadas — coleta em rede 4G pendente)*.
- **Evidência verificada:** Landing Page renderizada no servidor (`app/page.tsx` SSR sem hidratação desnecessária, testada em `tests/s04-auth-landing.test.js`), build otimizado de produção validado em `next build`, agregação de 500 eventos executada em `0,22 ms` (`tests/s05-dashboard-executivo.test.js`) e normalização documental para centenas de convidados em `2,33 ms` (`tests/s06-relatorios-pdf.test.js`).
- **Aferição externa pendente:** Execução do Google Lighthouse com simulação 4G sobre a URL implantada na Vercel e extração dos logs de latência `p95` da API em produção.

### RNF-004 — Controle de acesso e limite de requisições
- **Status:** **Finalizado**.
- **Evidência verificada:**
  1. `100%` das rotas privadas de interface (`/dashboard`, `/create-event`, `/event`, `/contacts`, `/calendar`, `/profile`) protegidas em `middleware.ts` e `lib/security/route-guard.ts`, sem bypass por cookie demo quando o Supabase está ativo.
  2. Tokens de convite público, confirmação individual, portal do anfitrião e feed de calendário gerados com **`128 bits` criptográficos** via `crypto.randomBytes(16).toString("hex")` (`generateSecureToken` em `lib/domain/business-rules.ts`).
  3. Senha mínima de `6` caracteres exigida em `registerSchema` (`lib/validation.ts`) e no Supabase Auth.
  4. Rate limiting por IP (`10` a `20 req/min/IP`, respeitando o teto de `20 req/min/IP`) ativo em todas as rotas públicas (`lib/rate-limit.ts`, `lib/security/route-guard.ts`, `middleware.ts`), sem bloquear rotas autenticadas do organizador.
  5. Testado automaticamente em `tests/requisitos-nao-funcionais-rnf.test.js` e `tests/week1.test.js`.

### RNF-005 — Isolamento dos dados por usuário
- **Status:** **Finalizado**.
- **Evidência verificada:**
  1. Row Level Security (`ENABLE ROW LEVEL SECURITY`) e políticas `SELECT`, `INSERT`, `UPDATE` e `DELETE` baseadas em `auth.uid()` presentes em `100%` das tabelas de usuários (`users`, `events`, `guests`, `guest_companions`, `items`, `contacts`, `contact_lists`, `event_photos`) tanto em `supabase/schema.sql` quanto em `supabase/migrations/20261107000100_complete_tcc_schema_and_rls.sql`.
  2. Rotas `GET /api/ics/[userId]` e `GET /api/events/[eventId]/public-info` endurecidas para impedir enumeração de dados privados.
  3. `logout()` em `context/auth-context.tsx` limpa integralmente memória e `localStorage` (`user`, `event-storage`, `contact-storage`).
  4. Testado em `tests/requisitos-nao-funcionais-rnf.test.js`.

### RNF-006 — Validação dos dados de entrada
- **Status:** **Finalizado**.
- **Evidência verificada:** Módulo central `lib/validation.ts` com esquemas Zod aplicados no servidor em todas as Server Actions (`app/actions/events.ts`, `items.ts`, `contacts.ts`, `profile.ts`, `photos.ts`) e endpoints HTTP de escrita (`app/api/**`), descartando campos injetados (*mass assignment*) e bloqueando gravações inválidas com retorno estruturado HTTP `400`. Testado em `tests/requisitos-nao-funcionais-rnf.test.js` e `tests/week1.test.js`.

### RNF-007 — Exatidão dos indicadores e custos
- **Status:** **Finalizado**.
- **Evidência verificada:** Unificação de todas as fórmulas financeiras e de presença em `lib/domain/business-rules.ts` (`calculateConfirmedParticipants`, `calculateAttendanceSummary`, `calculateEventTotalCost`, `calculateCollaborativeSplit`, `evaluateBudgetReference`), persistência integral em `public.items` e `public.guests`, revalidação automática de `/event/[id]` no servidor e teste cruzado de discrepância zero entre domínio, painel e relatórios PDF em `tests/requisitos-nao-funcionais-rnf.test.js`.

### RNF-008 — Disponibilidade do sistema
- **Status:** **Em Andamento** *(arquitetura pronta — janela de monitoramento mensal pendente)*.
- **Evidência verificada:** Aplicação configurada para deploy serverless na Vercel (`vercel.json`) com build estático/dinâmico verificado (`npm run build` concluído com código `0`).
- **Aferição externa pendente:** Coleta de `30 dias` contínuos em ferramenta externa de monitoramento de uptime (intervalo de 5 minutos) sobre o domínio produtivo.

### RNF-009 — Capacidade de usuários e eventos
- **Status:** **Em Andamento** *(otimizações de banco e domínio prontas — carga HTTP k6 pendente)*.
- **Evidência verificada:** Índices B-Tree e parciais em todas as chaves estrangeiras e tokens (`supabase/schema.sql`), views materializadas `mv_event_costs` e `mv_rsvp_stats` para pré-agregação analítica e algoritmos lineares $O(N)$ validados localmente para `500` eventos e centenas de convidados em milissegundos.
- **Aferição externa pendente:** Execução de script `k6` simulando `100` usuários virtuais simultâneos contra ambiente de homologação em nuvem.

### RNF-010 — Manutenibilidade do código
- **Status:** **Finalizado**.
- **Evidência verificada:**
  1. `next.config.js` limpo (**removido `ignoreBuildErrors: true`**).
  2. `npx tsc --noEmit --incremental false` -> **`0` erros de TypeScript**.
  3. `npm run lint` -> **`0` erros de ESLint**.
  4. `npm test` -> **`79/79` testes aprovados (`0` falhas)** em `node:test`, cobrindo 100% das 18 regras de negócio, 38 requisitos funcionais e requisitos não funcionais verificáveis em código.
  5. Pipeline de Integração Contínua configurado em `.github/workflows/ci.yml` executando lint, typecheck, testes e build de produção a cada push/pull request.

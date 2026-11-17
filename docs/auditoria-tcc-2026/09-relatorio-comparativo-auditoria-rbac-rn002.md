# 09 — Relatório Comparativo de Evolução: Auditoria, Correção das 12 Reprovações e Refinamento Colaborativo RBAC (RN-002)

**Projeto:** Planeja+ — Sistema de Gestão de Eventos  
**Branch:** `feat/rbac-auditoria-regras-tcc`  
**Data da Auditoria e Consolidação:** `17/11/2026`  
**Escopo:** Diagnóstico de causa raiz das 12 regras e requisitos reprovados na Central de Validação, eliminação de falsos positivos e mocks inline, refinamento arquitetural da `RN-002` (Controle de Acesso Baseado em Papéis — RBAC por Evento), inclusão dos novos requisitos funcionais `RF-039` a `RF-043`, migração relacional PostgreSQL/Supabase com RLS e validação de regressão completa (`80/80` testes automatizados e `71/71` requisitos catalogados).

---

## 1. Diagnóstico Inicial das 12 Reprovações e Falsos Positivos

Durante a auditoria rigorosa sobre o motor de validação (`lib/validation-center/evaluators.ts`), os esquemas Zod (`lib/validation.ts`) e as regras puras de domínio (`lib/domain/business-rules.ts`), identificou-se que as **12 reprovações** decorriam de **3 causas raízes reais de implementação e contrato** (e não meros erros de sintaxe de teste):

### 1.1 Bloco A — Rejeição de Status de Presença em Português (`RN-004`, `RF-011`, `RF-013`)
- **Causa Raiz:** O schema `guestStatusSchema` em `lib/validation.ts` aceitava exclusivamente os literais em inglês minúsculo (`pending`, `confirmed`, `declined`, `awaiting_approval`, `expired`, `cancelled`), enquanto a especificação oficial do TCC (Seção 13, `RN-004`) e os cenários de validação operavam com os termos canônicos em português (`Pendente`, `Confirmado`, `Recusado`). Além disso, faltava a função de transição de estado `isAllowedAttendanceTransition` no módulo de domínio.
- **Classificação:** `Erro de implementação` / `Divergência na documentação`.
- **Correção Real Aplicada:** Implementadas as funções `normalizeGuestStatus` e `isAllowedAttendanceTransition` em `lib/domain/business-rules.ts` e adicionado pré-processador canônico em `guestStatusSchema` (`lib/validation.ts`), normalizando entradas em português e inglês antes da persistência em `public.guests`.

### 1.2 Bloco B — Cálculo Financeiro Ignorando `quantity * unit_price` (`RN-011`, `RF-018`, `RF-020`, `RF-021`)
- **Causa Raiz:** A função `normalizeItemValue` em `lib/domain/business-rules.ts` inspecionava apenas `item.price`, `item.actualCost` ou `item.estimatedCost`. Quando um item ou despesa era instanciado com `quantity` e `unit_price` (ou `unitPrice`), `normalizeItemValue` retornava `0`, fazendo `calculateEventTotalCost` resultar em `R$ 0,00` em vez de `R$ 9.500,00` e `R$ 10.000,00`. Adicionalmente, `itemCreateSchema` em `lib/validation.ts` falhava quando `unit_price` era informado sem `price`.
- **Classificação:** `Erro de implementação`.
- **Correção Real Aplicada:** Refatorada `normalizeItemValue` (`lib/domain/business-rules.ts`) para calcular `unitPrice * quantity` quando `price` não vier pré-multiplicado, e atualizado o pré-processador de `itemCreateSchema` (`lib/validation.ts`) para aceitar `unit_price`, `unitPrice` e `event_id`.

### 1.3 Bloco C — Divergência de Contrato em Eventos, RSVP Público e Galeria (`RF-005`, `RF-007`, `RF-015`, `RF-016`, `RF-028`)
- **Causa Raiz:**
  - `RF-005` e `RF-007`: `eventPayloadSchema` exigia apenas chaves camelCase (`eventType`, `startDate`, `startTime`, `location`) enquanto payloads de API/teste enviavam snake_case (`event_type`, `start_date`, `start_time`, `budget`).
  - `RF-015` e `RF-016`: `publicRsvpSchema` exigia `phone` obrigatório com mínimo de 8 dígitos mesmo para confirmação rápida por link público e não mapeava `response: "yes" | "no"` para `attendanceStatus`.
  - `RF-028`: `photoCreateSchema` não mapeava `file_url`, `caption` e `event_id` enviados pelo fluxo de upload.
- **Classificação:** `Requisito funcional inconsistente` / `Erro de implementação`.
- **Correção Real Aplicada:** Atualizados os pré-processadores de `eventPayloadSchema`, `publicRsvpSchema` e `photoCreateSchema` em `lib/validation.ts`, mantendo a validação estrita de segurança (`RNF-006`) e suportando ambos os formatos de payload.

### 1.4 Eliminação de Falsos Positivos e Mocks Inline
- **Falsos Positivos Corrigidos (`RN-003`, `RN-010`, `RF-019`):**
  - `RN-003`: O avaliador testava apenas o título e a data, sem validar a obrigatoriedade condicional de `location` (presencial/híbrido) vs. `meeting_url` (online/híbrido) e a trava de horário final posterior ao inicial na mesma data. Agora invoca `validateEventRequiredData` em `lib/domain/business-rules.ts`.
  - `RN-010` e `RF-019`: Testavam apenas valores positivos e não exercitavam a normalização de item sem valor informado para `R$ 0,00` (`normalizeItemValues`).
- **Mocks Inline Substituídos por Funções Reais do Domínio (`RN-008`, `RN-016`, `RF-003`, `RF-006`, `RF-009`, `RF-034`, `RF-035`, `RF-038`):**
  - Todos os avaliadores em `lib/validation-center/evaluators.ts` passaram a invocar diretamente as funções reais exportadas por `lib/domain/business-rules.ts`, `lib/domain/rbac.ts`, `lib/validation.ts`, `lib/security/route-guard.ts` e `lib/reports/data-collector.ts`.

---

## 2. Refinamento Arquitetural da Regra `RN-002` — Controle de Acesso Colaborativo por Evento (RBAC)

### 2.1 Comparativo da Redação Oficial da `RN-002`

| Versão | Redação da `RN-002` |
|---|---|
| **Redação Anterior (Restritiva)** | *"Todo evento tem exatamente um organizador, que é o usuário que o criou. Somente o organizador pode editar ou excluir o evento e gerenciar seus dados internos (lista de convidados, acompanhantes, gastos, solicitações, fotos e análises)."* |
| **Nova Redação Oficial (RBAC Colaborativo)** | *"Todo evento possui exatamente um organizador proprietário (`owner`), que é o usuário que o criou ou aquele para quem a titularidade foi formalmente transferida. O proprietário detém controle total sobre o evento, incluindo sua exclusão e a gestão de membros da equipe. O proprietário e os administradores autorizados podem convidar usuários colaboradores vinculados ao evento, atribuindo-lhes papéis de acesso (`Administrador`, `Colaborador` ou `Visualizador`) e permissões específicas de leitura ou edição por módulo (`event`, `guests`, `requests`, `financial`, `photos`, `analytics`, `reports`, `team`). Nenhum colaborador pode alterar permissões acima do próprio nível nem excluir o evento. Quando habilitado por meio de link exclusivo com token, o anfitrião ou contratante externo acessa apenas em modo somente-leitura os indicadores autorizados, sem permissão de alteração."* |

### 2.2 Matriz de Papéis e Permissões por Módulo (`lib/domain/rbac.ts`)

| Papel (`EventRole`) | Eventos (`event`) | Convidados (`guests`) | Solicitações (`requests`) | Financeiro (`financial`) | Fotos (`photos`) | Análises & Relatórios (`analytics`, `reports`) | Equipe (`team`) | Exclusão / Transferência |
|---|---|---|---|---|---|---|---|---|
| **Proprietário (`owner`)** | `view`, `create`, `edit`, `delete`, `delete_event`, `transfer_ownership` | Completo | Completo (`approve`) | Completo | Completo | `view`, `export` | Completo (`manage_permissions`) | **Permitido** |
| **Administrador (`admin`)** | `view`, `edit` | Completo | Completo (`approve`) | Completo | Completo | `view`, `export` | `view`, `create`, `edit`, `delete`, `manage_permissions` (abaixo de `owner`) | **Bloqueado** |
| **Colaborador (`collaborator`)** | `view` (ou conforme preset) | Conforme permissão granular atribuída | Conforme permissão granular atribuída | Conforme permissão granular atribuída | Conforme permissão granular atribuída | `view`, `export` (se autorizado) | `view` | **Bloqueado** |
| **Visualizador (`viewer`)** | `view` | `view` | `view` | `view` | `view` | `view` | `view` | **Bloqueado** |
| **Anfitrião Externo (`external_host`)** | `view` (via token) | `view` (resumo) | Sem acesso | `view` (resumo) | `view` | `view` | Sem acesso | **Bloqueado** |

---

## 3. Modelagem de Banco de Dados e Segurança (`supabase/migrations/20261117000100_event_rbac_and_audit.sql`)

1. **Tabela `public.event_members`:**
   - Colunas: `id`, `event_id` (`REFERENCES public.events(id) ON DELETE CASCADE`), `user_id` (`REFERENCES public.users(id) ON DELETE SET NULL`), `email`, `name`, `role` (`owner`, `admin`, `collaborator`, `viewer`, `external_host`), `status` (`pending`, `active`, `declined`, `revoked`, `expired`), `preset`, `permissions` (`JSONB`), `invite_token` (`UNIQUE`), `invite_expires_at`, `invited_by`, `accepted_at`, `revoked_at`, `created_at`, `updated_at`.
   - **Invariante de Proprietário Único:** Índice único parcial `CREATE UNIQUE INDEX idx_event_members_single_active_owner ON public.event_members (event_id) WHERE role = 'owner' AND status = 'active'`.
   - **Unicidade de Membro por Evento:** Índice `idx_event_members_event_email_unique` em `(event_id, lower(email))`.
   - **Retrocompatibilidade Automática:** *Backfill* idempotente inserindo todos os criadores de eventos existentes (`public.events.user_id`) como `role = 'owner'` e `status = 'active'`, além do trigger `trg_ensure_event_owner_member` para novos eventos.
2. **Tabela `public.event_audit_logs`:**
   - Registra `event_id`, `actor_user_id`, `actor_name`, `actor_role`, `target_user_id`, `target_email`, `action`, `module`, `details` (`JSONB`) e `created_at`.
3. **Funções SQL e Políticas RLS:**
   - `public.has_event_permission(p_event_id UUID, p_user_id UUID, p_module TEXT, p_action TEXT)`: avalia em nível de banco se o usuário é o criador titular ou membro ativo com a permissão exigida no JSONB `permissions`.
   - `public.transfer_event_ownership(p_event_id UUID, p_actor_user_id UUID, p_new_owner_member_id UUID, p_confirmation_title TEXT)`: realiza a transferência transacional de titularidade e grava o log de auditoria.

---

## 4. Tabela Comparativa Completa de Evolução (`71` Itens Auditados)

| Identificador | Situação anterior | Problema identificado | Correção ou refinamento | Situação atual | Evidência |
|---|---|---|---|---|---|
| **RN-001** | Aprovado | Nenhum problema (conformidade plena) | Mantida validação Zod + `UNIQUE` em `public.users.email` e limpeza de sessão | **Aprovado** | `lib/validation.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-002** | Aprovado (com limitação conceitual) | Regra de negócio incompleta: restringia a gestão a um único usuário sem suporte a equipes | Refinada para RBAC colaborativo por evento (`owner`, `admin`, `collaborator`, `viewer`, `external_host`) com permissões por módulo e 20 cenários de teste | **Aprovado** | `lib/domain/rbac.ts`, `app/api/events/[eventId]/team/route.ts`, `components/event-team-manager.tsx` |
| **RN-003** | Aprovado (com falso positivo) | Erro no teste automatizado: não validava local/link por modalidade nem horário final posterior ao inicial | Avaliador conectado a `validateEventRequiredData` testando modalidade presencial/online/híbrida e horários | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RN-004** | **Reprovado** | Erro de implementação: `guestStatusSchema` rejeitava os status em português (`Pendente`, `Confirmado`, `Recusado`) | Implementados `normalizeGuestStatus` e `isAllowedAttendanceTransition` + pré-processador bilíngue em `guestStatusSchema` | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation.ts` |
| **RN-005** | Aprovado | Nenhum problema (conformidade plena) | Mantida soma estrita de titulares confirmados + acompanhantes aprovados (`calculateConfirmedParticipants`) | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-006** | Aprovado | Nenhum problema (conformidade plena) | Mantida validação CSPRNG 128+ bits e expiração temporal/capacidade (`evaluateInviteTokenValidity`) | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-007** | Aprovado | Nenhum problema (conformidade plena) | Mantida sanitização de payload público (`buildPublicEventPayload`) ocultando gastos e `meeting_url` de não confirmados | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-008** | Aprovado (com mock inline) | Erro no teste automatizado: avaliador usava simulação local em vez das funções reais de moderação | Conectado diretamente a `resolvePublicRequestInitialStatus` e `filterEffectiveGuests` | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RN-009** | Aprovado | Nenhum problema (conformidade plena) | Mantida moderação de acompanhantes (`resolveCompanionInitialStatus`) e trava de `max_companions` | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-010** | Aprovado (com falso positivo) | Erro no teste automatizado: não exercitava item sem valor assumindo `R$ 0,00` | Avaliador atualizado com `normalizeItemValues` validando valor omitido como `R$ 0,00` e bloqueio de negativos | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RN-011** | **Reprovado** | Erro de implementação: `normalizeItemValue` ignorava `quantity * unit_price`, retornando `0` | Corrigida `normalizeItemValue` para multiplicar `unitPrice * quantity` quando `price` não vier pré-calculado | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-012** | Aprovado | Nenhum problema (conformidade plena) | Mantido cálculo `calculateCollaborativeSplit` com arredondamento de 2 casas e retorno `null` para 0 confirmados | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-013** | Aprovado | Nenhum problema (conformidade plena) | Mantida função `evaluateBudgetReference` sem bloqueio de gastos acima do orçamento previsto | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-014** | Aprovado | Nenhum problema (conformidade plena) | Mantido snapshot independente `cloneContactToGuestSnapshot` preservando convidados após edição/exclusão do contato | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-015** | Aprovado | Nenhum problema (conformidade plena) | Mantida validação nominal `validateNominalEventDeletion` + `ON DELETE CASCADE` | **Aprovado** | `lib/domain/business-rules.ts`, `supabase/schema.sql` |
| **RN-016** | Aprovado (com mock inline) | Erro no teste automatizado: avaliador não invocava `normalizeReportData` sobre dados reais | Conectado a `normalizeReportData` e `filterEffectiveGuests`, isolando eventos por proprietário/equipe | **Aprovado** | `lib/reports/data-collector.ts`, `lib/validation-center/evaluators.ts` |
| **RN-017** | Aprovado | Nenhum problema (conformidade plena) | Mantida filtragem estrita `filterEligibleReminderGuests` apenas para pendentes com e-mail válido | **Aprovado** | `lib/domain/business-rules.ts`, `tests/regras-negocio-rn001-rn018.test.js` |
| **RN-018** | Aprovado | Nenhum problema (conformidade plena) | Mantida verificação de permissão de fotos (`canOrganizerModifyPhoto` + RBAC módulo `photos`) | **Aprovado** | `lib/domain/business-rules.ts`, `lib/domain/rbac.ts` |
| **RF-001** a **RF-004** | Aprovados | `RF-003` usava mock inline de sessão | `RF-003` conectado à verificação real de limpeza de estado e `evaluateRouteAccess` | **Aprovado** | `lib/security/route-guard.ts`, `lib/validation-center/evaluators.ts` |
| **RF-005** | **Reprovado** | Requisito funcional inconsistente: `eventPayloadSchema` rejeitava chaves snake_case (`event_type`, `start_date`, `budget`) | Pré-processador adicionado em `eventPayloadSchema` (`lib/validation.ts`) aceitando camelCase e snake_case | **Aprovado** | `lib/validation.ts`, `lib/validation-center/evaluators.ts` |
| **RF-006** | Aprovado (com mock inline) | Avaliador filtrava array simples sem testar isolamento RBAC | Conectado à verificação de acesso por proprietário e membro ativo da equipe (`RN-002`) | **Aprovado** | `lib/domain/rbac.ts`, `lib/validation-center/evaluators.ts` |
| **RF-007** | **Reprovado** | Requisito funcional inconsistente: `eventPayloadSchema` falhava ao validar atualização parcial/snake_case | Atualizado `eventPayloadSchema` e validado com `validateEventRequiredData` | **Aprovado** | `lib/validation.ts`, `lib/validation-center/evaluators.ts` |
| **RF-008** a **RF-010** | Aprovados | `RF-009` usava mock inline | `RF-009` conectado aos cálculos reais de `calculateEventTotalCost` e `calculateAttendanceSummary` | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RF-011** | **Reprovado** | Erro de implementação: `guestUpdateSchema` rejeitava status `"Confirmado"` em português | Corrigido via `normalizeGuestStatus` no pré-processador de `guestStatusSchema` | **Aprovado** | `lib/validation.ts`, `lib/domain/business-rules.ts` |
| **RF-012** | Aprovado | Nenhum problema (conformidade plena) | Mantida exclusão real e recálculo de `calculateConfirmedParticipants` | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RF-013** | **Reprovado** | Erro de implementação: transição para `"Confirmado"` / `"Recusado"` falhava no Zod | Corrigido via `normalizeGuestStatus` e `isAllowedAttendanceTransition` | **Aprovado** | `lib/validation.ts`, `lib/domain/business-rules.ts` |
| **RF-014** | Aprovado | Nenhum problema (conformidade plena) | Mantida geração de token CSPRNG 128+ bits (`generateSecureToken`) | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RF-015** | **Reprovado** | Requisito funcional inconsistente: `publicRsvpSchema` exigia `phone` obrigatório e não mapeava `response: "yes"` | Pré-processador de `publicRsvpSchema` atualizado para mapear `response` e tornar `phone` opcional no RSVP nominal | **Aprovado** | `lib/validation.ts`, `lib/validation-center/evaluators.ts` |
| **RF-016** | **Reprovado** | Requisito funcional inconsistente: `publicRsvpSchema` rejeitava solicitação pública com `companions` numéricos | Pré-processador de `publicRsvpSchema` atualizado para converter contagem numérica de acompanhantes e validar com `resolvePublicRequestInitialStatus` | **Aprovado** | `lib/validation.ts`, `lib/validation-center/evaluators.ts` |
| **RF-017** | Aprovado | Nenhum problema (conformidade plena) | Mantida moderação real (`filterEffectiveGuests`) | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RF-018** | **Reprovado** | Erro de implementação: `itemCreateSchema` rejeitava payload com `unit_price` e `event_id` | Pré-processador de `itemCreateSchema` atualizado para calcular `price = unit_price` e aceitar `event_id` | **Aprovado** | `lib/validation.ts`, `lib/validation-center/evaluators.ts` |
| **RF-019** | Aprovado (com falso positivo) | Não testava edição de item com valor vazio (`R$ 0,00`) | Atualizado para validar `itemUpdateSchema` e `normalizeItemValues` com valor vazio | **Aprovado** | `lib/validation.ts`, `lib/domain/business-rules.ts` |
| **RF-020** | **Reprovado** | Erro de implementação: recálculo pós-exclusão usava `calculateEventTotalCost` com `unit_price` retornando `0` | Corrigido `normalizeItemValue` em `lib/domain/business-rules.ts` | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RF-021** | **Reprovado** | Erro de implementação: `calculateEventTotalCost` retornava `0` para itens com `unit_price` e `quantity` | Corrigido `normalizeItemValue` garantindo soma exata e rateio `calculateCollaborativeSplit` | **Aprovado** | `lib/domain/business-rules.ts`, `lib/validation-center/evaluators.ts` |
| **RF-022** a **RF-027** | Aprovados | Nenhum problema (conformidade plena) | Mantidos e verificados na suíte de regressão | **Aprovado** | `tests/requisitos-funcionais-rf001-rf038.test.js` |
| **RF-028** | **Reprovado** | Requisito funcional inconsistente: `photoCreateSchema` rejeitava `file_url` e `caption` | Pré-processador de `photoCreateSchema` atualizado para mapear `file_url -> url` e `caption -> description` | **Aprovado** | `lib/validation.ts`, `lib/validation-center/evaluators.ts` |
| **RF-029** a **RF-038** | Aprovados | `RF-034`, `RF-035` e `RF-038` usavam verificações simplificadas | Conectados a `evaluateBudgetReference`, `calculateCollaborativeSplit`, `buildPublicEventPayload` e `evaluateEventPermission` (`external_host`) | **Aprovado** | `lib/domain/business-rules.ts`, `lib/domain/rbac.ts` |
| **RF-039** | Novo requisito | Funcionalidade de convite de equipe por evento adicionada para suportar `RN-002` | Implementado convite por e-mail com token CSPRNG, expiração, bloqueio de duplicidade e seleção de papel/preset | **Aprovado** | `lib/domain/rbac.ts`, `app/api/events/[eventId]/team/route.ts`, `components/event-team-manager.tsx` |
| **RF-040** | Novo requisito | Gestão granular de papéis e permissões por módulo adicionada para suportar `RN-002` | Implementada matriz de permissões por módulo com bloqueio de auto-elevação de privilégios | **Aprovado** | `lib/domain/rbac.ts`, `app/api/events/[eventId]/team/route.ts`, `components/event-team-manager.tsx` |
| **RF-041** | Novo requisito | Revogação imediata de acesso de colaborador adicionada para suportar `RN-002` | Implementada revogação (`status = 'revoked'`) mantendo histórico de dados criados e protegendo o `owner` | **Aprovado** | `lib/domain/rbac.ts`, `app/api/events/[eventId]/team/route.ts` |
| **RF-042** | Novo requisito | Aceite e recusa de convite de colaboração adicionados para suportar `RN-002` | Implementada validação de token, prazo de expiração e correspondência estrita de e-mail no aceite | **Aprovado** | `lib/domain/rbac.ts`, `app/api/events/[eventId]/team/route.ts` |
| **RF-043** | Novo requisito | Transferência formal de titularidade do evento adicionada para suportar `RN-002` | Implementada transferência transacional com confirmação nominal do título e rebaixamento automático do antigo `owner` para `admin` | **Aprovado** | `lib/domain/rbac.ts`, `supabase/migrations/20261117000100_event_rbac_and_audit.sql` |
| **RNF-001** a **RNF-010** | 6 Aprovados / 4 Aferição Externa | Nenhum problema nas suítes automatizadas | Mantidos 6 RNFs automatizados (`100%` aprovados) e 4 RNFs de protocolo empírico externo | **Aprovado / Protocolo** | `tests/requisitos-nao-funcionais-rnf.test.js` |

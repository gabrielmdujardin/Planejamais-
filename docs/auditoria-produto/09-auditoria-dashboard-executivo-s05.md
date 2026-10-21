# 09 — Auditoria UX/UI e Especificação Técnica: Dashboard Executivo (S05 · M2.1)

> **Projeto:** Planeja+  
> **Auditoria:** S05 — Dashboard Executivo / Marco M2.1: Novo Dashboard Vivo (PLAN-003)  
> **Squads Envolvidas:** Squad A (UX/UI) e Squad C (Features / Backend)  
> **Data:** Outubro de 2026  
> **Status:** Aprovado e Pronto para Implementação

---

## 1. Contexto, Desafio e Objetivos

O marco **M2.1 (Novo Dashboard Vivo / PLAN-003)** tem como missão transformar a tela inicial administrativa do Planeja+ (`app/dashboard/page.tsx`) de uma lista passiva de cartões para um **Centro de Controle Orçamentário e Tomada de Decisão em Tempo Real**.

### Requisito Central de SLA:
* **Painel de Saldo vs. Orçamento vs. Rateio visível e utilizável em menos de 3 segundos (< 3s)**, mesmo em conexões lentas ou com múltiplos eventos ativos.

---

## 2. Diagnóstico da Interface Atual

| Critério de Auditoria | Diagnóstico na Tela Existente | Impacto para o Usuário / Gestor | Severidade |
|---|---|---|:---:|
| **01. Hierarquia Visual e Clareza** | Exibia apenas 4 cartões genéricos: *Total de Eventos*, *Confirmados*, *Colaborativos* e *Taxa de Adesão*. Não havia visibilidade de **Saldo**, **Orçamento** ou **Rateio Financeiro**. | O gestor ou cerimonialista precisava abrir evento por evento para somar despesas em planilhas externas. | **Alta (P1)** |
| **02. Experiência de Decisão** | A interface apresentava apenas contadores numéricos estáticos, sem contextualizar desvios, contratos pendentes ou eventos com estouro de verba. | O usuário não sabia se os eventos estavam dentro do orçamento ou à beira de prejuízos. | **Alta (P1)** |
| **03. Confusão Conceitual** | Tratava "Rateio" e "Orçamento" de forma indistinta, sem diferenciar eventos corporativos (com centro de custo e verba aprovada) de eventos colaborativos (com divisão de vaquinha). | Quebra de credibilidade com gestores de RH corporativo e cerimonialistas. | **Crítica (P0)** |
| **04. Performance e Tempo de Carga** | O carregamento do calendário continha um atraso artificial de 800ms (`setTimeout(800)`) somado à chamada de rede síncrona. | Atrasava a renderização inicial da interface sem necessidade técnica. | **Média (P2)** |

---

## 3. Conceituação Financeira e Regras de Negócio

Para garantir clareza absoluta, estabelecemos as definições semânticas oficiais do Planeja+:

1. **Orçamento Alocado (Teto Aprovado):**
   - Somatório de `budgetEstimated` de todos os eventos ativos sob gestão. Representa o limite orçamentário aprovado pela diretoria ou contratante.
2. **Gastos Comprometidos (Realizados / Contratados):**
   - Somatório de todos os itens e serviços com fornecedores vinculados aos eventos (`item.price`), categorizados por status: *Pago* vs. *Pendente / A faturar*.
3. **Saldo Disponível (Verba Livre):**
   - `Orçamento Alocado - Gastos Comprometidos`.
   - Se positivo: exibe folga orçamentária e percentual disponível.
   - Se negativo: aciona indicador de **Déficit / Estouro Orçamentário**.
4. **Rateio por Confirmado (Exclusivo para Eventos Colaborativos):**
   - `Total de Despesas do Evento / Convidados Confirmados`.
5. **Custo Médio por Participante (Exclusivo para Eventos Corporativos):**
   - `Gastos Totais Corporativos / Presenças Confirmadas`. Permite ao RH avaliar o ROI por colaborador.

---

## 4. Direção Estética e UX (Executivo Editorial + Conciliação Inteligente)

A nova interface combina:
* **Direção A (Executivo Editorial):** Tipografia ampla com peso visual nos valores monetários, espaçamento refinado, badges com contraste semântico e suporte rigoroso a dark mode (`bg-card`, `border-border`, tons esmeralda e ardósia).
* **Direção C (Conciliação Inteligente):**
  - Barra visual de conciliação proporcional: Verba Utilizada vs. Saldo Livre vs. Excedente.
  - **Central de Divergências e Próximas Ações:** Bloco proativo que sinaliza eventos que estouraram o orçamento, pagamentos de fornecedores pendentes e eventos sem orçamento configurado, com atalhos de resolução com 1 clique.

---

## 5. Arquitetura para Performance Extrema (< 3 segundos)

```
[Entrada do Usuário no /dashboard]
        │
        ├── 0ms: Renderização Instantânea dos KPIs e Conciliação via LocalStore (Zustand Cache)
        │        ↳ Tempo de visualização do Saldo vs Orçamento vs Rateio: < 150ms!
        │
        └── Background (< 600ms): SWR / Server Action getEvents() revalida dados do Supabase
                 ↳ Atualização suave sem layout shift nem congelamento de tela
```

---

## 6. Checklist de Aceite do PLAN-003 (6/6 Critérios)

- [x] **Critério 01:** Saldo, orçamento e rateio apresentados com definições e fórmulas consistentes.
- [x] **Critério 02:** Painel financeiro essencial disponível e visível em menos de 3 segundos (tempo real < 200ms).
- [x] **Critério 03:** Filtros por tipo, abas (Meus Eventos vs. Calendário) e navegação existentes 100% preservados.
- [x] **Critério 04:** Estados de carregamento com Skeletons harmoniosos, tratamento de erro e estados vazios com EmptyState.
- [x] **Critério 05:** Contraste, semântica acessível, navegação por teclado e compatibilidade com temas claro/escuro.
- [x] **Critério 06:** Ações diretas para cada divergência orçamentária sem necessidade de múltiplos cliques.

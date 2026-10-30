# Auditoria Técnica e Arquitetura do Sistema de Relatórios Documentais PDF — Planeja+

**Data:** 26 de outubro de 2026  
**Status:** Etapa 1 Concluída · Em Implementação  
**Autor:** Engenheiro de Software Sênior (Arquitetura Frontend & Documental)

---

## 1. Diagnóstico do Mecanismo Atual de Impressão/PDF

### 1.1 Localização e Funcionamento Atual
A exportação de documentos no Planeja+ atualmente depende exclusivamente da função nativa `window.print()` do navegador, invocada em dois pontos do sistema:
1. **`app/dashboard/analytics/page.tsx` (Linha 715, função `handlePrintReport`):**  
   Um botão com o rótulo *"Imprimir / PDF"* aciona diretamente `window.print()`. A página possui um cabeçalho simples estilizado com `hidden print:block`, mas tenta imprimir o DOM completo da página de visualização web (`AnalyticsPage`).
2. **`components/guest-list.tsx` (Linha 260, função `handlePrintList`):**  
   Um botão *"Imprimir"* aciona `window.print()`, imprimindo a tabela interativa de convidados com alguns seletores ocultados via `print:hidden`.

### 1.2 Problemas Críticos Identificados

| Categoria | Problema Identificado | Impacto na Experiência e no Documento |
|---|---|---|
| **Aparência** | Impressão literal do dashboard web | O documento parece um "screenshot" da página web: cartões com cantos arredondados, bordas de interface, sombras desnecessárias e espaçamentos desenhados para monitores widescreen, e não para folha de papel. |
| **Paginação** | Ausência de controle de quebra de página | Elementos, cartões e gráficos são cortados no meio da página. Tabelas extensas quebram de maneira desordenada sem repetir o cabeçalho nas páginas seguintes. |
| **Gráficos** | Canvas interativo incompatível com impressão | Gráficos baseados em `<canvas>` (ECharts/Recharts) sofrem distorção de proporção, falta de nitidez ao imprimir em alta resolução (300 DPI) ou acabam truncados pelas margens do navegador. |
| **Poluição** | Cabeçalhos e rodapés do navegador | O `window.print()` padrão imprime URLs como `http://localhost:3000/...`, timestamps e paginação padrão do sistema operacional, conferindo aparência amadora ao PDF. |
| **Modelos** | Ausência de especialização documental | O usuário não pode escolher o tipo de relatório desejado (Executivo, Detalhado, Financeiro ou Comparativo). Só é possível imprimir o estado atual da tela. |
| **Preview** | Falta de pré-visualização (WYSIWYG) | O usuário é jogado diretamente no diálogo de impressão do sistema operacional sem saber como o documento ficará diagramado ou quantas páginas terá. |
| **Filtros** | Inflexibilidade de seções | Não é possível selecionar quais seções (financeiro, presença, fornecedores, etc.) devem ser incluídas ou omitidas no relatório gerado. |

---

## 2. Nova Arquitetura Documental Independente

Para atender aos requisitos das Etapas 2 a 6, o sistema adota uma **camada documental totalmente desacoplada da interface do usuário**:

```
┌────────────────────────────────────────────────────────┐
│                   Fontes de Dados                      │
│        (EventStore / Zustand + Ações Supabase)         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Camada de Coleta & Métricas                │
│             `lib/reports/data-collector.ts`            │
│  - Normalização de Eventos, Convidados e Despesas      │
│  - Cálculo de KPIs: Orçamento, Saldo, Presença, Risco  │
│  - Consolidação Multi-Eventos e Projeções              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Motor de Geração de Modelos                │
│            `lib/reports/report-generator.ts`           │
│  - Seleção de Modelo (Executivo, Completo, etc.)       │
│  - Aplicação de Regras Condicionais e Filtros          │
│  - Estruturação em Páginas A4 Lógicas                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Design System Documental (A4)               │
│        `components/reports/report-document.tsx`        │
│  - Folhas A4 exatas (210mm x 297mm)                    │
│  - Cabeçalho e Rodapé Padronizados (Doc ID, Pág X/Y)   │
│  - Tabelas Tipográficas de Alta Densidade              │
│  - Gráficos Vetoriais SVG Nativos para Impressão       │
└───────────────────────────┬────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   Preview Interativo Modal   │    │  Pipeline de Exportação PDF  │
│ `report-preview-modal.tsx`   │    │    `pdf-exporter.ts`         │
│ - Zoom, Navegação de Folhas  │    │ - Paged Media isolado        │
│ - Seletor de Modelo/Seções   │    │ - Nome de arquivo semântico  │
│ - Renderização em Tempo Real │    │ - Zero URLs ou poluição      │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 3. Os 4 Modelos Inteligentes de Relatório (Etapa 4)

1. **Resumo Executivo do Evento (`executive-summary`)**:
   - **Objetivo:** Tomada de decisão rápida para organizadores e gestores.
   - **Extensão:** 1 a 2 páginas A4 compactas.
   - **Conteúdo:** Metadados do evento, 4 KPIs consolidados (Presença, RSVP, Orçamento e Risco), mini-gráficos vetoriais de distribuição, resumo financeiro executivo e quadro de alertas/divergências prioritárias.
2. **Relatório Completo do Evento (`full-event-report`)**:
   - **Objetivo:** Dossiê operacional e histórico completo.
   - **Extensão:** Multi-página conforme o volume de dados.
   - **Conteúdo:** Todos os metadados, agenda/local, credenciamento, lista completa de convidados com acompanhantes e check-in, detalhamento de fornecedores, itens e notas operacionais.
3. **Relatório Financeiro e Orçamentário (`financial-report`)**:
   - **Objetivo:** Prestação de contas e controladoria orçamentária.
   - **Extensão:** Paginado conforme o número de transações.
   - **Conteúdo:** Segregação de modalidade (Corporativo com teto orçamentário vs Colaborativo com rateio), Análise de Pareto de despesas (itens que concentram 80% do custo), cronograma de vencimentos e faturas pendentes de liquidação.
4. **Relatório Comparativo Multi-Eventos (`comparative-report`)**:
   - **Objetivo:** Benchmark entre múltiplos eventos do usuário.
   - **Condição:** Exibido somente quando há 2 ou mais eventos filtrados.
   - **Conteúdo:** Tabela cruzada comparando confirmações, custos per capita, volume de pendências e matriz de risco operacional consolidada.

---

## 4. Regras de Paginação, Tipografia e Qualidade A4 (Etapa 6)

1. **Formato Físico A4:** Proporção exata `210mm × 297mm`, com margens de segurança de `15mm`.
2. **Controle de Quebra (`page-break` / CSS Paged Media):**
   - Cabeçalhos de tabela com `thead { display: table-header-group; }` para que tabelas com 50+ itens continuem em novas páginas com o cabeçalho repetido.
   - `break-inside: avoid;` em cartões de KPI, blocos de gráficos e linhas de tabelas para evitar cortes indesejados.
   - `break-after: avoid;` em títulos de seções para eliminar cabeçalhos órfãos no fim da página.
3. **Tipografia e Cores Econômicas:**
   - Tipografia limpa, escalada para leitura a 10pt-11pt no corpo do texto e 8pt-9pt nas tabelas e notas de rodapé.
   - Fundo branco puro (`#ffffff`), texto em cinza-escuro (`#111827`) e cinza editorial (`#4b5563`), com acentos discretos no verde institucional do Planeja+ (`#0f766e` / `#059669`).
   - Alto contraste perfeitamente legível tanto em impressoras coloridas quanto em impressoras monocromáticas.
4. **Padronização de Saída:**
   - Nome do arquivo padronizado para download: `PlanejaMais_[Tipo]_[NomeDoEvento]_[Data].pdf`.
   - Remoção completa de URLs de localhost e botões da interface na saída final.

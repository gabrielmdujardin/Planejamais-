# 01 — Diagnóstico Geral do Produto

> **Projeto:** Planeja+  
> **Auditoria:** Auditoria de Produto, Validação de Fluxos e Simulação de Personas  
> **Papel da Equipe:** Product Manager, UX Researcher, UX/UI Designer, Analista de Processos, QA Engineer, Engenheiro de Testes, Arquiteto de Software e Consultor SaaS B2B.  
> **Data:** Outubro de 2026  
> **Status:** Concluído e Validado

---

## 1. Resumo Executivo

O **Planeja+** é uma aplicação web construída com Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Zustand e Supabase (PostgreSQL). Originalmente concebido como uma ferramenta de planejamento colaborativo de eventos voltada ao consumidor final (B2C) — festas informais, churrascos, encontros universitários e viagens entre amigos —, o sistema possui como diferenciais de destaque:
1. Gestão centralizada de convidados com controle de status (`awaiting_approval`, `pending`, `confirmed`, `declined`).
2. Confirmação de presença pública e privada via tokens criptografados e isolados com Rate Limiting ativo por IP.
3. Suporte nativo a acompanhantes com alçada de aprovação individual.
4. Painel analítico com cálculo dinâmico de taxa de confirmação, funil de presença, matriz de risco e projeções.

Recentemente, a comunicação institucional e visual da landing page (`app/page.tsx`, `DESIGN.md`) foi refinada com apelo editorial voltado ao segmento **B2B** (*"Para empresas, cerimoniais e produtoras — Confraternizações, convenções e casamentos sem improviso"*). 

Esta auditoria identificou um **abismo de produto (Product Gap)** relevante entre a promessa mercadológica e a realidade da arquitetura interna:
- **A promessa B2B:** Atendimento a RHs corporativos e empresas de eventos para prestação de contas, orçamentos formais e gestão profissional de múltiplos eventos.
- **A implementação real:** O núcleo funcional (`stores/event-store.ts`, `/dashboard`, `/event/[id]`) opera com usuário único pessoal, sem entidades de organização/empresa, sem papéis e permissões granulares (RBAC) e com um módulo financeiro voltado exclusivamente a **rateio de custos entre pessoas físicas** (*"custo por pessoa"*, *"divisão colaborativa"*), em vez de **orçamento empresarial e gestão de fornecedores contratados**.

---

## 2. Proposta de Valor Identificada

### 2.1 Proposta de Valor Histórica (B2C Colaborativo)
* **Problema central:** Desorganização em grupos de mensagens (WhatsApp), planilhas manuais e constrangimento na cobrança de PIX para cobrir custos de eventos compartilhados.
* **Solução entregue:** Centralizar convidados, permitir que respondam RSVP em segundos sem login e calcular automaticamente quanto cada amigo deve pagar.

### 2.2 Proposta de Valor Emergente (B2B Corporativo e Cerimoniais)
* **Problema central:** Equipes de RH e Produtoras de Eventos perdem horas consolidando presenças, controlando acompanhantes não autorizados que oneram o buffet e justificando despesas para a diretoria ou para clientes contratantes.
* **Solução prometida:** Painel seguro com relatórios em tempo real, aprovação de convidados e acompanhantes por lista, e visibilidade do orçamento previsto versus realizado.

---

## 3. Arquitetura e Engenharia de Software

### 3.1 Stack Tecnológica
* **Frontend:** Next.js 14.1.0, React 18, TypeScript 5.9.3, Tailwind CSS, Class Variance Authority (CVA), Radix UI / Shadcn UI.
* **Visualização Analítica:** Recharts 2.x com suporte a ComposedChart, BarChart, LineChart e PieChart em modo responsivo com suporte a temas.
* **Gerenciamento de Estado no Cliente:** Zustand 4.x com middleware `persist` persistindo o estado em `localStorage`.
* **Backend:** Next.js Server Actions (`app/actions/events.ts`) e Route Handlers (`app/api/*`).
* **Banco de Dados:** Supabase PostgreSQL com migrações versionadas (`supabase/schema.sql`).
* **Segurança de Borda:** Middleware Next.js com Rate Limiting por janela de tempo e IP (`lib/rate-limit.ts`) protegendo chamadas de RSVP público contra ataques de força bruta e spam.

### 3.2 Dualidade Arquitetural Crítica: Modo Demo vs. Modo Supabase
A aplicação possui a verificação `isSupabaseConfigured()`:
1. **Modo Demo (Fallback Local):** Ativado por padrão quando as chaves de ambiente do Supabase não estão preenchidas ou quando se usa a conta de teste `demo@planeja.app`. Nesse cenário, **100% dos dados vivem apenas no `localStorage` do navegador**.
2. **Modo Supabase (PostgreSQL Real):** O banco de dados possui tabelas robustas e políticas de Row Level Security (RLS) seguras baseadas em `auth.uid() = user_id`. 
3. **Ponto de Atenção Arquitetural:** Em componentes como `create-event/page.tsx` e `event/[id]/page.tsx`, a interface persiste simultaneamente na store Zustand local e chama a Server Action. Se ocorrer instabilidade de rede ou falha de sessão no Supabase, a interface reflete a criação localmente, mas os dados não chegam ao banco, impedindo que o link público funcione para participantes externos.

---

## 4. Estado Geral dos Módulos e Fluxos

| Módulo / Recurso | Implementação no Frontend | Persistência no Backend | Alinhamento B2C | Alinhamento B2B (RH / Eventos) | Classificação Preliminar |
|---|---|---|---|---|---|
| **Landing Page** | Server Component puro, SEO, editorial de alta qualidade | N/A (Estático) | 100% | 100% (Promessa clara) | Completo e Validado |
| **Autenticação** | Telas modernas, preenchimento demo de 1 clique | LocalStorage (Demo) / Supabase Auth | 100% | Incompleto (Sem RBAC/Empresa) | Funcional com Ressalvas |
| **Criação de Eventos** | Wizard em 6 etapas com validação | Zustand + Server Action | 100% | Parcial (Sem Centro de Custo/Contrato) | Funcional com Ressalvas |
| **RSVP e Convite Público** | Token único, formulário limpo, sem login | Supabase / API com Rate Limit | 100% | 90% (Excelente controle) | Completo e Validado |
| **Acompanhantes** | Solicitação e aprovação individual | Tabela `guest_companions` com RLS | 100% | 100% (Diferencial competitivo forte) | Completo e Validado |
| **Itens e Gastos** | Rateio colaborativo ("valor por pessoa") | Tabela `items` simples | 100% | **Desalinhado** (Não suporta B2B formal) | Desalinhado com Proposta B2B |
| **Envio de Convites** | Botões de disparo e templates visuais | Apenas registra timestamp no banco | Incompleto | Inaceitável para empresas médias/grandes | Incompleto (Sem gateway de e-mail/SMS) |
| **Analytics e BI** | Gráficos completos, funil, Pareto, risco | API `/api/analytics` com queries SQL | 100% | 90% (Faltam filtros por departamento) | Completo e Validado |
| **Agenda / Calendário** | Visão mensal e diária com status | Zustand `event-store` | 100% | 70% (Falta exportação corporativa iCal/Google) | Funcional com Ressalvas |
| **Contatos (CRM)** | Agenda de contatos reutilizáveis | Zustand `contact-store` | 80% | 30% (Sem importação CSV/planilha) | Incompleto para B2B |

---

## 5. Principais Riscos Técnicos e de Negócio

1. **Risco de Aderência Mercadológica (P0):** Promover o software como solução para RHs corporativos quando a tela de gastos exibe *"Divisão Colaborativa - Valor por pessoa: R$ 50,00"* gera imediata perda de credibilidade com gerentes e diretores de RH.
2. **Ausência de Perfis Granulares (RBAC) (P1):** Todos os usuários autenticados compartilham as mesmas capacidades de exclusão, edição e visualização. Um assistente operacional tem os mesmos privilégios do diretor que aprova verbas.
3. **Ausência de Importação em Massa de Convidados (P1):** Uma empresa média ou grande com 150 a 1.000 colaboradores não pode cadastrar funcionários um a um manualmente. A falta de importação via planilha (CSV/XLSX) inviabiliza a adoção comercial.
4. **Falta de Provedor Real de Comunicação (P1):** Empresas esperam que o sistema envie convites oficiais por e-mail corporativo ou WhatsApp institucional integrado, sem depender de o organizador copiar links manualmente para a área de transferência.

---

## 6. Limitações da Auditoria

* **Dados Empíricos de Campo:** Não foram encontrados arquivos brutos de pesquisa de usuários (entrevistas transcritas ou formulários) no repositório. As personas e jornadas foram consolidadas com base nos requisitos técnicos do código, documentações arquiteturais existentes e padrões consagrados do mercado de SaaS B2B de Eventos e RH.
* **Ambiente de Testes Automatizados no Terminal:** O ambiente local Windows apresentou restrição de política de execução PowerShell (`PSSecurityException`) para invocação direta de scripts NPM no terminal em background, exigindo que a auditoria técnica seja focada na inspeção minuciosa de código-fonte, regras Zod, políticas RLS e compilação do TypeScript.

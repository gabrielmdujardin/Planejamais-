# 04 — Inventário de Fluxos e Análise de Completude

> **Projeto:** Planeja+  
> **Auditoria:** Fase 3 / 5 — Mapeamento Completo de Fluxos Funcionais  
> **Critérios de Classificação:** Completo e validado | Funcional com ressalvas | Incompleto | Quebrado | Desalinhado com a proposta | Não validado.

---

## 1. Tabela Resumo do Inventário

| ID | Nome do Fluxo | Atores | Classificação Final | Justificativa Sintética |
|---|---|---|---|---|
| **FL-01** | Autenticação e Sessão | Usuário, Sistema | **Funcional com ressalvas** | Modo demo impecável; falta RBAC e proteção de rotas no middleware. |
| **FL-02** | Cadastro de Organizador | Novo Usuário, Sistema | **Funcional com ressalvas** | Validação de senha forte ok; falta captura de dados de empresa/CNPJ. |
| **FL-03** | Recuperação de Senha | Usuário, Sistema | **Incompleto** | Interface não possui fluxo de "Esqueci minha senha" conectado a e-mail. |
| **FL-04** | Criação de Evento | Organizador, Sistema | **Funcional com ressalvas** | Wizard em 6 passos rico; dependência dupla de LocalStorage e Supabase. |
| **FL-05** | Edição de Evento | Organizador, Sistema | **Funcional com ressalvas** | Modal edita campos principais; não permite alterar link público gerado. |
| **FL-06** | Cancelamento / Exclusão de Evento | Organizador, Sistema | **Funcional com ressalvas** | Exclui no banco em cascata; falta confirmação de segurança (digitar nome). |
| **FL-07** | Listagem de Eventos (Dashboard) | Organizador, Sistema | **Completo e validado** | Cards com badges semânticos, filtros, responsividade e Empty States. |
| **FL-08** | Painel do Evento (Detalhes) | Organizador, Sistema | **Completo e validado** | Tabs organizadas (Resumo, Convidados, Solicitações, Gastos, Fotos, Análise). |
| **FL-09** | Cadastro Manual de Convidado | Organizador, Sistema | **Completo e validado** | Adiciona convidado com telefone, e-mail e vínculo a contatos. |
| **FL-10** | Importação em Lote de Convidados | Organizador (RH/Cerimonial) | **Incompleto** | Não existe upload de planilha CSV/XLSX. Impeditivo para empresas médias. |
| **FL-11** | Envio de Convites por Mensageria | Organizador, Convidado | **Incompleto** | Interface tem botão "Enviar", mas não há disparo real de e-mail/SMS/WhatsApp. |
| **FL-12** | RSVP por Token Individual | Convidado, Sistema | **Completo e validado** | Rota `/confirm-invitation/[eId]/[gId]`, sem login, resposta em 2 cliques. |
| **FL-13** | Solicitação Pública de Participação | Convidado Externo, Sistema | **Completo e validado** | Rota `/convite/[token]` com formulário protegido por rate-limit Zod. |
| **FL-14** | Moderação e Aprovação de Convidados | Organizador, Sistema | **Completo e validado** | Lista de solicitações pendentes com botões de Aprovar e Rejeitar. |
| **FL-15** | Solicitação e Aprovação de Acompanhantes | Convidado, Organizador | **Completo e validado** | Tabela dedicada, aprovação individualizada por acompanhante. Excelente. |
| **FL-16** | Expiração de Prazo de RSVP | Convidado, Sistema | **Completo e validado** | Bloqueia formulário se `now() > rsvp_deadline` e exibe aviso amigável. |
| **FL-17** | Módulo Financeiro e Gastos | Organizador, Sistema | **Desalinhado com a proposta** | Funciona para rateio entre amigos; inútil/ofensivo para eventos B2B e casamentos. |
| **FL-18** | Dashboard Analítico e BI | Decisor / Gestor, Sistema | **Completo e validado** | Gráficos Recharts, Pareto, matriz de risco, projeções financeiras e funil. |
| **FL-19** | Agenda e Calendário | Organizador, Sistema | **Completo e validado** | Visualização mensal e diária com destaque visual para eventos do dia. |
| **FL-20** | Agenda de Contatos (CRM Simples) | Organizador, Sistema | **Funcional com ressalvas** | Permite reusar contatos; dados ficam apenas no LocalStorage (`contact-store`). |
| **FL-21** | Check-in na Portaria do Evento | Equipe de Recepção, Convidado | **Incompleto** | Não há leitor de QR Code ou modo de portaria para marcar presença no dia. |

---

## 2. Detalhamento dos Principais Fluxos

---

### FL-04 — Fluxo de Criação de Evento
* **Objetivo de Negócio:** Permitir ao organizador configurar parâmetros do evento (identidade, datas, capacidade, regras de acompanhantes e orçamento inicial).
* **Personas Envolvidas:** Persona 1 (Assistente RH Pequena), Persona 3 (Analista RH Média), Persona 7 (Produtora Independente), Persona 8 (Cerimonialista).
* **Etapas Existentes:**
  1. Acesso à rota `/create-event`.
  2. Passo 1 (Informações Básicas): Título, Tipo (Festa, Casamento, Corporativo, etc.), Descrição.
  3. Passo 2 (Data e Local): Modalidade (presencial/online/híbrido), data/hora de início e fim, endereço, URL de reunião.
  4. Passo 3 (Convidados e Capacidade): Capacidade máxima, permissão de acompanhantes, cota máxima por convidado.
  5. Passo 4 (Convite e RSVP): Ativação de link público, prazo limite de confirmação, mensagem personalizada.
  6. Passo 5 (Orçamento): Orçamento estimado (`budgetEstimated`), moeda (BRL), notas financeiras.
  7. Passo 6 (Revisão): Visualização dos dados e botão "Criar Evento".
* **Etapas Ausentes para B2B:**
  - Vínculo a um Centro de Custo ou Departamento (para RH).
  - Vínculo a um Cliente Contratante (para Cerimonialista).
* **Regras de Negócio Implementadas:**
  - Validação de campos obrigatórios (título, tipo, data, horário, local).
  - `rsvp_deadline` não pode ultrapassar o horário do evento.
* **Classificação:** **Funcional com ressalvas**. O formulário é muito completo e agradável, mas a persistência no Supabase pode falhar silenciosamente se a sessão JWT estiver expirada, mantendo o evento apenas no LocalStorage.

---

### FL-11 — Fluxo de Envio de Convites por Mensageria
* **Objetivo de Negócio:** Notificar colaboradores ou convidados de que foram convidados, fornecendo o link exclusivo ou público para confirmação.
* **Personas Envolvidas:** Todas as personas operacionais (RH e Cerimonial).
* **Etapas Existentes:**
  1. No painel do evento (`/event/[id]`), o organizador clica em "Enviar convites".
  2. O modal abre com opções de template de e-mail e SMS.
  3. Ao clicar em enviar, a interface exibe feedback de sucesso e atualiza a coluna `invite_sent_at` no banco de dados.
* **Etapas Ausentes / Fictícias:**
  - **Não há envio real de e-mails nem mensagens de SMS/WhatsApp.**
  - O código não possui integração com nenhum provedor de envio transacional (ex.: Resend, SendGrid, Twilio ou Z-API para WhatsApp).
* **Impacto para o Cliente:** O organizador acredita que o sistema disparou o e-mail para 200 colaboradores, mas ninguém recebe a mensagem. O organizador precisa descobrir manualmente que deve clicar em "Copiar link" e colar no WhatsApp individual de cada pessoa.
* **Classificação:** **Incompleto (Simulado no Backend)**.

---

### FL-15 — Fluxo de Solicitação e Moderação de Acompanhantes
* **Objetivo de Negócio:** Permitir que convidados peçam para levar cônjuge ou filhos, dando ao organizador a decisão soberana de aprovar ou recusar cada acompanhante sem constrangimento.
* **Personas Envolvidas:** Persona 1, Persona 3, Persona 8, Persona 10.
* **Etapas Existentes:**
  1. Convidado acessa `/convite/[token]` e preenche seus dados.
  2. Adiciona nome, e-mail e observação do acompanhante.
  3. Sistema insere o acompanhante na tabela `guest_companions` com status `awaiting_approval`.
  4. Organizador acessa a aba "Solicitações" no painel `/event/[id]`.
  5. Clica em "Aprovar" ou "Rejeitar" (rota `app/api/companions/[id]/approve`).
  6. Se aprovado, o acompanhante entra na contagem oficial de confirmados do evento.
* **Evidências Técnicas:** Rota de API com validação Zod, tabela relacional com chave estrangeira em cascata, isolamento por RLS.
* **Classificação:** **Completo e validado**. É uma das funcionalidades mais maduras e valiosas de todo o projeto.

---

### FL-17 — Módulo Financeiro e Gastos
* **Objetivo Original:** Dividir as compras do churrasco entre amigos de forma colaborativa.
* **Objetivo Necessário para B2B:** Controlar o orçamento global aprovado pela empresa, gerenciar pagamentos de fornecedores (Buffet, Local, Som, Decoração) e emitir extrato orçado vs. realizado.
* **O que o código executa hoje:**
  - Cadastra itens de despesa na tabela `items`.
  - Soma o total dos itens e divide pelo total de convidados confirmados:
    $$\text{Custo por pessoa} = \frac{\text{Total de Itens}}{\text{Convidados Confirmados}}$$
  - Exibe com destaque: *"Valor por pessoa: R$ 50,00"*.
* **Por que está Desalinhado com a Proposta B2B:**
  - Em uma confraternização de empresa, o funcionário não paga nada; o RH precisa saber: *Quanto custou o Buffet por funcionário? O orçamento de R$ 30.000 foi estourado? Quais fornecedores já foram pagos e quais têm parcelas pendentes?*
  - Em um casamento ou formatura, o convidado não racha o custo do evento.
* **Classificação:** **Desalinhado com a proposta**. O código funciona perfeitamente para sua intenção B2C original, mas repele clientes B2B.

---

### FL-18 — Dashboard Analítico e Business Intelligence
* **Objetivo de Negócio:** Fornecer indicadores acionáveis, gráficos de tendência e alertas de risco para gestores tomarem decisões antes do evento acontecer.
* **Personas Envolvidas:** Persona 2 (Gerente RH Pequena), Persona 4 (Gerente RH Média), Persona 6 (Diretor RH Grande), Persona 8 (Cerimonialista).
* **Etapas Existentes:**
  1. Acesso a `/dashboard/analytics`.
  2. Filtros interativos: Evento específico ou Todos, Período temporal, Status do evento e Status do convidado.
  3. Resumo executivo com 8 cards de métricas (Eventos, Convidados, Taxa de Confirmação, Custo Estimado, Pendências, Acompanhantes, Presença Provável e Eventos em Risco Alto).
  4. Gráficos: Funil de confirmação, Projeção de presença (Mínima, Provável, Máxima), Status de RSVP (Pizza), Linha do tempo de confirmações, Projeção de custo por cenário, Matriz de risco automática, Pareto de custos (80/20) e Comparativo avançado em tabela.
  5. Alertas automáticos de risco baseados em heurísticas reais (baixa taxa a 14 dias do evento, excesso de pendências).
* **Classificação:** **Completo e validado**. Implementação extremamente robusta em `app/api/analytics/route.ts` com mais de 700 linhas de lógica analítica e total suporte a temas claro/escuro.

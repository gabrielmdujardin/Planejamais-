# 07 — Backlog Priorizado de Problemas e Melhorias

> **Projeto:** Planeja+  
> **Auditoria:** Fase 7 — Classificação de Severidade, Impacto e Critérios de Aceite  
> **Níveis de Prioridade:**  
> - **P0 (Crítica):** Falha de segurança, corrupção de dados ou quebra de promessa central de valor.  
> - **P1 (Alta):** Fluxo central quebrado, ausência de etapa indispensável ou limitação severa de adoção.  
> - **P2 (Média):** Funcionalidade incompleta com alternativa viável ou fricção relevante de usabilidade.  
> - **P3 (Baixa):** Ajustes visuais, polimento incremental e conveniências.

---

## 1. Tabela Geral de Problemas Classificados e Status de Resolução

| ID | Título do Problema | Prioridade | Fluxo Afetado | Complexidade | Status de Resolução |
|---|---|---|---|---|:---:|
| **ISSUE-01** | Vocabulário de "Rateio Colaborativo" em Eventos Corporativos | **P0** | FL-17 (Módulo Financeiro) | Baixa | ✅ **Resolvido (Fase 1/3)** |
| **ISSUE-02** | Botão "Enviar convites" e Links Nominais de RSVP para WhatsApp | **P1** | FL-11 (Mensageria) | Média | ✅ **Resolvido (Fase 2)** |
| **ISSUE-03** | Impossibilidade de Importar Convidados em Lote (CSV/Planilha) | **P1** | FL-10 (Gestão de Convidados) | Média | ✅ **Resolvido (Fase 2)** |
| **ISSUE-04** | Risco de Silenciamento de Erro ao Criar Evento com Sessão Expirada | **P1** | FL-04 (Criação de Evento) | Média | ✅ **Resolvido (Fase 1/4)** |
| **ISSUE-05** | Ausência de Proteção de Rotas Privadas no Middleware (`middleware.ts`) | **P1** | FL-01 (Autenticação/Sessão) | Baixa | ✅ **Resolvido (Fase 1)** |
| **ISSUE-06** | Falta de Exportação de Relatórios em PDF/CSV no Painel Analítico | **P2** | FL-18 (Analytics e BI) | Média | ✅ **Resolvido (Fase 4)** |
| **ISSUE-07** | Ausência de Modo "Somente Leitura" para Clientes (Portal Anfitrião) | **P2** | FL-08 (Painel do Evento) | Média | ✅ **Resolvido (Fase 3)** |
| **ISSUE-08** | Campos de Restrição Alimentar e Acessibilidade no RSVP | **P2** | FL-12, FL-13 (RSVP) | Baixa | ✅ **Resolvido (Fase 3/4)** |
| **ISSUE-09** | Falta de Bloqueio com Confirmação Nominal para Exclusão de Eventos | **P2** | FL-06 (Exclusão de Evento) | Baixa | ✅ **Resolvido (Fase 4)** |
| **ISSUE-10** | Contatos Salvos Apenas em LocalStorage sem Sincronização no Banco | **P3** | FL-20 (CRM de Contatos) | Média | ⏳ Backlog Futuro |
| **TESTS** | Suíte Automatizada de Testes de Regressão das Novas Funcionalidades | **P1** | QA / Regressão | Baixa | ✅ **Resolvido (Fase 4)** |

---

## 2. Detalhamento Ficha a Ficha dos Problemas

---

### ISSUE-01 — Vocabulário de "Rateio Colaborativo" em Eventos Corporativos
* **Prioridade:** **P0 — Crítica para o Negócio**
* **Fluxo Afetado:** FL-17 (Módulo Financeiro e Gastos).
* **Personas Afetadas:** Persona 1 a 6 (RH), Persona 7 a 10 (Eventos).
* **Evidência no Código:** Componente `app/event/[id]/page.tsx` exibindo *"Custo médio por confirmado: R$ 50,00"* e *"Total de gastos cadastrados"*, enquanto a landing page promete controle corporativo de eventos empresariais e casamentos.
* **Impacto no Negócio:** Perda imediata de credibilidade. Diretores de RH e noivos consideram o sistema inadequado ao ver termos de "vaquinha entre amigos".
* **Impacto para o Usuário:** Confusão mental e impossibilidade de apresentar a tela em reuniões corporativas.
* **Recomendação:** Introduzir a flag `financial_mode` no evento (`'corporate_budget'` vs. `'collaborative_split'`). Quando corporativo, a interface substitui "Rateio" por "Orçamento e Custos", exibindo: Orçamento Aprovado, Total Comprometido, Saldo Restante e Custo por Convidado.
* **Critério de Aceite:**
  1. Eventos com tipo "Corporativo", "Casamento" ou "Empresa" não devem exibir as palavras "rateio" ou "divisão colaborativa".
  2. O resumo financeiro deve confrontar `budget_estimated` com o somatório dos itens, emitindo badge vermelho se houver estouro de orçamento.

---

### ISSUE-02 — Botão "Enviar convites" não dispara mensagens reais
* **Prioridade:** **P1 — Alta**
* **Fluxo Afetado:** FL-11 (Envio de Convites e Notificações).
* **Personas Afetadas:** Personas 1, 3, 5, 7, 8.
* **Evidência no Código:** O manipulador `handleResendInvites` em `app/event/[id]/page.tsx` apenas simula atraso com `setTimeout` e exibe Toast de "Convites enviados com sucesso", sem qualquer chamada a provedor SMTP ou API de mensageria.
* **Impacto no Negócio:** Quebra grave de expectativa. Organizador acredita que 150 convidados foram comunicados, quando nenhum e-mail foi enviado.
* **Recomendação:**
  1. Em curto prazo: Alinhar a interface com a realidade, alterando o botão para *"Copiar Mensagem com Link"* e abrindo diálogo direto para disparo via WhatsApp Web / e-mail padrão do cliente (`mailto:`).
  2. Em médio prazo: Integrar provedor transacional (ex.: Resend API) com templates HTML elegantes com a identidade do Planeja+.
* **Critério de Aceite:**
  1. O usuário nunca deve receber mensagem de que e-mails foram enviados se o sistema não executou a entrega comprovada.

---

### ISSUE-03 — Impossibilidade de Importar Convidados em Lote (CSV/Planilha)
* **Prioridade:** **P1 — Alta**
* **Fluxo Afetado:** FL-10 (Gestão e Cadastro de Convidados).
* **Personas Afetadas:** Persona 3 (Analista RH Média com 200 colaboradores), Persona 8 (Cerimonialista com 180 convidados).
* **Evidência no Código:** `components/add-guest-dialog.tsx` permite inserir apenas um único convidado por vez através de formulário modal manual.
* **Impacto no Negócio:** Bloqueio de venda para qualquer empresa com mais de 40 colaboradores. Nenhum analista de RH digitará 250 nomes e telefones manualmente.
* **Recomendação:** Criar componente de upload de arquivo CSV com parsing no cliente (PapaParse ou script nativo) mapeando colunas: Nome, E-mail, Telefone, Departamento e Cota de Acompanhantes.
* **Critério de Aceite:**
  1. O organizador faz upload de arquivo CSV com 200 linhas e todos os convidados são inseridos na tabela `guests` em uma única operação em lote (Batch Insert) em menos de 5 segundos.

---

### ISSUE-04 — Risco de Mascaramento de Erro ao Criar Evento com Sessão Expirada
* **Prioridade:** **P1 — Alta**
* **Fluxo Afetado:** FL-04 (Criação de Evento).
* **Personas Afetadas:** Todas as personas organizadoras.
* **Evidência no Código:** `app/create-event/page.tsx` insere o evento no Zustand `addEvent(newEvent)` local antes ou independentemente de a Server Action `createEvent()` ter concluído com sucesso no Supabase.
* **Impacto no Negócio:** O organizador acredita que o evento está online e divulga o link. Convidados clicam no link público e recebem erro 404 (evento não existe no banco de dados).
* **Recomendação:** Garantir que a persistência no banco Supabase seja a fonte primária de verdade (`Source of Truth`). Se a requisição falhar por sessão expirada ou erro de rede, o formulário não deve redirecionar e deve exibir alerta crítico ao usuário.
* **Critério de Aceite:**
  1. O redirecionamento para o dashboard só ocorre após confirmação de sucesso com UUID retornado pelo Supabase.

---

### ISSUE-05 — Ausência de Bloqueio de Rotas Privadas no Middleware
* **Prioridade:** **P1 — Alta (Segurança / Governança)**
* **Fluxo Afetado:** FL-01 (Autenticação e Sessão).
* **Personas Afetadas:** Persona 4 e 6 (Governança e TI Corporativa).
* **Evidência no Código:** `middleware.ts` retorna `NextResponse.next()` para qualquer rota não mapeada explicitamente, permitindo que requisições a `/dashboard` ou `/event/[id]` alcancem o renderizador do Next.js sem verificação de token de autenticação.
* **Impacto no Negócio:** Reprovação em auditorias de TI e segurança da informação de empresas médias e grandes.
* **Recomendação:** Atualizar `middleware.ts` utilizando o helper oficial do Supabase SSR (`@supabase/ssr`) para validar a sessão do usuário no servidor antes de autorizar o acesso a rotas do dashboard.
* **Critério de Aceite:**
  1. Usuário sem cookie de sessão válido que tente acessar `/dashboard` ou `/create-event` é redirecionado instantaneamente pelo servidor (HTTP 307) para `/login`.

---

### ISSUE-06 — Falta de Exportação de Relatórios em PDF/CSV no Painel Analítico
* **Prioridade:** **P2 — Média**
* **Fluxo Afetado:** FL-18 (Analytics e BI).
* **Personas Afetadas:** Personas 2, 4, 6 (Gestores de RH), Persona 8 (Cerimonialista).
* **Evidência no Código:** O módulo `/dashboard/analytics` exibe tabelas e gráficos avançados, mas não possui nenhum botão de exportação.
* **Impacto para o Usuário:** O gestor precisa tirar prints de tela para colar no PowerPoint ou digitar novamente os números em uma planilha para enviar ao Diretor Financeiro.
* **Critério de Aceite:**
  1. Botão "Exportar Relatório" gerando arquivo CSV com a lista de presença e resumo executivo de custos.

---

### ISSUE-07 — Ausência de Modo "Somente Leitura" para Clientes Contratantes
* **Prioridade:** **P2 — Média**
* **Fluxo Afetado:** FL-08 (Painel do Evento).
* **Personas Afetadas:** Persona 8 (Cerimonialista), Persona 10 (Noivos / Contratante).
* **Evidência no Código:** A tela `/event/[id]` é 100% administrativa e exige login completo de organizador.
* **Impacto no Negócio:** Cerimonialistas não conseguem dar acesso transparente aos noivos sem expor os outros clientes da sua carteira.
* **Critério de Aceite:**
  1. Geração de um "Link do Anfitrião" (Host Token) que abre uma visão limpa do evento, mostrando apenas contadores de presença, lista de confirmados e botão para aprovar acompanhantes, sem botões de excluir evento ou cadastrar despesas.

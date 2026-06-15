# Roadmap de 6 Meses - Planeja+

## Slide 1 - Titulo

**Planeja+: Roadmap de Evolucao do Projeto**

**Periodo:** janeiro a junho de 2026  
**Objetivo:** apresentar a evolucao do Planeja+ desde a concepcao da solucao ate a consolidacao da arquitetura, banco de dados, fluxo de eventos, convites e analytics.

---

## Slide 2 - Visao Geral do Projeto

O Planeja+ e uma plataforma web para centralizar o planejamento de eventos colaborativos.

**Problema resolvido:**

- Organizacao dispersa entre mensagens, planilhas e anotacoes.
- Falta de controle sobre convidados, confirmacoes e custos.
- Dificuldade para acompanhar o andamento do evento em uma unica tela.

**Proposta de valor:**

- Criar eventos.
- Gerenciar convidados e RSVP.
- Controlar itens, responsabilidades e custos.
- Visualizar indicadores e dados de apoio a decisao.

---

## Slide 3 - Linha do Tempo dos 6 Meses

| Mes | Foco principal | Resultado entregue |
| --- | --- | --- |
| Mes 1 | Descoberta e definicao do produto | Problema, publico-alvo, funcionalidades e stack definidos |
| Mes 2 | Base visual e experiencia inicial | Landing page, autenticacao, dashboard e navegacao principal |
| Mes 3 | Funcionalidades centrais | Criacao de eventos, convidados, itens, fotos, calendario e contatos |
| Mes 4 | Backend e seguranca | Supabase, schema, RLS, tabelas, views e APIs protegidas |
| Mes 5 | Convites e fluxo publico | Link publico, RSVP, solicitacoes, acompanhantes e aprovacao |
| Mes 6 | Analytics, jobs e consolidacao | Dashboards, pipeline de dados, jobs, documentacao e preparo para escala |

---

## Slide 4 - Mes 1: Planejamento e Concepcao

**O que foi feito:**

- Definicao da ideia central do Planeja+.
- Identificacao dos usuarios principais: estudantes, familias, grupos de amigos, comunidades e organizadores de eventos.
- Mapeamento das dores: controle de presenca, divisao de custos, tarefas e comunicacao.
- Escolha da stack: Next.js, TypeScript, Tailwind, shadcn/ui, Zustand e Supabase.

**Entrega do mes:**

Uma visao clara de produto, com escopo funcional e arquitetura inicial.

---

## Slide 5 - Mes 2: Interface e Estrutura da Aplicacao

**O que foi feito:**

- Criacao da estrutura do projeto em Next.js com App Router.
- Desenvolvimento das primeiras telas: landing page, login, registro, sobre, precos e layout principal.
- Implementacao de componentes reutilizaveis com shadcn/ui.
- Configuracao de tema, navegacao, responsividade e base visual do sistema.
- Criacao do contexto de autenticacao para uso no modo demonstrativo.

**Entrega do mes:**

Primeira versao navegavel do sistema, com identidade visual e fluxo basico de acesso.

---

## Slide 6 - Mes 3: Funcionalidades Centrais de Eventos

**O que foi feito:**

- Criacao e edicao de eventos.
- Tela individual do evento com resumo, convidados, itens, custos, galeria e analises.
- Gerenciamento de convidados com status de presenca.
- Controle de itens, valores e responsaveis.
- Calendario de eventos.
- Area de contatos para apoiar a gestao dos participantes.
- Persistencia local com Zustand durante a fase inicial.

**Entrega do mes:**

MVP funcional para planejar e acompanhar eventos do inicio ao fim.

---

## Slide 7 - Mes 4: Banco de Dados, Supabase e Seguranca

**O que foi feito:**

- Criacao do schema Supabase com tabelas principais:
  - `users`
  - `events`
  - `guests`
  - `guest_companions`
  - `items`
  - `event_photos`
  - tabelas de jobs e analytics
- Implementacao de Row Level Security para isolar dados por usuario.
- Criacao de indices para melhorar consultas.
- Criacao de triggers para atualizacao automatica e sincronizacao de campos.
- Criacao de materialized views para custos e estatisticas de RSVP.
- Organizacao dos clientes Supabase de frontend, server e admin.

**Entrega do mes:**

Base de dados robusta, segura e preparada para evoluir para dados reais em producao.

---

## Slide 8 - Mes 5: Convites, RSVP e Fluxo Publico

**O que foi feito:**

- Criacao de fluxo de convite publico por token.
- Rota publica `/convite/[token]` para convidados acessarem o evento.
- Rota `/evento/[eventId]/solicitar` para solicitacao publica de participacao.
- APIs para gerar, ativar e desativar link publico.
- Confirmacao e recusa de presenca por token.
- Suporte a acompanhantes.
- Fluxo de aprovacao/rejeicao de convidados e acompanhantes.
- Geracao de link de confirmacao e arquivo ICS para calendario.

**Entrega do mes:**

Fluxo completo para convidar, receber respostas e controlar participacoes sem expor dados sensiveis.

---

## Slide 9 - Mes 6: Analytics, Jobs e Consolidacao

**O que foi feito:**

- Dashboard de visualizacao de dados com filtros, KPIs e graficos.
- Pagina de analytics para leitura de desempenho dos eventos.
- Pipeline de jobs para tarefas automatizadas:
  - agregacao diaria de dados;
  - lembretes de convites pendentes;
  - sincronizacao de calendario;
  - limpeza de dados antigos.
- Estrutura de logs e execucoes de jobs.
- Documentacao tecnica de arquitetura, deploy, pipeline, Supabase e visualizacao de dados.
- Analise de suporte para eventos de medio e grande porte.

**Entrega do mes:**

Sistema mais maduro, com inteligencia operacional, monitoramento e documentacao para continuidade.

---

## Slide 10 - Principais Entregas Ate Agora

**Produto:**

- Plataforma web responsiva.
- Area autenticada.
- Dashboard.
- Criacao e gerenciamento de eventos.
- Calendario e contatos.
- Controle de convidados, itens, custos e fotos.

**Backend e dados:**

- Supabase estruturado.
- RLS e politicas de seguranca.
- APIs para eventos, convidados, convites e jobs.
- Views e pipeline analitico.

**Experiencia do usuario:**

- Convite publico.
- RSVP por token.
- Acompanhantes.
- Aprovacao de solicitacoes.
- Exportacao/integração com calendario via ICS.

---

## Slide 11 - Impacto do Projeto

**Antes do Planeja+:**

- Informacoes espalhadas.
- Controle manual de presenca.
- Custos pouco transparentes.
- Baixa visibilidade do andamento do evento.

**Depois do Planeja+:**

- Tudo centralizado em uma plataforma.
- Convidados e respostas organizados.
- Custos e responsabilidades mais claros.
- Dashboards para acompanhar indicadores.
- Base preparada para automacoes e escala.

---

## Slide 12 - Situacao Atual

**Status atual:** prototipo funcional avancado / MVP em evolucao.

**Pontos fortes:**

- Produto com fluxo principal bem definido.
- Arquitetura moderna.
- Banco modelado para dados reais.
- Funcionalidades de convite e RSVP implementadas.
- Documentacao consistente.

**Pontos de atencao:**

- Integrar completamente autenticacao real com Supabase Auth.
- Padronizar criacao de eventos para persistir diretamente no banco.
- Evoluir envio real de emails/SMS.
- Ampliar testes automatizados.
- Refinar padronizacao de datas e campos de convite.

---

## Slide 13 - Proximos Passos

**Curto prazo:**

- Finalizar integracao completa com Supabase Auth.
- Persistir criacao de eventos diretamente no Supabase.
- Padronizar tokens, datas e status de convite.
- Validar fluxo completo em ambiente de producao.

**Medio prazo:**

- Envio real de emails e notificacoes.
- Pagamentos para eventos pagos.
- Relatorios exportaveis em PDF/CSV.
- Dashboard de monitoramento dos jobs.

**Longo prazo:**

- Previsao de presenca com IA.
- Recomendacoes de lista de compras.
- Integracoes com ferramentas externas.
- Suporte avancado a eventos maiores.

---

## Slide 14 - Fechamento

Em seis meses, o Planeja+ evoluiu de uma ideia para uma plataforma funcional, com interface, fluxo de eventos, convidados, convites publicos, banco de dados estruturado, seguranca, analytics e documentacao tecnica.

**Mensagem final:**  
O Planeja+ esta preparado para sair da fase de prototipo avancado e caminhar para validacao real com usuarios, integracoes externas e melhorias de escala.


# 06 — Análise do Segmento de Empresas de Eventos e Decisão Estratégica

> **Projeto:** Planeja+  
> **Auditoria:** Fase 6 — Investigação de Mercado para Produtoras, Cerimoniais, Casamentos e Festas  
> **Objetivo:** Avaliar se o produto atende a empresas organizadoras de eventos, diagnosticar sobreposições e decidir fundamentadamente entre três alternativas de implementação.

---

## 1. Diagnóstico de Compatibilidade por Tipo de Evento

| Tipo de Evento | Nível de Aderência Atual | Maiores Pontos Fortes no Planeja+ | Maiores Lacunas / Incompatibilidades |
|---|---|---|---|
| **Confraternizações Corporativas** | **85% (Alta)** | Link público seguro, controle de acompanhantes por cota, moderação de convidados, analytics executivo. | Falta de importação CSV em massa e falta de campos de departamento/centro de custo. |
| **Casamentos** | **50% (Média)** | Controle rigoroso de convites e acompanhantes; campos de restrição alimentar no banco. | Módulo de gastos voltado a "rateio" (inaceitável para noivos); falta mapa de mesas e cronograma minuto a minuto (R.O.). |
| **Festas de Aniversário / 15 Anos** | **80% (Alta)** | Gestão ágil de presença, confirmação pelo celular sem login, controle de lotação. | Falta gestão de múltiplos fornecedores contratados (som, buffet, foto). |
| **Bailes de Formatura** | **65% (Média-Alta)** | Capacidade de lidar com aprovação pública rigorosa (evitar penetras); controle de cotas de convites por formando. | Formaturas exigem lotes de convites por formando (ex.: Formando X tem direito a 10 convites). |
| **Convenções e Congressos** | **40% (Baixa-Média)** | Agenda e rate limiting. | Exige credenciamento com crachá e QR Code na portaria, além de múltiplos palcos/salas. |

---

## 2. Matriz de Requisitos Operacionais de Eventos Profissionais

Análise das 19 necessidades operacionais típicas do setor de eventos frente ao código atual do Planeja+:

| Requisito Operacional | Classificação Técnica | Situação no Código Atual |
|---|---|---|
| **1. Cadastro do Evento (Nome, data, local)** | **Já existe e atende** | Implementado no wizard em `app/create-event` e tabela `events`. |
| **2. Capacidade e Estimativa de Participantes** | **Já existe e atende** | Campos `capacity` e `confirmed_guests` com validação de limite. |
| **3. Orçamento Global (Budget Previsto)** | **Existe, mas precisa de adaptação** | Campo `budget_estimated` existe, mas não emite alertas de estouro de verba. |
| **4. Gestão de Fornecedores e Contratos** | **Não existe e pode ser necessário** | Itens na tabela `items` não registram Razão Social, CNPJ, contato ou contrato. |
| **5. Cronograma Geral e Tarefas** | **Já existe e atende** | Checklist em `items` com atribuição de pessoas (`assignedTo`). |
| **6. Roteiro Operacional Minuto a Minuto (R.O.)** | **Não existe e pode ser necessário** | Cerimoniais usam planilhas de horários (ex.: 19h00 Entrada Padrinhos, 19h15 Entrada Noiva). |
| **7. Lista de Convidados e RSVP** | **Já existe e atende** | O melhor módulo do sistema (`guests`, tokens únicos, sem login). |
| **8. Aprovação Individual de Acompanhantes** | **Já existe e atende** | Fluxo maduro com tabela relacional `guest_companions` e status individual. |
| **9. Restrições Alimentares e Acessibilidade** | **Existe, mas precisa de adaptação** | Campos existem no banco (`dietary_restrictions`, `accessibility_needs`), mas não estão no formulário público. |
| **10. Mapeamento de Mesas e Lugares** | **Depende de validação adicional** | Requisito forte em casamentos de luxo, mas irrelevante para confraternizações corporativas. |
| **11. Portal do Cliente / Visualização dos Noivos**| **Não existe e pode ser necessário** | O cliente contratante hoje não tem uma visão restrita somente-leitura. |
| **12. Check-in na Entrada / Portaria** | **Não existe e pode ser necessário** | Falta leitor de QR Code para conferência na portaria do evento. |
| **13. Alterações de Última Hora e Cancelamento** | **Já existe e atende** | Edição de convidados e suporte a status `cancelled`. |
| **14. Relatório Executivo e Prestação de Contas** | **Existe, mas precisa de adaptação** | O painel de Analytics é rico, mas falta exportação formal em PDF/CSV. |
| **15. Divisão de Custos / Rateio** | **Existe, mas precisa de adaptação** | Deve ser uma opção ativável (Toggle), e **desativada por padrão** para eventos corporativos e casamentos. |
| **16. Lista de Presentes / Cotas** | **Não existe e não há justificativa** | Existem plataformas consagradas no mercado (iCasei, Casar.com) que dominam esse nicho financeiro. |
| **17. Propostas Comerciais e Pagamentos Online** | **Não existe e não há justificativa** | Introduzir meios de pagamento e emissão de notas fiscais adiciona altíssima complexidade regulatória no momento. |
| **18. Envio de Notificações Automáticas** | **Não existe e pode ser necessário** | Falta integração real com gateway de e-mail (Resend) e WhatsApp. |
| **19. Histórico e Agenda de Eventos** | **Já existe e atende** | Telas de `/dashboard` e `/calendar` cobrem muito bem a agenda mensal. |

---

## 3. Avaliação das Três Alternativas Estratégicas

Conforme determinado na Seção 9 da missão, avaliamos formalmente as três rotas de engenharia e produto:

---

### Alternativa A — Reaproveitar o Fluxo Atual com Configuração Dinâmica (Recomendada)
* **Conceito:** O Planeja+ mantém um **núcleo único e enxuto de eventos**, introduzindo um seletor de modalidade de evento na criação:
  - `Modo Corporativo / RH` (Oculta rateio; exibe Fornecedores, Orçamento Previsto × Realizado, e campos de Departamento).
  - `Modo Cerimonial / Social` (Oculta rateio; exibe Fornecedores, Acompanhantes com Restrições Alimentares e Portal de Leitura para os Noivos).
  - `Modo Colaborativo / Amigos` (Mantém o rateio de custos entre pessoas físicas e tarefas colaborativas).
* **Valor para o Cliente:** Permite ao organizador usar o mesmo software para um churrasco de equipe, uma convenção da empresa ou o casamento de um cliente, sem redundância.
* **Esforço de Desenvolvimento:** **Baixo a Médio**. Reaproveita 90% das tabelas e rotas existentes (`events`, `guests`, `guest_companions`, `analytics`).
* **Risco Arquitetural:** Mínimo. Não cria forks de código nem duplicidade de componentes.
* **Manutenção:** Baixa. Uma única base de código para testar e manter.

---

### Alternativa B — Criar um Módulo Dedicado de Gestão de Eventos Profissionais
* **Conceito:** Manter a área atual para uso pessoal e criar uma área separada `/pro` ou `/cerimonial` com banco de dados estendido (tabelas `vendors`, `contracts`, `seating_tables`, `checkins`).
* **Valor para o Cliente:** Atende a cerimonialistas de alto padrão que exigem mapas de mesas e contratos formais.
* **Esforço de Desenvolvimento:** **Alto**. Exige criação de 5 novas tabelas, novas rotas de API, telas especializadas e fluxos financeiros complexos.
* **Risco Arquitetural:** Médio. Risco de construir funcionalidades pesadas que poucos usuários utilizarão antes de validar a tração básica do produto.
* **Manutenção:** Média a Alta. Complexidade de manter duas experiências paralelas no mesmo produto.

---

### Alternativa C — Criar um Produto SaaS Separado (Split de Repositório)
* **Conceito:** Separar o Planeja+ em dois produtos comerciais distintos: *Planeja+ Pessoal* (B2C) e *Planeja+ Corporativo/Pro* (B2B SaaS).
* **Valor para o Cliente:** Posicionamento de marca 100% puro para cada público.
* **Esforço de Desenvolvimento:** **Altíssimo**. Duplicação de repositórios, pipelines de CI/CD, custos de hospedagem e esforço de manutenção.
* **Risco Estratégico:** Prematuro. Não há volume de receita comprovado que justifique sustentar duas empresas ou bases de código separadas neste estágio.

---

## 4. Comparativo Estruturado entre as Alternativas

| Critério de Avaliação | Alternativa A (Núcleo Configurável) | Alternativa B (Módulo Dedicado Pro) | Alternativa C (Produto Separado) |
|---|---|---|---|
| **Velocidade de Entrada no Mercado (Time-to-Market)** | **Imediata (1 a 2 sprints)** | Lenta (6 a 8 sprints) | Muito Lenta (3 a 4 meses) |
| **Esforço de Engenharia** | Baixo | Alto | Altíssimo |
| **Complexidade de Manutenção** | Baixa | Média-Alta | Alta |
| **Aderência ao Posicionamento da Landing Page** | Total (Resolve o gap atual) | Total | Parcial |
| **Risco de Desperdício de Desenvolvimento** | Baixo (Mudanças reversíveis) | Alto | Altíssimo |
| **Atendimento a RHs Pequenos e Médios** | **Excelente** | Complexo demais | Excelente |
| **Atendimento a Produtoras e Cerimoniais** | Muito Bom | Excelente | Excelente |

---

## 5. Recomendação Fundamentada da Equipe Multidisciplinar

A recomendação definitiva é a **Alternativa A (Reaproveitamento com Configuração Dinâmica por Perfil de Evento)**.

### Por que a Alternativa A é a Decisão Correta:
1. **O maior ativo do Planeja+ é o fluxo de Convidados, RSVP público e Acompanhantes.** Esse fluxo é 100% idêntico e compartilhado entre uma confraternização de empresa, um casamento e um aniversário de 15 anos. Duplicar esse código seria um erro grave de arquitetura.
2. **O único grande ponto de rejeição do público B2B é o vocabulário financeiro de rateio.** Ao introduzir uma flag no evento chamada `financial_mode` (`'corporate_budget'` vs. `'collaborative_split'`), a interface passa a exibir:
   - No modo corporativo: *"Orçamento: R$ 50.000 | Comprometido: R$ 38.000 | Saldo: R$ 12.000 | Custo por Convidado: R$ 190,00"*.
   - No modo colaborativo: *"Total de Gastos: R$ 1.200 | Divisão por pessoa: R$ 50,00"*.
3. **Preserva a simplicidade para pequenas empresas:** Um RH de 20 funcionários quer praticidade, não um ERP pesado de eventos. A Alternativa A entrega o nível exato de profissionalismo sem burocracia desnecessária.

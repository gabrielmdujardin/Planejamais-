# 02 — Personas Reais e Mapeamento de Jornadas

> **Projeto:** Planeja+  
> **Auditoria:** Fase 2 — Construção de Personas e Mapeamento de Jornadas  
> **Metodologia:** Divisão estrita entre Evidências Observadas no Código/Documentação, Comportamentos Típicos de Mercado e Hipóteses que Demandam Validação de Campo.

---

## PARTE 1: AS SEIS PERSONAS DE RECURSOS HUMANOS (RH)

---

### Persona 1 — Profissional de RH de Empresa Pequena
**Nome Fictício:** Juliana Mendes  
**Cargo:** Assistente Administrativo e de DP / RH (Equipe de 1 pessoa de RH em empresa com 22 colaboradores)  
**Porte da Empresa:** Pequena (10 a 30 funcionários)  
**Nível Hierárquico:** Operacional

1. **Objetivos principais:**
   - Organizar confraternizações mensais, aniversariantes do mês e o almoço de fim de ano da empresa sem perder horas no WhatsApp.
   - Saber exatamente quem vai comparecer para encomendar a quantidade certa de comida e bebida sem desperdício de verba.
2. **Dores e dificuldades:**
   - Acúmulo de funções (folha, compras, recepção, suporte e eventos).
   - Funcionários esquecem de responder ou avisam de última hora.
   - Falta de tempo para ler tutoriais ou passar por cadastros complexos.
3. **Contexto de uso:**
   - Acessa o sistema rapidamente entre um intervalo de rotina, frequentemente pelo navegador do notebook ou pelo smartphone.
4. **Responsabilidades:**
   - Cadastrar o evento, disparar o link no grupo interno da empresa, conferir confirmados e comprar os itens.
5. **Necessidades funcionais:**
   - Criação de evento em 2 minutos.
   - Link de confirmação simples que funcione sem exigir senha dos colaboradores.
   - Lista consolidada de confirmados para enviar ao buffet/restaurante.
6. **Necessidades de informação:**
   - Número total de pessoas confirmadas e restrições alimentares simples.
7. **Permissões esperadas:**
   - Acesso total para criar, editar, aprovar convidados e visualizar custos do evento que ela mesma criou.
8. **Tarefas mais frequentes:**
   - Criar evento, copiar link público, verificar lista de confirmados, checar valor total dos gastos.
9. **Cenários críticos:**
   - Colaborador não consegue abrir o link no celular; confirmação de última hora de pessoas não autorizadas.
10. **Critérios de sucesso:**
    - O evento ser configurado e os convites disparados em menos de 10 minutos; lista final 100% precisa.
11. **Funcionalidades atendidas pelo sistema:**
    - Criação de evento ágil (`app/create-event`), link público seguro (`/convite/[token]`), confirmação sem login.
12. **Funcionalidades parcialmente atendidas:**
    - Acompanhamento de itens (atende o cadastro, mas fala em "rateio entre pessoas", o que causa confusão).
13. **Funcionalidades ausentes:**
    - Opção de selecionar os colaboradores diretamente a partir de uma lista interna da empresa sem cadastrar do zero toda vez.
14. **Barreiras de usabilidade:**
    - Termos como *"Rateio Colaborativo"* e *"Valor por pessoa: R$ 50,00"* que aparecem em telas como `/event/[id]`.
15. **Evidências no código que sustentam o perfil:**
    - Implementação de convite público via token com auto-aprovação (`auto_approve_public_guests` em `schema.sql`), ideal para grupos pequenos onde o link é jogado no grupo geral da empresa.
16. **Hipóteses ainda não confirmadas:**
    - Se pequenos RHs preferem cadastrar lista nominal ou apenas soltar o link aberto para a equipe.

---

### Persona 2 — Gerente de RH de Empresa Pequena
**Nome Fictício:** Roberto Silveira  
**Cargo:** Sócio-Fundador / Gestor Operacional e de Pessoas  
**Porte da Empresa:** Pequena (20 a 45 colaboradores)  
**Nível Hierárquico:** Gerencial / Decisor

1. **Objetivos principais:**
   - Assegurar que os eventos promovam engajamento e clima organizacional sem estourar o orçamento da empresa.
   - Ter visibilidade do custo final do evento sem precisar pedir planilhas manuais ao assistente.
2. **Dores e dificuldades:**
   - Não quer perder tempo operando sistemas; quer apenas olhar o resumo e autorizar o gasto.
   - Frustração quando o custo final ultrapassa o valor aprovado com os sócios.
3. **Contexto de uso:**
   - Acesso esporádico (1 a 2 vezes por mês), consultando o dashboard executivo em reuniões de alinhamento.
4. **Responsabilidades:**
   - Aprovar a verba do evento, definir o limite de acompanhantes e avaliar o retorno de adesão da equipe.
5. **Necessidades funcionais:**
   - Dashboard com total gasto versus orçado.
   - Taxa de adesão dos colaboradores.
6. **Necessidades de informação:**
   - Quanto foi gasto no total, quantos colaboradores participaram e custo médio por colaborador.
7. **Permissões esperadas:**
   - Visualização gerencial com permissão de alterar orçamento e autorizar despesas.
8. **Tarefas mais frequentes:**
   - Abrir o dashboard, consultar o painel de métricas analíticas e aprovar o orçamento.
9. **Cenários críticos:**
   - O evento custar R$ 8.000 quando o limite estipulado pela diretoria era de R$ 5.000.
10. **Critérios de sucesso:**
    - Relatório claro de adesão e despesas consolidado em 1 clique.
11. **Funcionalidades atendidas pelo sistema:**
    - Dashboard de métricas (`/dashboard/analytics`) com taxa de confirmação e custo estimado.
12. **Funcionalidades parcialmente atendidas:**
    - Orçamento estimado (`budget_estimated`): existe no banco e no formulário, mas não há bloqueio ou alerta visual quando o custo dos itens cadastrados ultrapassa a verba.
13. **Funcionalidades ausentes:**
    - Separação de perfis (não há como o Gerente ter visão de aprovação enquanto o assistente opera).
14. **Barreiras de usabilidade:**
    - Falta de exportação em PDF para prestação de contas com outros sócios.
15. **Evidências no código que sustentam o perfil:**
    - Existência dos campos `budget_estimated` e `financial_notes` na tabela `events` do Supabase.
16. **Hipóteses ainda não confirmadas:**
    - Se gestores de empresas pequenas realmente entram no sistema ou apenas recebem o print do dashboard.

---

### Persona 3 — Profissional de RH de Empresa Média
**Nome Fictício:** Camila Rocha  
**Cargo:** Analista de Gente e Gestão / Comunicação Interna  
**Porte da Empresa:** Média (100 a 300 colaboradores)  
**Nível Hierárquico:** Operacional

1. **Objetivos principais:**
   - Organizar a convenção interna de vendas e a festa junina corporativa com controle rígido de acompanhantes (apenas cônjuges e filhos).
   - Garantir que cada setor da empresa (Comercial, Operações, Suporte) esteja devidamente engajado.
2. **Dores e dificuldades:**
   - Impossível cadastrar 200 funcionários individualmente de forma manual.
   - Controle caótico de acompanhantes: funcionários cadastram amigos ou familiares distantes sem autorização prévia.
   - Retrabalho em conferir nomes duplicados e pedidos de alteração de presença.
3. **Contexto de uso:**
   - Uso contínuo durante as semanas que antecedem grandes eventos, em computador desktop com duas telas.
4. **Responsabilidades:**
   - Subir a lista de convidados, moderar pedidos de acompanhantes, cobrar líderes de setores com baixa confirmação.
5. **Necessidades funcionais:**
   - **Importação de convidados via planilha (CSV/Excel).**
   - Moderação individual de acompanhantes (aprovar o funcionário, mas rejeitar o segundo acompanhante se a cota for excedida).
   - Filtro de convidados por departamento/área.
6. **Necessidades de informação:**
   - Lista filtrada por status (`awaiting_approval`, `confirmed`, `pending`).
   - Log de quem confirmou e quando respondeu.
7. **Permissões esperadas:**
   - Operador de evento: gerenciar convidados, itens e status, sem poder excluir o evento principal.
8. **Tarefas mais frequentes:**
   - Analisar lista de pendências, aprovar/rejeitar acompanhantes, atualizar itens contratados de fornecedores.
9. **Cenários críticos:**
   - Chegar ao dia do evento e haver 50 pessoas a mais na portaria do que o contratado no buffet.
10. **Critérios de sucesso:**
    - Triagem de 100% dos acompanhantes antes do fechamento do contrato com o espaço; lista de presença livre de penetras.
11. **Funcionalidades atendidas pelo sistema:**
    - Tabela e fluxo de aprovação de acompanhantes (`guest_companions` e `app/api/companions/[id]/approve`). **Excelente aderência.**
12. **Funcionalidades parcialmente atendidas:**
    - Lista de convidados (`components/guest-list.tsx`): permite adicionar convidados, mas somente de 1 em 1.
13. **Funcionalidades ausentes:**
    - Importação em lote (Batch Import CSV/XLSX); campo de Departamento/Setor na tabela `guests`.
14. **Barreiras de usabilidade:**
    - Ausência de paginação ou virtualização de lista para eventos com 250+ participantes.
15. **Evidências no código que sustentam o perfil:**
    - A rota `app/api/companions/[id]/approve` e as colunas `approved_by`, `status in ('approved', 'rejected')` mostram que essa necessidade já foi mapeada na engenharia do banco.
16. **Hipóteses ainda não confirmadas:**
    - Se a importação por CSV precisa aceitar colunas personalizadas (ex.: crachá, matrícula, restrição alimentar).

---

### Persona 4 — Gerente de RH de Empresa Média
**Nome Fictício:** Marcelo Vasconcelos  
**Cargo:** Gerente de Recursos Humanos e Facilities  
**Porte da Empresa:** Média (150 a 400 colaboradores)  
**Nível Hierárquico:** Gerencial / Tático

1. **Objetivos principais:**
   - Garantir governança de custos e conformidade com as políticas corporativas (compliance e código de conduta).
   - Identificar áreas da empresa que não estão participando das ações de integração para agir preventivamente.
2. **Dores e dificuldades:**
   - Falta de relatórios formais para apresentar à Diretoria Executiva justificando o investimento em clima e eventos.
   - Risco de vazamento de dados de colaboradores em ferramentas não homologadas pela TI.
3. **Contexto de uso:**
   - Reuniões semanais de governança e prestação de contas com o Diretor Financeiro (CFO).
4. **Responsabilidades:**
   - Validar contratos de fornecedores (espaço, buffet, segurança), assinar aprovações e garantir adesão aos limites financeiros.
5. **Necessidades funcionais:**
   - Análise de risco de evento (matriz de risco de adesão e custos).
   - Relatórios executivos com comparativo entre eventos passados.
   - Exportação de dados consolidados em CSV/PDF.
6. **Necessidades de informação:**
   - Taxa de confirmação consolidada, custo total real versus orçado, custo por participante confirmado.
7. **Permissões esperadas:**
   - Gerente de Unidade / Administrador de RH: visualiza todos os eventos da empresa, controla alçadas de despesas e exporta relatórios.
8. **Tarefas mais frequentes:**
   - Avaliar a matriz de risco no painel de Analytics (`/dashboard/analytics`), verificar pendências críticas e autorizar aditivos de contrato.
9. **Cenários críticos:**
   - Estouro imprevisto de custos e baixa adesão em evento obrigatório da empresa.
10. **Critérios de sucesso:**
    - Custo por participante mantido dentro do benchmark estipulado; dados auditáveis.
11. **Funcionalidades atendidas pelo sistema:**
    - O módulo `/dashboard/analytics` possui cálculo de risco (`riskMatrix`), Pareto de custos e comparativo avançado.
12. **Funcionalidades parcialmente atendidas:**
    - O Pareto de custos ordena itens, mas os itens são simples nomes com preço, sem agrupamento por Fornecedor (ex.: Buffet Silva, Espaço Villa, DJ Som).
13. **Funcionalidades ausentes:**
    - Controle de alçadas de aprovação formal de despesas; exportação formal de relatórios.
14. **Barreiras de usabilidade:**
    - Não conseguir filtrar a análise por filial, centro de custo ou unidade de negócio.
15. **Evidências no código que sustentam o perfil:**
    - `app/api/analytics/route.ts` possui lógica avançada de cálculo de risco (`riskForEvent`), provando foco em suporte à decisão gerencial.
16. **Hipóteses ainda não confirmadas:**
    - Se gerentes de RH médios precisam de integração com ERPs (ex.: TOTVS, Senior, SAP).

---

### Persona 5 — Profissional de RH de Empresa Grande
**Nome Fictício:** Fernanda Lacerda  
**Cargo:** Especialista de Endomarketing e Experiência do Colaborador  
**Porte da Empresa:** Grande (1.000 a 5.000 colaboradores em múltiplas filiais)  
**Nível Hierárquico:** Operacional Especializado

1. **Objetivos principais:**
   - Coordenar convenções nacionais e celebrações de fim de ano simultâneas em 4 estados com milhares de participantes.
   - Manter identidade visual corporativa rigorosa e integração com a base corporativa de colaboradores.
2. **Dores e dificuldades:**
   - Volume massivo de requisições e dúvidas de colaboradores.
   - Riscos severos de segurança da informação e conformidade com a LGPD.
   - Mudanças de status em tempo real (colaboradores transferidos, demitidos ou de férias).
3. **Contexto de uso:**
   - Acesso em rede corporativa segura via SSO (Single Sign-On).
4. **Responsabilidades:**
   - Executar o cronograma do evento, gerenciar múltiplos checkpoints de confirmação, coordenar equipes locais de apoio.
5. **Necessidades funcionais:**
   - Paginação e busca avançada por matrícula, filial, diretoria e cargo.
   - Check-in na portaria com leitor de QR Code para validar entrada em tempo real.
   - Log completo de auditoria (quem aprovou o quê e em qual horário).
6. **Necessidades de informação:**
   - Fluxo de entrada em tempo real no dia do evento; relatórios de no-show (quem confirmou e faltou).
7. **Permissões esperadas:**
   - Acesso restrito à sua filial / evento específico, sem permissão para ver custos de eventos de outras diretorias.
8. **Tarefas mais frequentes:**
   - Filtrar lotes de convidados, exportar listas para equipes de credenciamento na portaria, disparar comunicados segmentados.
9. **Cenários críticos:**
   - Queda de sistema ou lentidão durante o acesso simultâneo de 3.000 colaboradores para confirmar presença; falhas na portaria por falta de QR Code.
10. **Critérios de sucesso:**
    - Credenciamento na portaria em menos de 10 segundos por convidado; zero incidentes de segurança de dados.
11. **Funcionalidades atendidas pelo sistema:**
    - Arquitetura de banco com índices preparados para consulta (`supabase/schema.sql`) e proteção por Rate Limiting.
12. **Funcionalidades parcialmente atendidas:**
    - O modelo de dados do Supabase suporta campos extensíveis em JSONB (`metadata`), mas a interface web não tem campos para filial, matrícula ou QR Code.
13. **Funcionalidades ausentes:**
    - Check-in via QR Code na portaria; Single Sign-On (SSO / SAML / Azure AD); segregação multi-tenant por filial.
14. **Barreiras de usabilidade:**
    - Listas sem paginação travam no navegador ao renderizar mais de 500 registros simultâneos.
15. **Evidências no código que sustentam o perfil:**
    - A tabela `job_runs` e `facts_daily_events` com pipeline analítico diário reflete a necessidade de lidar com grandes volumes de dados.
16. **Hipóteses ainda não confirmadas:**
    - Se empresas grandes utilizariam o Planeja+ como ferramenta independente ou se exigiriam integração obrigatória via API corporativa.

---

### Persona 6 — Gerente de RH de Empresa Grande
**Nome Fictício:** Dr. Carlos Eduardo Guimarães  
**Cargo:** Diretor de Recursos Humanos e Governança Corporativa  
**Porte da Empresa:** Grande (3.000+ colaboradores)  
**Nível Hierárquico:** Executivo / Estratégico

1. **Objetivos principais:**
   - Assegurar compliance total, aderência à LGPD e uso transparente do orçamento global de benefícios e confraternizações da companhia.
   - Ter uma visão consolidada de todos os eventos realizados por todas as unidades de negócio no ano fiscal.
2. **Dores e dificuldades:**
   - Falta de governança: cada filial ou departamento usa uma ferramenta diferente (Google Forms, planilhas, agências terceiras descontroladas).
   - Responsabilidade legal sobre vazamento de listas com nomes, e-mails e telefones de colaboradores.
3. **Contexto de uso:**
   - Dashboard de BI em reuniões com o Comitê Executivo e Auditoria Interna.
4. **Responsabilidades:**
   - Aprovar a contratação corporativa do SaaS, aprovar a política de eventos e responder por auditorias externas.
5. **Necessidades funcionais:**
   - Multi-tenancy com hierarquia (Organização → Filiais → Centros de Custo → Eventos).
   - Trilhas de auditoria (Audit Trails) completas e imutáveis.
   - Termos de consentimento e privacidade adequados à LGPD no fluxo público de RSVP.
6. **Necessidades de informação:**
   - Custo total anual por colaborador em confraternizações; índice geral de participação; conformidade de aprovações.
7. **Permissões esperadas:**
   - Visualização irrestrita de todas as unidades, sem permissão operacional de edição de dados locais.
8. **Tarefas mais frequentes:**
   - Consultar relatórios trimestrais consolidados de investimentos em eventos e indicadores de satisfação.
9. **Cenários críticos:**
   - Notificação da ANPD por vazamento de dados de lista de convidados em link desprotegido; fraude em aprovação de custos.
10. **Critérios de sucesso:**
    - Homologação bem-sucedida pelo time de Segurança da Informação da empresa; consolidação de 100% dos eventos corporativos em uma única plataforma oficial.
11. **Funcionalidades atendidas pelo sistema:**
    - Banco de dados Supabase com RLS ativado em todas as tabelas (`alter table public.events enable row level security`).
12. **Funcionalidades parcialmente atendidas:**
    - Política de privacidade e termos presentes no rodapé, mas sem checkbox de consentimento explícito registrado no banco de dados durante o RSVP público.
13. **Funcionalidades ausentes:**
    - Multi-empresa (Multi-tenancy corporativo); controle RBAC com perfis Executivo, Auditor, Gerente e Operador; auditoria de logs de acessos a dados sensíveis.
14. **Barreiras de usabilidade:**
    - Ausência de filtros de alto nível para navegar entre filiais ou períodos fiscais plurianuais.
15. **Evidências no código que sustentam o perfil:**
    - As notas no `docs/REFERENCIAL_TEÓRICO.md` abordam LGPD e OWASP, comprovando consciência teórica da equipe, embora a implementação de multi-tenancy ainda não tenha sido codificada.
16. **Hipóteses ainda não confirmadas:**
    - Disposição de empresas grandes em pagar licença enterprise para um software focado em confraternizações.

---

## PARTE 2: AS QUATRO PERSONAS DO SEGMENTO DE EVENTOS PROFISSIONAIS

---

### Persona 7 — Responsável por Pequena Empresa de Eventos
**Nome Fictício:** Beatriz Lins  
**Cargo:** Produtora Independente / Proprietária de Assessoria de Eventos  
**Segmento:** Festas Infantis, Aniversários de 15 anos e Pequenas Confraternizações  
**Nível:** Proprietária Operacional

1. **Objetivos principais:**
   - Organizar de 3 a 6 eventos por mês sem se perder em listas de papel e mensagens de WhatsApp dos clientes.
   - Passar uma imagem profissional e moderna para os clientes contratantes.
2. **Dores e dificuldades:**
   - Faz tudo sozinha: atendimento, visitas técnicas, listas de compras, contato com fornecedores e organização no dia.
   - Clientes trocam a lista de convidados a cada 2 dias e mandam prints ilegíveis de conversas.
3. **Contexto de uso:**
   - Uso diário e móvel: 70% no smartphone durante visitas e compras; 30% no notebook à noite.
4. **Responsabilidades:**
   - Criar os eventos, configurar os links, repassar o link aos contratantes, conferir confirmações e repassar ao buffet.
5. **Necessidades funcionais:**
   - Criação rápida de eventos em lista/calendário.
   - Compartilhamento de links que o contratante possa divulgar aos seus amigos/família.
   - Checklist de tarefas e fornecedores com status de pendência.
6. **Necessidades de informação:**
   - Contagem precisa de convidados confirmados, desistências e itens pendentes de compra.
7. **Permissões esperadas:**
   - Gestora geral de todos os eventos criados em sua conta.
8. **Tarefas mais frequentes:**
   - Adicionar itens de fornecedores, checar status de RSVP dos eventos do final de semana, atualizar tarefas.
9. **Cenários críticos:**
   - O buffet preparar comida para 100 pessoas e comparecerem 140, gerando crise de relacionamento com o cliente.
10. **Critérios de sucesso:**
    - Lista de presença precisa fechada com 48h de antecedência; economia de pelo menos 10 horas semanais de mensagens manuais.
11. **Funcionalidades atendidas pelo sistema:**
    - O fluxo completo de criação de evento, link público, acompanhamento de presença e calendário atende com excelência.
12. **Funcionalidades parcialmente atendidas:**
    - Gestão de múltiplos eventos: o dashboard lista os eventos, mas mistura eventos finalizados com ativos sem separação por cliente.
13. **Funcionalidades ausentes:**
    - Associação do evento a um "Cliente Contratante" com visualização restrita para esse cliente.
14. **Barreiras de usabilidade:**
    - Mistura de vocabulário de divisão de custos ("rateio") com termos de produção profissional.
15. **Evidências no código que sustentam o perfil:**
    - A tela `/calendar` com visualização integrada mensal/diária e a tabela `items` atendem exatamente a dinâmica de quem gerencia cronogramas do mês.
16. **Hipóteses ainda não confirmadas:**
    - Se produtoras independentes estão dispostas a pagar assinatura mensal recorrente de R$ 49 a R$ 99.

---

### Persona 8 — Gerente ou Coordenador de Eventos (Cerimonialista)
**Nome Fictício:** Patricia Albuquerque  
**Cargo:** Coordenadora Chefe de Cerimonial (Casamentos e Formaturas)  
**Segmento:** Casamentos de Médio e Alto Padrão, Bailes de Formatura  
**Nível:** Tático / Operacional Avançado

1. **Objetivos principais:**
   - Conduzir o planejamento completo de casamentos que duram de 6 a 12 meses de preparação.
   - Coordenar 15 a 30 fornecedores por evento (Buffet, Decoração, Florista, DJ, Banda, Iluminação, Segurança, Bartender, Fotografia, Filmagem).
   - Manter os noivos calmos e com visibilidade clara das pendências sem que eles alterem o que não devem.
2. **Dores e dificuldades:**
   - Casamentos têm dinâmicas muito específicas: mesas marcadas, restrições alimentares severas (veganos, celíacos), presentes/cotas de lua de mel e protocolo de entrada.
   - O rateio colaborativo entre convidados é **totalmente ofensivo** para casamentos (convidado não paga nada no evento).
   - Noivos perdem o sono cobrando confirmações de padrinhos e parentes.
3. **Contexto de uso:**
   - Acesso em escritórios de reunião com noivos e uso intenso de tablet/celular nos ensaios e no dia do evento.
4. **Responsabilidades:**
   - Alimentar cronograma minuto a minuto (R.O. - Roteiro Operacional), controlar confirmação ativa de presença e conferir entregas dos fornecedores.
5. **Necessidades funcionais:**
   - Cadastro detalhado de fornecedores com valores contratados, pagamentos e responsáveis.
   - RSVP passivo (link) e ativo (registro manual por telefone/WhatsApp).
   - Campos de restrição alimentar e necessidades de acessibilidade dos convidados.
6. **Necessidades de informação:**
   - Quantidade de adultos, crianças e fornecedores que vão comer no evento; lista alfabética de convidados para a recepção.
7. **Permissões esperadas:**
   - A cerimonialista edita tudo; os noivos visualizam e aprovam itens; a recepcionista no dia apenas dá check-in.
8. **Tarefas mais frequentes:**
   - Checar confirmações de presença, aprovar acompanhantes solicitados pelos noivos, revisar custos contratados de fornecedores.
9. **Cenários críticos:**
   - Falta de lugares nas mesas por erro na lista de confirmação; esquecimento de refeição especial para convidado celíaco.
10. **Critérios de sucesso:**
    - Recepção na entrada do casamento fluida, sem filas; noivos elogiando a organização impecável.
11. **Funcionalidades atendidas pelo sistema:**
    - O banco de dados do Supabase possui os campos `dietary_restrictions` e `accessibility_needs` na tabela `guests`!
12. **Funcionalidades parcialmente atendidas:**
    - O formulário público de RSVP ainda não expõe esses campos de forma clara para o convidado preencher suas alergias e restrições alimentares.
13. **Funcionalidades ausentes:**
    - Módulo de Roteiro Operacional (cronograma minuto a minuto da cerimônia/festa); mapa de mesas; lista de presentes/cotas.
14. **Barreiras de usabilidade:**
    - O visual escuro com tema de churrasco que existia anteriormente era inadequado (o redesign recente resolveu parte dessa percepção).
15. **Evidências no código que sustentam o perfil:**
    - A presença das colunas `dietary_restrictions` e `accessibility_needs` no `schema.sql` prova que a equipe de engenharia já antecipou essa necessidade de casamentos e festas formais.
16. **Hipóteses ainda não confirmadas:**
    - Se cerimonialistas preferem um software dedicado apenas a casamentos ou se adotariam o Planeja+ como plataforma flexível.

---

### Persona 9 — Responsável Comercial ou de Atendimento de Espaço de Eventos
**Nome Fictício:** Leonardo Prado  
**Cargo:** Gerente Comercial de Espaço de Festas / Buffet  
**Segmento:** Casas de Festas, Espaços de Eventos e Buffets  
**Nível:** Comercial / Atendimento ao Cliente

1. **Objetivos principais:**
   - Vender pacotes de eventos para clientes corporativos ou particulares e acompanhar a execução sem falhas contratuais.
   - Fornecer ao cliente contratante uma ferramenta moderna inclusa no pacote do espaço para fidelização e valor agregado.
2. **Dores e dificuldades:**
   - Clientes fecham contrato para 150 pessoas e tentam colocar 220 no dia do evento sem pagar o valor adicional por pessoa.
   - Discussões no pós-evento sobre cobranças extras de buffet e bebidas consumidas a mais.
3. **Contexto de uso:**
   - Apresentações comerciais para prospects e acompanhamento semanal das datas reservadas na agenda.
4. **Responsabilidades:**
   - Enviar propostas, fechar contratos, monitorar a contagem de confirmações para calcular o consumo previsto de buffet.
5. **Necessidades funcionais:**
   - Trava de capacidade máxima rígida do espaço (`capacity` estrita).
   - Cálculo automático do valor adicional caso o número de confirmados exceda o pacote contratado.
   - Visualização da disponibilidade do espaço em formato de agenda/calendário.
6. **Necessidades de informação:**
   - Total de convidados confirmados por evento com prazo limite (RSVP deadline).
7. **Permissões esperadas:**
   - Administrador do Espaço: gerencia todos os eventos agendados no local e define a capacidade física limite.
8. **Tarefas mais frequentes:**
   - Verificar a agenda de datas disponíveis, checar se o contratante do próximo sábado já fechou a lista final de presenças.
9. **Cenários críticos:**
   - Superlotação do espaço gerando multa dos bombeiros ou falta de insumos no buffet.
10. **Critérios de sucesso:**
    - Lista final congelada e auditada exatamente na data limite (`rsvp_deadline`), permitindo ao buffet comprar insumos com precisão.
11. **Funcionalidades atendidas pelo sistema:**
    - O campo `capacity` e `rsvp_deadline` na tabela `events` e a rota de validação pública com bloqueio após a data limite.
12. **Funcionalidades parcialmente atendidas:**
    - O sistema avisa que a capacidade foi atingida, mas não calcula o valor de aditivo contratual para pessoas excedentes.
13. **Funcionalidades ausentes:**
    - Emissão de propostas comerciais e controle de contratos assinados.
14. **Barreiras de usabilidade:**
    - Não poder vincular múltiplos eventos ao mesmo espaço físico para evitar conflito de datas e horários (Double Booking).
15. **Evidências no código que sustentam o perfil:**
    - A lógica de expiração por prazo (`rsvp_deadline`) e cálculo de capacidade (`capacityLine`) já implementada em `app/event/[id]/page.tsx`.
16. **Hipóteses ainda não confirmadas:**
    - Se buffets e casas de eventos contratariam o Planeja+ no modelo white-label para oferecer com a marca própria deles.

---

### Persona 10 — Cliente Contratante (Noivo, Anfitrião ou Patrocinador)
**Nome Fictício:** Juliana & Thiago (Noivos) / Renato (Diretor Comercial contratante de confraternização)  
**Cargo:** Cliente Final que contratou o cerimonial ou a empresa de eventos  
**Segmento:** Usuário Contratante / Stakeholder  
**Nível:** Patrocinador / Visualizador Autorizado

1. **Objetivos principais:**
   - Ter a tranquilidade de acompanhar em tempo real quantas pessoas já confirmaram presença no seu casamento ou evento corporativo sem precisar ligar para o organizador todo dia.
   - Saber quem pediu acompanhante e aprovar com um clique quem realmente faz sentido comparecer.
2. **Dores e dificuldades:**
   - Ansiedade sobre a presença de pessoas queridas ou clientes estratégicos.
   - Medo de ser cobrado por convidados adicionais sem ter autorizado previamente.
   - Dificuldade para lidar com tecnologia complexa; quer apenas uma interface bonita, limpa e convidativa.
3. **Contexto de uso:**
   - Acesso móvel casual, abrindo o link do celular no sofá ou no trânsito para ver quem confirmou hoje.
4. **Responsabilidades:**
   - Indicar nomes de amigos/familiares ou convidados VIP, aprovar ou barrar pedidos de acompanhantes.
5. **Necessidades funcionais:**
   - Portal do Cliente simples (modo somente leitura com botão de aprovação de acompanhante).
   - Estatísticas visuais de presença (gráfico pizza ou barra de progresso simples).
6. **Necessidades de informação:**
   - Lista resumida: Confirmados, Pendentes, Recusados e Acompanhantes em Análise.
7. **Permissões esperadas:**
   - Apenas visualizador do seu próprio evento com permissão restrita para aprovar acompanhantes, sem permissão para mexer em configurações técnicas ou excluir o evento.
8. **Tarefas mais frequentes:**
   - Abrir o dashboard do evento, ver o número de confirmados subindo, clicar em "Aprovar" em uma solicitação de acompanhante.
9. **Cenários críticos:**
   - O contratante excluir o evento por engano ao tentar mexer na lista; o contratante ver valores internos de margem de lucro do cerimonialista.
10. **Critérios de sucesso:**
    - Sentimento de controle e segurança absoluta sobre o andamento do evento; experiência visual elegante e sem ruído.
11. **Funcionalidades atendidas pelo sistema:**
    - O card de demonstração e a barra de confirmação (`18/24 confirmados`) transmitem exatamente essa clareza visual.
12. **Funcionalidades parcialmente atendidas:**
    - A tela de detalhes do evento (`/event/[id]`) hoje expõe botões de edição de evento e adição de gastos que não deveriam estar visíveis para um cliente contratante.
13. **Funcionalidades ausentes:**
    - Link de acesso exclusivo de Cliente (Portal do Contratante com visão restrita e sem botões administrativos).
14. **Barreiras de usabilidade:**
    - Exigir que o cliente crie conta completa de organizador para conseguir ver a lista de convidados do seu próprio evento.
15. **Evidências no código que sustentam o perfil:**
    - A rota `app/api/public-events/[token]/route.ts` já possui a estrutura de expor dados do evento de forma seletiva via token, podendo ser estendida para criar um modo de visualização exclusivo de contratante.
16. **Hipóteses ainda não confirmadas:**
    - Se noivos ou anfitriões preferem receber notificações de confirmação via e-mail diário (digest) ou acessar a tela em tempo real.

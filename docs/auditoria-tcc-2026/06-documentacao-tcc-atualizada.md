## 13 REGRAS DE NEGÓCIO

As regras de negócio a seguir descrevem as políticas e restrições do domínio de organização de eventos, ou seja, as condições que valem independentemente da tela ou da tecnologia utilizada. O que o sistema faz para cumprir cada regra está descrito nos requisitos funcionais indicados na coluna Requisitos Relacionados.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-001 | Unicidade da conta de usuário | RF-001, RF-002, RF-003, RF-004 |

**Detalhamento:** Cada conta pertence a uma única pessoa e é identificada por um e-mail exclusivo: não podem existir duas contas com o mesmo e-mail. A senha deve ter no mínimo 6 caracteres. Os dados, contatos e eventos de uma conta pertencem somente ao seu titular, sendo a sessão e os dados temporários locais limpos ao encerrar o acesso.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-002 | Titularidade do evento | RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-012, RF-024, RF-025, RF-029, RF-033, RF-037, RF-038 |

**Detalhamento:** Todo evento tem exatamente um organizador, que é o usuário que o criou. Somente o organizador pode editar ou excluir o evento e gerenciar seus dados internos (lista de convidados, acompanhantes, gastos, solicitações, fotos e análises). Quando habilitado pelo organizador por meio de link exclusivo com token, o anfitrião ou contratante externo pode apenas visualizar em modo de leitura os indicadores autorizados, sem permissão de alteração.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-003 | Dados obrigatórios do evento | RF-005, RF-007 |

**Detalhamento:** Um evento só pode ser registrado com nome, tipo, data e horário de início, além de local físico (em eventos presenciais ou híbridos) ou link de reunião (em eventos online ou híbridos). Quando informado na mesma data, o horário de término deve ser posterior ao de início, e o orçamento previsto não pode ser negativo.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-004 | Status de presença do convidado | RF-010, RF-011, RF-013, RF-015, RF-016, RF-017, RF-033 |

**Detalhamento:** Todo convidado cadastrado pelo organizador começa com o status Pendente. Na lista de presença, o status muda para Confirmado ou Recusado pela resposta do próprio convidado no link de confirmação ou por registro do organizador. No controle de convites e solicitações públicas, o registro também pode assumir os estados operacionais Aguardando Aprovação, Expirado ou Cancelado.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-005 | Contagem de participantes confirmados | RF-006, RF-009, RF-013, RF-026, RF-036, RF-037 |

**Detalhamento:** O total de participantes confirmados de um evento é a soma dos convidados com status Confirmado e de seus acompanhantes aprovados. Convidados Pendentes, Recusados ou não aprovados e acompanhantes não aprovados não entram nessa contagem.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-006 | Validade do convite público | RF-014, RF-015, RF-016, RF-029, RF-035 |

**Detalhamento:** Cada link público de evento e cada convite individual de confirmação é identificado por um token único e pertence a um único evento ou convidado. Um token desativado, expirado, inexistente, de evento com vagas esgotadas ou de evento excluído não aceita respostas, e o convidado é informado de que o convite não é mais válido.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-007 | Visibilidade dos dados do evento | RF-014, RF-015, RF-016, RF-029, RF-035, RF-038 |

**Detalhamento:** Pelo link público, o convidado externo vê apenas nome, data, horário, modalidade, local público e descrição do evento, sendo links privados de transmissão exibidos apenas aos participantes confirmados. A lista de convidados, os gastos, as solicitações e as análises do evento permanecem restritos ao organizador, exceto na consulta somente-leitura compartilhada por token exclusivo do anfitrião.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-008 | Aprovação de solicitações de participação | RF-016, RF-017 |

**Detalhamento:** Somente eventos com link público ativo aceitam solicitações de participação. Com a moderação padrão ativa, toda solicitação nasce aguardando aprovação e só o organizador pode aprová-la ou rejeitá-la; opcionalmente, o organizador pode ativar a aprovação automática dentro do limite de capacidade do evento. A solicitação aprovada passa a integrar a lista de convidados; a rejeitada não gera convidado na lista ativa.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-009 | Aprovação de acompanhantes | RF-010, RF-013, RF-015, RF-016, RF-017, RF-036 |

**Detalhamento:** Em eventos que permitam acompanhantes, o convidado pode indicar acompanhantes ao confirmar presença, respeitando o limite máximo definido pelo organizador. Quando exigida aprovação, os acompanhantes ficam pendentes até a deliberação do organizador e só passam a contar como participantes depois de aprovados.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-010 | Vínculo e valor dos itens | RF-018, RF-019, RF-020 |

**Detalhamento:** Todo item ou gasto pertence a um único evento e deve ter um nome e quantidade positiva. O valor não pode ser negativo; o item sem valor informado conta como R\$ 0,00. O responsável pode ser um convidado, um contato ou um nome digitado livremente.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-011 | Cálculo do custo total | RF-021, RF-026, RF-027, RF-037 |

**Detalhamento:** O custo total de um evento é a soma dos valores de todos os seus itens ativos cadastrados. Ao criar, editar ou remover um item, o custo total passa a considerar imediatamente a nova situação; itens removidos deixam de compor o total.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-012 | Rateio do valor por pessoa | RF-021, RF-026, RF-034, RF-037 |

**Detalhamento:** Em eventos configurados na modalidade de Rateio Colaborativo, o valor por pessoa é o custo total dividido pelo número de participantes confirmados, arredondado para duas casas decimais. Com nenhum participante confirmado, o valor por pessoa não é calculado.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-013 | Orçamento previsto como referência | RF-005, RF-007, RF-021, RF-034, RF-037 |

**Detalhamento:** Em eventos configurados na modalidade de Orçamento Previsto, o orçamento é um valor de referência definido pelo organizador e serve para comparação com o custo total. Gastos acima do orçamento não são bloqueados, pois representam o custo real do evento, mas a diferença fica visível para o organizador.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-014 | Propriedade dos contatos | RF-022, RF-023 |

**Detalhamento:** Os contatos e listas de contatos pertencem ao usuário que os cadastrou e podem ser reaproveitados como convidados em vários eventos. Editar ou excluir um contato não altera os convidados já adicionados a eventos existentes.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-015 | Exclusão de evento em cascata | RF-008 |

**Detalhamento:** Ao excluir um evento mediante confirmação nominal de seu título, seus convidados, acompanhantes, itens, fotos, solicitações e convites públicos são excluídos junto com ele, e os links públicos do evento deixam de funcionar. A exclusão só pode ser feita pelo organizador.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-016 | Abrangência das métricas | RF-012, RF-026, RF-027, RF-037 |

**Detalhamento:** As métricas do dashboard, das análises e dos relatórios consideram somente os eventos do próprio organizador. Eventos excluídos e convidados removidos deixam de ser contabilizados.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-017 | Envio de lembretes de confirmação | RF-030, RF-031 |

**Detalhamento:** Somente convidados com status Pendente e e-mail válido cadastrado recebem lembretes de confirmação. Convidados que já confirmaram ou recusaram não recebem novos lembretes daquele evento.

| ID | Título | Requisitos Relacionados |
|---|---|---|
| RN-018 | Remoção de fotos do evento | RF-028 |

**Detalhamento:** Toda foto pertence a um único evento e registra quem a enviou e quando. Apenas o organizador do evento pode adicionar ou remover fotos, e uma foto removida deixa de aparecer na galeria.

---

## 14 REQUISITOS FUNCIONAIS

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-001 | Cadastrar usuário | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que novos usuários criem uma conta informando nome, e-mail e senha.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-002 | Autenticar usuário | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que usuários cadastrados acessem a plataforma informando e-mail e senha, iniciando uma sessão autenticada.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-003 | Encerrar sessão | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o usuário encerre sua sessão de forma segura, limpando credenciais e dados locais armazenados no navegador.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-004 | Restringir acesso às áreas privadas | Finalizado | Alta |

**Detalhamento:** O sistema deve impedir que usuários não autenticados acessem áreas privadas, como dashboard, eventos, contatos, calendário e perfil.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-005 | Cadastrar evento | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o usuário crie eventos informando nome, tipo, categoria, data, horário, modalidade, local ou link de reunião, descrição, orçamento e imagem/banner.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-006 | Listar eventos do usuário | Finalizado | Alta |

**Detalhamento:** O sistema deve exibir os eventos cadastrados pelo usuário autenticado no dashboard.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-007 | Editar evento | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o usuário edite informações cadastrais, operacionais e financeiras de eventos criados por ele.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-008 | Excluir evento | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o usuário exclua eventos criados por ele mediante confirmação nominal do título do evento.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-009 | Consultar detalhes do evento | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o usuário visualize uma página detalhada com informações do evento, convidados, solicitações, itens, custos, fotos e análises.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-010 | Cadastrar convidado | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o usuário adicione convidados a um evento.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-011 | Editar convidado | Finalizado | Média |

**Detalhamento:** O sistema deve permitir editar nome, e-mail, telefone e status de um convidado.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-012 | Excluir convidado | Finalizado | Média |

**Detalhamento:** O sistema deve permitir remover convidados de um evento.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-013 | Atualizar status de presença | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir classificar convidados como pendentes, confirmados ou recusados.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-014 | Gerar link público de convite | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o organizador gere, ative, desative ou regenere um link público para convite ou confirmação de presença.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-015 | Responder convite (RSVP) | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que convidados confirmem ou recusem presença por meio de um link de confirmação válido.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-016 | Solicitar participação em evento | Finalizado | Média |

**Detalhamento:** O sistema deve permitir que pessoas externas solicitem participação em eventos com convite público ativo.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-017 | Avaliar solicitação de participação | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir que o organizador aprove ou rejeite solicitações de participação.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-018 | Cadastrar item do evento | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir adicionar itens ou despesas vinculadas ao evento, persistindo-os no banco de dados.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-019 | Editar item do evento | Finalizado | Média |

**Detalhamento:** O sistema deve permitir editar nome, quantidade, valor, situação de pagamento, responsável e observações de itens do evento.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-020 | Excluir item do evento | Finalizado | Média |

**Detalhamento:** O sistema deve permitir remover itens ou despesas cadastradas no evento.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-021 | Calcular custo total do evento | Finalizado | Alta |

**Detalhamento:** O sistema deve calcular automaticamente o custo total com base nos itens cadastrados.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-022 | Manter contatos | Finalizado | Média |

**Detalhamento:** O sistema deve permitir cadastrar, organizar em listas, editar, listar e remover contatos.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-023 | Importar contato como convidado | Finalizado | Média |

**Detalhamento:** O sistema deve permitir adicionar contatos e listas de contatos cadastrados como convidados de eventos.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-024 | Exibir calendário de eventos | Finalizado | Alta |

**Detalhamento:** O sistema deve exibir os eventos cadastrados em formato de calendário.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-025 | Acessar evento pelo calendário | Finalizado | Média |

**Detalhamento:** O sistema deve permitir abrir os detalhes de um evento a partir do calendário.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-026 | Exibir painel de indicadores | Finalizado | Alta |

**Detalhamento:** O sistema deve exibir um painel com resumo dos eventos, convidados, confirmações de presença e custos.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-027 | Exibir análises e gráficos | Finalizado | Média |

**Detalhamento:** O sistema deve exibir gráficos e métricas sobre eventos, convidados, RSVP e custos.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-028 | Manter galeria de fotos | Finalizado | Baixa |

**Detalhamento:** O sistema deve permitir adicionar, visualizar, baixar e remover fotos vinculadas a eventos.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-029 | Exportar evento em formato ICS | Finalizado | Baixa |

**Detalhamento:** O sistema deve gerar um arquivo ou feed ICS autenticado para integração com calendários externos.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-030 | Enviar convites e lembretes | Finalizado | Média |

**Detalhamento:** O sistema deve permitir envio de convites e lembretes para convidados pendentes com e-mail válido, quando houver integração disponível.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-031 | Executar rotinas automáticas | Finalizado | Média |

**Detalhamento:** O sistema deve possuir jobs para lembretes, limpeza de dados, sincronização de calendário e agregação de métricas.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-032 | Registrar execução das rotinas automáticas | Finalizado | Média |

**Detalhamento:** O sistema deve registrar status, horário, duração, logs e erros das execuções automatizadas.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-033 | Importar convidados em lote via planilha | Finalizado | Média |

**Detalhamento:** O sistema deve permitir importar listas de convidados em lote a partir de arquivos ou colagem em formato CSV ou TSV, com pré-visualização antes do cadastro.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-034 | Configurar modalidade financeira do evento | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir configurar o evento sob a modalidade de Orçamento Previsto ou de Rateio Colaborativo, aplicando os cálculos correspondentes.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-035 | Registrar restrições alimentares e acessibilidade | Finalizado | Média |

**Detalhamento:** O sistema deve permitir que convidados informem restrições alimentares e necessidades de acessibilidade ao responder ao convite, consolidando esses dados para o evento.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-036 | Gerenciar acompanhantes de convidados | Finalizado | Alta |

**Detalhamento:** O sistema deve permitir a indicação nominal de acompanhantes dentro do limite configurado e sua aprovação ou rejeição pelo organizador.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-037 | Exportar relatórios gerenciais em PDF e CSV | Finalizado | Média |

**Detalhamento:** O sistema deve permitir configurar, pré-visualizar e emitir relatórios gerenciais em PDF padrão A4 (resumo executivo, dossiê completo, financeiro e comparativo) e exportar dados em CSV.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RF-038 | Disponibilizar portal somente-leitura do anfitrião | Finalizado | Baixa |

**Detalhamento:** O sistema deve permitir que o organizador compartilhe um link exclusivo em modo somente-leitura para acompanhamento de presença, restrições e resumo financeiro pelo anfitrião ou contratante.

---

## 15 REQUISITOS NÃO FUNCIONAIS

Cada requisito não funcional a seguir apresenta a métrica utilizada, a meta a ser alcançada e a forma de verificação, de modo que o seu atendimento possa ser medido de forma objetiva.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-001 | Usabilidade da interface | Em Andamento | Alta |

**Detalhamento:** Um usuário sem treinamento deve conseguir realizar as tarefas principais com poucos passos e sem ajuda.  
**Métrica:** tempo para criar um evento completo; número de cliques para o convidado responder ao convite; nota na escala SUS (System Usability Scale).  
**Meta:** criar um evento em até 5 minutos; responder ao convite em até 3 cliques após abrir o link; taxa de conclusão das tarefas de pelo menos 90%; nota SUS igual ou superior a 70.  
**Verificação:** teste de usabilidade com no mínimo 5 participantes, com tarefas cronometradas e aplicação do questionário SUS.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-002 | Adaptação a diferentes tamanhos de tela | Finalizado | Alta |

**Detalhamento:** A aplicação deve funcionar em celulares, tablets e computadores sem perda de funcionalidade.  
**Métrica:** largura de tela suportada, presença de rolagem horizontal e tamanho das áreas de toque nos botões principais.  
**Meta:** telas utilizáveis de 360 px a 1920 px de largura, sem rolagem horizontal, com botões de ação principal de no mínimo 44 px de altura.  
**Verificação:** verificação automatizada dos padrões do Design System e inspeção das telas nas larguras de 360, 768, 1280 e 1920 px pelo modo responsivo.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-003 | Tempo de carregamento e de resposta | Em Andamento | Alta |

**Detalhamento:** As páginas e as respostas do sistema devem ser rápidas o suficiente para não interromper o uso.  
**Métrica:** tempo de carregamento do maior elemento da página (LCP), tempo de resposta da API e pontuação de desempenho do Lighthouse.  
**Meta:** LCP de até 2,5 segundos nas páginas principais em conexão 4G; 95% das respostas da API em até 800 ms; pontuação de desempenho do Lighthouse igual ou superior a 80.  
**Verificação:** relatórios do Lighthouse e registros de tempo de resposta da Vercel.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-004 | Controle de acesso e limite de requisições | Finalizado | Alta |

**Detalhamento:** O sistema deve impedir o acesso às áreas privadas e o abuso das rotas públicas.  
**Métrica:** proporção de rotas privadas protegidas, regras de senha, aleatoriedade dos tokens de convite e limite de requisições nas rotas públicas.  
**Meta:** 100% das rotas privadas e das APIs que alteram dados recusam requisições sem sessão válida (redirecionamento para o login ou HTTP 401); senha com no mínimo 6 caracteres; tokens de convite com 128 bits aleatórios; rotas públicas limitadas a no máximo 20 requisições por minuto por IP.  
**Verificação:** testes automatizados que verificam o bloqueio de rotas privadas sem sessão, a entropia criptográfica dos tokens e o bloqueio de requisições acima do limite por IP.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-005 | Isolamento dos dados por usuário | Finalizado | Alta |

**Detalhamento:** Cada usuário deve visualizar e gerenciar apenas seus próprios eventos, contatos e informações.  
**Métrica:** quantidade de registros de outros usuários retornados nas consultas e proporção de tabelas com Row Level Security (RLS).  
**Meta:** nenhum registro de outro usuário retornado em qualquer consulta; RLS ativa em 100% das tabelas que guardam dados de usuários e limpeza do armazenamento local ao encerrar a sessão.  
**Verificação:** verificação automatizada das políticas RLS no banco de dados, do controle de titularidade e da limpeza de sessão.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-006 | Validação dos dados de entrada | Finalizado | Alta |

**Detalhamento:** As entradas de formulários e da API devem ser validadas antes de qualquer gravação.  
**Métrica:** proporção de ações de escrita e endpoints com validação no servidor e comportamento diante de dados inválidos.  
**Meta:** 100% das ações de servidor e endpoints de escrita validados com esquemas Zod no servidor; dados inválidos retornam erro estruturado (HTTP 400) e não gravam nada no banco.  
**Verificação:** testes automatizados que enviam dados inválidos e campos não autorizados para os validadores do servidor e conferem a rejeição.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-007 | Exatidão dos indicadores e custos | Finalizado | Alta |

**Detalhamento:** Os números exibidos devem corresponder exatamente aos dados cadastrados.  
**Métrica:** diferença entre o custo total exibido e a soma dos itens, e diferença entre os indicadores de presença e os status dos convidados e acompanhantes.  
**Meta:** diferença zero em todas as telas e relatórios; após qualquer alteração, os indicadores do evento e do dashboard refletem os novos dados na atualização da página.  
**Verificação:** testes automatizados que criam, editam e removem itens, convidados e acompanhantes e comparam os valores calculados entre o domínio, o painel e os relatórios em PDF.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-008 | Disponibilidade do sistema | Em Andamento | Alta |

**Detalhamento:** A aplicação deve permanecer acessível pela internet, hospedada na Vercel.  
**Métrica:** percentual de tempo em que a aplicação responde normalmente em um mês.  
**Meta:** disponibilidade mensal de pelo menos 99%, o que equivale a no máximo cerca de 7 horas fora do ar por mês.  
**Verificação:** monitoramento de disponibilidade da Vercel ou de um serviço de uptime, com verificação a cada 5 minutos.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-009 | Capacidade de usuários e eventos | Em Andamento | Alta |

**Detalhamento:** A arquitetura deve suportar o crescimento de usuários e de eventos sem perda de desempenho.  
**Métrica:** número de usuários simultâneos e de convidados por evento suportados mantendo os tempos do RNF-003.  
**Meta:** 100 usuários simultâneos e eventos com até 500 convidados, mantendo as metas de desempenho do RNF-003.  
**Verificação:** teste de carga com a ferramenta k6 simulando os fluxos de dashboard, página do evento e resposta ao convite.

| ID | Título | Status | Prioridade |
|---|---|---|---|
| RNF-010 | Manutenibilidade do código | Finalizado | Alta |

**Detalhamento:** O código deve ser organizado de forma que novas funcionalidades possam ser adicionadas com segurança.  
**Métrica:** cobertura funcional das regras de negócio por testes automatizados, erros de lint e de tipagem no build e organização em camadas.  
**Meta:** 100% das regras de negócio e requisitos funcionais validados por testes automatizados; nenhum erro de ESLint ou TypeScript no build de produção; separação modular entre domínio, ações de servidor e componentes.  
**Verificação:** execução automatizada da suíte de testes do Node.js, do ESLint, do TypeScript e do build no pipeline de integração contínua (GitHub Actions).

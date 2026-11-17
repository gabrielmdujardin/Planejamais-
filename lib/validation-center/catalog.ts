import { RequirementItem } from "./types"

export const REQUIREMENTS_CATALOG: RequirementItem[] = [
  // ==========================================
  // REGRAS DE NEGÓCIO (RN-001 a RN-018) - 18 ITENS
  // ==========================================
  {
    id: "RN-001",
    category: "RN",
    number: 1,
    title: "Unicidade da conta de usuário",
    description:
      "Cada conta pertence a uma única pessoa e é identificada por um e-mail exclusivo: não podem existir duas contas com o mesmo e-mail. A senha deve ter no mínimo 6 caracteres. Os dados, contatos e eventos de uma conta pertencem somente ao seu titular, sendo a sessão e os dados temporários locais limpos ao encerrar o acesso.",
    explanation:
      "Garante a individualidade e segurança de cada organizador: e-mail exclusivo no cadastro, senha forte com mínimo de 6 caracteres e segregação completa de dados e eventos entre organizadores.",
    relatedReqs: ["RF-001", "RF-002", "RF-003", "RF-004"],
    expectedBehavior:
      "Rejeitar e-mail em formato inválido; rejeitar senha com menos de 6 caracteres; aceitar credenciais válidas com normalização em minúsculas; assegurar titularidade estrita da conta.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-002",
    category: "RN",
    number: 2,
    title: "Titularidade do evento e gerenciamento colaborativo (RBAC)",
    previousWording:
      "Todo evento tem exatamente um organizador, que é o usuário que o criou. Somente o organizador pode editar ou excluir o evento e consultar seus dados internos (lista de convidados, gastos, solicitações e análises).",
    description:
      "Todo evento deverá possuir exatamente um proprietário, inicialmente definido como o usuário responsável por sua criação. O proprietário terá controle integral sobre o evento, podendo gerenciar seus dados, convidar outros usuários, atribuir papéis, configurar permissões, transferir a titularidade e realizar sua exclusão. O sistema deverá permitir o gerenciamento colaborativo por meio da inclusão de membros da equipe, aos quais poderão ser atribuídos diferentes papéis e níveis de acesso, conforme suas responsabilidades. As permissões deverão ser individuais e vinculadas ao respectivo evento, permitindo restringir operações de visualização, criação, edição e exclusão dos dados relacionados aos diferentes módulos do sistema. Somente o proprietário poderá excluir o evento ou transferir sua titularidade. Nenhum membro poderá conceder permissões superiores às suas próprias atribuições. O anfitrião ou contratante externo deverá continuar podendo visualizar os indicadores autorizados por meio de um link exclusivo com token, sem permissão de alteração.",
    explanation:
      "Arquitetura RBAC por evento: garante exatamente um Proprietário com controle total, permitindo distribuir responsabilidades operacionais entre Administradores, Colaboradores por módulo e Visualizadores, além do portal externo somente-leitura para o anfitrião.",
    relatedReqs: [
      "RF-004",
      "RF-005",
      "RF-006",
      "RF-007",
      "RF-008",
      "RF-009",
      "RF-012",
      "RF-024",
      "RF-025",
      "RF-029",
      "RF-033",
      "RF-037",
      "RF-038",
      "RF-039",
      "RF-040",
      "RF-041",
      "RF-042",
      "RF-043",
    ],
    expectedBehavior:
      "Validar os 20 cenários RBAC obrigatórios: proprietário único, convite e aceite de administrador/colaborador/visualizador, bloqueio de exclusão por administrador, escopo modular financeiro e de convidados, bloqueio de auto-elevação de privilégios, revogação imediata, transferência transacional de titularidade e retrocompatibilidade com eventos antigos.",
    testFiles: [
      "lib/domain/rbac.ts",
      "app/api/events/[eventId]/team/route.ts",
      "components/event-team-manager.tsx",
      "tests/regras-negocio-rn001-rn018.test.js",
    ],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-003",
    category: "RN",
    number: 3,
    title: "Dados obrigatórios do evento",
    description:
      "Um evento só pode ser registrado com nome, tipo, data e horário de início, além de local físico (em eventos presenciais ou híbridos) ou link de reunião (em eventos online ou híbridos). Quando informado na mesma data, o horário de término deve ser posterior ao de início, e o orçamento previsto não pode ser negativo.",
    explanation:
      "Impede o cadastro de eventos inconsistentes ou incompletos no sistema, garantindo integridade temporal (término após início) e coerência financeira (orçamento não negativo).",
    relatedReqs: ["RF-005", "RF-007"],
    expectedBehavior:
      "Rejeitar evento sem nome ou tipo; rejeitar horário final anterior ou igual ao inicial no mesmo dia; rejeitar orçamento negativo; validar modalidade física/online.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-004",
    category: "RN",
    number: 4,
    title: "Status de presença do convidado",
    description:
      "Todo convidado cadastrado pelo organizador começa com o status Pendente. Na lista de presença, o status muda para Confirmado ou Recusado pela resposta do próprio convidado no link de confirmação ou por registro do organizador. No controle de convites e solicitações públicas, o registro também pode assumir os estados operacionais Aguardando Aprovação, Expirado ou Cancelado.",
    explanation:
      "Padroniza a máquina de estados de presença: inicia em Pendente e transita de forma controlada para Confirmado ou Recusado, prevenindo estados ilegais na lista do evento.",
    relatedReqs: ["RF-010", "RF-011", "RF-013", "RF-015", "RF-016", "RF-017", "RF-033"],
    expectedBehavior:
      "Iniciar novo convidado como 'Pendente'; permitir transição para 'Confirmado' e 'Recusado'; rejeitar status inválido; calcular resumo por estado com exatidão.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-005",
    category: "RN",
    number: 5,
    title: "Contagem de participantes confirmados",
    description:
      "O total de participantes confirmados de um evento é a soma dos convidados com status Confirmado e de seus acompanhantes aprovados. Convidados Pendentes, Recusados ou não aprovados e acompanhantes não aprovados não entram nessa contagem.",
    explanation:
      "A contagem de participantes é a base de todo o dimensionamento do evento (buffet, espaço e rateio). Apenas convidados confirmados e acompanhantes expressamente aprovados somam à contagem.",
    relatedReqs: ["RF-006", "RF-009", "RF-013", "RF-026", "RF-036", "RF-037"],
    expectedBehavior:
      "Somar exatamente titulares confirmados + acompanhantes aprovados; ignorar convidados pendentes, recusados e acompanhantes rejeitados.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-006",
    category: "RN",
    number: 6,
    title: "Validade do convite público",
    description:
      "Cada link público de evento e cada convite individual de confirmação é identificado por um token único e pertence a um único evento ou convidado. Um token desativado, expirado, inexistente, de evento com vagas esgotadas ou de evento excluído não aceita respostas, e o convidado é informado de que o convite não é mais válido.",
    explanation:
      "Protege os links de convite e RSVP contra acessos indevidos e fraudes, validando formato alfanumérico seguro, unicidade e desativação imediata quando expirado ou desativado.",
    relatedReqs: ["RF-014", "RF-015", "RF-016", "RF-029", "RF-035"],
    expectedBehavior:
      "Gerar tokens seguros CSPRNG de 128 bits; validar formato; recusar resposta quando link público estiver desativado ou expirado.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-007",
    category: "RN",
    number: 7,
    title: "Visibilidade dos dados do evento",
    description:
      "Pelo link público, o convidado externo vê apenas nome, data, horário, modalidade, local público e descrição do evento, sendo links privados de transmissão exibidos apenas aos participantes confirmados. A lista de convidados, os gastos, as solicitações e as análises do evento permanecem restritos ao organizador, exceto na consulta somente-leitura compartilhada por token exclusivo do anfitrião.",
    explanation:
      "Princípio de Menor Privilégio e LGPD: a página pública nunca expõe lista interna de participantes, valores gastos, faturas pendentes ou anotações privadas do organizador.",
    relatedReqs: ["RF-014", "RF-015", "RF-016", "RF-029", "RF-035", "RF-038"],
    expectedBehavior:
      "Filtrar estritamente payload público: expor apenas nome, tipo, data e local; omitir lista de convidados, itens de custo, orçamento e anotações internas.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-008",
    category: "RN",
    number: 8,
    title: "Aprovação de solicitações de participação",
    description:
      "Somente eventos com link público ativo aceitam solicitações de participação. Com a moderação padrão ativa, toda solicitação nasce aguardando aprovação e só o organizador pode aprová-la ou rejeitá-la; opcionalmente, o organizador pode ativar a aprovação automática dentro do limite de capacidade do evento. A solicitação aprovada passa a integrar a lista de convidados; a rejeitada não gera convidado na lista ativa.",
    explanation:
      "Garante controle sobre quem entra no evento: solicitações externas passam por moderação do organizador antes de ocuparem vaga ou se tornarem convidados efetivos.",
    relatedReqs: ["RF-016", "RF-017"],
    expectedBehavior:
      "Criar solicitação externa com status 'pending_approval'; aprovação transita para convidado efetivo; rejeição mantém solicitação rejeitada sem inserção na lista principal.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-009",
    category: "RN",
    number: 9,
    title: "Aprovação de acompanhantes",
    description:
      "Em eventos que permitam acompanhantes, o convidado pode indicar acompanhantes ao confirmar presença, respeitando o limite máximo definido pelo organizador. Quando exigida aprovação, os acompanhantes ficam pendentes até a deliberação do organizador e só passam a contar como participantes depois de aprovados.",
    explanation:
      "Evita superlotação do evento: convidados não podem exceder o limite de acompanhantes configurado e acompanhantes pendentes não afetam a capacidade antes da aprovação do organizador.",
    relatedReqs: ["RF-010", "RF-013", "RF-015", "RF-016", "RF-017", "RF-036"],
    expectedBehavior:
      "Validar cota máxima de acompanhantes; registrar acompanhante como pendente de moderação; computar acompanhante apenas após aprovação expressa.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-010",
    category: "RN",
    number: 10,
    title: "Vínculo e valor dos itens",
    description:
      "Todo item ou gasto pertence a um único evento e deve ter um nome e quantidade positiva. O valor não pode ser negativo; o item sem valor informado conta como R$ 0,00. O responsável pode ser um convidado, um contato ou um nome digitado livremente.",
    explanation:
      "Garante consistência na planilha de custos: itens com quantidade >= 1, preço unitário >= 0, valor padrão R$ 0,00 quando omitido, vinculados estritamente a um evento.",
    relatedReqs: ["RF-018", "RF-019", "RF-020"],
    expectedBehavior:
      "Rejeitar nome vazio e quantidade <= 0; normalizar valor ausente para R$ 0,00; rejeitar valores monetários negativos; aceitar responsáveis convidados, contatos ou texto livre.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-011",
    category: "RN",
    number: 11,
    title: "Cálculo do custo total",
    description:
      "O custo total de um evento é a soma dos valores de todos os seus itens ativos cadastrados. Ao criar, editar ou remover um item, o custo total passa a considerar imediatamente a nova situação; itens removidos deixam de compor o total.",
    explanation:
      "Cálculo financeiro dinâmico e exato: somatório de (quantidade * valor_unitario) de todos os itens ativos, atualizado instantaneamente em tempo real.",
    relatedReqs: ["RF-021", "RF-026", "RF-027", "RF-037"],
    expectedBehavior:
      "Calcular a soma exata dos itens ativos com precisão de centavos; refletir imediatamente adição, edição de preço/quantidade e exclusão de itens.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-012",
    category: "RN",
    number: 12,
    title: "Rateio do valor por pessoa",
    description:
      "Em eventos configurados na modalidade de Rateio Colaborativo, o valor por pessoa é o custo total dividido pelo número de participantes confirmados, arredondado para duas casas decimais. Com nenhum participante confirmado, o valor por pessoa não é calculado.",
    explanation:
      "Regra central de rateio em churrascos, viagens e eventos entre amigos: custo total dividido pelos confirmados, com proteção segura contra divisão por zero.",
    relatedReqs: ["RF-021", "RF-026", "RF-034", "RF-037"],
    expectedBehavior:
      "Dividir custo total pelos participantes confirmados com 2 casas decimais; retornar nulo de forma segura com 0 confirmados sem erro de runtime.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-013",
    category: "RN",
    number: 13,
    title: "Orçamento previsto como referência",
    description:
      "Em eventos configurados na modalidade de Orçamento Previsto, o orçamento é um valor de referência definido pelo organizador e serve para comparação com o custo total. Gastos acima do orçamento não são bloqueados, pois representam o custo real do evento, mas a diferença fica visível para o organizador.",
    explanation:
      "Distingue orçamento corporativo de trava rígida: permite cadastrar custos reais acima do planejado, calculando saldo positivo ou déficit de estouro de verba.",
    relatedReqs: ["RF-005", "RF-007", "RF-021", "RF-034", "RF-037"],
    expectedBehavior:
      "Comparar custo total com o orçamento previsto; não bloquear itens adicionais; exibir déficit quando custos superarem o teto previsto.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-014",
    category: "RN",
    number: 14,
    title: "Propriedade dos contatos",
    description:
      "Os contatos e listas de contatos pertencem ao usuário que os cadastrou e podem ser reaproveitados como convidados em vários eventos. Editar ou excluir um contato não altera os convidados já adicionados a eventos existentes.",
    explanation:
      "Princípio de desacoplamento: a agenda de contatos é um catálogo global do usuário; importar um contato cria um snapshot independente no evento.",
    relatedReqs: ["RF-022", "RF-023"],
    expectedBehavior:
      "Vincular contatos estritamente ao organizador; criar cópia snapshot do convidado no evento, garantindo que alterações no contato original não corrompam o histórico do evento.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-015",
    category: "RN",
    number: 15,
    title: "Exclusão de evento em cascata",
    description:
      "Ao excluir um evento mediante confirmação nominal de seu título, seus convidados, acompanhantes, itens, fotos, solicitações e convites públicos são excluídos junto com ele, e os links públicos do evento deixam de funcionar. A exclusão só pode ser feita pelo organizador.",
    explanation:
      "Mecanismo de proteção contra acidentes (exige digitar o nome exato do evento) e integridade referencial com remoção em cascata de registros dependentes.",
    relatedReqs: ["RF-008"],
    expectedBehavior:
      "Rejeitar exclusão se o texto digitado divergir do nome do evento; autorizar exclusão quando idêntico; remover dependências associadas.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-016",
    category: "RN",
    number: 16,
    title: "Abrangência das métricas",
    description:
      "As métricas do dashboard, das análises e dos relatórios consideram somente os eventos do próprio organizador. Eventos excluídos e convidados removidos deixam de ser contabilizados.",
    explanation:
      "Isolamento analítico e coerência de dados: nenhum dado de outro organizador vaza para os gráficos e métricas; exclusões são expurgadas imediatamente dos cálculos.",
    relatedReqs: ["RF-012", "RF-026", "RF-027", "RF-037"],
    expectedBehavior:
      "Filtrar métricas apenas para eventos ativos do organizador; expurgar eventos marcados como excluídos; garantir zero vazamento entre organizadores.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-017",
    category: "RN",
    number: 17,
    title: "Envio de lembretes de confirmação",
    description:
      "Somente convidados com status Pendente e e-mail válido cadastrado recebem lembretes de confirmação. Convidados que já confirmaram ou recusaram não recebem novos lembretes daquele evento.",
    explanation:
      "Prevenção contra spam e conformidade com boas práticas de e-mail: apenas quem ainda não respondeu (Pendente) e possui endereço válido é notificado.",
    relatedReqs: ["RF-030", "RF-031"],
    expectedBehavior:
      "Filtrar convidados pendentes com e-mail válido para a fila de lembretes; ignorar sumariamente confirmados, recusados ou convidados sem e-mail.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RN-018",
    category: "RN",
    number: 18,
    title: "Remoção de fotos do evento",
    description:
      "Toda foto pertence a um único evento e registra quem a enviou e quando. Apenas o organizador do evento pode adicionar ou remover fotos, e uma foto removida deixa de aparecer na galeria.",
    explanation:
      "Moderação e autoria na galeria: fotos são vinculadas a um evento específico e apenas o organizador titular detém permissão para exclusão e gerenciamento.",
    relatedReqs: ["RF-028"],
    expectedBehavior:
      "Validar upload com metadados (autor, timestamp, evento); autorizar exclusão apenas pelo organizador titular do evento; rejeitar remoção por terceiros.",
    testFiles: ["tests/regras-negocio-rn001-rn018.test.js"],
    automated: true,
    status: "not_tested",
  },

  // ==========================================
  // REQUISITOS FUNCIONAIS (RF-001 a RF-038) - 38 ITENS
  // ==========================================
  {
    id: "RF-001",
    category: "RF",
    number: 1,
    title: "Cadastrar usuário",
    description: "O sistema deve permitir que novos usuários criem uma conta informando nome, e-mail e senha.",
    explanation: "Fluxo de onboarding do organizador com validação de dados cadastrais no servidor.",
    relatedReqs: ["RN-001"],
    expectedBehavior: "Validar nome (>=2 caracteres), e-mail RFC válido e senha (>=6 caracteres) via schema Zod no servidor.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-002",
    category: "RF",
    number: 2,
    title: "Autenticar usuário",
    description: "O sistema deve permitir que usuários cadastrados acessem a plataforma informando e-mail e senha, iniciando uma sessão autenticada.",
    explanation: "Login seguro com geração de token JWT de sessão gerenciado pelo Supabase Auth.",
    relatedReqs: ["RN-001"],
    expectedBehavior: "Validar credenciais de acesso, normalizar e-mail e rejeitar tentativas com formato inválido.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-003",
    category: "RF",
    number: 3,
    title: "Encerrar sessão",
    description: "O sistema deve permitir que o usuário encerre sua sessão de forma segura, limpando credenciais e dados locais armazenados no navegador.",
    explanation: "Logout com invalidação de cookies HTTP-only de autenticação e limpeza de armazenamento temporário local.",
    relatedReqs: ["RN-001"],
    expectedBehavior: "Executar logout limpando cookies de autenticação e redirecionar para a landing page ou tela de login.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-004",
    category: "RF",
    number: 4,
    title: "Restringir acesso às áreas privadas",
    description: "O sistema deve impedir que usuários não autenticados acessem áreas privadas, como dashboard, eventos, contatos, calendário e perfil.",
    explanation: "Guardião de rotas em middleware: bloqueia acessos anônimos a rotas protegidas redirecionando para login com preservação de rota de retorno.",
    relatedReqs: ["RN-001", "RN-002", "RNF-004"],
    expectedBehavior: "Detectar rotas privadas (/dashboard, /create-event, /event, /contacts, /calendar, /profile) e redirecionar acessos anônimos para /login.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js", "tests/requisitos-nao-funcionais-rnf.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-005",
    category: "RF",
    number: 5,
    title: "Cadastrar evento",
    description: "O sistema deve permitir que o usuário crie eventos informando nome, tipo, categoria, data, horário, modalidade, local ou link de reunião, descrição, orçamento e imagem/banner.",
    explanation: "Formulário de criação com validação Zod abrangente, suporte a eventos presenciais, online ou híbridos e modalidade financeira.",
    relatedReqs: ["RN-002", "RN-003", "RN-013", "RF-034"],
    expectedBehavior: "Validar campos obrigatórios do evento no servidor; vincular evento ao organizador autenticado.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-006",
    category: "RF",
    number: 6,
    title: "Listar eventos do usuário",
    description: "O sistema deve exibir os eventos cadastrados pelo usuário autenticado no dashboard.",
    explanation: "Visualização centralizada de eventos do organizador com contadores de presença, status e data.",
    relatedReqs: ["RN-002", "RN-016"],
    expectedBehavior: "Retornar somente os eventos pertencentes ao usuário logado, filtrados por RLS ou titularidade.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-007",
    category: "RF",
    number: 7,
    title: "Editar evento",
    description: "O sistema deve permitir que o usuário edite informações cadastrais, operacionais e financeiras de eventos criados por ele.",
    explanation: "Atualização de datas, local, modalidade, capacidade e teto orçamentário com validação de consistência temporal.",
    relatedReqs: ["RN-002", "RN-003", "RN-013"],
    expectedBehavior: "Permitir edição parcial ou total dos dados mantendo regras de validação (início < término e orçamento >= 0).",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-008",
    category: "RF",
    number: 8,
    title: "Excluir evento",
    description: "O sistema deve permitir que o usuário exclua eventos criados por ele mediante confirmação nominal do título do evento.",
    explanation: "Exclusão segura: modal de confirmação exige digitar o nome exato do evento antes de acionar a deleção em cascata.",
    relatedReqs: ["RN-002", "RN-015"],
    expectedBehavior: "Bloquear exclusão quando o nome informado não corresponder exatamente ao título do evento.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-009",
    category: "RF",
    number: 9,
    title: "Consultar detalhes do evento",
    description: "O sistema deve permitir que o usuário visualize uma página detalhada com informações do evento, convidados, solicitações, itens, custos, fotos e análises.",
    explanation: "Hub operacional do evento: congrega abas de presença, custos, buffet, galeria e relatórios gerenciais.",
    relatedReqs: ["RN-002", "RN-005"],
    expectedBehavior: "Carregar dados completos do evento, isolados por titularidade, agregando métricas de convidados e finanças.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-010",
    category: "RF",
    number: 10,
    title: "Cadastrar convidado",
    description: "O sistema deve permitir que o usuário adicione convidados a um evento.",
    explanation: "Adição manual ou rápida de novos convidados com inicialização automática do status em Pendente.",
    relatedReqs: ["RN-004", "RN-009"],
    expectedBehavior: "Validar nome e e-mail do convidado; atribuir status inicial 'Pendente' e vincular ao evento.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-011",
    category: "RF",
    number: 11,
    title: "Editar convidado",
    description: "O sistema deve permitir editar nome, e-mail, telefone e status de um convidado.",
    explanation: "Atualização de contatos e correções cadastrais na lista do evento.",
    relatedReqs: ["RN-004"],
    expectedBehavior: "Atualizar campos de contato e presença do convidado respeitando validações de schema.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-012",
    category: "RF",
    number: 12,
    title: "Excluir convidado",
    description: "O sistema deve permitir remover convidados de um evento.",
    explanation: "Remoção de convidados com recálculo automático de presença e exclusão de acompanhantes associados.",
    relatedReqs: ["RN-002", "RN-016"],
    expectedBehavior: "Remover convidado da lista ativa do evento e atualizar instantaneamente a contagem de confirmados.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-013",
    category: "RF",
    number: 13,
    title: "Atualizar status de presença",
    description: "O sistema deve permitir classificar convidados como pendentes, confirmados ou recusados.",
    explanation: "Controle de RSVP pelo organizador ou via resposta direta do convidado no link público.",
    relatedReqs: ["RN-004", "RN-005", "RN-009"],
    expectedBehavior: "Alternar status entre Pendente, Confirmado e Recusado com validação dos estados permitidos.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-014",
    category: "RF",
    number: 14,
    title: "Gerar link público de convite",
    description: "O sistema deve permitir que o organizador gere, ative, desative ou regenere um link público para convite ou confirmação de presença.",
    explanation: "Geração de tokens criptográficos únicos e seguros para compartilhamento do convite em redes e mensageiros.",
    relatedReqs: ["RN-006", "RN-007"],
    expectedBehavior: "Gerar token alfanumérico seguro com entropia mínima de 128 bits e permitir ativar/desativar o link.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-015",
    category: "RF",
    number: 15,
    title: "Responder convite (RSVP)",
    description: "O sistema deve permitir que convidados confirmem ou recusem presença por meio de um link de confirmação válido.",
    explanation: "Página pública de RSVP acessível sem necessidade de login, com registro imediato de presença.",
    relatedReqs: ["RN-004", "RN-006", "RN-007", "RN-009"],
    expectedBehavior: "Receber resposta de presença (sim/não) via token válido e atualizar o registro do convidado.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-016",
    category: "RF",
    number: 16,
    title: "Solicitar participação em evento",
    description: "O sistema deve permitir que pessoas externas solicitem participação em eventos com convite público ativo.",
    explanation: "Inscrição de participantes externos em eventos públicos com moderação de entrada.",
    relatedReqs: ["RN-006", "RN-008"],
    expectedBehavior: "Cadastrar solicitação com nome e e-mail sob status 'pending_approval' vinculada ao evento.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-017",
    category: "RF",
    number: 17,
    title: "Avaliar solicitação de participação",
    description: "O sistema deve permitir que o organizador aprove ou rejeite solicitações de participação.",
    explanation: "Painel de moderação no qual o organizador aceita ou recusa pedidos de participação externa.",
    relatedReqs: ["RN-008", "RN-009"],
    expectedBehavior: "Aprovar solicitação transferindo-a para a lista de convidados ou rejeitar sem integrá-la à lista.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-018",
    category: "RF",
    number: 18,
    title: "Cadastrar item do evento",
    description: "O sistema deve permitir adicionar itens ou despesas vinculadas ao evento, persistindo-os no banco de dados.",
    explanation: "Gestão de planilha de custos, tarefas ou contratações de serviços com atribuição de responsável.",
    relatedReqs: ["RN-010"],
    expectedBehavior: "Validar nome, quantidade positiva e valor unitário >= 0, normalizando ausência para R$ 0,00.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-019",
    category: "RF",
    number: 19,
    title: "Editar item do evento",
    description: "O sistema deve permitir editar nome, quantidade, valor, situação de pagamento, responsável e observações de itens do evento.",
    explanation: "Atualização de status de pagamento (pendente/pago), valores e reatribuição de responsáveis.",
    relatedReqs: ["RN-010"],
    expectedBehavior: "Atualizar propriedades do item mantendo regras de validação financeira.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-020",
    category: "RF",
    number: 20,
    title: "Excluir item do evento",
    description: "O sistema deve permitir remover itens ou despesas cadastradas no evento.",
    explanation: "Exclusão de itens obsoletos ou cancelados com recálculo imediato do custo total.",
    relatedReqs: ["RN-010", "RN-011"],
    expectedBehavior: "Remover o item da base de dados e abater seu valor imediatamente do custo total do evento.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-021",
    category: "RF",
    number: 21,
    title: "Calcular custo total do evento",
    description: "O sistema deve calcular automaticamente o custo total com base nos itens cadastrados.",
    explanation: "Agregação matemática contínua: soma dos custos de todos os itens cadastrados no evento.",
    relatedReqs: ["RN-011", "RN-012", "RN-013"],
    expectedBehavior: "Retornar a soma exata de (quantidade * valor_unitario) de todos os itens ativos do evento.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-022",
    category: "RF",
    number: 22,
    title: "Manter contatos",
    description: "O sistema deve permitir cadastrar, organizar em listas, editar, listar e remover contatos.",
    explanation: "Agenda pessoal do organizador para reaproveitamento rápido de contatos entre diferentes eventos.",
    relatedReqs: ["RN-014"],
    expectedBehavior: "Permitir CRUD completo de contatos vinculados à conta do organizador.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-023",
    category: "RF",
    number: 23,
    title: "Importar contato como convidado",
    description: "O sistema deve permitir adicionar contatos e listas de contatos cadastrados como convidados de eventos.",
    explanation: "Criação de convidados no evento a partir de registros da agenda de contatos, gerando snapshots isolados.",
    relatedReqs: ["RN-014"],
    expectedBehavior: "Copiar dados do contato para novo registro de convidado no evento com status inicial Pendente.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-024",
    category: "RF",
    number: 24,
    title: "Exibir calendário de eventos",
    description: "O sistema deve exibir os eventos cadastrados em formato de calendário.",
    explanation: "Visão cronológica dos eventos do organizador com suporte a visualização mensal, semanal e diária.",
    relatedReqs: ["RN-002"],
    expectedBehavior: "Exibir eventos do organizador distribuídos pelas datas correspondentes no calendário.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-025",
    category: "RF",
    number: 25,
    title: "Acessar evento pelo calendário",
    description: "O sistema deve permitir abrir os detalhes de um evento a partir do calendário.",
    explanation: "Navegação direta do calendário para a página individual de gerenciamento do evento.",
    relatedReqs: ["RN-002"],
    expectedBehavior: "Fornecer link de navegação rápida (/event/[id]) a partir do card do evento no calendário.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-026",
    category: "RF",
    number: 26,
    title: "Exibir painel de indicadores",
    description: "O sistema deve exibir um painel com resumo dos eventos, convidados, confirmações de presença e custos.",
    explanation: "Cards analíticos no topo do dashboard com total de eventos, confirmados, despesas e taxa de confirmação.",
    relatedReqs: ["RN-005", "RN-011", "RN-016"],
    expectedBehavior: "Consolidar indicadores executivos considerando estritamente eventos ativos do titular.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-027",
    category: "RF",
    number: 27,
    title: "Exibir análises e gráficos",
    description: "O sistema deve exibir gráficos e métricas sobre eventos, convidados, RSVP e custos.",
    explanation: "Visualizações em gráficos de barras, pizza e curvas de adesão de presença ao longo do tempo.",
    relatedReqs: ["RN-011", "RN-016"],
    expectedBehavior: "Gerar séries de dados de presença e custos consistentes com as tabelas do banco de dados.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-028",
    category: "RF",
    number: 28,
    title: "Manter galeria de fotos",
    description: "O sistema deve permitir adicionar, visualizar, baixar e remover fotos vinculadas a eventos.",
    explanation: "Upload de fotos em storage isolado com visualização em grade e download direto.",
    relatedReqs: ["RN-018"],
    expectedBehavior: "Permitir upload e exclusão de fotos por evento com validação de titularidade do organizador.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-029",
    category: "RF",
    number: 29,
    title: "Exportar evento em formato ICS",
    description: "O sistema deve gerar um arquivo ou feed ICS autenticado para integração com calendários externos.",
    explanation: "Geração de arquivo iCalendar (.ics) compatível com Google Calendar, Apple Calendar e Outlook.",
    relatedReqs: ["RN-002", "RN-006"],
    expectedBehavior: "Gerar arquivo .ics com cabeçalhos VCALENDAR/VEVENT válidos, data UTC e escape de caracteres especiais.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-030",
    category: "RF",
    number: 30,
    title: "Enviar convites e lembretes",
    description: "O sistema deve permitir envio de convites e lembretes para convidados pendentes com e-mail válido, quando houver integração disponível.",
    explanation: "Comunicação transacional via e-mail informando dados do evento e link de resposta individual.",
    relatedReqs: ["RN-017"],
    expectedBehavior: "Validar e sanitizar payload de envio; filtrar apenas convidados com status Pendente e e-mail válido.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-031",
    category: "RF",
    number: 31,
    title: "Executar rotinas automáticas",
    description: "O sistema deve possuir jobs para lembretes, limpeza de dados, sincronização de calendário e agregação de métricas.",
    explanation: "Rotinas de manutenção executadas em background ou acionadas por cron seguro.",
    relatedReqs: ["RN-017"],
    expectedBehavior: "Disponibilizar endpoints de job com autenticação por Bearer Token e execução idempotente.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-032",
    category: "RF",
    number: 32,
    title: "Registrar execução das rotinas automáticas",
    description: "O sistema deve registrar status, horário, duração, logs e erros das execuções automatizadas.",
    explanation: "Tabela de auditoria cron_logs contendo histórico de disparos, falhas e volumetria tratada.",
    relatedReqs: ["RN-017"],
    expectedBehavior: "Persistir registro de execução contendo nome do job, status (success/error), duração em ms e logs.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-033",
    category: "RF",
    number: 33,
    title: "Importar convidados em lote via planilha",
    description: "O sistema deve permitir importar listas de convidados em lote a partir de arquivos ou colagem em formato CSV ou TSV, com pré-visualização antes do cadastro.",
    explanation: "Importação rápida de grandes listas: reconhece delimitadores vírgula, ponto e vírgula e tabulação (Ctrl+V).",
    relatedReqs: ["RN-004"],
    expectedBehavior: "Fazer parse de CSV/TSV, mapear colunas (nome, e-mail, telefone), validar linhas e pré-visualizar antes de salvar.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-034",
    category: "RF",
    number: 34,
    title: "Configurar modalidade financeira do evento",
    description: "O sistema deve permitir configurar o evento sob a modalidade de Orçamento Previsto ou de Rateio Colaborativo, aplicando os cálculos correspondentes.",
    explanation: "Duplo regime financeiro: chaveamento entre gestão orçamentária corporativa e divisão comunitária de gastos.",
    relatedReqs: ["RN-012", "RN-013"],
    expectedBehavior: "Permitir configurar financial_mode como 'budget' ou 'split', adaptando as fórmulas de cálculo e a interface.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-035",
    category: "RF",
    number: 35,
    title: "Registrar restrições alimentares e acessibilidade",
    description: "O sistema deve permitir que convidados informem restrições alimentares e necessidades de acessibilidade ao responder ao convite, consolidando esses dados para o evento.",
    explanation: "Módulo de buffet inclusivo: agrupa vegetarianos, veganos, celíacos e necessidades especiais para os fornecedores.",
    relatedReqs: ["RN-006", "RN-007"],
    expectedBehavior: "Coletar restrições no RSVP público e disponibilizar resumo quantitativo consolidado no painel do organizador.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-036",
    category: "RF",
    number: 36,
    title: "Gerenciar acompanhantes de convidados",
    description: "O sistema deve permitir a indicação nominal de acompanhantes dentro do limite configurado e sua aprovação ou rejeição pelo organizador.",
    explanation: "Controle refinado de convites de casal e família, limitando a cota permitida por convidado.",
    relatedReqs: ["RN-005", "RN-009"],
    expectedBehavior: "Validar cota máxima de acompanhantes por convidado e permitir ao organizador aprovar ou reprovar individualmente.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-037",
    category: "RF",
    number: 37,
    title: "Exportar relatórios gerenciais em PDF e CSV",
    description: "O sistema deve permitir configurar, pré-visualizar e emitir relatórios gerenciais em PDF padrão A4 (resumo executivo, dossiê completo, financeiro e comparativo) e exportar dados em CSV.",
    explanation: "Emissão de relatórios profissionais A4 para impressão ou apresentação formal a clientes e patrocinadores.",
    relatedReqs: ["RN-005", "RN-011", "RN-012", "RN-013", "RN-016"],
    expectedBehavior: "Gerar relatórios estruturados com sumário executivo, curva de Pareto 80/20 de gastos e tabelas de presença.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js", "tests/s06-relatorios-pdf.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-038",
    category: "RF",
    number: 38,
    title: "Disponibilizar portal somente-leitura do anfitrião",
    description: "O sistema deve permitir que o organizador compartilhe um link exclusivo em modo somente-leitura para acompanhamento de presença, restrições e resumo financeiro pelo anfitrião ou contratante.",
    explanation: "Visão executiva compartilhável com clientes ou aniversariantes, exibindo indicadores sem permissão de edição.",
    relatedReqs: ["RN-002", "RN-007"],
    expectedBehavior: "Proteger rota de host-view via token de leitura; exibir indicadores consolidados sem permitir ações de escrita.",
    testFiles: ["tests/requisitos-funcionais-rf001-rf038.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-039",
    category: "RF",
    number: 39,
    title: "Convidar membros para a equipe do evento por e-mail",
    description:
      "O sistema deve permitir que o proprietário ou administrador autorizado convide profissionais por e-mail para integrar a equipe do evento, definindo papel inicial (Administrador, Colaborador ou Visualizador), permissões modulares e prazo de validade do convite, bloqueando convites duplicados.",
    explanation:
      "Viabiliza a montagem da equipe organizadora com convites seguros, prazo de expiração e prevenção de duplicidade no mesmo evento.",
    relatedReqs: ["RN-002", "RF-040", "RF-041"],
    expectedBehavior:
      "Gerar convite com token CSPRNG e data de expiração; bloquear e-mail duplicado ativo/pendente no mesmo evento; validar hierarquia do convidante.",
    testFiles: ["lib/domain/rbac.ts", "app/api/events/[eventId]/team/route.ts", "components/event-team-manager.tsx"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-040",
    category: "RF",
    number: 40,
    title: "Aceitar convites de equipe e revogar acesso de colaboradores",
    description:
      "O sistema deve permitir que o usuário convidado aceite um convite válido dentro do prazo para tornar-se membro ativo da equipe do evento, bem como permitir que o proprietário cancele convites pendentes ou revogue imediatamente o acesso de colaboradores.",
    explanation:
      "Controla o ciclo de vida do vínculo do colaborador com o evento: ativação mediante token válido e revogação instantânea quando desligado da equipe.",
    relatedReqs: ["RN-002", "RF-039"],
    expectedBehavior:
      "Ativar membro ao aceitar convite no prazo; rejeitar convite expirado ou revogado; bloquear acesso imediatamente após revogação.",
    testFiles: ["lib/domain/rbac.ts", "app/api/events/[eventId]/team/route.ts", "components/event-team-manager.tsx"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-041",
    category: "RF",
    number: 41,
    title: "Configurar papéis e permissões granulares por módulo (RBAC)",
    description:
      "O sistema deve permitir definir e alterar papéis e permissões granulares por módulo (evento, convidados, solicitações, financeiro, fotos, análises, relatórios e equipe) e por operação (visualizar, criar, editar, excluir, aprovar, exportar), impedindo que qualquer membro eleve suas próprias permissões ou conceda privilégios superiores aos seus.",
    explanation:
      "Implementa o controle de acesso baseado em papéis (RBAC) por evento, garantindo segregação de funções (ex.: colaborador financeiro vs. recepção).",
    relatedReqs: ["RN-002", "RN-010", "RN-018"],
    expectedBehavior:
      "Autorizar apenas módulos e ações concedidos; bloquear auto-elevação de privilégios; impedir que visualizador modifique dados.",
    testFiles: ["lib/domain/rbac.ts", "app/api/events/[eventId]/team/route.ts", "components/event-team-manager.tsx"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-042",
    category: "RF",
    number: 42,
    title: "Transferir titularidade do evento com confirmação nominal",
    description:
      "O sistema deve permitir exclusivamente ao proprietário atual transferir de forma transacional a titularidade do evento para outro membro ativo da equipe mediante confirmação nominal do título do evento, mantendo a regra de proprietário único.",
    explanation:
      "Permite a sucessão segura de responsabilidade pelo evento sem violar a unicidade de proprietário nem exigir recriação do evento.",
    relatedReqs: ["RN-002", "RN-015"],
    expectedBehavior:
      "Exigir papel 'owner' e confirmação nominal do título; promover destinatário ativo a 'owner' e converter anterior em 'admin' atomicamente.",
    testFiles: ["lib/domain/rbac.ts", "supabase/migrations/20261117000100_event_rbac_and_audit.sql", "components/event-team-manager.tsx"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RF-043",
    category: "RF",
    number: 43,
    title: "Registrar e consultar histórico de alterações e auditoria do evento",
    description:
      "O sistema deve registrar em trilha de auditoria todas as alterações relevantes de equipe, permissões, transferências de titularidade e tentativas de acesso ou escalação de privilégio bloqueadas, permitindo sua consulta na seção Equipe e permissões.",
    explanation:
      "Garante rastreabilidade e governança sobre quem concedeu acessos, alterou permissões ou tentou executar operações não autorizadas.",
    relatedReqs: ["RN-002", "RNF-004", "RNF-005"],
    expectedBehavior:
      "Registrar entradas em event_audit_logs com ator, papel, ação, status (autorizado/bloqueado) e carimbo de tempo.",
    testFiles: ["lib/domain/rbac.ts", "supabase/migrations/20261117000100_event_rbac_and_audit.sql", "components/event-team-manager.tsx"],
    automated: true,
    status: "not_tested",
  },

  // ==========================================
  // REQUISITOS NÃO FUNCIONAIS (RNF-001 a RNF-010) - 10 ITENS
  // ==========================================
  {
    id: "RNF-001",
    category: "RNF",
    number: 1,
    title: "Usabilidade da interface (SUS >= 70)",
    description:
      "Um usuário sem treinamento deve conseguir realizar as tarefas principais com poucos passos e sem ajuda. Métrica: tempo para criar um evento completo (<= 5 min); cliques para responder convite (<= 3 cliques); taxa de conclusão >= 90%; nota SUS >= 70.",
    explanation:
      "Avaliação de experiência do usuário (UX): protocolo com 5 usuários reais e aplicação do questionário formal SUS.",
    relatedReqs: ["RF-005", "RF-015"],
    expectedBehavior:
      "Criar evento em até 5 minutos e responder convite em até 3 cliques, obtendo nota SUS >= 70 em teste assistido.",
    testFiles: ["Aferição Externa / Testes de Usuário com Formulário SUS"],
    automated: false,
    status: "manual",
  },
  {
    id: "RNF-002",
    category: "RNF",
    number: 2,
    title: "Adaptação a diferentes tamanhos de tela",
    description:
      "A aplicação deve funcionar em celulares, tablets e computadores sem perda de funcionalidade. Telas utilizáveis de 360 px a 1920 px de largura, sem rolagem horizontal, com botões de ação principal de no mínimo 44 px de altura (alvos de toque WCAG).",
    explanation:
      "Acessibilidade e responsividade: conformidade com diretrizes WCAG 2.1 AA para áreas mínimas de clique no celular.",
    relatedReqs: ["RF-004", "RF-009"],
    expectedBehavior:
      "Garantir layout fluido de 360px a 1920px e classes de botão com min-height >= 44px (h-11 no Design System).",
    testFiles: ["tests/requisitos-nao-funcionais-rnf.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RNF-003",
    category: "RNF",
    number: 3,
    title: "Tempo de carregamento e resposta (LCP e API)",
    description:
      "As páginas e respostas do sistema devem ser rápidas. LCP de até 2,5 segundos nas páginas principais em conexão 4G; 95% das respostas da API em até 800 ms; pontuação de desempenho do Google Lighthouse igual ou superior a 80.",
    explanation:
      "Performance Web Core Vitals: auditoria de carregamento em rede simulada de celular (4G) e SLA das APIs.",
    relatedReqs: ["RF-006", "RF-009"],
    expectedBehavior:
      "LCP <= 2.5s, tempo de resposta das rotas de leitura <= 800ms e score Lighthouse Performance >= 80.",
    testFiles: ["Aferição Externa / Google Lighthouse & Vercel Analytics"],
    automated: false,
    status: "manual",
  },
  {
    id: "RNF-004",
    category: "RNF",
    number: 4,
    title: "Controle de acesso e limite de requisições",
    description:
      "100% das rotas privadas e APIs recusam requisições sem sessão válida; senha com no mínimo 6 caracteres; tokens de convite com 128 bits aleatórios gerados por CSPRNG; rotas públicas limitadas a no máximo 20 requisições por minuto por IP.",
    explanation:
      "Segurança da informação: proteção contra brute force, scraping e adulteração por meio de rate limiting e CSPRNG.",
    relatedReqs: ["RF-001", "RF-004", "RF-014"],
    expectedBehavior:
      "Bloquear acesso anônimo; verificar entropia de 128 bits nos tokens; aplicar corte no rate limiter com HTTP 429 após 10 req/min.",
    testFiles: ["tests/requisitos-nao-funcionais-rnf.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RNF-005",
    category: "RNF",
    number: 5,
    title: "Isolamento dos dados por usuário (RLS e LGPD)",
    description:
      "Nenhum registro de outro usuário retornado em qualquer consulta; RLS (Row Level Security) ativa em 100% das tabelas que guardam dados de usuários e limpeza do armazenamento local ao encerrar a sessão.",
    explanation:
      "Privacidade por padrão: políticas de banco de dados no Supabase garantem que um usuário jamais consulte dados alheios.",
    relatedReqs: ["RN-001", "RN-002", "RF-004"],
    expectedBehavior:
      "Verificar se RLS está explicitamente habilitado nas migrações SQL para events, guests, items, contacts e photos.",
    testFiles: ["tests/requisitos-nao-funcionais-rnf.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RNF-006",
    category: "RNF",
    number: 6,
    title: "Validação dos dados de entrada (Zero Mass Assignment)",
    description:
      "100% das ações de servidor e endpoints de escrita validados com esquemas Zod no servidor; dados inválidos retornam erro estruturado (HTTP 400) e não gravam nada no banco; campos não autorizados são ignorados e descartados.",
    explanation:
      "Defesa em profundidade: validação estrita no backend contra injeção de parâmetros maliciosos ou tipos incompatíveis.",
    relatedReqs: ["RF-001", "RF-005", "RF-010", "RF-015", "RF-018"],
    expectedBehavior:
      "Rejeitar payloads com tipos inválidos e descartar propriedades adicionais injetadas em ataques de Mass Assignment.",
    testFiles: ["tests/requisitos-nao-funcionais-rnf.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RNF-007",
    category: "RNF",
    number: 7,
    title: "Exatidão dos indicadores e custos (Zero Discrepância)",
    description:
      "Diferença zero entre o custo total exibido e a soma dos itens, e diferença entre os indicadores de presença e os status dos convidados e acompanhantes; após qualquer alteração, os indicadores refletem os novos dados imediatamente.",
    explanation:
      "Consistência matemática entre camadas: as mesmas fórmulas regem a UI do cliente, a API do servidor e o gerador de PDF.",
    relatedReqs: ["RN-005", "RN-011", "RF-021", "RF-026", "RF-037"],
    expectedBehavior:
      "Garantir discrepância matemática rigorosamente 0.00 entre domínio, painéis e relatórios gerenciais exportáveis.",
    testFiles: ["tests/requisitos-nao-funcionais-rnf.test.js"],
    automated: true,
    status: "not_tested",
  },
  {
    id: "RNF-008",
    category: "RNF",
    number: 8,
    title: "Disponibilidade do sistema (Uptime >= 99%)",
    description:
      "A aplicação deve permanecer acessível pela internet, hospedada na Vercel. Métrica: percentual de tempo em que a aplicação responde normalmente em um mês; Meta: disponibilidade mensal de pelo menos 99% (máximo de 7h de indisponibilidade/mês).",
    explanation:
      "Confiabilidade de infraestrutura: monitoramento contínuo de disponibilidade em ambiente de produção na Vercel.",
    relatedReqs: ["RF-004", "RF-006"],
    expectedBehavior:
      "Atingir uptime contínuo >= 99% em janela de 30 dias com sondas de verificação periódica a cada 5 minutos.",
    testFiles: ["Aferição Externa / Uptime Robot ou Vercel Health Monitoring"],
    automated: false,
    status: "manual",
  },
  {
    id: "RNF-009",
    category: "RNF",
    number: 9,
    title: "Capacidade de usuários e eventos (Teste de Carga)",
    description:
      "A arquitetura deve suportar o crescimento de usuários e de eventos sem perda de desempenho. Meta: 100 usuários simultâneos e eventos com até 500 convidados, mantendo as metas de tempo de resposta.",
    explanation:
      "Escalabilidade da aplicação: simulação de concorrência com cenários k6 testando dashboard, evento e RSVP sob carga.",
    relatedReqs: ["RF-006", "RF-009", "RF-015"],
    expectedBehavior:
      "Processar requisições concorrentes de 100 usuários sem quebra de conexão ou erros HTTP 500 no k6.",
    testFiles: ["Aferição Externa / k6 Load Testing Suite"],
    automated: false,
    status: "manual",
  },
  {
    id: "RNF-010",
    category: "RNF",
    number: 10,
    title: "Manutenibilidade do código (Strict Typing e CI)",
    description:
      "100% das regras de negócio e requisitos funcionais validados por testes automatizados; nenhum erro de ESLint ou TypeScript no build de produção (sem ignoreBuildErrors); separação modular entre domínio, ações e componentes.",
    explanation:
      "Engenharia de software profissional: pipeline automatizado com verificação estrita de tipagem e suite de testes.",
    relatedReqs: ["RN-001 a RN-018", "RF-001 a RF-043"],
    expectedBehavior:
      "Build de produção executado sem flags de supressão de erros (strict TypeScript e ESLint passando com zero falhas).",
    testFiles: ["tests/requisitos-nao-funcionais-rnf.test.js"],
    automated: true,
    status: "not_tested",
  },
]

const AUDIT_DIAGNOSTIC_METADATA: Record<
  string,
  Pick<
    RequirementItem,
    | "previousStatus"
    | "problemClassification"
    | "rootCauseAnalysis"
    | "correctionApplied"
    | "testedEndpoint"
    | "databaseValidationInfo"
  >
> = {
  "RN-001": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "context/auth-context.tsx (register/login/logout)",
    databaseValidationInfo: "public.users (email TEXT NOT NULL UNIQUE, idx_users_email_unique, RLS auth.uid() = id)",
  },
  "RN-002": {
    previousStatus: "needs_refinement",
    problemClassification: "incomplete_rule",
    rootCauseAnalysis:
      "A regra original restringia toda gestão a um único organizador isolado, não suportando equipes profissionais, delegação modular nem hierarquia de acesso (RBAC).",
    correctionApplied:
      "Refinada para RBAC por evento (Proprietário único, Administrador, Colaborador modular, Visualizador e Anfitrião externo tokenizado) com 20 cenários validados, tabelas event_members e event_audit_logs e seção Equipe e permissões.",
    testedEndpoint: "/api/events/[eventId]/team & /api/events/[eventId]/host-view",
    databaseValidationInfo:
      "public.event_members (idx_event_members_single_active_owner), public.event_audit_logs, função SQL has_event_permission e transfer_event_ownership",
  },
  "RN-003": {
    previousStatus: "needs_refinement",
    problemClassification: "test_error",
    rootCauseAnalysis:
      "O cenário rn003_s2 gerava falso positivo ao testar orçamento negativo em um payload incompleto que já falhava por ausência de horário e local.",
    correctionApplied:
      "Corrigido o teste para isolar exatamente a falha de orçamento negativo e término anterior ao início com payload completo e normalização snake_case/camelCase em eventPayloadSchema.",
    testedEndpoint: "app/actions/events.ts (createEvent / updateEventDetails)",
    databaseValidationInfo: "public.events (NOT NULL constraints e CHECK budget_estimated >= 0)",
  },
  "RN-004": {
    previousStatus: "failed",
    problemClassification: "doc_divergence",
    rootCauseAnalysis:
      "Reprovada anteriormente: guestStatusSchema aceitava apenas códigos em inglês ('pending', 'confirmed', 'declined'), rejeitando os termos da documentação ('Pendente', 'Confirmado', 'Recusado').",
    correctionApplied:
      "Implementada normalizeGuestStatus e isAllowedAttendanceTransition em lib/domain/business-rules.ts e preprocessamento em guestStatusSchema.",
    testedEndpoint: "/api/guests/[guestId] & /api/confirm/[token]/accept|decline",
    databaseValidationInfo: "public.guests (status CHECK in awaiting_approval, pending, confirmed, declined, expired, cancelled)",
  },
  "RN-005": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "app/actions/events.ts & /api/analytics",
    databaseValidationInfo: "public.guests + public.guest_companions & materialized view public.mv_rsvp_stats",
  },
  "RN-006": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "/api/public-events/[token] & /api/confirm/[token]",
    databaseValidationInfo: "public.events(public_invite_token UNIQUE) & public.guests(confirmation_token UNIQUE)",
  },
  "RN-007": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "/api/public-events/[token] & /api/events/[eventId]/public-info",
    databaseValidationInfo: "Filtragem server-side via buildPublicEventPayload e RLS em public.events",
  },
  "RN-008": {
    previousStatus: "needs_refinement",
    problemClassification: "test_error",
    rootCauseAnalysis:
      "O teste anterior validava apenas um schema opcional sem exercitar resolvePublicRequestInitialStatus e filterEffectiveGuests.",
    correctionApplied:
      "Integrada validação real de moderação manual (awaiting_approval), aprovação automática configurável (pending) e exclusão de rejeitados (cancelled) da lista efetiva.",
    testedEndpoint: "/api/public-events/[token] & /api/guests/[guestId]/approve|reject",
    databaseValidationInfo: "public.guests (source, status, approved_at, rejected_at)",
  },
  "RN-009": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "/api/companions/[companionId]/approve|reject",
    databaseValidationInfo: "public.guest_companions (status CHECK in pending, awaiting_approval, approved, rejected, cancelled)",
  },
  "RN-010": {
    previousStatus: "needs_refinement",
    problemClassification: "test_error",
    rootCauseAnalysis:
      "O teste de rejeição de valor negativo gerava falso positivo por omitir eventId no itemCreateSchema.",
    correctionApplied:
      "Corrigido itemCreateSchema para suportar cálculo composto (quantity * unitPrice) e validado bloqueio estrito de preço negativo com eventId preenchido.",
    testedEndpoint: "app/actions/items.ts (createItemAction / updateItemAction)",
    databaseValidationInfo: "public.items (price >= 0, unit_price >= 0, FK event_id ON DELETE CASCADE)",
  },
  "RN-011": {
    previousStatus: "failed",
    problemClassification: "implementation_error",
    rootCauseAnalysis:
      "Reprovada anteriormente: normalizeItemValue lia apenas price/actualCost/estimatedCost e retornava 0 quando o item informava quantity e unit_price.",
    correctionApplied:
      "Corrigida normalizeItemValue em lib/domain/business-rules.ts para calcular automaticamente quantity * unit_price quando price não estiver pré-multiplicado.",
    testedEndpoint: "app/actions/items.ts & /api/analytics",
    databaseValidationInfo: "public.items & materialized view public.mv_event_costs",
  },
  "RN-012": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "app/actions/events.ts & lib/reports/data-collector.ts",
    databaseValidationInfo: "public.events (financial_mode = 'collaborative_split')",
  },
  "RN-013": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "app/actions/events.ts & lib/reports/data-collector.ts",
    databaseValidationInfo: "public.events (budget_estimated >= 0 sem bloqueio de insert em public.items)",
  },
  "RN-014": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "app/actions/contacts.ts",
    databaseValidationInfo: "public.contacts & public.contact_lists (RLS auth.uid() = user_id)",
  },
  "RN-015": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "app/actions/events.ts (deleteEventAction)",
    databaseValidationInfo: "public.events e FKs com ON DELETE CASCADE em guests, items, event_photos, event_members",
  },
  "RN-016": {
    previousStatus: "needs_refinement",
    problemClassification: "test_error",
    rootCauseAnalysis:
      "O avaliador anterior usava um array mockado local em vez de invocar normalizeReportData do coletor oficial.",
    correctionApplied:
      "Substituído pelo uso direto de normalizeReportData validando consolidação de múltiplos eventos, filtro individual e estado vazio.",
    testedEndpoint: "/api/analytics",
    databaseValidationInfo: "public.events, public.mv_event_costs, public.mv_rsvp_stats",
  },
  "RN-017": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "/api/events/[eventId]/send-invites & /api/jobs/pending-invites",
    databaseValidationInfo: "public.guests (status = 'pending' AND email <> '')",
  },
  "RN-018": {
    previousStatus: "passed",
    problemClassification: "none",
    testedEndpoint: "app/actions/photos.ts (uploadEventPhotoAction / deleteEventPhotoAction)",
    databaseValidationInfo: "public.event_photos & storage.objects (bucket event-photos)",
  },
  "RF-005": {
    previousStatus: "failed",
    problemClassification: "inconsistent_requirement",
    rootCauseAnalysis:
      "Reprovado anteriormente: divergência de nomenclatura de atributos (snake_case vs camelCase) e ausência de horário/local obrigatórios da RN-003 no cenário de teste.",
    correctionApplied:
      "Adicionado preprocessamento compatível em eventPayloadSchema e validado payload completo com todos os campos obrigatórios da RN-003.",
    testedEndpoint: "app/actions/events.ts (createEvent)",
    databaseValidationInfo: "INSERT em public.events + trigger trg_ensure_event_owner_member em public.event_members",
  },
  "RF-007": {
    previousStatus: "failed",
    problemClassification: "inconsistent_requirement",
    rootCauseAnalysis:
      "Reprovado anteriormente: mesmo desalinhamento de contrato em eventPayloadSchema ao validar atualização cadastral do evento.",
    correctionApplied:
      "Compatibilizado eventPayloadSchema e validada atualização de título, horário, local e orçamento.",
    testedEndpoint: "app/actions/events.ts (updateEventDetails)",
    databaseValidationInfo: "UPDATE em public.events protegido por RLS e RBAC",
  },
  "RF-011": {
    previousStatus: "failed",
    problemClassification: "doc_divergence",
    rootCauseAnalysis:
      "Reprovado anteriormente: guestUpdateSchema rejeitava o status 'Confirmado' em português por falta de normalização em guestStatusSchema.",
    correctionApplied:
      "Integrado normalizeGuestStatus ao guestStatusSchema permitindo atualização tanto com códigos canônicos quanto rótulos em português.",
    testedEndpoint: "/api/guests/[guestId] (PATCH)",
    databaseValidationInfo: "UPDATE em public.guests",
  },
  "RF-013": {
    previousStatus: "failed",
    problemClassification: "doc_divergence",
    rootCauseAnalysis:
      "Reprovado anteriormente: guestStatusSchema.safeParse('Confirmado') falhava ao registrar presença manual pelo organizador.",
    correctionApplied:
      "Normalização determinística em guestStatusSchema e validação de transição via isAllowedAttendanceTransition.",
    testedEndpoint: "/api/guests/[guestId] (PATCH)",
    databaseValidationInfo: "UPDATE status em public.guests",
  },
  "RF-015": {
    previousStatus: "failed",
    problemClassification: "inconsistent_requirement",
    rootCauseAnalysis:
      "Reprovado anteriormente: publicRsvpSchema exigia telefone obrigatório (min 8) e não mapeava o alias response ('yes'/'no') para attendanceStatus ('confirmed'/'declined').",
    correctionApplied:
      "Tornado telefone opcional (validado quando preenchido) e adicionado mapeamento de response/attendanceStatus em publicRsvpSchema.",
    testedEndpoint: "/api/confirm/[token]/accept & /api/confirm/[token]/decline",
    databaseValidationInfo: "UPDATE em public.guests e INSERT em public.guest_companions",
  },
  "RF-016": {
    previousStatus: "failed",
    problemClassification: "inconsistent_requirement",
    rootCauseAnalysis:
      "Reprovado anteriormente: publicRsvpSchema rejeitava solicitação externa sem telefone e não verificava o status inicial awaiting_approval.",
    correctionApplied:
      "Ajustado publicRsvpSchema e integrado resolvePublicRequestInitialStatus para validar entrada na fila de moderação.",
    testedEndpoint: "/api/public-events/[token] & /api/events/[eventId]/public-request",
    databaseValidationInfo: "INSERT em public.guests com source = 'public_request' e status = 'awaiting_approval'",
  },
  "RF-018": {
    previousStatus: "failed",
    problemClassification: "implementation_error",
    rootCauseAnalysis:
      "Reprovado anteriormente: itemCreateSchema exigia price estrito e falhava quando o item era cadastrado informando quantity e unit_price.",
    correctionApplied:
      "Atualizado itemCreateSchema para calcular price = quantity * unitPrice automaticamente e aceitar eventId/event_id.",
    testedEndpoint: "app/actions/items.ts (createItemAction)",
    databaseValidationInfo: "INSERT em public.items com trigger sync_item_costs",
  },
  "RF-020": {
    previousStatus: "failed",
    problemClassification: "implementation_error",
    rootCauseAnalysis:
      "Reprovado anteriormente: calculateEventTotalCost retornava 0 para itens com unit_price antes e depois da remoção.",
    correctionApplied:
      "Corrigido normalizeItemValue para considerar unit_price * quantity no cálculo e recálculo após exclusão.",
    testedEndpoint: "app/actions/items.ts (deleteItemAction)",
    databaseValidationInfo: "DELETE em public.items e atualização de mv_event_costs",
  },
  "RF-021": {
    previousStatus: "failed",
    problemClassification: "implementation_error",
    rootCauseAnalysis:
      "Reprovado anteriormente: calculateEventTotalCost ignorava a multiplicação quantity * unit_price, retornando R$ 0,00 em vez de R$ 2.650,00.",
    correctionApplied:
      "Corrigido normalizeItemValue em lib/domain/business-rules.ts para multiplicar quantity * unit_price com arredondamento de centavos.",
    testedEndpoint: "app/actions/items.ts & /api/analytics",
    databaseValidationInfo: "public.items & public.mv_event_costs",
  },
  "RF-028": {
    previousStatus: "failed",
    problemClassification: "inconsistent_requirement",
    rootCauseAnalysis:
      "Reprovado anteriormente: photoCreateSchema não mapeava os aliases event_id, file_url e caption enviados pela API/teste.",
    correctionApplied:
      "Adicionado preprocessamento em photoCreateSchema mapeando event_id -> eventId, file_url -> url, caption -> description e derivando filename.",
    testedEndpoint: "app/actions/photos.ts (uploadEventPhotoAction)",
    databaseValidationInfo: "INSERT/DELETE em public.event_photos e bucket storage.objects (event-photos)",
  },
  "RF-039": {
    previousStatus: "new",
    problemClassification: "none",
    correctionApplied: "Novo requisito funcional implementado para suportar convites de equipe por e-mail (RN-002 RBAC).",
    testedEndpoint: "POST /api/events/[eventId]/team",
    databaseValidationInfo: "INSERT em public.event_members (status = 'pending', invite_token, invite_expires_at)",
  },
  "RF-040": {
    previousStatus: "new",
    problemClassification: "none",
    correctionApplied: "Novo requisito funcional implementado para aceite de convite e revogação imediata de acesso.",
    testedEndpoint: "POST & DELETE /api/events/[eventId]/team",
    databaseValidationInfo: "UPDATE status ('active' / 'revoked') em public.event_members",
  },
  "RF-041": {
    previousStatus: "new",
    problemClassification: "none",
    correctionApplied: "Novo requisito funcional implementado para matriz granular de permissões por módulo e prevenção de escalação de privilégio.",
    testedEndpoint: "PATCH /api/events/[eventId]/team",
    databaseValidationInfo: "UPDATE role e permissions JSONB em public.event_members + função SQL has_event_permission",
  },
  "RF-042": {
    previousStatus: "new",
    problemClassification: "none",
    correctionApplied: "Novo requisito funcional implementado para transferência transacional de titularidade com confirmação nominal.",
    testedEndpoint: "POST /api/events/[eventId]/team (operation: transfer_ownership)",
    databaseValidationInfo: "Função transacional public.transfer_event_ownership e índice parcial idx_event_members_single_active_owner",
  },
  "RF-043": {
    previousStatus: "new",
    problemClassification: "none",
    correctionApplied: "Novo requisito funcional implementado para trilha de auditoria de equipe, permissões e segurança.",
    testedEndpoint: "GET /api/events/[eventId]/team",
    databaseValidationInfo: "INSERT e SELECT em public.event_audit_logs",
  },
}

for (const item of REQUIREMENTS_CATALOG) {
  const meta = AUDIT_DIAGNOSTIC_METADATA[item.id]
  if (meta) {
    Object.assign(item, meta)
  } else {
    item.previousStatus = item.previousStatus ?? "passed"
    item.problemClassification = item.problemClassification ?? "none"
    item.testedEndpoint = item.testedEndpoint ?? "Camada de Domínio / Server Actions / API REST"
    item.databaseValidationInfo = item.databaseValidationInfo ?? "PostgreSQL / Supabase Schema & RLS"
  }
}



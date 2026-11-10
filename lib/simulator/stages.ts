export interface CoveredRule {
  code: string // ex: "RN-001"
  category: "RN" | "RF" | "RNF"
  title: string
  proof: string
  badgeText: string
}

export interface SimulatorStage {
  id: number
  title: string
  subtitle: string
  actor: string
  route: string
  actions: string[]
  coveredRules: CoveredRule[]
  logs: string[]
  screenState: {
    pageTitle: string
    activeTab?: string
    visualType:
      | "register_form"
      | "dashboard_view"
      | "create_event_form"
      | "guests_table"
      | "public_rsvp"
      | "financial_split"
      | "gallery_calendar"
      | "host_view"
      | "analytics_report"
      | "nominal_deletion"
    data: Record<string, any>
  }
}

export const SIMULATOR_STAGES: SimulatorStage[] = [
  // ==========================================
  // ETAPA 1: Cadastro e Onboarding do Organizador
  // ==========================================
  {
    id: 1,
    title: "1. Cadastro e Onboarding do Organizador",
    subtitle: "Criação de nova conta com validação estrita de integridade e segurança",
    actor: "Mariana Costa (Organizadora de Eventos)",
    route: "/register",
    actions: [
      "Mariana acessa a tela de cadastro do Planeja+",
      "Informa Nome Completo: 'Mariana Costa'",
      "Informa E-mail: 'mariana.costa@eventosprime.com.br'",
      "Digita Senha segura com 10 caracteres: 'Planeja@2026'",
      "O sistema submete o formulário e valida com Zod no servidor",
      "Sessão JWT é gerada com segurança pelo Supabase Auth",
    ],
    coveredRules: [
      {
        code: "RN-001",
        category: "RN",
        title: "Unicidade da conta de usuário",
        badgeText: "E-mail exclusivo + Senha >= 6 chars",
        proof: "E-mail normalizado e senha com 10 caracteres validada pelo registerUserSchema.",
      },
      {
        code: "RF-001",
        category: "RF",
        title: "Cadastrar usuário",
        badgeText: "Onboarding Concluído",
        proof: "Registro do organizador persistido com id 'usr-org-mariana'.",
      },
      {
        code: "RF-002",
        category: "RF",
        title: "Autenticar usuário",
        badgeText: "Sessão JWT Ativa",
        proof: "Token de sessão gerado e salvo em cookies seguros HTTP-only.",
      },
      {
        code: "RNF-006",
        category: "RNF",
        title: "Zero Mass Assignment",
        badgeText: "Payload Sanitizado",
        proof: "Campos sensíveis não autorizados são bloqueados e descartados.",
      },
    ],
    logs: [
      "[00:00.12] POST /api/auth/register payload: { name: 'Mariana Costa', email: 'mariana.costa@...' }",
      "[00:00.28] Zod Schema Validation: PASS (registerUserSchema)",
      "[00:00.45] Supabase Auth: User created with UUID usr-org-mariana",
      "[00:00.62] Auth Cookies: planeja_session established (SameSite=Lax, Secure)",
    ],
    screenState: {
      pageTitle: "Criar Conta — Planeja+",
      visualType: "register_form",
      data: {
        name: "Mariana Costa",
        email: "mariana.costa@eventosprime.com.br",
        passwordMasked: "••••••••••••",
        isSubmitted: true,
        successMessage: "Conta criada com sucesso! Redirecionando para o painel...",
      },
    },
  },

  // ==========================================
  // ETAPA 2: Acesso ao Dashboard e Proteção de Rotas
  // ==========================================
  {
    id: 2,
    title: "2. Acesso ao Dashboard e Proteção de Rotas",
    subtitle: "Acesso autorizado à área restrita do titular com isolamento de dados",
    actor: "Mariana Costa (Sessão Autenticada)",
    route: "/dashboard",
    actions: [
      "O middleware intercepta a rota '/dashboard'",
      "Valida a sessão ativa do usuário e concede acesso sem redirecionar para login",
      "Carrega o dashboard executivo filtrando exclusivamente eventos do titular",
      "Estado inicial: 0 eventos ativos, interface preparada com boas-vindas",
    ],
    coveredRules: [
      {
        code: "RF-004",
        category: "RF",
        title: "Restringir acesso às áreas privadas",
        badgeText: "Guardião de Rotas Ativo",
        proof: "evaluateRouteAccess() autorizou acesso com base na sessão válida.",
      },
      {
        code: "RF-006",
        category: "RF",
        title: "Listar eventos do usuário",
        badgeText: "Filtro por Organizador",
        proof: "Consulta restrita via titularidade: WHERE user_id = 'usr-org-mariana'.",
      },
      {
        code: "RNF-005",
        category: "RNF",
        title: "Isolamento dos dados por usuário (RLS)",
        badgeText: "RLS Ativo",
        proof: "Zero registros de outros usuários vazam para a tela.",
      },
    ],
    logs: [
      "[00:01.05] Middleware: evaluateRouteAccess('/dashboard') -> allow",
      "[00:01.20] Query: SELECT * FROM events WHERE user_id = 'usr-org-mariana'",
      "[00:01.34] Row Level Security (RLS) enforcement: OK (0 records found for new user)",
      "[00:01.48] Render: Dashboard initial empty state rendered",
    ],
    screenState: {
      pageTitle: "Painel do Organizador — Planeja+",
      visualType: "dashboard_view",
      data: {
        userName: "Mariana Costa",
        activeEventsCount: 0,
        confirmedGuestsCount: 0,
        totalExpenses: "R$ 0,00",
        eventsList: [],
      },
    },
  },

  // ==========================================
  // ETAPA 3: Criação do Evento & Duplo Regime Financeiro
  // ==========================================
  {
    id: 3,
    title: "3. Criação de Evento com Modalidade Financeira",
    subtitle: "Cadastro completo com validação de horários, local e modo colaborativo",
    actor: "Mariana Costa (Criando Evento)",
    route: "/create-event",
    actions: [
      "Mariana clica em '+ Criar Novo Evento'",
      "Preenche Título: 'Churrasco de Formatura Engenharia 2026'",
      "Seleciona Categoria: 'Social' e Modalidade: 'Presencial'",
      "Define Data: 12/12/2026 | Horário: 12:00 às 19:00 (término posterior ao início)",
      "Informa Local: 'Espaço Gourmet Jardim, Salão 2'",
      "Seleciona Regime Financeiro: 'Rateio Colaborativo (split)'",
      "Define Orçamento de Referência: R$ 3.000,00 (não negativo)",
      "Clica em 'Salvar Evento' e o sistema persiste com titularidade exclusiva",
    ],
    coveredRules: [
      {
        code: "RN-002",
        category: "RN",
        title: "Titularidade do evento",
        badgeText: "Organizador Exclusivo",
        proof: "Evento vinculado estritamente a user_id 'usr-org-mariana'.",
      },
      {
        code: "RN-003",
        category: "RN",
        title: "Dados obrigatórios do evento",
        badgeText: "Consistência Temporal",
        proof: "Validação Zod aprovou início (12:00) < término (19:00) e orçamento >= 0.",
      },
      {
        code: "RF-005",
        category: "RF",
        title: "Cadastrar evento",
        badgeText: "Evento Criado",
        proof: "Registro persistido com ID 'evt-formatura-2026'.",
      },
      {
        code: "RF-034",
        category: "RF",
        title: "Configurar modalidade financeira",
        badgeText: "Rateio Colaborativo",
        proof: "financial_mode configurado como 'split' para divisão comunitária.",
      },
    ],
    logs: [
      "[00:02.10] Form: Submit create event 'Churrasco de Formatura Engenharia 2026'",
      "[00:02.25] Zod check: start_time ('12:00') < end_time ('19:00') -> VALID",
      "[00:02.40] Zod check: budget (3000.00 >= 0) -> VALID",
      "[00:02.58] Database INSERT into events (id, title, user_id, financial_mode) -> SUCCESS",
    ],
    screenState: {
      pageTitle: "Criar Novo Evento — Planeja+",
      visualType: "create_event_form",
      data: {
        title: "Churrasco de Formatura Engenharia 2026",
        category: "Social / Universitário",
        date: "12/12/2026",
        startTime: "12:00",
        endTime: "19:00",
        location: "Espaço Gourmet Jardim, Salão 2",
        financialMode: "Rateio Colaborativo (split)",
        budget: "R$ 3.000,00",
        createdId: "evt-formatura-2026",
      },
    },
  },

  // ==========================================
  // ETAPA 4: Gestão de Convidados, Acompanhantes & Buffet
  // ==========================================
  {
    id: 4,
    title: "4. Gestão de Convidados, Acompanhantes e Buffet",
    subtitle: "Importação via planilha, status Pendente e contagem de participantes",
    actor: "Mariana Costa (Gerenciando Lista)",
    route: "/event/evt-formatura-2026",
    actions: [
      "Mariana abre o hub do evento na aba 'Convidados'",
      "Importa lote de convidados via planilha CSV (delimitador ';')",
      "Cadastra 15 convidados: todos iniciam com status 'Pendente'",
      "Lucas Rocha confirma presença com 1 acompanhante (Beatriz Lima)",
      "Juliana Mendes confirma com 2 acompanhantes (Filhos)",
      "Mariana aprova os acompanhantes no painel de moderação",
      "Registra restrições alimentares: 2 Vegetarianos e 1 Sem Glúten",
      "Contagem de participantes confirmados atualiza: 2 titulares + 3 acompanhantes = 5",
    ],
    coveredRules: [
      {
        code: "RN-004",
        category: "RN",
        title: "Status de presença do convidado",
        badgeText: "Inicial: Pendente",
        proof: "Todos os convidados nascem 'Pendente' e transitam para 'Confirmado'.",
      },
      {
        code: "RN-005",
        category: "RN",
        title: "Contagem de participantes confirmados",
        badgeText: "Titulares + Acompanhantes",
        proof: "calculateConfirmedParticipants: 2 titulares confirmados + 3 acompanhantes aprovados = 5.",
      },
      {
        code: "RN-009",
        category: "RN",
        title: "Aprovação de acompanhantes",
        badgeText: "Moderação de Acompanhantes",
        proof: "Acompanhantes pendentes só contam após aprovação expressa do organizador.",
      },
      {
        code: "RF-033",
        category: "RF",
        title: "Importar convidados via planilha",
        badgeText: "Parser CSV/TSV Ativo",
        proof: "Reconhecimento automático de delimitadores ';' e cabeçalhos brasileiros.",
      },
      {
        code: "RF-035",
        category: "RF",
        title: "Restrições alimentares e acessibilidade",
        badgeText: "Consolidação de Buffet",
        proof: "Mapeamento para a equipe de buffet: 2 Vegetarianos, 1 Celíaco.",
      },
      {
        code: "RF-036",
        category: "RF",
        title: "Gerenciar acompanhantes",
        badgeText: "Cota Validada",
        proof: "companionSchema validou nomes e parentesco dentro do limite.",
      },
    ],
    logs: [
      "[00:03.10] Batch CSV Import: 15 guests parsed successfully",
      "[00:03.25] Default guest status set to 'pending' for all rows",
      "[00:03.45] RSVP response received: Lucas Rocha (status -> confirmed, companions: 1)",
      "[00:03.62] RSVP response received: Juliana Mendes (status -> confirmed, companions: 2)",
      "[00:03.80] Organizer approved 3 companions -> calculateConfirmedParticipants() = 5",
      "[00:03.95] Buffet aggregator: { Vegetariano: 2, 'Sem Glúten': 1 }",
    ],
    screenState: {
      pageTitle: "Churrasco de Formatura — Lista de Convidados",
      activeTab: "convidados",
      visualType: "guests_table",
      data: {
        totalImported: 15,
        confirmedCount: 2,
        approvedCompanions: 3,
        totalParticipantsConfirmed: 5,
        pendingCount: 13,
        dietarySummary: ["2 Vegetarianos", "1 Sem Glúten"],
        guests: [
          { name: "Lucas Rocha", status: "Confirmado", companions: "1 aprovado (Beatriz Lima)", dietary: "Normal" },
          { name: "Juliana Mendes", status: "Confirmado", companions: "2 aprovados (Filhos)", dietary: "Vegetariano" },
          { name: "Carlos Eduardo", status: "Pendente", companions: "0", dietary: "Sem Glúten" },
          { name: "Fernanda Alves", status: "Pendente", companions: "1 pendente", dietary: "Vegetariano" },
        ],
      },
    },
  },

  // ==========================================
  // ETAPA 5: Geração de Convite Público, RSVP & LGPD
  // ==========================================
  {
    id: 5,
    title: "5. Link Público, RSVP e Proteção de Dados (LGPD)",
    subtitle: "Geração de token CSPRNG 128 bits e formulário externo sem vazamento",
    actor: "Convidado Externo (Rafael Souza)",
    route: "/convite/a8f192b0e741c490e517823f99aa1234",
    actions: [
      "Mariana ativa o link público do evento com token CSPRNG de 128 bits",
      "O link público é gerado: planejamais.com.br/convite/a8f192b0e741c490...",
      "Rafael Souza (convidado externo) abre o link no smartphone",
      "A página pública filtra estritamente dados sensíveis: gastos e lista de convidados ficam ocultos (LGPD)",
      "Rafael preenche seu nome, e-mail e confirma presença com 1 acompanhante",
      "O sistema processa a confirmação de presença (RSVP) e notifica o organizador",
    ],
    coveredRules: [
      {
        code: "RN-006",
        category: "RN",
        title: "Validade do convite público",
        badgeText: "CSPRNG 128 bits",
        proof: "Token hexadecimal seguro gerado por generateSecureToken().",
      },
      {
        code: "RN-007",
        category: "RN",
        title: "Visibilidade dos dados do evento (LGPD)",
        badgeText: "Menor Privilégio",
        proof: "buildPublicEventPayload ocultou custos, anotações e lista interna.",
      },
      {
        code: "RF-014",
        category: "RF",
        title: "Gerar link público de convite",
        badgeText: "Link Ativo",
        proof: "Endpoint de link público ativado e validado no servidor.",
      },
      {
        code: "RF-015",
        category: "RF",
        title: "Responder convite (RSVP)",
        badgeText: "RSVP Concluído",
        proof: "publicRsvpSchema validou resposta externa sem exigir login.",
      },
      {
        code: "RNF-004",
        category: "RNF",
        title: "Controle de acesso e Rate Limiting",
        badgeText: "Rate Limit <= 20 req/min",
        proof: "Middleware protege rota pública contra ataques de força bruta.",
      },
    ],
    logs: [
      "[00:04.15] Token generation: CSPRNG 128-bit safe hex token created",
      "[00:04.30] GET /convite/[token] -> public payload delivered (zero sensitive data leaked)",
      "[00:04.45] Rate limiter IP check: request 1 of 10 within 60s window (ALLOWED)",
      "[00:04.60] POST /api/confirm/[token]/accept -> RSVP registered for 'Rafael Souza'",
    ],
    screenState: {
      pageTitle: "Convite — Churrasco de Formatura",
      visualType: "public_rsvp",
      data: {
        token: "a8f192b0e741c490e517823f99aa1234",
        eventTitle: "Churrasco de Formatura Engenharia 2026",
        eventDate: "12 de Dezembro de 2026 • 12:00 às 19:00",
        eventLocation: "Espaço Gourmet Jardim, Salão 2",
        guestName: "Rafael Souza",
        guestEmail: "rafael.souza@gmail.com",
        response: "Confirmado com 1 acompanhante",
        statusAlert: "Presença confirmada com sucesso! Seu nome foi incluído na lista oficial.",
      },
    },
  },

  // ==========================================
  // ETAPA 6: Planilha de Custos & Rateio Colaborativo
  // ==========================================
  {
    id: 6,
    title: "6. Gestão Financeira e Rateio Colaborativo",
    subtitle: "Cálculo dinâmico do custo total e divisão exata por participante confirmado",
    actor: "Mariana Costa (Aba Financeiro)",
    route: "/event/evt-formatura-2026?tab=financeiro",
    actions: [
      "Mariana abre a aba 'Financeiro' do evento",
      "Cadastra itens de despesa:",
      "  • Carnes Nobres e Carvão: R$ 1.200,00 (pago por Lucas Rocha)",
      "  • Bebidas e Gelo: R$ 800,00 (pago por Mariana Costa)",
      "  • Aluguel do Salão e Som: R$ 600,00 (pago por Mariana Costa)",
      "  • Sobremesas e Descartáveis: R$ 400,00 (pendente)",
      "O sistema calcula dinamicamente o Custo Total: R$ 3.000,00",
      "Com 20 participantes confirmados, o sistema calcula o Rateio Colaborativo: R$ 150,00 por pessoa",
      "O teto orçamentário de referência (R$ 3.000,00) registra saldo R$ 0,00 (100% executado)",
    ],
    coveredRules: [
      {
        code: "RN-010",
        category: "RN",
        title: "Vínculo e valor dos itens",
        badgeText: "Itens Vinculados",
        proof: "itemCreateSchema validou valores >= 0 e vinculação ao evento.",
      },
      {
        code: "RN-011",
        category: "RN",
        title: "Cálculo do custo total",
        badgeText: "R$ 3.000,00 Total",
        proof: "calculateEventTotalCost computou a soma exata de todos os itens ativos.",
      },
      {
        code: "RN-012",
        category: "RN",
        title: "Rateio do valor por pessoa",
        badgeText: "R$ 150,00 / pessoa",
        proof: "calculateCollaborativeSplit(3000, 20) = R$ 150,00 (2 casas decimais).",
      },
      {
        code: "RN-013",
        category: "RN",
        title: "Orçamento previsto como referência",
        badgeText: "Teto Não Bloqueante",
        proof: "calculateBudgetComparison comparou custo real com orçamento de referência.",
      },
      {
        code: "RF-021",
        category: "RF",
        title: "Calcular custo total do evento",
        badgeText: "Automação Financeira",
        proof: "Atualização instantânea na criação, edição ou exclusão de despesas.",
      },
      {
        code: "RNF-007",
        category: "RNF",
        title: "Consistência matemática zero-discrepância",
        badgeText: "Diferença 0.00",
        proof: "Mesmo valor calculado no domínio, exibido na tela e emitido nos relatórios.",
      },
    ],
    logs: [
      "[00:05.10] Item created: 'Carnes Nobres' (R$ 1.200,00) - Assignee: Lucas Rocha",
      "[00:05.24] Item created: 'Bebidas e Gelo' (R$ 800,00) - Assignee: Mariana Costa",
      "[00:05.38] Item created: 'Aluguel do Salão' (R$ 600,00) - Assignee: Mariana Costa",
      "[00:05.50] Item created: 'Sobremesas' (R$ 400,00) - Status: pending",
      "[00:05.68] calculateEventTotalCost: R$ 3.000,00",
      "[00:05.82] calculateCollaborativeSplit: 3000 / 20 confirmed = R$ 150,00 per person",
    ],
    screenState: {
      pageTitle: "Churrasco de Formatura — Painel Financeiro",
      activeTab: "financeiro",
      visualType: "financial_split",
      data: {
        totalCost: "R$ 3.000,00",
        confirmedParticipants: 20,
        splitPerPerson: "R$ 150,00",
        budgetEstimated: "R$ 3.000,00",
        budgetBalance: "R$ 0,00 (100% da verba)",
        items: [
          { name: "Carnes Nobres e Carvão", cost: "R$ 1.200,00", paidBy: "Lucas Rocha", status: "Pago" },
          { name: "Bebidas e Gelo", cost: "R$ 800,00", paidBy: "Mariana Costa", status: "Pago" },
          { name: "Aluguel Salão e Som", cost: "R$ 600,00", paidBy: "Mariana Costa", status: "Pago" },
          { name: "Sobremesas e Descartáveis", cost: "R$ 400,00", paidBy: "Pendente", status: "A pagar" },
        ],
      },
    },
  },

  // ==========================================
  // ETAPA 7: Galeria de Fotos, Contatos & Calendário ICS
  // ==========================================
  {
    id: 7,
    title: "7. Galeria de Fotos, Contatos e Calendário ICS",
    subtitle: "Upload de fotos, exportação de arquivo .ics e snapshot de contatos",
    actor: "Mariana Costa (Organização Complementar)",
    route: "/calendar",
    actions: [
      "Mariana faz upload de fotos na Galeria do evento",
      "O sistema valida a titularidade do organizador para gerenciar e excluir fotos",
      "Mariana exporta o evento no formato universal de calendário iCalendar (.ics)",
      "Arquivo gerado conforme padrão RFC 5545 para Google Calendar e Outlook",
      "Abre o Calendário do sistema e o evento aparece agendado em 12/12/2026",
    ],
    coveredRules: [
      {
        code: "RN-014",
        category: "RN",
        title: "Propriedade dos contatos",
        badgeText: "Snapshot Desacoplado",
        proof: "cloneContactToGuestSnapshot preserva integridade histórica do evento.",
      },
      {
        code: "RN-018",
        category: "RN",
        title: "Remoção de fotos do evento",
        badgeText: "Moderação da Galeria",
        proof: "canOrganizerModifyPhoto autoriza apenas o criador titular do evento.",
      },
      {
        code: "RF-024",
        category: "RF",
        title: "Exibir calendário de eventos",
        badgeText: "Visão Calendário",
        proof: "Renderização do evento na grade mensal com parseFlexibleEventDate.",
      },
      {
        code: "RF-028",
        category: "RF",
        title: "Manter galeria de fotos",
        badgeText: "Galeria Ativa",
        proof: "photoCreateSchema validou metadados da imagem no storage.",
      },
      {
        code: "RF-029",
        category: "RF",
        title: "Exportar evento em formato ICS",
        badgeText: "iCalendar RFC 5545",
        proof: "buildIcsCalendar gerou cabeçalhos VCALENDAR e VEVENT válidos.",
      },
    ],
    logs: [
      "[00:06.12] Photo upload: 'banner-formatura.jpg' linked to evt-formatura-2026",
      "[00:06.28] canOrganizerModifyPhoto check: user is owner -> ALLOWED",
      "[00:06.42] ICS Generator: BEGIN:VCALENDAR -> VEVENT 'Churrasco de Formatura' generated",
      "[00:06.60] Calendar View: Event mapped to date 2026-12-12 on monthly grid",
    ],
    screenState: {
      pageTitle: "Calendário & Mídias — Planeja+",
      visualType: "gallery_calendar",
      data: {
        activeMonth: "Dezembro de 2026",
        scheduledEvent: "12 de Dezembro: Churrasco de Formatura (12:00 - 19:00)",
        icsExportUrl: "/api/confirm/a8f192b0e741c490/calendar.ics",
        galleryPhotosCount: 4,
        photos: [
          { caption: "Local do Evento", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=300" },
          { caption: "Área Gourmet", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300" },
        ],
      },
    },
  },

  // ==========================================
  // ETAPA 8: Portal do Anfitrião (Host View - Leitura)
  // ==========================================
  {
    id: 8,
    title: "8. Portal do Anfitrião (Host View - Modo Leitura)",
    subtitle: "Compartilhamento com clientes e contratantes sem permissão de alteração",
    actor: "Comissão de Formatura (Visualização Externa)",
    route: "/event/evt-formatura-2026/host-view?token=host-sec-token-2026",
    actions: [
      "Mariana gera o link exclusivo do Anfitrião para a comissão de formatura",
      "A comissão abre a página do anfitrião via navegador",
      "A tela exibe indicadores executivos: presença, restrições e rateio",
      "Botões de edição, exclusão e alteração de despesas não existem na tela",
      "Garante transparência com os contratantes sem risco de adulteração de dados",
    ],
    coveredRules: [
      {
        code: "RN-002",
        category: "RN",
        title: "Titularidade do evento",
        badgeText: "Portal Somente-Leitura",
        proof: "Anfitrião externo tem acesso estritamente restrito a leitura dos dados.",
      },
      {
        code: "RN-007",
        category: "RN",
        title: "Visibilidade dos dados do evento",
        badgeText: "Consulta Autorizada",
        proof: "Token exclusivo do anfitrião autoriza indicadores consolidados sem mutação.",
      },
      {
        code: "RF-038",
        category: "RF",
        title: "Portal somente-leitura do anfitrião",
        badgeText: "Host View Homologada",
        proof: "Rota /event/[id]/host-view protegida por token e sem ações de escrita.",
      },
    ],
    logs: [
      "[00:07.10] Host view access token verified: 'host-sec-token-2026'",
      "[00:07.25] Checking mutation permissions: Organizer only (host-view is READ-ONLY)",
      "[00:07.40] Indicators loaded: 20 participants confirmed, R$ 150,00 split, 3 dietary restrictions",
    ],
    screenState: {
      pageTitle: "Portal do Anfitrião — Churrasco de Formatura",
      visualType: "host_view",
      data: {
        eventTitle: "Churrasco de Formatura Engenharia 2026",
        modeNotice: "Modo de Acompanhamento do Anfitrião (Somente Leitura)",
        confirmedCount: "20 Participantes Confirmados",
        splitPerPerson: "R$ 150,00 por pessoa",
        totalExpenses: "R$ 3.000,00",
        dietarySummary: "2 Vegetarianos, 1 Sem Glúten",
        canEdit: false,
      },
    },
  },

  // ==========================================
  // ETAPA 9: Métricas no Dashboard & Emissão de Relatório PDF
  // ==========================================
  {
    id: 9,
    title: "9. Consolidação Analítica e Emissão de Relatório PDF",
    subtitle: "Métricas consolidadas, Pareto 80/20 e emissão de documento formal A4",
    actor: "Mariana Costa (Auditoria Final)",
    route: "/dashboard/analytics",
    actions: [
      "Mariana retorna ao Dashboard para verificar as métricas consolidadas",
      "O sistema calcula indicadores com isolamento estrito de titularidade",
      "Gera curva de Pareto 80/20 das maiores despesas do evento",
      "Clica em 'Exportar Dossiê Executivo em PDF'",
      "O sistema normaliza os dados com zero discrepância matemática",
      "Gera o documento A4 profissional para prestação de contas",
    ],
    coveredRules: [
      {
        code: "RN-016",
        category: "RN",
        title: "Abrangência das métricas",
        badgeText: "Isolamento Analítico",
        proof: "Métricas consideram exclusivamente os eventos ativos do titular.",
      },
      {
        code: "RF-026",
        category: "RF",
        title: "Exibir painel de indicadores",
        badgeText: "Dashboard Executivo",
        proof: "Agrupamento de confirmados, taxa de adesão e finanças.",
      },
      {
        code: "RF-027",
        category: "RF",
        title: "Exibir análises e gráficos",
        badgeText: "Gráficos & Pareto",
        proof: "Distribuição percentual e Pareto 80/20 consistentes com a base.",
      },
      {
        code: "RF-037",
        category: "RF",
        title: "Exportar relatórios gerenciais em PDF",
        badgeText: "Relatório A4 Pronto",
        proof: "normalizeReportData estruturou o PDF sem divergências numéricas.",
      },
      {
        code: "RNF-007",
        category: "RNF",
        title: "Consistência matemática zero-discrepância",
        badgeText: "Zero Discrepância",
        proof: "Diferença 0.00 entre painéis, cálculos do domínio e documento exportado.",
      },
    ],
    logs: [
      "[00:08.15] Analytics engine: Aggregating 1 active event for 'usr-org-mariana'",
      "[00:08.30] Pareto calculation: 'Carnes Nobres' (R$ 1.200) accounts for 40% of total expenses",
      "[00:08.48] normalizeReportData called for PDF export -> totalExpenses: R$ 3.000,00",
      "[00:08.65] PDF document compiled in standard A4 format with executive summary and sign-offs",
    ],
    screenState: {
      pageTitle: "Análises & Relatórios — Planeja+",
      visualType: "analytics_report",
      data: {
        totalCost: "R$ 3.000,00",
        confirmationRate: "66.7%",
        paretoTopItem: "Carnes Nobres e Carvão (40% do orçamento)",
        pdfReportReady: true,
        reportTitle: "Dossiê Executivo — Churrasco de Formatura 2026.pdf",
      },
    },
  },

  // ==========================================
  // ETAPA 10: Encerramento do Ciclo & Exclusão Nominal Segura
  // ==========================================
  {
    id: 10,
    title: "10. Encerramento do Ciclo e Exclusão Nominal Segura",
    subtitle: "Proteção contra exclusão acidental e integridade referencial em cascata",
    actor: "Mariana Costa (Finalizando Evento)",
    route: "/event/evt-formatura-2026",
    actions: [
      "Após o encerramento do evento, Mariana decide testar o fluxo de exclusão",
      "Clica em 'Excluir Evento'",
      "O sistema abre o Modal de Segurança com Confirmação Nominal",
      "Tentativa com nome incorreto ('Formatura') é bloqueada pelo sistema",
      "Mariana digita o nome exato: 'Churrasco de Formatura Engenharia 2026'",
      "O sistema autoriza e executa a exclusão em cascata (convidados, itens, fotos)",
      "Links públicos são desativados e o dashboard retorna ao estado limpo",
    ],
    coveredRules: [
      {
        code: "RN-015",
        category: "RN",
        title: "Exclusão de evento em cascata",
        badgeText: "Confirmação Nominal",
        proof: "validateNominalEventDeletion exige correspondência exata do título.",
      },
      {
        code: "RF-008",
        category: "RF",
        title: "Excluir evento",
        badgeText: "Cascata Concluída",
        proof: "Exclusão remove convidados, despesas e fotos vinculados sem órfãos.",
      },
      {
        code: "RN-006",
        category: "RN",
        title: "Validade do convite público",
        badgeText: "Links Desativados",
        proof: "Tokens de evento excluído deixam de aceitar respostas imediatamente.",
      },
      {
        code: "RN-016",
        category: "RN",
        title: "Abrangência das métricas",
        badgeText: "Expurgo Imediato",
        proof: "Eventos excluídos são desconsiderados do dashboard em tempo real.",
      },
    ],
    logs: [
      "[00:09.10] Deletion attempt with input 'Formatura' -> REJECTED (nominal mismatch)",
      "[00:09.30] Deletion attempt with input 'Churrasco de Formatura Engenharia 2026' -> AUTHORIZED",
      "[00:09.50] Cascade DELETE: guests, companions, items, photos, public links removed",
      "[00:09.70] Event status: deleted | Dashboard metrics recalculated to 0",
      "[00:09.90] JORNADA COMPLETA E2E FINALIZADA COM 100% DE CONFORMIDADE TÉCNICA!",
    ],
    screenState: {
      pageTitle: "Exclusão Segura — Confirmação Nominal",
      visualType: "nominal_deletion",
      data: {
        eventTitle: "Churrasco de Formatura Engenharia 2026",
        enteredText: "Churrasco de Formatura Engenharia 2026",
        isAuthorized: true,
        cascadeNotice: "4 itens, 15 convidados, 3 acompanhantes e 4 fotos removidos em cascata.",
        successMessage: "Ciclo de vida do evento concluído com sucesso. Todos os requisitos demonstrados!",
      },
    },
  },
]


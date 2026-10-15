export interface EventTerminology {
  guestLabel: string
  guestsLabel: string
  attendeeLabel: string
  attendeeSingular: string
  confirmedLabel: string
  groupLabel: string
  hostLabel: string
  expensesLabel: string
  budgetTitle: string
  addGuestText: string
  addAttendee: string
  addItem: string
  overviewTitle: string
}

export function getEventTerminology(eventType?: string): EventTerminology {
  const normalized = (eventType || "").toLowerCase().trim()

  if (
    normalized.includes("corporativo") ||
    normalized.includes("empresa") ||
    normalized.includes("confraterniza") ||
    normalized.includes("rh")
  ) {
    return {
      guestLabel: "Colaborador",
      guestsLabel: "Colaboradores",
      attendeeLabel: "Colaboradores",
      attendeeSingular: "Colaborador",
      confirmedLabel: "Presenças Confirmadas",
      groupLabel: "Departamento / Setor",
      hostLabel: "Comitê Organizador / RH",
      expensesLabel: "Centro de Custo e Fornecedores",
      budgetTitle: "Centro de Custo e Fornecedores",
      addGuestText: "Importar / Adicionar Colaborador",
      addAttendee: "Importar / Adicionar Colaborador",
      addItem: "Adicionar Fornecedor / Custo",
      overviewTitle: "Gestão do Evento Corporativo",
    }
  }

  if (normalized.includes("casamento")) {
    return {
      guestLabel: "Convidado",
      guestsLabel: "Convidados da Cerimônia",
      attendeeLabel: "Convidados da Cerimônia",
      attendeeSingular: "Convidado",
      confirmedLabel: "Presenças Confirmadas",
      groupLabel: "Família / Mesa",
      hostLabel: "Noivos e Cerimonial",
      expensesLabel: "Fornecedores e Contratos",
      budgetTitle: "Fornecedores e Contratos",
      addGuestText: "Adicionar à Lista dos Noivos",
      addAttendee: "Adicionar à Lista dos Noivos",
      addItem: "Adicionar Contrato / Serviço",
      overviewTitle: "Painel dos Noivos e Cerimonial",
    }
  }

  if (normalized.includes("formatura")) {
    return {
      guestLabel: "Formando / Convidado",
      guestsLabel: "Formandos e Convidados",
      attendeeLabel: "Formandos e Convidados",
      attendeeSingular: "Formando",
      confirmedLabel: "Confirmados",
      groupLabel: "Turma / Mesa",
      hostLabel: "Comissão de Formatura",
      expensesLabel: "Contratos da Formatura",
      budgetTitle: "Contratos da Formatura",
      addGuestText: "Adicionar Formando",
      addAttendee: "Adicionar Formando",
      addItem: "Adicionar Fornecedor / Contrato",
      overviewTitle: "Painel da Comissão de Formatura",
    }
  }

  return {
    guestLabel: "Convidado",
    guestsLabel: "Convidados",
    attendeeLabel: "Convidados",
    attendeeSingular: "Convidado",
    confirmedLabel: "Confirmados",
    groupLabel: "Grupo / Categoria",
    hostLabel: "Organizador",
    expensesLabel: "Gastos do Evento",
    budgetTitle: "Gastos do Evento",
    addGuestText: "Adicionar Convidado",
    addAttendee: "Importar / Adicionar Convidados",
    addItem: "Adicionar Gasto / Fornecedor",
    overviewTitle: "Painel do Evento",
  }
}

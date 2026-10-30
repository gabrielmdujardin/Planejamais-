/**
 * Coletor e normalizador de dados para relatórios documentais PDF — Planeja+
 * Isola as regras de negócio, consolidação e projeções dos componentes visuais.
 */

import type {
  NormalizedReportData,
  NormalizedEvent,
  NormalizedItem,
  NormalizedGuest,
  ParetoItem,
  AttendanceScenario,
  ReportFilterOptions,
} from "./types"

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value || 0)
}

export function formatBRLCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0)
}

export function formatPercent(value: number): string {
  return `${(value || 0).toFixed(1)}%`
}

/**
 * Normaliza uma lista bruta de eventos do Planeja+ para o formato de relatório
 */
export function normalizeReportData(
  rawEvents: any[],
  options: ReportFilterOptions,
): NormalizedReportData {
  const filteredRaw =
    options.selectedEventId === "all"
      ? rawEvents
      : rawEvents.filter((ev) => String(ev.id) === String(options.selectedEventId))

  const normalizedEvents: NormalizedEvent[] = filteredRaw.map((ev) => {
    // Normalizar Itens
    const rawItems: any[] = ev.items || []
    const items: NormalizedItem[] = rawItems.map((item: any) => {
      const rawPrice = Number(item.price ?? item.estimatedCost ?? item.actualCost ?? 0)
      const price = Number.isFinite(rawPrice) ? rawPrice : 0
      const rawEst = item.estimatedCost ? Number(item.estimatedCost) : undefined
      const estimatedCost = Number.isFinite(rawEst) ? rawEst : undefined
      const paymentStatus = (item.paymentStatus || item.status || "pending").toLowerCase()
      return {
        id: String(item.id || Math.random()),
        name: item.name || "Item sem nome",
        price,
        estimatedCost,
        category: item.category || "Geral",
        paymentStatus,
        supplier: item.supplier || undefined,
        dueDate: item.dueDate || undefined,
        notes: item.notes || undefined,
      }
    })

    // Normalizar Convidados
    const rawGuests: any[] = ev.guests || []
    const guests: NormalizedGuest[] = rawGuests.map((g: any) => {
      const companions = Array.isArray(g.companions) ? g.companions : []
      return {
        id: String(g.id || Math.random()),
        name: g.name || "Convidado sem nome",
        email: g.email || undefined,
        phone: g.phone || undefined,
        status: g.status || "pending",
        companionsCount: companions.length,
        companionsNames: companions.map((c: any) => c.name || "Acompanhante"),
        tableNumber: g.tableNumber || undefined,
        dietaryRestrictions: g.dietaryRestrictions || undefined,
      }
    })

    // Métricas de convidados
    const totalGuests = guests.length || Number(ev.totalGuests || 0)
    const confirmedGuests =
      guests.length > 0
        ? guests.filter((g) => g.status === "confirmed").length
        : Number(ev.confirmedGuests || 0)
    const pendingGuests =
      guests.length > 0
        ? guests.filter((g) => g.status === "pending" || g.status === "awaiting_approval" || g.status === "pending_approval").length
        : Math.max(0, totalGuests - confirmedGuests)
    const declinedGuests =
      guests.length > 0
        ? guests.filter((g) => g.status === "declined").length
        : 0

    const confirmationRate = totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0
    const responseRate = totalGuests > 0 ? ((confirmedGuests + declinedGuests) / totalGuests) * 100 : 0

    // Métricas financeiras
    const totalCost = items.reduce((acc, it) => acc + it.price, 0)
    const paidCost = items
      .filter((it) => it.paymentStatus === "paid")
      .reduce((acc, it) => acc + it.price, 0)
    const pendingCost = items
      .filter((it) => it.paymentStatus !== "paid")
      .reduce((acc, it) => acc + it.price, 0)

    const costPerGuest = totalGuests > 0 ? totalCost / totalGuests : 0
    const costPerConfirmed = confirmedGuests > 0 ? totalCost / confirmedGuests : 0

    // Modo financeiro
    const financialMode =
      ev.financialMode || (ev.type === "Colaborativo" ? "collaborative_split" : "corporate_budget")
    const budgetEstimated = ev.budgetEstimated ? Number(ev.budgetEstimated) : null

    // Cálculo de Risco
    let riskLevel: "Baixo" | "Médio" | "Alto" = "Baixo"
    let riskReason = "Operação sob controle e sem pendências críticas."

    if (financialMode === "corporate_budget" && budgetEstimated && totalCost > budgetEstimated) {
      riskLevel = "Alto"
      riskReason = `Orçamento estourado em ${formatBRL(totalCost - budgetEstimated)}.`
    } else if (confirmationRate < 40 && totalGuests > 10) {
      riskLevel = "Médio"
      riskReason = `Taxa de confirmação baixa (${formatPercent(confirmationRate)}).`
    } else if (pendingCost > totalCost * 0.7 && totalCost > 1000) {
      riskLevel = "Médio"
      riskReason = `Grande volume de faturas pendentes a liquidar (${formatBRL(pendingCost)}).`
    }

    return {
      id: String(ev.id),
      title: ev.title || "Evento sem título",
      type: ev.type || "Geral",
      category: ev.category || undefined,
      status: ev.status || "Ativo",
      date: ev.fullDate || ev.date || "Data não definida",
      time: ev.time || undefined,
      location: ev.location || undefined,
      address: ev.address || undefined,
      description: ev.description || undefined,
      financialMode,
      budgetEstimated,
      totalGuests,
      confirmedGuests,
      pendingGuests,
      declinedGuests,
      confirmationRate,
      responseRate,
      totalCost,
      paidCost,
      pendingCost,
      costPerGuest,
      costPerConfirmed,
      riskLevel,
      riskReason,
      items,
      guests,
    }
  })

  // Agregações globais do relatório
  const totalEvents = normalizedEvents.length
  const totalGuests = normalizedEvents.reduce((acc, ev) => acc + ev.totalGuests, 0)
  const confirmedGuests = normalizedEvents.reduce((acc, ev) => acc + ev.confirmedGuests, 0)
  const pendingGuests = normalizedEvents.reduce((acc, ev) => acc + ev.pendingGuests, 0)
  const declinedGuests = normalizedEvents.reduce((acc, ev) => acc + ev.declinedGuests, 0)
  const confirmationRate = totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0
  const responseRate = totalGuests > 0 ? ((confirmedGuests + declinedGuests) / totalGuests) * 100 : 0

  // Separação de orçamento corporativo vs rateio colaborativo
  const corporateEvents = normalizedEvents.filter((ev) => ev.financialMode === "corporate_budget")
  const collaborativeEvents = normalizedEvents.filter((ev) => ev.financialMode === "collaborative_split")

  const totalBudget = corporateEvents.reduce((acc, ev) => acc + (ev.budgetEstimated || 0), 0)
  const totalExpenses = normalizedEvents.reduce((acc, ev) => acc + ev.totalCost, 0)
  const paidExpenses = normalizedEvents.reduce((acc, ev) => acc + ev.paidCost, 0)
  const pendingExpenses = normalizedEvents.reduce((acc, ev) => acc + ev.pendingCost, 0)

  const corporateExpenses = corporateEvents.reduce((acc, ev) => acc + ev.totalCost, 0)
  const availableBalance = Math.max(0, totalBudget - corporateExpenses)
  const deficit = corporateExpenses > totalBudget ? corporateExpenses - totalBudget : 0
  const budgetExecutionRate = totalBudget > 0 ? (corporateExpenses / totalBudget) * 100 : 0

  const averageCostPerGuest = totalGuests > 0 ? totalExpenses / totalGuests : 0
  const highRiskEventsCount = normalizedEvents.filter((ev) => ev.riskLevel === "Alto").length

  // Análise de Pareto de Despesas
  const allItems = normalizedEvents.flatMap((ev) => ev.items)
  const itemMap = new Map<string, number>()
  allItems.forEach((it) => {
    itemMap.set(it.name, (itemMap.get(it.name) || 0) + it.price)
  })

  const sortedItems = Array.from(itemMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  let cumulativeSum = 0
  const paretoItems: ParetoItem[] = sortedItems.map((item) => {
    cumulativeSum += item.value
    const percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0
    const cumulative = totalExpenses > 0 ? (cumulativeSum / totalExpenses) * 100 : 0
    return {
      name: item.name,
      value: item.value,
      percentage,
      cumulative,
      isTop80: cumulative <= 80 || (cumulativeSum - item.value) / totalExpenses < 0.8,
    }
  })

  // Projeção de Cenários de Presença
  const attendanceScenarios: AttendanceScenario[] = [
    {
      name: "Mínima",
      people: confirmedGuests,
      cost: totalExpenses > 0 && totalGuests > 0 ? (totalExpenses / totalGuests) * confirmedGuests : 0,
      description: "Apenas convidados que já confirmaram presença formalmente.",
    },
    {
      name: "Provável",
      people: confirmedGuests + Math.ceil(pendingGuests * 0.45),
      cost:
        totalExpenses > 0 && totalGuests > 0
          ? (totalExpenses / totalGuests) * (confirmedGuests + Math.ceil(pendingGuests * 0.45))
          : 0,
      description: "Confirmados somados a uma taxa histórica estimada de 45% dos pendentes.",
    },
    {
      name: "Máxima",
      people: confirmedGuests + pendingGuests,
      cost: totalExpenses,
      description: "100% de adesão de todos os convidados listados.",
    },
  ]

  // Fornecedores principais
  const supplierMap = new Map<string, { total: number; itemCount: number; paid: number }>()
  allItems.forEach((it) => {
    const supp = it.supplier || "Fornecedor não informado"
    const current = supplierMap.get(supp) || { total: 0, itemCount: 0, paid: 0 }
    current.total += it.price
    current.itemCount += 1
    if (it.paymentStatus === "paid") current.paid += it.price
    supplierMap.set(supp, current)
  })

  const topSuppliers = Array.from(supplierMap.entries())
    .map(([name, data]) => ({
      name,
      total: data.total,
      itemCount: data.itemCount,
      paidPercentage: data.total > 0 ? (data.paid / data.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // Divergências e Alertas Documentais
  const divergences: Array<{ title: string; detail: string; severity: "critical" | "warning" | "info" }> = []

  if (deficit > 0) {
    divergences.push({
      title: "Excesso Orçamentário",
      detail: `O valor comprometido excede o teto aprovado em ${formatBRL(deficit)}. Recomenda-se remanejamento de itens não críticos.`,
      severity: "critical",
    })
  }

  if (pendingExpenses > totalExpenses * 0.6 && totalExpenses > 500) {
    divergences.push({
      title: "Alta Concentração de Faturas Pendentes",
      detail: `${formatBRL(pendingExpenses)} (${formatPercent((pendingExpenses / totalExpenses) * 100)}) dos custos totais ainda estão pendentes de liquidação.`,
      severity: "warning",
    })
  }

  if (confirmationRate < 50 && totalGuests > 15) {
    divergences.push({
      title: "Taxa de Resposta Abaixo do Ideal",
      detail: `${pendingGuests} convidados ainda não responderam ao RSVP. Sugere-se disparo de lembrete.`,
      severity: "warning",
    })
  }

  if (divergences.length === 0) {
    divergences.push({
      title: "Conformidade Orçamentária e Operacional",
      detail: "Nenhuma inconsistência grave identificada. O cronograma e os custos estão dentro das metas previstas.",
      severity: "info",
    })
  }

  // Título e identificação do documento
  const isSingleEvent = normalizedEvents.length === 1
  const singleEvent = isSingleEvent ? normalizedEvents[0] : undefined

  let reportTitle = "Relatório Executivo de Eventos"
  if (options.reportType === "executive-summary") {
    reportTitle = isSingleEvent ? `Resumo Executivo — ${singleEvent?.title}` : "Resumo Executivo do Portfólio"
  } else if (options.reportType === "full-event") {
    reportTitle = isSingleEvent ? `Relatório Completo — ${singleEvent?.title}` : "Dossiê Consolidado de Eventos"
  } else if (options.reportType === "financial") {
    reportTitle = isSingleEvent ? `Relatório Financeiro — ${singleEvent?.title}` : "Prestação de Contas & Orçamento"
  } else if (options.reportType === "comparative") {
    reportTitle = "Relatório Comparativo de Eventos"
  }

  const now = new Date()
  const reportId = `PLN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`

  return {
    reportId,
    reportType: options.reportType,
    reportTitle,
    generatedAt: now.toISOString(),
    generatedDateFormatted: now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    generatedBy: options.generatedBy || "Planeja+ Sistema de Gestão",
    isSingleEvent,
    event: singleEvent,
    events: normalizedEvents,
    metrics: {
      totalEvents,
      totalGuests,
      confirmedGuests,
      pendingGuests,
      declinedGuests,
      confirmationRate,
      responseRate,
      totalBudget,
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      availableBalance,
      deficit,
      budgetExecutionRate,
      averageCostPerGuest,
      collaborativeEventsCount: collaborativeEvents.length,
      corporateEventsCount: corporateEvents.length,
      highRiskEventsCount,
    },
    paretoItems,
    attendanceScenarios,
    topSuppliers,
    divergences,
  }
}

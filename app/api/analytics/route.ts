import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type GuestStatus = "awaiting_approval" | "pending" | "confirmed" | "declined" | "expired" | "cancelled"
type CompanionStatus = "awaiting_approval" | "approved" | "rejected" | "cancelled"
type InsightTone = "info" | "warning" | "risk" | "success"

type EventRow = {
  id: string
  title: string
  type?: string | null
  category?: string | null
  status?: string | null
  date?: string | null
  time?: string | null
  location?: string | null
  created_at?: string | null
  guests?: GuestRow[]
  items?: ItemRow[]
}

type GuestRow = {
  id: string
  event_id: string
  status: GuestStatus
  source?: string | null
  requested_at?: string | null
  responded_at?: string | null
  confirmed_at?: string | null
  created_at?: string | null
  guest_companions?: CompanionRow[]
}

type CompanionRow = {
  id: string
  guest_id: string
  status: CompanionStatus
  created_at?: string | null
}

type ItemRow = {
  id: string
  event_id: string
  name: string
  price?: number | string | null
  estimated_cost?: number | string | null
  quantity?: number | null
  status?: string | null
}

const emptyMetrics = {
  totalEvents: 0,
  totalGuests: 0,
  confirmedGuests: 0,
  pendingGuests: 0,
  declinedGuests: 0,
  confirmationRate: 0,
  responseRate: 0,
  pendingRequests: 0,
  requestedCompanions: 0,
  approvedCompanions: 0,
  pendingCompanions: 0,
  rejectedCompanions: 0,
  publicInviteGuests: 0,
  totalPeopleEstimated: 0,
  totalPeopleConfirmed: 0,
  projectedPeopleLikely: 0,
  projectedPeopleMax: 0,
  estimatedCost: 0,
  confirmedCost: 0,
  likelyCost: 0,
  maxCost: 0,
  averageCostPerGuest: 0,
  averageCostPerConfirmed: 0,
  itemsCount: 0,
  highRiskEvents: 0,
}

function emptyAnalytics(selectedEventId: string, title: string, description: string) {
  return {
    filters: { selectedEventId, events: [] },
    metrics: emptyMetrics,
    charts: {
      rsvpStatus: [],
      companionStatus: [],
      confirmationFunnel: [],
      attendanceProjection: [],
      costProjection: [],
      paretoCosts: [],
      costByEvent: [],
      costByItem: [],
      confirmationsByEvent: [],
      confirmationsOverTime: [],
      eventsByStatus: [],
      eventsByMonth: [],
      advancedComparison: [],
      riskMatrix: [],
    },
    insights: [{ tone: "info", title, description, reason: description }],
    rankings: { attentionEvents: [] },
  }
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseEventDate(value?: string | null) {
  if (!value) return null
  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct

  const brDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brDate) {
    const [, day, month, year] = brDate
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function itemCost(item: ItemRow) {
  const unitCost = toNumber(item.estimated_cost) || toNumber(item.price)
  return unitCost * (item.quantity || 1)
}

function eventCost(event: EventRow) {
  return (event.items || []).reduce((sum, item) => sum + itemCost(item), 0)
}

function getDaysUntilEvent(event: EventRow) {
  const date = parseEventDate(event.date)
  if (!date) return null
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - startOfToday.getTime()) / 86400000)
}

function isEventInPeriod(event: EventRow, period: string, startDate: string | null, endDate: string | null) {
  if (period === "all") return true
  const date = parseEventDate(event.date) || new Date(event.created_at || "")
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (period === "this-month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }

  if (period === "last-30-days") {
    const limit = new Date(now)
    limit.setDate(limit.getDate() - 30)
    return date >= limit && date <= now
  }

  if (period === "upcoming") return date >= start
  if (period === "finished") return date < start

  if (period === "custom") {
    const startCustom = startDate ? new Date(startDate) : null
    const endCustom = endDate ? new Date(endDate) : null
    if (startCustom && date < startCustom) return false
    if (endCustom) {
      endCustom.setHours(23, 59, 59, 999)
      if (date > endCustom) return false
    }
  }

  return true
}

function eventGuestStats(event: EventRow) {
  const guests = event.guests || []
  const companions = guests.flatMap((guest) => guest.guest_companions || [])
  const confirmed = guests.filter((guest) => guest.status === "confirmed").length
  const pending = guests.filter((guest) => guest.status === "pending").length
  const declined = guests.filter((guest) => guest.status === "declined").length
  const awaitingApproval = guests.filter((guest) => guest.status === "awaiting_approval").length
  const approvedCompanions = companions.filter((companion) => companion.status === "approved").length
  const pendingCompanions = companions.filter((companion) => companion.status === "awaiting_approval").length
  const confirmationRate = guests.length > 0 ? (confirmed / guests.length) * 100 : 0
  const responseRate = guests.length > 0 ? ((confirmed + declined) / guests.length) * 100 : 0

  return {
    total: guests.length,
    confirmed,
    pending,
    declined,
    awaitingApproval,
    approvedCompanions,
    pendingCompanions,
    companions: companions.length,
    confirmationRate,
    responseRate,
  }
}

function riskForEvent(event: EventRow) {
  const stats = eventGuestStats(event)
  const cost = eventCost(event)
  const costPerGuest = stats.total > 0 ? cost / stats.total : cost
  const daysUntilEvent = getDaysUntilEvent(event)
  let score = 0
  const reasons: string[] = []

  if (stats.total > 0 && stats.confirmationRate < 45) {
    score += 3
    reasons.push("baixa taxa de confirmação")
  }
  if (stats.pending + stats.awaitingApproval >= Math.max(3, stats.total * 0.4)) {
    score += 2
    reasons.push("muitos convidados pendentes")
  }
  if (daysUntilEvent !== null && daysUntilEvent >= 0 && daysUntilEvent <= 14) {
    score += 2
    reasons.push("evento próximo")
  }
  if (costPerGuest >= 250) {
    score += 1
    reasons.push("custo por convidado alto")
  }
  if (stats.awaitingApproval > 0 || stats.pendingCompanions > 0) {
    score += 2
    reasons.push("aprovações aguardando decisão")
  }

  const level = score >= 6 ? "Alto" : score >= 3 ? "Médio" : "Baixo"
  return { score, level, reasons, costPerGuest, daysUntilEvent }
}

function buildInsights(
  events: EventRow[],
  metrics: typeof emptyMetrics,
  costByEvent: Array<{ name: string; value: number }>,
  paretoCosts: Array<{ name: string; value: number; share: number }>
) {
  const insights: Array<{ tone: InsightTone; title: string; description: string; reason: string }> = []

  if (metrics.totalEvents === 0) {
    return [
      {
        tone: "info" as const,
        title: "Nenhum evento encontrado",
        description: "Crie um evento e adicione convidados ou custos para gerar análises.",
        reason: "O filtro atual não retornou eventos pertencentes ao usuário autenticado.",
      },
    ]
  }

  if (metrics.totalGuests === 0) {
    insights.push({
      tone: "info",
      title: "Sem convidados cadastrados",
      description: "Adicione convidados para liberar funil, projeções e taxas de confirmação.",
      reason: "A soma de convidados nos eventos filtrados é zero.",
    })
  }

  if (metrics.itemsCount === 0) {
    insights.push({
      tone: "info",
      title: "Sem custos cadastrados",
      description: "Cadastre itens para acompanhar orçamento, Pareto e custo por cenário.",
      reason: "Nenhum item de custo foi encontrado nos eventos filtrados.",
    })
  }

  if (metrics.confirmationRate < 45 && metrics.totalGuests > 0) {
    insights.push({
      tone: "risk",
      title: "Taxa de confirmação abaixo do esperado",
      description: `A taxa atual é de ${metrics.confirmationRate.toFixed(0)}%. Reenviar convites pode reduzir incerteza.`,
      reason: "Menos de 45% dos convidados filtrados estão confirmados.",
    })
  }

  if (metrics.pendingGuests > 0) {
    insights.push({
      tone: "warning",
      title: "Há convidados sem resposta",
      description: `${metrics.pendingGuests} convidado(s) ainda estão pendentes.`,
      reason: "Convidados com status pending ainda não responderam ao RSVP.",
    })
  }

  if (metrics.pendingRequests > 0) {
    insights.push({
      tone: "warning",
      title: "Solicitações públicas aguardando aprovação",
      description: `${metrics.pendingRequests} pessoa(s) vieram pelo link público e aguardam análise.`,
      reason: "Convidados com status awaiting_approval precisam de decisão manual.",
    })
  }

  if (metrics.pendingCompanions > 0) {
    insights.push({
      tone: "warning",
      title: "Acompanhantes pendentes",
      description: `${metrics.pendingCompanions} acompanhante(s) aguardam aprovação.`,
      reason: "Há registros em guest_companions com status awaiting_approval.",
    })
  }

  const topItem = paretoCosts[0]
  if (topItem && topItem.share >= 45) {
    insights.push({
      tone: "warning",
      title: "Um item concentra grande parte do orçamento",
      description: `${topItem.name} representa ${topItem.share.toFixed(0)}% do custo filtrado.`,
      reason: "O maior item do Pareto ultrapassou 45% do orçamento total.",
    })
  }

  const topEvent = costByEvent[0]
  if (topEvent && metrics.estimatedCost > 0 && topEvent.value / metrics.estimatedCost >= 0.5) {
    insights.push({
      tone: "info",
      title: "Custo concentrado em um evento",
      description: `${topEvent.name} representa pelo menos metade do custo estimado filtrado.`,
      reason: "O custo do evento líder é maior ou igual a 50% do total filtrado.",
    })
  }

  if (metrics.highRiskEvents > 0) {
    insights.push({
      tone: "risk",
      title: "Eventos precisam de atenção",
      description: `${metrics.highRiskEvents} evento(s) foram classificados com risco alto.`,
      reason: "A matriz considera confirmação, pendências, proximidade, custo e aprovações.",
    })
  }

  if (metrics.confirmationRate >= 75 && metrics.totalGuests > 0) {
    insights.push({
      tone: "success",
      title: "Boa taxa de confirmação",
      description: "A maior parte dos convidados já respondeu positivamente.",
      reason: "Pelo menos 75% dos convidados filtrados estão confirmados.",
    })
  }

  return insights.slice(0, 8)
}

export async function GET(request: NextRequest) {
  const selectedEventId = request.nextUrl.searchParams.get("eventId") || "all"
  const period = request.nextUrl.searchParams.get("period") || "all"
  const eventStatus = request.nextUrl.searchParams.get("eventStatus") || "all"
  const guestStatus = request.nextUrl.searchParams.get("guestStatus") || "all"
  const startDate = request.nextUrl.searchParams.get("startDate")
  const endDate = request.nextUrl.searchParams.get("endDate")

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        emptyAnalytics(
          selectedEventId,
          "Supabase não configurado",
          "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar análises reais."
        )
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        emptyAnalytics(
          selectedEventId,
          "Sessão Supabase ausente",
          "Faça login pelo Supabase para carregar dados reais de análises."
        )
      )
    }

    const { data: eventOptions, error: eventOptionsError } = await supabase
      .from("events")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (eventOptionsError) return NextResponse.json({ error: eventOptionsError.message }, { status: 500 })

    let eventsQuery = supabase
      .from("events")
      .select("id, title, type, category, status, date, time, location, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (selectedEventId !== "all") eventsQuery = eventsQuery.eq("id", selectedEventId)
    if (eventStatus !== "all") eventsQuery = eventsQuery.eq("status", eventStatus)

    const { data: eventsData, error: eventsError } = await eventsQuery
    if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 })

    const events = ((eventsData || []) as EventRow[]).filter((event) =>
      isEventInPeriod(event, period, startDate, endDate)
    )
    const eventIds = events.map((event) => event.id)

    if (eventIds.length === 0) {
      return NextResponse.json({
        ...emptyAnalytics(selectedEventId, "Nenhum evento encontrado", "Não há dados para o filtro selecionado."),
        filters: { selectedEventId, events: eventOptions || [] },
      })
    }

    let guestsQuery = supabase
      .from("guests")
      .select("id, event_id, status, source, requested_at, responded_at, confirmed_at, created_at")
      .in("event_id", eventIds)

    if (guestStatus !== "all") guestsQuery = guestsQuery.eq("status", guestStatus)

    let { data: guestsData, error: guestsError } = await guestsQuery

    if (guestsError) {
      let fallbackGuests = supabase
        .from("guests")
        .select("id, event_id, status, responded_at, confirmed_at, created_at")
        .in("event_id", eventIds)
      if (guestStatus !== "all") fallbackGuests = fallbackGuests.eq("status", guestStatus)
      const fallback = await fallbackGuests
      guestsData = fallback.data as typeof guestsData
      guestsError = fallback.error
    }

    if (guestsError) return NextResponse.json({ error: guestsError.message }, { status: 500 })

    const guests = (guestsData || []) as GuestRow[]
    const guestIds = guests.map((guest) => guest.id)

    let { data: itemsData, error: itemsError } = await supabase
      .from("items")
      .select("id, event_id, name, price, estimated_cost, quantity, status")
      .in("event_id", eventIds)

    if (itemsError) {
      const fallbackItems = await supabase.from("items").select("id, event_id, name, price").in("event_id", eventIds)
      itemsData = fallbackItems.data as typeof itemsData
      itemsError = fallbackItems.error
    }

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

    let companions: CompanionRow[] = []
    if (guestIds.length > 0) {
      const { data: companionsData } = await supabase
        .from("guest_companions")
        .select("id, guest_id, status, created_at")
        .in("guest_id", guestIds)
      companions = (companionsData || []) as CompanionRow[]
    }

    const companionsByGuestId = companions.reduce<Record<string, CompanionRow[]>>((acc, companion) => {
      if (!acc[companion.guest_id]) acc[companion.guest_id] = []
      acc[companion.guest_id].push(companion)
      return acc
    }, {})

    const guestsByEventId = guests.reduce<Record<string, GuestRow[]>>((acc, guest) => {
      if (!acc[guest.event_id]) acc[guest.event_id] = []
      acc[guest.event_id].push({ ...guest, guest_companions: companionsByGuestId[guest.id] || [] })
      return acc
    }, {})

    const itemsByEventId = ((itemsData || []) as ItemRow[]).reduce<Record<string, ItemRow[]>>((acc, item) => {
      if (!acc[item.event_id]) acc[item.event_id] = []
      acc[item.event_id].push(item)
      return acc
    }, {})

    const enrichedEvents = events.map((event) => ({
      ...event,
      guests: guestsByEventId[event.id] || [],
      items: itemsByEventId[event.id] || [],
    }))

    const allGuests = enrichedEvents.flatMap((event) => event.guests || [])
    const allCompanions = allGuests.flatMap((guest) => guest.guest_companions || [])
    const allItems = enrichedEvents.flatMap((event) => event.items || [])

    const confirmedGuests = allGuests.filter((guest) => guest.status === "confirmed").length
    const pendingGuests = allGuests.filter((guest) => guest.status === "pending").length
    const declinedGuests = allGuests.filter((guest) => guest.status === "declined").length
    const pendingRequests = allGuests.filter((guest) => guest.status === "awaiting_approval").length
    const publicInviteGuests = allGuests.filter(
      (guest) => guest.source === "public_invite" || guest.source === "public_request"
    ).length
    const approvedCompanions = allCompanions.filter((companion) => companion.status === "approved").length
    const pendingCompanions = allCompanions.filter((companion) => companion.status === "awaiting_approval").length
    const rejectedCompanions = allCompanions.filter((companion) => companion.status === "rejected").length
    const estimatedCost = enrichedEvents.reduce((sum, event) => sum + eventCost(event), 0)
    const totalPeopleConfirmed = confirmedGuests + approvedCompanions
    const projectedPeopleLikely = confirmedGuests + approvedCompanions + Math.ceil(pendingGuests * 0.45) + Math.ceil(pendingCompanions * 0.5)
    const projectedPeopleMax = confirmedGuests + pendingGuests + pendingRequests + approvedCompanions + pendingCompanions
    const totalPeopleEstimated = projectedPeopleMax
    const confirmationRate = allGuests.length > 0 ? (confirmedGuests / allGuests.length) * 100 : 0
    const responseRate = allGuests.length > 0 ? ((confirmedGuests + declinedGuests) / allGuests.length) * 100 : 0
    const costPerPersonBase = projectedPeopleMax > 0 ? estimatedCost / projectedPeopleMax : 0

    const rsvpStatus = [
      { name: "Confirmados", value: confirmedGuests },
      { name: "Pendentes", value: pendingGuests },
      { name: "Recusados", value: declinedGuests },
      { name: "Aguardando aprovação", value: pendingRequests },
    ]

    const companionStatus = [
      { name: "Aprovados", value: approvedCompanions },
      { name: "Pendentes", value: pendingCompanions },
      { name: "Recusados", value: rejectedCompanions },
    ]

    const confirmationFunnel = [
      { name: "Total de convidados", value: allGuests.length },
      { name: "Pendentes", value: pendingGuests },
      { name: "Confirmados", value: confirmedGuests },
      { name: "Recusados", value: declinedGuests },
      { name: "Aguardando aprovação", value: pendingRequests },
      { name: "Acompanhantes solicitados", value: allCompanions.length },
      { name: "Acompanhantes aprovados", value: approvedCompanions },
    ]

    const attendanceProjection = [
      { name: "Mínima", value: totalPeopleConfirmed, detail: "Confirmados + acompanhantes aprovados" },
      { name: "Provável", value: projectedPeopleLikely, detail: "Confirmados + parte dos pendentes" },
      { name: "Máxima", value: projectedPeopleMax, detail: "Confirmados + pendentes + aprovações possíveis" },
    ]

    const costProjection = [
      { name: "Atual estimado", value: estimatedCost },
      { name: "Confirmados", value: costPerPersonBase * totalPeopleConfirmed },
      { name: "Provável", value: costPerPersonBase * projectedPeopleLikely },
      { name: "Máximo", value: costPerPersonBase * projectedPeopleMax },
      { name: "Médio por pessoa", value: costPerPersonBase },
    ]

    const costByEvent = enrichedEvents
      .map((event) => ({ name: event.title, value: eventCost(event) }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)

    const totalCost = allItems.reduce((sum, item) => sum + itemCost(item), 0)
    let cumulative = 0
    const paretoCosts = allItems
      .map((item) => ({ name: item.name, value: itemCost(item) }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item) => {
        cumulative += item.value
        return {
          ...item,
          share: totalCost > 0 ? (item.value / totalCost) * 100 : 0,
          cumulative: totalCost > 0 ? (cumulative / totalCost) * 100 : 0,
        }
      })

    const confirmationsByEvent = enrichedEvents.map((event) => {
      const stats = eventGuestStats(event)
      return {
        name: event.title,
        total: stats.total,
        confirmed: stats.confirmed,
        pending: stats.pending + stats.awaitingApproval,
        declined: stats.declined,
        responseRate: Math.round(stats.responseRate),
      }
    })

    const eventsByStatusMap = enrichedEvents.reduce<Record<string, number>>((acc, event) => {
      const status = event.status || "pending"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const confirmationsOverTimeMap = allGuests.reduce<Record<string, { value: number; raw: number }>>((acc, guest) => {
      if (guest.status !== "confirmed") return acc
      const date = new Date(guest.confirmed_at || guest.responded_at || guest.created_at || "")
      if (Number.isNaN(date.getTime())) return acc
      const label = dayLabel(date)
      if (!acc[label]) acc[label] = { value: 0, raw: date.getTime() }
      acc[label].value += 1
      return acc
    }, {})

    const confirmationsOverTime = Object.entries(confirmationsOverTimeMap)
      .map(([name, item]) => ({ name, value: item.value, raw: item.raw }))
      .sort((a, b) => a.raw - b.raw)

    const eventsByMonthMap = enrichedEvents.reduce<Record<string, { events: number; guests: number; raw: number }>>(
      (acc, event) => {
        const date = parseEventDate(event.date) || new Date(event.created_at || "")
        if (Number.isNaN(date.getTime())) return acc
        const label = monthLabel(date)
        if (!acc[label]) acc[label] = { events: 0, guests: 0, raw: date.getTime() }
        acc[label].events += 1
        acc[label].guests += (event.guests || []).length
        return acc
      },
      {}
    )

    const eventsByMonth = Object.entries(eventsByMonthMap)
      .map(([name, value]) => ({ name, events: value.events, guests: value.guests, raw: value.raw }))
      .sort((a, b) => a.raw - b.raw)

    const advancedComparison = enrichedEvents.map((event) => {
      const stats = eventGuestStats(event)
      const total = eventCost(event)
      return {
        name: event.title,
        confirmationRate: Math.round(stats.confirmationRate),
        totalGuests: stats.total,
        confirmed: stats.confirmed,
        totalCost: total,
        costPerGuest: stats.total > 0 ? total / stats.total : 0,
        pending: stats.pending + stats.awaitingApproval,
        publicRequests: stats.awaitingApproval,
        companions: stats.companions,
      }
    })

    const riskMatrix = enrichedEvents.map((event) => {
      const risk = riskForEvent(event)
      const stats = eventGuestStats(event)
      return {
        name: event.title,
        value: risk.score,
        level: risk.level,
        confirmationRate: Math.round(stats.confirmationRate),
        pending: stats.pending + stats.awaitingApproval,
        costPerGuest: Math.round(risk.costPerGuest),
        daysUntilEvent: risk.daysUntilEvent,
        reason: risk.reasons.join(", ") || "sem sinais críticos",
      }
    })

    const attentionEvents = riskMatrix
      .filter((event) => event.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((event) => ({
        name: event.name,
        score: event.value,
        level: event.level,
        reason:
          event.reason === "sem sinais críticos"
            ? "Sem alertas relevantes no momento."
            : `${event.reason}.`,
      }))

    const highRiskEvents = riskMatrix.filter((event) => event.level === "Alto").length

    const metrics = {
      ...emptyMetrics,
      totalEvents: enrichedEvents.length,
      totalGuests: allGuests.length,
      confirmedGuests,
      pendingGuests,
      declinedGuests,
      confirmationRate,
      responseRate,
      pendingRequests,
      requestedCompanions: allCompanions.length,
      approvedCompanions,
      pendingCompanions,
      rejectedCompanions,
      publicInviteGuests,
      totalPeopleEstimated,
      totalPeopleConfirmed,
      projectedPeopleLikely,
      projectedPeopleMax,
      estimatedCost,
      confirmedCost: costPerPersonBase * totalPeopleConfirmed,
      likelyCost: costPerPersonBase * projectedPeopleLikely,
      maxCost: costPerPersonBase * projectedPeopleMax,
      averageCostPerGuest: allGuests.length > 0 ? estimatedCost / allGuests.length : 0,
      averageCostPerConfirmed: totalPeopleConfirmed > 0 ? estimatedCost / totalPeopleConfirmed : 0,
      itemsCount: allItems.length,
      highRiskEvents,
    }

    return NextResponse.json({
      filters: {
        selectedEventId,
        events: eventOptions || [],
      },
      metrics,
      charts: {
        rsvpStatus,
        companionStatus,
        confirmationFunnel,
        attendanceProjection,
        costProjection,
        paretoCosts,
        costByEvent: costByEvent.slice(0, 8),
        costByItem: paretoCosts,
        confirmationsByEvent,
        confirmationsOverTime,
        eventsByStatus: Object.entries(eventsByStatusMap).map(([name, value]) => ({ name, value })),
        eventsByMonth,
        advancedComparison,
        riskMatrix,
      },
      insights: buildInsights(enrichedEvents, metrics, costByEvent, paretoCosts),
      rankings: { attentionEvents },
    })
  } catch (error) {
    console.error("Erro inesperado em analytics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

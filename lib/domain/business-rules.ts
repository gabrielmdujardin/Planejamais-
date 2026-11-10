/**
 * Regras de domínio centralizadas do Planeja+ (RN-001 a RN-018, RF-001 a RF-038, RNF-004/005/007).
 * Funções puras compartilhadas entre Server Actions, API Routes, Stores, Análises e Relatórios PDF/CSV/ICS.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SAFE_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,128}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const PT_BR_MONTHS: Record<string, number> = {
  jan: 0,
  janeiro: 0,
  fev: 1,
  fevereiro: 1,
  mar: 2,
  marco: 2,
  março: 2,
  abr: 3,
  abril: 3,
  mai: 4,
  maio: 4,
  jun: 5,
  junho: 5,
  jul: 6,
  julho: 6,
  ago: 7,
  agosto: 7,
  set: 8,
  setembro: 8,
  out: 9,
  outubro: 9,
  nov: 10,
  novembro: 10,
  dez: 11,
  dezembro: 11,
}

export const VALID_GUEST_STATUSES = [
  "awaiting_approval",
  "pending",
  "confirmed",
  "declined",
  "expired",
  "cancelled",
] as const

export type ValidGuestStatus = (typeof VALID_GUEST_STATUSES)[number]

/**
 * RN-006 / RNF-004: Gera token criptograficamente seguro com pelo menos 128 bits (16 bytes = 32 chars hex).
 */
export function generateSecureToken(byteLength = 16): string {
  const safeLength = Math.max(16, byteLength)
  const bytes = new Uint8Array(safeLength)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * RN-006 / RNF-004: Valida formato seguro de token público antes de consultas PostgREST (.or / .eq).
 */
export function isSafeToken(token: unknown): token is string {
  return typeof token === "string" && SAFE_TOKEN_REGEX.test(token.trim())
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim())
}

/**
 * RNF-004 / RNF-006: Escapa caracteres HTML especiais para prevenir XSS em e-mails e relatórios PDF.
 */
export function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value)
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * RF-029: Escapa textos conforme RFC 5545 para geração de arquivos iCalendar (.ics).
 */
export function escapeIcsText(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value)
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
}

/**
 * RN-008: Solicitações externas rejeitadas (source !== 'manual' e status === 'cancelled' ou rejected_at preenchido com cancelled)
 * não geram convidado ativo na lista do evento.
 */
export function isRejectedExternalRequest(guest: any): boolean {
  if (!guest || typeof guest !== "object") return true
  const source = guest.source || "manual"
  const status = guest.status || "pending"
  return source !== "manual" && status === "cancelled"
}

export function filterEffectiveGuests<T = any>(guests: T[] | null | undefined): T[] {
  if (!Array.isArray(guests)) return []
  return guests.filter((g) => !isRejectedExternalRequest(g))
}

/**
 * RN-005 & RN-009: Total de participantes confirmados = convidados com status 'confirmed' + seus acompanhantes com status 'approved'.
 * Convidados pendentes/recusados/aguardando aprovação e acompanhantes não aprovados não entram na contagem.
 */
export function countApprovedCompanionsForGuest(guest: any): number {
  if (!guest || guest.status !== "confirmed") return 0

  if (Array.isArray(guest.companions) && guest.companions.length > 0) {
    return guest.companions.filter((comp: any) => comp && comp.status === "approved").length
  }

  if (Array.isArray(guest.guest_companions) && guest.guest_companions.length > 0) {
    return guest.guest_companions.filter((comp: any) => comp && comp.status === "approved").length
  }

  if (Array.isArray(guest.approved_companions) && guest.approved_companions.length > 0) {
    return guest.approved_companions.length
  }

  if (Array.isArray(guest.approvedCompanions) && guest.approvedCompanions.length > 0) {
    return guest.approvedCompanions.length
  }

  return 0
}

export function calculateConfirmedParticipants(guests: any[] | null | undefined): number {
  const effective = filterEffectiveGuests(guests)
  let total = 0
  for (const guest of effective) {
    if (guest.status === "confirmed") {
      total += 1 + countApprovedCompanionsForGuest(guest)
    }
  }
  return total
}

export function calculateAttendanceSummary(guests: any[] | null | undefined) {
  const effectiveGuests = filterEffectiveGuests(guests)
  let confirmedGuestsCount = 0
  let confirmedCompanionsCount = 0
  let pendingGuests = 0
  let awaitingApprovalGuests = 0
  let declinedGuests = 0
  let pendingCompanions = 0

  for (const guest of effectiveGuests) {
    const status = guest?.status || "pending"
    const rawCompanions = Array.isArray(guest?.companions)
      ? guest.companions
      : Array.isArray(guest?.guest_companions)
      ? guest.guest_companions
      : []

    pendingCompanions += rawCompanions.filter((c: any) => c && c.status === "pending").length

    if (status === "confirmed") {
      confirmedGuestsCount += 1
      confirmedCompanionsCount += countApprovedCompanionsForGuest(guest)
    } else if (status === "declined" || status === "rejected") {
      declinedGuests += 1
    } else if (status === "awaiting_approval" || status === "pending_approval") {
      awaitingApprovalGuests += 1
    } else if (status === "pending") {
      pendingGuests += 1
    }
  }

  const totalGuests = effectiveGuests.length
  const confirmedParticipants = confirmedGuestsCount + confirmedCompanionsCount
  const confirmationRate = totalGuests > 0 ? Math.round((confirmedGuestsCount / totalGuests) * 1000) / 10 : 0

  return {
    effectiveGuests,
    totalGuests,
    totalEffectiveGuests: totalGuests,
    confirmedGuestsCount,
    confirmedGuests: confirmedGuestsCount,
    confirmedCompanionsCount,
    confirmedParticipants,
    pendingGuests,
    awaitingApprovalGuests,
    pendingRequests: awaitingApprovalGuests,
    pendingCompanions,
    declinedGuests,
    confirmationRate,
  }
}

/**
 * RN-010: Valor não pode ser negativo; item sem valor informado conta como R$ 0,00; itens cancelados não compõem o custo ativo.
 */
export function normalizeItemValue(item: any): number {
  if (!item || typeof item !== "object") return 0
  const paymentStatus = item.paymentStatus ?? item.payment_status ?? "pending"
  if (paymentStatus === "cancelled") return 0

  const raw =
    item.price !== undefined && item.price !== null && item.price !== ""
      ? item.price
      : item.actualCost !== undefined && item.actualCost !== null && item.actualCost !== ""
      ? item.actualCost
      : item.estimated_cost !== undefined && item.estimated_cost !== null && item.estimated_cost !== ""
      ? item.estimated_cost
      : item.estimatedCost !== undefined && item.estimatedCost !== null && item.estimatedCost !== ""
      ? item.estimatedCost
      : 0

  const num = Number(raw)
  if (!Number.isFinite(num) || num < 0) return 0
  return Math.round(num * 100) / 100
}

/**
 * RN-011: Custo total do evento é a soma dos valores de todos os seus itens ativos cadastrados.
 */
export function calculateEventTotalCost(
  items: any[] | null | undefined,
  initialEstimatedCost?: number | null
): number {
  const itemsSum = Array.isArray(items) ? items.reduce((acc, item) => acc + normalizeItemValue(item), 0) : 0
  const baseCost =
    initialEstimatedCost !== undefined &&
    initialEstimatedCost !== null &&
    Number.isFinite(Number(initialEstimatedCost)) &&
    Number(initialEstimatedCost) > 0
      ? Number(initialEstimatedCost)
      : 0
  return Math.round((itemsSum + baseCost) * 100) / 100
}

/**
 * RN-012: Em eventos colaborativos, o valor por pessoa é o custo total dividido pelo número de participantes confirmados,
 * arredondado para 2 casas decimais. Com nenhum confirmado (0), não é calculado (retorna null).
 */
export function calculateCollaborativeSplit(totalCost: number, confirmedParticipants: number): number | null {
  const safeCost = Number.isFinite(totalCost) && totalCost >= 0 ? totalCost : 0
  const safeConfirmed = Math.floor(Number(confirmedParticipants) || 0)
  if (safeConfirmed <= 0) {
    return null
  }
  return Math.round((safeCost / safeConfirmed) * 100) / 100
}

/**
 * RN-013: Orçamento previsto como referência. Gastos acima do orçamento não são bloqueados, mas o déficit fica visível.
 */
export function calculateBudgetComparison(budgetEstimated: number | null | undefined, totalCost: number) {
  const safeCost = Math.max(0, Number(totalCost) || 0)
  const hasBudget = budgetEstimated !== null && budgetEstimated !== undefined && Number(budgetEstimated) > 0
  const budget = hasBudget ? Math.round(Number(budgetEstimated) * 100) / 100 : 0
  const balance = hasBudget ? Math.round((budget - safeCost) * 100) / 100 : 0
  const isOverBudget = hasBudget && safeCost > budget
  const deficit = isOverBudget ? Math.round((safeCost - budget) * 100) / 100 : 0
  const executionPercent = hasBudget ? Math.round((safeCost / budget) * 1000) / 10 : 0

  return {
    hasBudget,
    budget,
    totalCost: safeCost,
    balance,
    isOverBudget,
    deficit,
    executionPercent,
  }
}

/**
 * RN-017: Apenas convidados com status 'pending' E e-mail válido recebem lembretes de confirmação.
 * Convidados confirmados, recusados, aguardando aprovação ou sem e-mail jamais entram no envio de lembretes.
 */
export function filterEligibleReminderGuests<T extends { status?: string; email?: string | null }>(
  guests: T[] | null | undefined
): T[] {
  if (!Array.isArray(guests)) return []
  return guests.filter((guest) => {
    if (!guest || guest.status !== "pending") return false
    const email = typeof guest.email === "string" ? guest.email.trim() : ""
    return email.length > 0 && EMAIL_REGEX.test(email)
  })
}

/**
 * RN-007: Filtra estritamente os dados visíveis em rotas públicas de convite/solicitação.
 * Nunca expõe lista de convidados, gastos, solicitações, análises ou link de reunião privada antes da confirmação.
 */
export function buildPublicEventPayload(event: any) {
  if (!event) return null
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    date: event.date,
    time: event.time,
    startDate: event.start_date || event.startDate || null,
    startTime: event.start_time || event.startTime || event.time || null,
    endDate: event.end_date || event.endDate || null,
    endTime: event.end_time || event.endTime || null,
    location: event.location,
    address: event.address || null,
    mapsUrl: event.maps_url || event.mapsUrl || null,
    eventMode: event.event_mode || event.eventMode || "presential",
    description: event.description || "",
    invitationMessage: event.invitation_message || event.invitationMessage || null,
    allowCompanions: Boolean(event.allow_companions ?? event.allowCompanions ?? false),
    maxCompanions: Number(event.max_companions ?? event.maxCompanionsPerGuest ?? 0),
    rsvpEnabled: Boolean(event.rsvp_enabled ?? event.rsvpEnabled ?? true),
    rsvpDeadline: event.rsvp_deadline || event.rsvpDeadline || null,
  }
}

/**
 * RN-014 & RF-023: Cria cópia desacoplada do contato para inserção como convidado do evento.
 * Alterações ou exclusão futuras do contato não alteram os dados já importados no evento.
 */
export function cloneContactToGuestSnapshot(contact: {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}) {
  return {
    name: String(contact.name || "").trim(),
    email: String(contact.email || "").trim(),
    phone: String(contact.phone || "").trim(),
    status: "pending" as const,
    contactId: String(contact.id),
  }
}

/**
 * RN-015 & RF-008: Confirmação nominal do título do evento para exclusão segura pelo organizador.
 */
export function validateNominalEventDeletion(eventTitle: string, confirmationInput: string): boolean {
  if (!eventTitle || !confirmationInput) return false
  return eventTitle.trim().toLowerCase() === confirmationInput.trim().toLowerCase()
}

/**
 * RN-018 & RF-028: Somente o organizador titular do evento pode excluir fotos da galeria.
 */
export function canOrganizerModifyPhoto(eventOwnerId: string | null | undefined, currentUserId: string | null | undefined): boolean {
  if (!eventOwnerId || !currentUserId) return false
  return eventOwnerId === currentUserId
}

/**
 * RF-024 & RF-029: Converte datas nos formatos ISO (YYYY-MM-DD), BR (DD/MM/YYYY) ou extenso PT-BR ("15 de Dez, 2024")
 * sem lançar RangeError.
 */
export function parseFlexibleEventDate(
  eventOrDate:
    | string
    | null
    | undefined
    | {
        startDate?: string | null
        start_date?: string | null
        fullDate?: string | null
        full_date?: string | null
        date?: string | null
        startTime?: string | null
        start_time?: string | null
        time?: string | null
      },
  timeOverride?: string | null
): Date | null {
  if (!eventOrDate) return null

  const rawDate = (
    typeof eventOrDate === "string"
      ? eventOrDate
      : eventOrDate.startDate ||
        eventOrDate.start_date ||
        eventOrDate.fullDate ||
        eventOrDate.full_date ||
        eventOrDate.date ||
        ""
  ).trim()

  if (!rawDate) return null

  const rawTime = (
    timeOverride ||
    (typeof eventOrDate === "string"
      ? "09:00"
      : eventOrDate.startTime || eventOrDate.start_time || eventOrDate.time || "09:00")
  ).trim()
  const timeMatch = rawTime.match(/(\d{1,2}):(\d{2})/)
  const hours = timeMatch ? Math.min(23, Math.max(0, Number(timeMatch[1]))) : 9
  const minutes = timeMatch ? Math.min(59, Math.max(0, Number(timeMatch[2]))) : 0

  // 1. YYYY-MM-DD (ou ISO completo)
  const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    const d = new Date(year, month, day, hours, minutes, 0)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // 2. DD/MM/YYYY
  const brSlashMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (brSlashMatch) {
    const day = Number(brSlashMatch[1])
    const month = Number(brSlashMatch[2]) - 1
    const year = Number(brSlashMatch[3])
    const d = new Date(year, month, day, hours, minutes, 0)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // 3. Extenso PT-BR ex.: "15 de Dez, 2024" ou "22 de Novembro de 2026"
  const cleaned = rawDate
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const ptMatch = cleaned.match(/^(\d{1,2})\s+([a-zç]+)\s+(\d{4})/)
  if (ptMatch) {
    const day = Number(ptMatch[1])
    const monthKey = ptMatch[2]
    const year = Number(ptMatch[3])
    const month = PT_BR_MONTHS[monthKey] ?? PT_BR_MONTHS[monthKey.slice(0, 3)]
    if (month !== undefined) {
      const d = new Date(year, month, day, hours, minutes, 0)
      return Number.isNaN(d.getTime()) ? null : d
    }
  }

  // 4. Fallback seguro
  const fallback = new Date(rawDate)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

function formatIcsUtcTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

/**
 * RF-029: Gera conteúdo iCalendar (.ics) compatível com RFC 5545 para um ou múltiplos eventos.
 */
export function buildIcsCalendar(events: any[], calendarName = "Planeja+ Eventos"): string {
  const dtStamp = formatIcsUtcTimestamp(new Date())
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Planeja+//Gestao de Eventos TCC 2026//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ]

  for (const event of events) {
    const start = parseFlexibleEventDate(event)
    if (!start) continue

    let end: Date | null = null
    const rawEndTime = event.endTime || event.end_time
    if (rawEndTime) {
      end = parseFlexibleEventDate({
        startDate: event.endDate || event.end_date || event.startDate || event.start_date || event.fullDate || event.date,
        startTime: rawEndTime,
      })
    }
    if (!end || end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    }

    const uid = `${String(event.id || generateSecureToken(8))}@planejamais.app`
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcsText(uid)}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatIcsUtcTimestamp(start)}`,
      `DTEND:${formatIcsUtcTimestamp(end)}`,
      `SUMMARY:${escapeIcsText(event.title || "Evento Planeja+")}`,
      `DESCRIPTION:${escapeIcsText(event.description || "")}`,
      `LOCATION:${escapeIcsText(event.location || "")}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    )
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n") + "\r\n"
}

import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { CalendarSyncJob } from "../jobs/calendar-sync.ts"
import { CleanupJob } from "../jobs/cleanup.ts"
import { DailyAggregateJob } from "../jobs/daily-aggregate.ts"
import { PendingInvitesJob } from "../jobs/pending-invites.ts"
import {
  buildIcsCalendar,
  buildPublicEventPayload,
  calculateAttendanceSummary,
  calculateBudgetComparison,
  calculateCollaborativeSplit,
  calculateConfirmedParticipants,
  calculateEventTotalCost,
  canOrganizerModifyPhoto,
  cloneContactToGuestSnapshot,
  escapeHtml,
  filterEffectiveGuests,
  filterEligibleReminderGuests,
  generateSecureToken,
  isSafeToken,
  parseFlexibleEventDate,
  validateNominalEventDeletion,
} from "../lib/domain/business-rules.ts"
import { JobQueue } from "../lib/job-queue.ts"
import { normalizeReportData } from "../lib/reports/data-collector.ts"
import { generatePdfFileName } from "../lib/reports/pdf-exporter.ts"
import { isValidCronAuthorization } from "../lib/security/cron-auth.ts"
import {
  evaluateRouteAccess,
  isProtectedAppPath,
  isPublicRateLimitedEndpoint,
} from "../lib/security/route-guard.ts"
import { getEventTerminology } from "../lib/terminology.ts"
import {
  approvalDecisionSchema,
  confirmInviteAcceptSchema,
  contactListSchema,
  contactSchema,
  eventPayloadSchema,
  guestBatchCreateSchema,
  guestSingleCreateSchema,
  guestUpdateSchema,
  itemCreateSchema,
  itemUpdateSchema,
  loginUserSchema,
  photoCreateSchema,
  profileUpdateSchema,
  publicLinkSettingsSchema,
  publicRsvpSchema,
  registerUserSchema,
  rejectionDecisionSchema,
} from "../lib/validation.ts"

const defaultSections = {
  generalInfo: true,
  kpiSummary: true,
  guestList: true,
  financialDetails: true,
  paretoAnalysis: true,
  attendanceProjection: true,
  riskAlerts: true,
  notesAndSignatures: true,
}

/**
 * Cliente Supabase em memória para validação determinística dos Jobs (RF-031 e RF-032)
 */
function createMockSupabaseForJobs() {
  const db = {
    job_runs: [],
    job_logs: [],
    users: [{ id: "u-1", email: "organizador@planejamais.com" }],
    events: [
      {
        id: "ev-1",
        user_id: "u-1",
        title: "Simpósio Planeja+ 2026",
        date: "2027-05-10",
        start_date: "2027-05-10",
        time: "19:00",
        location: "Auditório Central",
        description: "Evento oficial",
      },
    ],
    guests: [
      {
        id: "g-1",
        event_id: "ev-1",
        name: "Convidado Pendente",
        email: "convidado@teste.com",
        phone: "11999998888",
        status: "pending",
        source: "manual",
        token: "tok_valido_1234567890",
        confirmation_token: "tok_valido_1234567890",
        confirmation_deadline: "2027-05-05T23:59:59Z",
        guest_companions: [],
      },
      {
        id: "g-2",
        event_id: "ev-1",
        name: "Convidado Confirmado",
        email: "confirmado@teste.com",
        phone: "11977776666",
        status: "confirmed",
        source: "manual",
        token: "tok_conf_1234567890",
        confirmation_token: "tok_conf_1234567890",
        confirmation_deadline: "2027-05-05T23:59:59Z",
        guest_companions: [{ id: "c-1", status: "approved" }],
      },
    ],
    items: [{ id: "i-1", event_id: "ev-1", name: "Coffee Break", price: 1800, payment_status: "paid" }],
    staging_events: [],
    staging_rsvps: [],
    fact_daily_summary: [],
    rpcCalls: [],
  }

  function buildQuery(table) {
    const state = { filters: [], updatePayload: null, isDelete: false }

    const applyFilters = (rows) =>
      rows.filter((row) =>
        state.filters.every((fn) => {
          try {
            return fn(row)
          } catch {
            return true
          }
        })
      )

    const chain = {
      select: () => chain,
      eq: (col, val) => {
        state.filters.push((r) => r[col] === val)
        return chain
      },
      neq: (col, val) => {
        state.filters.push((r) => r[col] !== val)
        return chain
      },
      in: (col, vals) => {
        state.filters.push((r) => vals.includes(r[col]))
        return chain
      },
      lt: (col, val) => {
        state.filters.push((r) => String(r[col] || "") < String(val))
        return chain
      },
      gte: () => chain,
      not: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (payload) => {
        const arr = Array.isArray(payload) ? payload : [payload]
        const inserted = arr.map((item, idx) => {
          const row = { id: item.id || `${table}-${db[table]?.length + idx + 1}`, ...item }
          if (db[table]) db[table].push(row)
          return row
        })
        return {
          select: () => ({
            single: async () => ({ data: inserted[0], error: null }),
          }),
          then: (resolve) => resolve({ data: inserted, error: null }),
        }
      },
      upsert: async (payload) => {
        const arr = Array.isArray(payload) ? payload : [payload]
        if (db[table]) db[table].push(...arr)
        return { data: arr, error: null }
      },
      update: (payload) => {
        state.updatePayload = payload
        return chain
      },
      delete: () => {
        state.isDelete = true
        return chain
      },
      single: async () => {
        const rows = applyFilters(db[table] || [])
        return { data: rows[0] || null, error: null }
      },
      maybeSingle: async () => {
        const rows = applyFilters(db[table] || [])
        return { data: rows[0] || null, error: null }
      },
      then: (resolve) => {
        let rows = applyFilters(db[table] || [])
        if (table === "guests") {
          rows = rows.map((g) => ({
            ...g,
            events: db.events.find((e) => e.id === g.event_id),
          }))
        }
        if (table === "events") {
          rows = rows.map((e) => ({
            ...e,
            guests: db.guests.filter((g) => g.event_id === e.id),
            items: db.items.filter((i) => i.event_id === e.id),
          }))
        }
        if (state.updatePayload && db[table]) {
          rows.forEach((r) => Object.assign(r, state.updatePayload))
        }
        if (state.isDelete && db[table]) {
          const toRemove = new Set(rows)
          const count = toRemove.size
          db[table] = db[table].filter((r) => !toRemove.has(r))
          return resolve({ data: null, count, error: null })
        }
        return resolve({ data: rows, count: rows.length, error: null })
      },
    }
    return chain
  }

  return {
    db,
    client: {
      from: (table) => buildQuery(table),
      rpc: async (fnName) => {
        db.rpcCalls.push(fnName)
        return { data: null, error: null }
      },
    },
  }
}

test("RF-001 a RF-004: Cadastro, Login, Perfil/Logout e Proteção de Rotas Privadas", () => {
  // RF-001: Cadastro
  assert.equal(
    registerUserSchema.safeParse({
      name: "Gabriel Rocha",
      email: "gabriel@planejamais.com",
      password: "senhaSegura123",
    }).success,
    true
  )

  // RF-002: Login
  assert.equal(
    loginUserSchema.safeParse({
      email: "gabriel@planejamais.com",
      password: "senhaSegura123",
    }).success,
    true
  )

  // RF-003: Edição de perfil e limpeza de sessão no logout
  assert.equal(
    profileUpdateSchema.safeParse({
      name: "Gabriel Atualizado",
      phone: "(11) 98888-7777",
      location: "São Paulo, SP",
    }).success,
    true
  )
  const authContextSrc = fs.readFileSync(path.resolve("context/auth-context.tsx"), "utf8")
  assert.match(authContextSrc, /event-storage/)
  assert.match(authContextSrc, /contact-storage/)

  // RF-004: Proteção de rotas privadas do organizador
  for (const protectedRoute of ["/dashboard", "/create-event", "/event/abc", "/contacts", "/calendar", "/profile"]) {
    assert.equal(isProtectedAppPath(protectedRoute), true, `Rota privada desprotegida: ${protectedRoute}`)
    assert.equal(
      evaluateRouteAccess({
        pathname: protectedRoute,
        hasSupabaseSession: false,
        hasDemoCookie: false,
        supabaseConfigured: true,
      }).action,
      "redirect_login"
    )
  }

  // Rotas públicas de convite e leitura continuam acessíveis sem login
  for (const publicRoute of ["/", "/login", "/register", "/evento/tok123", "/confirm/tok123", "/event/abc/host-view"]) {
    assert.equal(isProtectedAppPath(publicRoute), false, `Rota pública bloqueada indevidamente: ${publicRoute}`)
  }
})

test("RF-005 a RF-009: Criação, Listagem, Edição, Exclusão Nominal e Central do Evento", () => {
  // RF-005: Criação com rascunho/ativo, imagem de capa e orçamento opcional
  const created = eventPayloadSchema.safeParse({
    title: "Formatura Engenharia 2026",
    type: "Formatura",
    status: "draft",
    startDate: "2026-12-18",
    startTime: "20:00",
    endTime: "23:59",
    location: "Espaço das Américas",
    image: "https://exemplo.com/capa.jpg",
    budgetEstimated: 95000,
    financialMode: "corporate_budget",
  })
  assert.equal(created.success, true)

  // RF-006 & RF-009: Consolidação de métricas da lista e central do evento
  const summary = calculateAttendanceSummary([
    { id: "1", status: "confirmed", companions: [{ status: "approved" }] },
    { id: "2", status: "pending" },
  ])
  assert.equal(summary.totalGuests, 2)
  assert.equal(summary.confirmedParticipants, 2)

  // RF-007: Edição preservando dados válidos
  assert.equal(
    eventPayloadSchema.safeParse({
      ...created.data,
      status: "active",
      budgetEstimated: 105000,
    }).success,
    true
  )

  // RF-008: Exclusão segura mediante confirmação nominal
  assert.equal(validateNominalEventDeletion("Formatura Engenharia 2026", "Formatura Engenharia 2026"), true)
  assert.equal(validateNominalEventDeletion("Formatura Engenharia 2026", "Outro Nome"), false)
})

test("RF-010 a RF-013: Cadastro, Edição, Remoção e Registro Manual de Presença de Convidados", () => {
  // RF-010: Adição individual com status inicial Pendente
  const newGuest = guestSingleCreateSchema.safeParse({
    name: "Mariana Silva",
    email: "mariana@exemplo.com",
    phone: "11977776666",
    department: "Marketing",
  })
  assert.equal(newGuest.success, true)

  // RF-011 & RF-013: Edição cadastral e atualização manual de status pelo organizador
  const editedGuest = guestUpdateSchema.safeParse({
    name: "Mariana Silva Souza",
    status: "confirmed",
    dietaryRestrictions: "Sem lactose",
  })
  assert.equal(editedGuest.success, true)

  // RF-012: Remoção reflete imediatamente no total de participantes confirmados
  const listBeforeRemove = [
    { id: "g1", status: "confirmed" },
    { id: "g2", status: "confirmed" },
  ]
  assert.equal(calculateConfirmedParticipants(listBeforeRemove), 2)
  assert.equal(calculateConfirmedParticipants(listBeforeRemove.filter((g) => g.id !== "g2")), 1)
})

test("RF-014 a RF-017: Link Público, Confirmação Externa, Solicitação de Entrada e Moderação", () => {
  // RF-014: Configuração e token seguro do link público
  const token = generateSecureToken(16)
  assert.equal(isSafeToken(token), true)
  assert.equal(publicLinkSettingsSchema.safeParse({ enabled: true, regenerateToken: true }).success, true)

  const pubPayload = buildPublicEventPayload({
    id: "ev-1",
    title: "Workshop IA",
    date: "2026-10-15",
    time: "14:00",
    location: "Auditório B",
    description: "Aberto a convidados",
    items: [{ price: 5000 }],
  })
  assert.equal("items" in pubPayload, false)

  // RF-015: Resposta ao convite com acompanhantes
  assert.equal(
    confirmInviteAcceptSchema.safeParse({
      dietaryRestrictions: "Vegano",
      companions: [{ name: "Lucas Souza" }],
    }).success,
    true
  )

  // RF-016: Solicitação pública de participação
  assert.equal(
    publicRsvpSchema.safeParse({
      name: "Visitante Externo",
      email: "visitante@externo.com",
      phone: "11955554444",
      attendanceStatus: "confirmed",
    }).success,
    true
  )

  // RF-017: Decisão de aprovação ou rejeição pelo organizador
  assert.equal(
    approvalDecisionSchema.safeParse({
      approvedCompanionIds: ["comp-1"],
      rejectedCompanionIds: ["comp-2"],
      sendEmail: true,
    }).success,
    true
  )
  assert.equal(rejectionDecisionSchema.safeParse({ reason: "Lotação esgotada", sendEmail: true }).success, true)
  assert.equal(
    filterEffectiveGuests([{ id: "req-1", source: "public_link", status: "cancelled" }]).length,
    0
  )
})

test("RF-018 a RF-021: Cadastro, Edição, Remoção de Itens e Resumo Financeiro (Orçamento e Rateio)", () => {
  // RF-018: Cadastro de gasto
  const itemA = itemCreateSchema.parse({
    eventId: "ev-fin",
    name: "Buffet Executivo",
    price: 4500,
    supplier: "Gastronomia S/A",
    paymentStatus: "paid",
  })
  const itemB = itemCreateSchema.parse({
    eventId: "ev-fin",
    name: "Som e Luz",
    price: 1500,
    paymentStatus: "pending",
  })

  // RF-019: Edição e atribuição de responsável
  const itemBUpdated = itemUpdateSchema.parse({
    price: 1800,
    assignedTo: [{ id: "g1", name: "Coordenador Financeiro", type: "guest" }],
  })

  // RF-020 & RF-021: Recálculo de custo total, saldo do orçamento e rateio por confirmado
  const total = calculateEventTotalCost([itemA, { ...itemB, ...itemBUpdated }])
  assert.equal(total, 6300)

  const budgetComp = calculateBudgetComparison(6000, total)
  assert.equal(budgetComp.isOverBudget, true)
  assert.equal(budgetComp.deficit, 300)

  assert.equal(calculateCollaborativeSplit(total, 10), 630)
})

test("RF-022 e RF-023: Gestão da Agenda de Contatos, Listas Segmentadas e Importação Desacoplada", () => {
  const validContact = contactSchema.safeParse({
    name: "Fernanda Costa",
    email: "fernanda@empresa.com.br",
    phone: "11944443333",
    tags: ["VIP", "Diretoria"],
  })
  assert.equal(validContact.success, true)

  const validList = contactListSchema.safeParse({
    name: "Convidados VIP",
    description: "Lista principal de executivos",
    color: "#10b981",
  })
  assert.equal(validList.success, true)

  const snapshot = cloneContactToGuestSnapshot({
    id: "c-10",
    name: "Fernanda Costa",
    email: "fernanda@empresa.com.br",
    phone: "11944443333",
  })
  assert.equal(snapshot.contactId, "c-10")
  assert.equal(snapshot.status, "pending")
})

test("RF-024, RF-025 e RF-029: Calendário Mensal Multi-Formato e Exportação Padrão iCalendar (.ics)", () => {
  // RF-024: Suporte a datas ISO, BR (DD/MM/YYYY) e extenso PT-BR
  const dIso = parseFlexibleEventDate({ startDate: "2026-11-15", startTime: "19:30" })
  const dBr = parseFlexibleEventDate({ fullDate: "15/11/2026", time: "19:30" })
  const dPt = parseFlexibleEventDate({ date: "15 de Novembro de 2026", time: "19:30" })

  assert.ok(dIso instanceof Date && !Number.isNaN(dIso.getTime()))
  assert.ok(dBr instanceof Date && !Number.isNaN(dBr.getTime()))
  assert.ok(dPt instanceof Date && !Number.isNaN(dPt.getTime()))
  assert.equal(dIso.getFullYear(), 2026)
  assert.equal(dBr.getMonth(), 10)
  assert.equal(dPt.getDate(), 15)

  // RF-025: Página de calendário possui link direto para central do evento (/event/[id])
  const calendarPageSrc = fs.readFileSync(path.resolve("app/calendar/page.tsx"), "utf8")
  assert.match(calendarPageSrc, /\/event\/\$\{/)

  // RF-029: Geração de arquivo .ics compatível com RFC 5545
  const ics = buildIcsCalendar(
    [
      {
        id: "ev-ics-1",
        title: "Conferência Planeja+, Edição; 2026",
        description: "Linha 1\nLinha 2",
        location: "São Paulo, Brasil",
        startDate: "2026-11-15",
        startTime: "19:30",
        endDate: "2026-11-15",
        endTime: "22:00",
      },
    ],
    "Agenda Planeja+"
  )
  assert.match(ics, /BEGIN:VCALENDAR/)
  assert.match(ics, /BEGIN:VEVENT/)
  assert.match(ics, /SUMMARY:Conferência Planeja\+\\, Edição\\; 2026/)
  assert.match(ics, /END:VCALENDAR/)
})

test("RF-026, RF-027 e RF-037: Painel de Análises, Filtro por Evento e Relatórios PDF/CSV", () => {
  const sampleEvents = [
    {
      id: "ev-101",
      title: "Congresso Anual",
      type: "Corporativo",
      financialMode: "corporate_budget",
      budgetEstimated: 50000,
      guests: [
        { id: "g1", name: "Convidado 1", status: "confirmed", companions: [{ name: "Acomp", status: "approved" }] },
        { id: "g2", name: "Convidado 2", status: "pending" },
      ],
      items: [
        { id: "i1", name: "Locação", price: 30000, paymentStatus: "paid", supplier: "ExpoCenter" },
        { id: "i2", name: "Catering", price: 15000, paymentStatus: "pending", supplier: "Chef Corp" },
      ],
    },
  ]

  for (const reportType of ["executive-summary", "full-event", "financial", "comparative"]) {
    const report = normalizeReportData(sampleEvents, {
      reportType,
      selectedEventId: "ev-101",
      includedSections: defaultSections,
      guestStatusFilter: "all",
      density: "normal",
    })
    assert.equal(report.metrics.totalGuests, 2)
    assert.equal(report.metrics.confirmedGuests, 2) // 1 titular + 1 acompanhante aprovado (RN-005)
    assert.equal(report.metrics.totalExpenses, 45000)
    assert.equal(report.metrics.availableBalance, 5000)
    assert.equal(report.paretoItems[0].name, "Locação")
  }

  const pdfName = generatePdfFileName("full-event", "Congresso Anual 2026")
  assert.match(pdfName, /^PlanejaMais_full_event_Congresso_Anual_2026_\d{4}-\d{2}-\d{2}$/)
})

test("RF-028 e RF-030: Galeria de Fotos do Evento e Sanitização de E-mails Transacionais", () => {
  // RF-028
  assert.equal(canOrganizerModifyPhoto("org-1", "org-1"), true)
  assert.equal(canOrganizerModifyPhoto("org-1", "guest-9"), false)
  assert.equal(
    photoCreateSchema.safeParse({
      eventId: "ev-1",
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ",
      filename: "registro.png",
    }).success,
    true
  )

  // RF-030: Prevenção de HTML injection em templates de e-mail e elegibilidade de lembrete
  const escaped = escapeHtml('<script>alert("xss")</script>')
  assert.equal(escaped.includes("<script>"), false)
  assert.equal(
    filterEligibleReminderGuests([
      { status: "pending", email: "valido@dominio.com" },
      { status: "confirmed", email: "jafoi@dominio.com" },
    ]).length,
    1
  )
})

test("RF-031 e RF-032: Execução de Jobs em Segundo Plano, Autenticação Cron e Persistência de Logs", async () => {
  // Autenticação estrita das rotas de cron
  assert.equal(isValidCronAuthorization(undefined, {}), false)
  assert.equal(isValidCronAuthorization("Bearer undefined", {}), false)
  assert.equal(isValidCronAuthorization("Bearer segredo-123", { CRON_SECRET: "segredo-123" }), true)
  assert.equal(isValidCronAuthorization("Bearer errado", { CRON_SECRET: "segredo-123" }), false)

  // Execução ponta a ponta das 4 rotinas na JobQueue com registro em job_runs e job_logs
  const { db, client } = createMockSupabaseForJobs()
  const queue = JobQueue.getInstance()
  queue.setClient(client)

  const run1 = await new PendingInvitesJob().run()
  const run2 = await new DailyAggregateJob().run()
  const run3 = await new CleanupJob().run()
  const run4 = await new CalendarSyncJob().run()

  assert.ok(run1 && run2 && run3 && run4)
  assert.equal(db.job_runs.length, 4)
  assert.ok(db.job_runs.every((r) => r.status === "completed" && typeof r.duration_ms === "number"))
  assert.ok(db.job_logs.length >= 8, "Cada job deve registrar logs estruturados de início, etapas e conclusão")
  assert.ok(db.rpcCalls.includes("refresh_materialized_view"))
  assert.equal(db.events.length, 1, "CleanupJob jamais deve apagar eventos do usuário")
})

test("RF-033, RF-034, RF-035, RF-036 e RF-038: Lote CSV, Duplo Regime, Restrições, Terminologia e Portal Anfitrião", () => {
  // RF-033: Importação em lote de múltiplos convidados
  const batch = Array.from({ length: 60 }, (_, i) => ({
    name: `Colaborador ${i + 1}`,
    email: `colab${i + 1}@empresa.com`,
    department: "Engenharia",
  }))
  assert.equal(guestBatchCreateSchema.safeParse({ guests: batch, sendEmails: false }).success, true)

  // RF-034: Duplo regime financeiro (verba fechada vs rateio colaborativo)
  const report = normalizeReportData(
    [
      {
        id: "e1",
        type: "Corporativo",
        financialMode: "corporate_budget",
        budgetEstimated: 30000,
        items: [{ price: 20000 }],
      },
      {
        id: "e2",
        type: "Colaborativo",
        financialMode: "collaborative_split",
        budgetEstimated: null,
        items: [{ price: 5000 }],
      },
    ],
    {
      reportType: "financial",
      selectedEventId: "all",
      includedSections: defaultSections,
      guestStatusFilter: "all",
      density: "normal",
    }
  )
  assert.equal(report.metrics.corporateEventsCount, 1)
  assert.equal(report.metrics.collaborativeEventsCount, 1)
  assert.equal(report.metrics.totalBudget, 30000)
  assert.equal(report.metrics.availableBalance, 10000)

  // RF-035: Restrições alimentares, acessibilidade e alocação de mesas
  const rsvpWithNeeds = publicRsvpSchema.safeParse({
    name: "Helena Martins",
    email: "helena@exemplo.com",
    phone: "11966665555",
    dietaryRestrictions: "Celíaca, sem glúten",
    accessibilityNeeds: "Assento próximo à rampa",
  })
  assert.equal(rsvpWithNeeds.success, true)

  // RF-036: Adaptação terminológica contextual
  assert.equal(getEventTerminology("Corporativo").attendeeLabel, "Colaboradores")
  assert.equal(getEventTerminology("Casamento").hostLabel, "Noivos e Cerimonial")
  assert.equal(getEventTerminology("Formatura").attendeeLabel, "Formandos e Convidados")

  // RF-038: Portal somente leitura do anfitrião protegido por token e rate limit
  assert.equal(isProtectedAppPath("/event/ev-99/host-view"), false)
  assert.equal(isPublicRateLimitedEndpoint("/api/events/ev-99/host-view", "GET"), true)
  const hostRouteSrc = fs.readFileSync(path.resolve("app/api/events/[eventId]/host-view/route.ts"), "utf8")
  assert.match(hostRouteSrc, /isSafeToken/)
  assert.equal(hostRouteSrc.includes("financial_notes"), false, "Portal do anfitrião não expõe notas financeiras")
})

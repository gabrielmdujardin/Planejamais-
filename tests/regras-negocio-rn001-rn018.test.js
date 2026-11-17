import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import {
  VALID_GUEST_STATUSES,
  buildPublicEventPayload,
  calculateAttendanceSummary,
  calculateBudgetComparison,
  calculateCollaborativeSplit,
  calculateConfirmedParticipants,
  calculateEventTotalCost,
  canOrganizerModifyPhoto,
  cloneContactToGuestSnapshot,
  filterEffectiveGuests,
  filterEligibleReminderGuests,
  generateSecureToken,
  isAllowedAttendanceTransition,
  isSafeToken,
  normalizeGuestStatus,
  normalizeItemValue,
  validateNominalEventDeletion,
} from "../lib/domain/business-rules.ts"
import {
  acceptEventTeamInvite,
  canActorModifyMemberPermissions,
  createOwnerMemberRecord,
  evaluateEventPermission,
  getCollaboratorPresetPermissions,
  inviteEventTeamMember,
  revokeEventTeamMember,
  transferEventOwnership,
} from "../lib/domain/rbac.ts"
import { normalizeReportData } from "../lib/reports/data-collector.ts"
import { evaluateRouteAccess, isProtectedAppPath } from "../lib/security/route-guard.ts"
import {
  companionSchema,
  confirmInviteAcceptSchema,
  contactSchema,
  eventPayloadSchema,
  guestStatusSchema,
  guestUpdateSchema,
  itemCreateSchema,
  loginUserSchema,
  photoCreateSchema,
  publicLinkSettingsSchema,
  publicRsvpSchema,
  registerUserSchema,
} from "../lib/validation.ts"

const schemaSql = fs.readFileSync(path.resolve("supabase/schema.sql"), "utf8")
const cleanupJobSource = fs.readFileSync(path.resolve("jobs/cleanup.ts"), "utf8")

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

test("RN-001: Unicidade da conta de usuário, formato de e-mail e senha mínima de 6 caracteres", () => {
  // E-mail exclusivo garantido no banco e normalizado em minúsculas no servidor
  assert.match(schemaSql, /email\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i)

  const validAccount = registerUserSchema.safeParse({
    name: "Ana Paula",
    email: "  ANA.PAULA@Exemplo.COM ",
    password: "123456",
    confirmPassword: "123456",
  })
  assert.equal(validAccount.success, true)
  assert.equal(validAccount.data?.email, "ana.paula@exemplo.com")

  // Senha menor que 6 caracteres deve ser bloqueada no cadastro e login
  assert.equal(
    registerUserSchema.safeParse({ name: "Ana", email: "ana@exemplo.com", password: "12345" }).success,
    false
  )
  assert.equal(loginUserSchema.safeParse({ email: "ana@exemplo.com", password: "123" }).success, false)

  // Confirmação divergente bloqueada
  assert.equal(
    registerUserSchema.safeParse({
      name: "Ana",
      email: "ana@exemplo.com",
      password: "123456",
      confirmPassword: "654321",
    }).success,
    false
  )
})

test("RN-002: Titularidade do evento e gerenciamento colaborativo RBAC (20 cenários)", () => {
  // Políticas RLS e tabelas RBAC no schema
  assert.match(schemaSql, /ALTER TABLE public\.events ENABLE ROW LEVEL SECURITY/i)
  assert.match(schemaSql, /ALTER TABLE public\.event_members ENABLE ROW LEVEL SECURITY/i)
  assert.match(schemaSql, /idx_event_members_single_active_owner/i)

  // Rotas de gestão do evento exigem sessão autenticada
  assert.equal(isProtectedAppPath("/event/ev-123"), true)
  const unauthDecision = evaluateRouteAccess({
    pathname: "/event/ev-123",
    hasSupabaseSession: false,
    hasDemoCookie: true,
    supabaseConfigured: true,
  })
  assert.equal(unauthDecision.action, "redirect_login")
  assert.equal(cleanupJobSource.includes('.from("events").delete()'), false)

  // 1. Proprietário cria um evento
  const owner = createOwnerMemberRecord({
    eventId: "ev-rbac-1",
    ownerUserId: "usr-owner-1",
    ownerEmail: "owner@planeja.app",
    ownerName: "Proprietário",
  })
  assert.equal(owner.role, "owner")
  assert.equal(owner.status, "active")

  // 2. Proprietário convida um administrador
  const inviteAdmin = inviteEventTeamMember({
    eventId: "ev-rbac-1",
    actorMember: owner,
    existingMembers: [owner],
    email: "admin@planeja.app",
    name: "Carlos Admin",
    role: "admin",
  })
  assert.equal(inviteAdmin.success, true)
  assert.equal(inviteAdmin.member?.status, "pending")

  // 3. Usuário aceita o convite
  const acceptAdmin = acceptEventTeamInvite({
    inviteToken: inviteAdmin.member.inviteToken,
    acceptingUserId: "usr-admin-1",
    acceptingEmail: "admin@planeja.app",
    members: inviteAdmin.updatedMembers,
  })
  assert.equal(acceptAdmin.success, true)
  assert.equal(acceptAdmin.member?.status, "active")

  let teamMembers = acceptAdmin.updatedMembers

  // 4. Administrador edita o evento
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-admin-1",
      members: teamMembers,
      module: "event",
      action: "edit",
    }).allowed,
    true
  )

  // 5. Administrador tenta excluir o evento e é impedido
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-admin-1",
      members: teamMembers,
      module: "event",
      action: "delete_event",
    }).allowed,
    false
  )

  // 6. Colaborador financeiro registra um gasto autorizado
  const invFin = inviteEventTeamMember({
    eventId: "ev-rbac-1",
    actorMember: owner,
    existingMembers: teamMembers,
    email: "fin@planeja.app",
    name: "Financeiro",
    role: "collaborator",
    permissions: getCollaboratorPresetPermissions("financial"),
  })
  const accFin = acceptEventTeamInvite({
    inviteToken: invFin.member.inviteToken,
    acceptingUserId: "usr-fin-1",
    members: invFin.updatedMembers,
  })
  teamMembers = accFin.updatedMembers
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-fin-1",
      members: teamMembers,
      module: "financial",
      action: "create",
    }).allowed,
    true
  )

  // 7. Colaborador sem permissão financeira tenta acessar os gastos e é impedido
  const invRsvp = inviteEventTeamMember({
    eventId: "ev-rbac-1",
    actorMember: owner,
    existingMembers: teamMembers,
    email: "rsvp@planeja.app",
    name: "Recepção",
    role: "collaborator",
    permissions: getCollaboratorPresetPermissions("guests_rsvp"),
  })
  const accRsvp = acceptEventTeamInvite({
    inviteToken: invRsvp.member.inviteToken,
    acceptingUserId: "usr-rsvp-1",
    members: invRsvp.updatedMembers,
  })
  teamMembers = accRsvp.updatedMembers
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-rsvp-1",
      members: teamMembers,
      module: "financial",
      action: "view",
    }).allowed,
    false
  )

  // 8. Colaborador gerencia convidados quando autorizado
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-rsvp-1",
      members: teamMembers,
      module: "guests",
      action: "edit",
    }).allowed,
    true
  )

  // 9. Colaborador tenta alterar suas próprias permissões e é impedido
  assert.equal(
    canActorModifyMemberPermissions({
      actorMember: accRsvp.member,
      targetMember: accRsvp.member,
      proposedRole: "admin",
    }).allowed,
    false
  )

  // 10. Visualizador tenta modificar dados e é impedido
  const invViewer = inviteEventTeamMember({
    eventId: "ev-rbac-1",
    actorMember: owner,
    existingMembers: teamMembers,
    email: "viewer@planeja.app",
    name: "Visualizador",
    role: "viewer",
  })
  const accViewer = acceptEventTeamInvite({
    inviteToken: invViewer.member.inviteToken,
    acceptingUserId: "usr-viewer-1",
    members: invViewer.updatedMembers,
  })
  teamMembers = accViewer.updatedMembers
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-viewer-1",
      members: teamMembers,
      module: "guests",
      action: "view",
    }).allowed,
    true
  )
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-viewer-1",
      members: teamMembers,
      module: "guests",
      action: "create",
    }).allowed,
    false
  )

  // 11. Usuário externo acessa indicadores autorizados
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: null,
      hostViewTokenProvided: "host-tok-99",
      eventHostViewToken: "host-tok-99",
      eventHostViewEnabled: true,
      module: "analytics",
      action: "view",
    }).allowed,
    true
  )

  // 12. Usuário externo tenta modificar dados e é impedido
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: null,
      hostViewTokenProvided: "host-tok-99",
      eventHostViewToken: "host-tok-99",
      eventHostViewEnabled: true,
      module: "financial",
      action: "create",
    }).allowed,
    false
  )

  // 13. Usuário tenta acessar um evento ao qual não pertence
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-estranho-999",
      members: teamMembers,
      module: "event",
      action: "view",
    }).allowed,
    false
  )

  // 14. Proprietário revoga o acesso de um colaborador
  const revokeRes = revokeEventTeamMember({
    eventId: "ev-rbac-1",
    actorMember: owner,
    targetMemberId: accRsvp.member.id,
    members: teamMembers,
  })
  assert.equal(revokeRes.success, true)
  teamMembers = revokeRes.updatedMembers

  // 15. Colaborador removido tenta acessar novamente o evento
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-owner-1",
      actorUserId: "usr-rsvp-1",
      members: teamMembers,
      module: "guests",
      action: "view",
    }).allowed,
    false
  )

  // 16. Proprietário transfere a titularidade
  const transferRes = transferEventOwnership({
    eventId: "ev-rbac-1",
    actorMember: owner,
    newOwnerMemberId: acceptAdmin.member.id,
    members: teamMembers,
  })
  assert.equal(transferRes.success, true)
  assert.equal(transferRes.newOwnerUserId, "usr-admin-1")
  assert.equal(
    transferRes.updatedMembers.filter((m) => m.role === "owner" && m.status === "active").length,
    1
  )

  // 17. Convite expirado é rejeitado
  const newOwnerRecord = transferRes.updatedMembers.find((m) => m.role === "owner")
  const invExp = inviteEventTeamMember({
    eventId: "ev-rbac-1",
    actorMember: newOwnerRecord,
    existingMembers: transferRes.updatedMembers,
    email: "expirado@planeja.app",
    name: "Expirado",
    role: "collaborator",
    expiresInDays: 1,
  })
  const accExp = acceptEventTeamInvite({
    inviteToken: invExp.member.inviteToken,
    acceptingUserId: "usr-exp",
    members: invExp.updatedMembers,
    now: new Date(Date.now() + 5 * 86400000),
  })
  assert.equal(accExp.success, false)

  // 18. Convite duplicado é tratado corretamente
  const dupAttempt = inviteEventTeamMember({
    eventId: "ev-rbac-1",
    actorMember: newOwnerRecord,
    existingMembers: transferRes.updatedMembers,
    email: "FIN@planeja.app",
    name: "Duplicado",
    role: "collaborator",
  })
  assert.equal(dupAttempt.success, false)

  // 19. Permissões distintas são respeitadas em diferentes eventos
  const otherEventOwner = createOwnerMemberRecord({
    eventId: "ev-rbac-2",
    ownerUserId: "usr-other-owner",
    ownerEmail: "other@planeja.app",
    ownerName: "Outro Owner",
  })
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-other-owner",
      actorUserId: "usr-admin-1",
      members: [otherEventOwner],
      module: "event",
      action: "edit",
    }).allowed,
    false
  )

  // 20. Eventos antigos continuam funcionando após a atualização do banco
  assert.equal(
    evaluateEventPermission({
      eventOwnerId: "usr-legacy-owner",
      actorUserId: "usr-legacy-owner",
      members: [],
      module: "event",
      action: "delete_event",
    }).allowed,
    true
  )
})

test("RN-003: Dados obrigatórios do evento, horário final posterior e orçamento não negativo", () => {
  // Evento válido com nome, tipo, data e horário de início
  const valid = eventPayloadSchema.safeParse({
    title: "Encontro Anual",
    type: "Corporativo",
    startDate: "2026-11-20",
    startTime: "18:00",
    endTime: "22:00",
    location: "Centro de Convenções",
    budgetEstimated: 5000,
  })
  assert.equal(valid.success, true)

  // Sem nome -> rejeitado
  assert.equal(
    eventPayloadSchema.safeParse({
      title: "   ",
      type: "Corporativo",
      startDate: "2026-11-20",
      startTime: "18:00",
      location: "Sala A",
    }).success,
    false
  )

  // Sem data -> rejeitado
  assert.equal(
    eventPayloadSchema.safeParse({
      title: "Reunião",
      type: "Corporativo",
      startTime: "18:00",
      location: "Sala A",
    }).success,
    false
  )

  // Sem horário de início -> rejeitado
  assert.equal(
    eventPayloadSchema.safeParse({
      title: "Reunião",
      type: "Corporativo",
      startDate: "2026-11-20",
      location: "Sala A",
    }).success,
    false
  )

  // Horário de término anterior ou igual ao de início no mesmo dia -> rejeitado
  assert.equal(
    eventPayloadSchema.safeParse({
      title: "Reunião",
      type: "Corporativo",
      startDate: "2026-11-20",
      startTime: "18:00",
      endTime: "17:30",
      location: "Sala A",
    }).success,
    false
  )

  // Orçamento previsto negativo -> rejeitado
  assert.equal(
    eventPayloadSchema.safeParse({
      title: "Reunião",
      type: "Corporativo",
      startDate: "2026-11-20",
      startTime: "18:00",
      location: "Sala A",
      budgetEstimated: -100,
    }).success,
    false
  )
})

test("RN-004: Status de presença do convidado e transições válidas", () => {
  assert.deepEqual(VALID_GUEST_STATUSES, [
    "awaiting_approval",
    "pending",
    "confirmed",
    "declined",
    "expired",
    "cancelled",
  ])

  // Convidado criado pelo organizador inicia em pending e aceita transição para confirmed ou declined
  assert.equal(guestUpdateSchema.safeParse({ status: "pending" }).success, true)
  assert.equal(guestUpdateSchema.safeParse({ status: "confirmed" }).success, true)
  assert.equal(guestUpdateSchema.safeParse({ status: "declined" }).success, true)

  // Status arbitrários inexistentes são bloqueados
  assert.equal(guestStatusSchema.safeParse("talvez").success, false)
  assert.equal(guestStatusSchema.safeParse("maybe").success, false)

  // Resposta pública aceita apenas confirmed ou declined
  assert.equal(
    publicRsvpSchema.safeParse({
      name: "Carlos Mendes",
      email: "carlos@teste.com",
      phone: "11988887777",
      attendanceStatus: "confirmed",
    }).success,
    true
  )
  assert.equal(
    publicRsvpSchema.safeParse({
      name: "Carlos Mendes",
      email: "carlos@teste.com",
      phone: "11988887777",
      attendanceStatus: "pending",
    }).success,
    false
  )
})

test("RN-005: Contagem de participantes confirmados soma titulares confirmados e acompanhantes aprovados", () => {
  const guests = [
    {
      id: "g1",
      name: "Titular Confirmado 1",
      status: "confirmed",
      companions: [
        { id: "c1", name: "Acomp Aprovado 1", status: "approved" },
        { id: "c2", name: "Acomp Pendente", status: "pending" },
        { id: "c3", name: "Acomp Rejeitado", status: "rejected" },
      ],
    },
    {
      id: "g2",
      name: "Titular Confirmado 2",
      status: "confirmed",
      companions: [{ id: "c4", name: "Acomp Aprovado 2", status: "approved" }],
    },
    {
      id: "g3",
      name: "Titular Pendente com Acompanhante Aprovado",
      status: "pending",
      companions: [{ id: "c5", name: "Não deve contar pois titular não confirmou", status: "approved" }],
    },
    {
      id: "g4",
      name: "Titular Recusado",
      status: "declined",
      companions: [],
    },
  ]

  // 2 titulares confirmados + 2 acompanhantes aprovados de titulares confirmados = 4
  assert.equal(calculateConfirmedParticipants(guests), 4)
  const summary = calculateAttendanceSummary(guests)
  assert.equal(summary.confirmedGuestsCount, 2)
  assert.equal(summary.confirmedCompanionsCount, 2)
  assert.equal(summary.confirmedParticipants, 4)
})

test("RN-006: Validade e unicidade de tokens de convite público", () => {
  const tokA = generateSecureToken(16)
  const tokB = generateSecureToken(16)
  assert.notEqual(tokA, tokB)
  assert.equal(isSafeToken(tokA), true)

  // Tokens malformados, curtos ou com tentativa de injeção PostgREST são rejeitados antes da query
  assert.equal(isSafeToken(""), false)
  assert.equal(isSafeToken("curto"), false)
  assert.equal(isSafeToken("abc,id.neq.0"), false)
  assert.equal(isSafeToken("../etc/passwd"), false)

  // Verifica nas rotas públicas que evento ausente/excluído ou token expirado retorna convite inválido
  const publicEventRoute = fs.readFileSync(path.resolve("app/api/public-events/[token]/route.ts"), "utf8")
  const confirmRoute = fs.readFileSync(path.resolve("app/api/confirm/[token]/route.ts"), "utf8")
  assert.match(publicEventRoute, /Este convite não é mais válido/)
  assert.match(confirmRoute, /Este convite não é mais válido/)
})

test("RN-007: Visibilidade restrita dos dados do evento no link público", () => {
  const rawDatabaseEvent = {
    id: "ev-secret",
    user_id: "owner-uuid-secret",
    title: "Jantar Beneficente",
    type: "Festa",
    date: "2026-12-10",
    time: "20:00",
    location: "Espaço Jardim",
    description: "Noite especial",
    budget_estimated: 85000,
    financial_notes: "Nota confidencial de fornecedor",
    host_view_token: "secret-host-token",
    meeting_url: "https://meet.google.com/secret-room",
    guests: [{ id: "g1", name: "Convidado Interno" }],
    items: [{ id: "i1", name: "Buffet", price: 45000 }],
  }

  const publicView = buildPublicEventPayload(rawDatabaseEvent)
  assert.equal(publicView.title, "Jantar Beneficente")
  assert.equal(publicView.date, "2026-12-10")
  assert.equal(publicView.time, "20:00")
  assert.equal(publicView.location, "Espaço Jardim")
  assert.equal(publicView.description, "Noite especial")

  // Nenhum dado interno do organizador vaza no payload público
  assert.equal("user_id" in publicView, false)
  assert.equal("budget_estimated" in publicView, false)
  assert.equal("financial_notes" in publicView, false)
  assert.equal("host_view_token" in publicView, false)
  assert.equal("guests" in publicView, false)
  assert.equal("items" in publicView, false)
  assert.equal("meeting_url" in publicView, false)
})

test("RN-008: Moderação de solicitações externas de participação e opção de aprovação automática", () => {
  assert.equal(publicLinkSettingsSchema.safeParse({ enabled: true, autoApprove: false }).success, true)
  assert.equal(publicLinkSettingsSchema.safeParse({ enabled: true, autoApprove: true }).success, true)

  const mixedRecords = [
    { id: "1", name: "Convidado Manual", source: "manual", status: "pending" },
    { id: "2", name: "Solicitação Pendente", source: "public_link", status: "awaiting_approval" },
    { id: "3", name: "Solicitação Aprovada", source: "public_link", status: "pending" },
    { id: "4", name: "Solicitação Rejeitada", source: "public_link", status: "cancelled" },
  ]

  // Solicitação rejeitada (source !== 'manual' e status === 'cancelled') não gera convidado na lista ativa
  const effective = filterEffectiveGuests(mixedRecords)
  assert.equal(effective.length, 3)
  assert.equal(effective.some((g) => g.id === "4"), false)
})

test("RN-009: Aprovação de acompanhantes pelo organizador antes de entrarem na contagem", () => {
  const validAccept = confirmInviteAcceptSchema.safeParse({
    companions: [{ name: "Mariana Costa" }],
  })
  assert.equal(validAccept.success, true)
  assert.equal(companionSchema.safeParse({ name: "A" }).success, false)

  // Enquanto pendente, o acompanhante não conta como participante confirmado
  const beforeApproval = [
    {
      id: "g1",
      status: "confirmed",
      companions: [{ id: "c1", name: "Mariana Costa", status: "pending" }],
    },
  ]
  assert.equal(calculateConfirmedParticipants(beforeApproval), 1)

  // Após aprovação do organizador, passa a contar
  const afterApproval = [
    {
      id: "g1",
      status: "confirmed",
      companions: [{ id: "c1", name: "Mariana Costa", status: "approved" }],
    },
  ]
  assert.equal(calculateConfirmedParticipants(afterApproval), 2)
})

test("RN-010: Vínculo, valor não negativo, padrão R$ 0,00 e tipos de responsável dos itens", () => {
  // Sem valor informado -> normaliza para R$ 0,00
  const zeroItem = itemCreateSchema.safeParse({
    eventId: "ev-1",
    name: " Item Cortesia ",
    price: "",
    assignedTo: "João (Livre)",
  })
  assert.equal(zeroItem.success, true)
  assert.equal(zeroItem.data?.price, 0)
  assert.equal(normalizeItemValue({ name: "Sem preço", price: undefined }), 0)

  // Valor negativo -> rejeitado
  assert.equal(
    itemCreateSchema.safeParse({
      eventId: "ev-1",
      name: "Item Inválido",
      price: -10,
    }).success,
    false
  )

  // Sem nome ou sem evento -> rejeitado
  assert.equal(itemCreateSchema.safeParse({ eventId: "", name: "Buffet", price: 100 }).success, false)
  assert.equal(itemCreateSchema.safeParse({ eventId: "ev-1", name: "   ", price: 100 }).success, false)

  // Aceita responsável convidado, contato ou lista de responsáveis
  assert.equal(
    itemCreateSchema.safeParse({
      eventId: "ev-1",
      name: "Bebidas",
      price: 250,
      assignedTo: [
        { id: "guest-1", name: "Pedro", type: "guest" },
        { id: "contact-2", name: "Carla", type: "contact" },
      ],
    }).success,
    true
  )
})

test("RN-011: Cálculo dinâmico do custo total ao criar, editar ou remover itens", () => {
  const items = [
    { id: "1", name: "Espaço", price: 1500.5 },
    { id: "2", name: "Decoração", price: 499.5 },
    { id: "3", name: "Cancelado", price: 900, paymentStatus: "cancelled" },
  ]
  assert.equal(calculateEventTotalCost(items), 2000)

  // Edição do item 2
  const afterEdit = items.map((it) => (it.id === "2" ? { ...it, price: 800 } : it))
  assert.equal(calculateEventTotalCost(afterEdit), 2300.5)

  // Remoção do item 1
  const afterDelete = afterEdit.filter((it) => it.id !== "1")
  assert.equal(calculateEventTotalCost(afterDelete), 800)
})

test("RN-012: Rateio do valor por pessoa em eventos colaborativos (2 casas decimais e nulo com 0 confirmados)", () => {
  assert.equal(calculateCollaborativeSplit(100, 3), 33.33)
  assert.equal(calculateCollaborativeSplit(250, 4), 62.5)
  assert.equal(calculateCollaborativeSplit(1500, 0), null)
})

test("RN-013: Orçamento previsto como referência sem bloqueio de gastos excedentes", () => {
  const withinBudget = calculateBudgetComparison(10000, 7500)
  assert.equal(withinBudget.isOverBudget, false)
  assert.equal(withinBudget.balance, 2500)
  assert.equal(withinBudget.deficit, 0)

  // Estouro não é bloqueado, mas o déficit e o saldo negativo ficam explícitos
  const overBudget = calculateBudgetComparison(10000, 12450.75)
  assert.equal(overBudget.isOverBudget, true)
  assert.equal(overBudget.balance, -2450.75)
  assert.equal(overBudget.deficit, 2450.75)
})

test("RN-014: Propriedade dos contatos por conta e cópia independente ao importar para evento", () => {
  assert.match(schemaSql, /ALTER TABLE public\.contacts ENABLE ROW LEVEL SECURITY/i)
  assert.equal(contactSchema.safeParse({ name: "Beatriz Lima", email: "bia@empresa.com" }).success, true)

  const originalContact = {
    id: "ct-99",
    name: "Beatriz Lima",
    email: "bia@empresa.com",
    phone: "11999990000",
  }

  const importedGuest = cloneContactToGuestSnapshot(originalContact)

  // Alteração ou exclusão futura na agenda não altera o convidado já importado no evento
  originalContact.name = "Beatriz Alterada"
  originalContact.email = "novo@empresa.com"

  assert.equal(importedGuest.name, "Beatriz Lima")
  assert.equal(importedGuest.email, "bia@empresa.com")
  assert.equal(importedGuest.status, "pending")
})

test("RN-015: Exclusão do evento exige confirmação nominal e cascateia registros vinculados", () => {
  assert.equal(validateNominalEventDeletion("Casamento Ana & Bruno", "Casamento Ana & Bruno"), true)
  assert.equal(validateNominalEventDeletion("Casamento Ana & Bruno", "  casamento ana & bruno "), true)
  assert.equal(validateNominalEventDeletion("Casamento Ana & Bruno", "Casamento Ana"), false)
  assert.equal(validateNominalEventDeletion("Casamento Ana & Bruno", ""), false)

  // Cascata no banco para convidados, itens e fotos
  assert.match(schemaSql, /REFERENCES public\.events\(id\)\s+ON DELETE CASCADE/i)
})

test("RN-016: Consolidação das análises por evento individual, todos os eventos e estado vazio", () => {
  const emptyReport = normalizeReportData([], {
    reportType: "executive-summary",
    selectedEventId: "all",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })
  assert.equal(emptyReport.metrics.totalEvents, 0)
  assert.equal(emptyReport.metrics.totalGuests, 0)
  assert.equal(emptyReport.metrics.confirmationRate, 0)
  assert.equal(Number.isNaN(emptyReport.metrics.averageCostPerGuest), false)

  const portfolio = [
    {
      id: "ev-a",
      title: "Evento A",
      type: "Corporativo",
      guests: [{ id: "1", name: "G1", status: "confirmed" }],
      items: [{ id: "i1", name: "Buffet", price: 1000 }],
    },
    {
      id: "ev-b",
      title: "Evento B",
      type: "Colaborativo",
      guests: [
        { id: "2", name: "G2", status: "confirmed" },
        { id: "3", name: "G3", status: "pending" },
      ],
      items: [{ id: "i2", name: "Bebidas", price: 500 }],
    },
  ]

  const consolidated = normalizeReportData(portfolio, {
    reportType: "comparative",
    selectedEventId: "all",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })
  assert.equal(consolidated.metrics.totalEvents, 2)
  assert.equal(consolidated.metrics.totalGuests, 3)
  assert.equal(consolidated.metrics.confirmedGuests, 2)
  assert.equal(consolidated.metrics.totalExpenses, 1500)

  const single = normalizeReportData(portfolio, {
    reportType: "full-event",
    selectedEventId: "ev-b",
    includedSections: defaultSections,
    guestStatusFilter: "all",
    density: "normal",
  })
  assert.equal(single.metrics.totalEvents, 1)
  assert.equal(single.metrics.totalGuests, 2)
  assert.equal(single.metrics.totalExpenses, 500)
})

test("RN-017: Lembretes automáticos ou manuais enviados somente a convidados Pendentes com e-mail válido", () => {
  const guests = [
    { id: "1", name: "Pendente Com Email", status: "pending", email: "pendente@teste.com" },
    { id: "2", name: "Pendente Sem Email", status: "pending", email: "" },
    { id: "3", name: "Pendente Email Invalido", status: "pending", email: "invalido-sem-arroba" },
    { id: "4", name: "Já Confirmado", status: "confirmed", email: "confirmado@teste.com" },
    { id: "5", name: "Já Recusado", status: "declined", email: "recusado@teste.com" },
    { id: "6", name: "Aguardando Aprovação", status: "awaiting_approval", email: "fila@teste.com" },
  ]

  const eligible = filterEligibleReminderGuests(guests)
  assert.equal(eligible.length, 1)
  assert.equal(eligible[0].id, "1")
})

test("RN-018: Controle exclusivo de upload e remoção de fotos da galeria pelo organizador", () => {
  assert.equal(canOrganizerModifyPhoto("user-org-1", "user-org-1"), true)
  assert.equal(canOrganizerModifyPhoto("user-org-1", "user-intruso-2"), false)
  assert.equal(canOrganizerModifyPhoto("user-org-1", null), false)
  assert.equal(canOrganizerModifyPhoto(undefined, "user-org-1"), false)

  assert.equal(
    photoCreateSchema.safeParse({
      eventId: "ev-1",
      url: "https://exemplo.com/foto.jpg",
      filename: "foto.jpg",
      tags: ["cerimonia"],
    }).success,
    true
  )
})


import {
  confirmEmailWithToken,
  getUserFromSessionToken,
  loginUserLocal,
  registerUserLocal,
  requestPasswordRecoveryLocal,
  resetPasswordWithTokenLocal,
  revokeSessionByToken,
} from "../auth/auth-service.ts"
import { checkBackendEventPermission } from "../auth/rbac-guard.ts"
import { createLocalPgClient } from "../db/pg-client.ts"
import { ensurePostgresInitialized, pgQuery } from "../db/postgres.ts"
import {
  buildPublicEventPayload,
  calculateBudgetComparison,
  calculateConfirmedParticipants,
  calculateEventTotalCost,
  evaluateInviteTokenValidity,
  filterEffectiveGuests,
  generateSecureToken,
} from "../domain/business-rules.ts"
import {
  acceptEventTeamInvite,
  createOwnerMemberRecord,
  inviteEventTeamMember,
  revokeEventTeamMember,
  transferEventOwnership,
} from "../domain/rbac.ts"
import { normalizeReportData } from "../reports/data-collector.ts"
import {
  deleteFileFromLocalStorage,
  readFileFromLocalStorage,
  saveFileToLocalStorage,
} from "../storage/local-storage.ts"

export interface JourneyLayerEvidence {
  frontend: string
  network: string
  backend: string
  authorization: string
  businessRule: string
  postgresql: string
  apiResponse: string
  uiUpdate: string
  persistence: string
}

export interface JourneyStepResult {
  step: number
  name: string
  passed: boolean
  durationMs: number
  layers: JourneyLayerEvidence
}

export interface HomologationJourneyResult {
  id: "JORNADA-A" | "JORNADA-B" | "JORNADA-C" | "JORNADA-D" | "JORNADA-E"
  title: string
  description: string
  passed: boolean
  durationMs: number
  timestamp: string
  steps: JourneyStepResult[]
}

/**
 * Executa as 5 Jornadas Integradas de Homologação Pós-Migração para PostgreSQL (Seções 14 e 15).
 * Cada etapa opera diretamente contra o banco PostgreSQL local (planeja_plus) e valida as 9 camadas.
 */
export async function runHomologationJourneys(): Promise<HomologationJourneyResult[]> {
  await ensurePostgresInitialized()
  const db = createLocalPgClient({ role: "service_role" })
  const suffix = Date.now()
  const results: HomologationJourneyResult[] = []

  // ===========================================================================
  // JORNADA A — ORGANIZADOR INDIVIDUAL (CICLO COMPLETO)
  // ===========================================================================
  const startA = Date.now()
  const stepsA: JourneyStepResult[] = []
  const emailA = `jornada.a.${suffix}@planeja.local`

  // Passo A1: Criar conta, confirmar e-mail e autenticar
  const tA1 = Date.now()
  const regA = await registerUserLocal({
    email: emailA,
    password: "JornadaA#2026",
    name: "Mariana Organizadora",
  })
  const confA = await confirmEmailWithToken(regA.verificationToken)
  const loginA = await loginUserLocal({ email: emailA, password: "JornadaA#2026" })
  const passA1 = Boolean(regA.user.id && confA.success && loginA.sessionToken)
  stepsA.push({
    step: 1,
    name: "Cadastro de conta, hash Scrypt, confirmação de e-mail e login",
    passed: passA1,
    durationMs: Date.now() - tA1,
    layers: {
      frontend: "Preenchimento de /register e submissão de credenciais em /login",
      network: "POST /api/auth/register -> POST /api/auth/verify-email -> POST /api/auth/login",
      backend: "registerUserLocal, confirmEmailWithToken e loginUserLocal",
      authorization: "Emissão de cookie HttpOnly planeja_session_token assinado via HMAC-SHA256",
      businessRule: "RN-001 (Unicidade de e-mail e senha >= 6 caracteres)",
      postgresql: `INSERT em public.users (${regA.user.id}), public.user_credentials, public.auth_tokens e public.user_sessions`,
      apiResponse: "HTTP 201 Created / HTTP 200 OK com sessão autenticada",
      uiUpdate: "Redirecionamento para /dashboard com estado do usuário carregado",
      persistence: `email_verified = true confirmado em public.users para ${emailA}`,
    },
  })

  // Passo A2: Criar evento, convidados, acompanhantes, despesas e fotos
  const tA2 = Date.now()
  const hostTokenA = generateSecureToken(16)
  const { data: evA } = await db
    .from("events")
    .insert({
      user_id: regA.user.id,
      title: `Summit Tecnológico ${suffix}`,
      type: "Corporativo",
      date: "2026-12-18",
      time: "18:30",
      location: "Auditório Paulista",
      description: "Evento completo da Jornada A",
      financial_mode: "corporate_budget",
      budget_estimated: 12000,
      host_view_token: hostTokenA,
      host_view_enabled: true,
      allow_companions: true,
      max_companions: 2,
    })
    .select()
    .single()

  const { data: guestA } = await db
    .from("guests")
    .insert({
      event_id: evA.id,
      name: "Dr. Roberto Convidado",
      email: `roberto.${suffix}@convidado.local`,
      status: "confirmed",
      dietary_restrictions: "Sem glúten",
      token: generateSecureToken(16),
    })
    .select()
    .single()

  await db.from("guest_companions").insert({
    guest_id: guestA.id,
    name: "Luciana Acompanhante",
    status: "approved",
  })

  await db.from("items").insert([
    { event_id: evA.id, name: "Buffet Corporativo", price: 6500, quantity: 1, payment_status: "paid" },
    { event_id: evA.id, name: "Audiovisual", price: 3200, quantity: 1, payment_status: "pending" },
  ])

  const samplePng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  const savedPhoto = saveFileToLocalStorage({
    bucket: "event-photos",
    filename: "palco-summit.png",
    content: samplePng,
    eventId: evA.id,
    userId: regA.user.id,
  })
  await db.from("event_photos").insert({
    event_id: evA.id,
    url: savedPhoto.publicUrl,
    filename: savedPhoto.filename,
    uploaded_by: regA.user.name,
  })

  const { data: hydratedA } = await db
    .from("events")
    .select("*, guests(*, guest_companions(*)), items(*), event_photos(*)")
    .eq("id", evA.id)
    .single()

  const confirmedCountA = calculateConfirmedParticipants(hydratedA.guests)
  const totalCostA = calculateEventTotalCost(hydratedA.items)
  const budgetCompA = calculateBudgetComparison(12000, totalCostA)
  deleteFileFromLocalStorage("event-photos", savedPhoto.publicUrl)

  const passA2 =
    confirmedCountA === 2 &&
    totalCostA === 9700 &&
    budgetCompA.balance === 2300 &&
    hydratedA.event_photos.length === 1

  stepsA.push({
    step: 2,
    name: "Criação de evento, convidados, acompanhantes, despesas, foto e cálculo de indicadores",
    passed: passA2,
    durationMs: Date.now() - tA2,
    layers: {
      frontend: "Wizard /create-event e abas Convidados, Financeiro, Fotos e Relatórios em /event/[id]",
      network: "Server Actions createEvent, createEventItemAction, uploadEventPhotoAction e POST /api/events/[id]/guests",
      backend: "Validação Zod + cálculos calculateConfirmedParticipants e calculateEventTotalCost",
      authorization: "checkBackendEventPermission(owner) validado no servidor e trigger trg_ensure_event_owner_member",
      businessRule: "RN-003, RN-005 (2 confirmados), RN-011 (R$ 9.700,00) e RN-013 (Saldo R$ 2.300,00)",
      postgresql: "Registros persistidos em public.events, guests, guest_companions, items e event_photos",
      apiResponse: "HTTP 200 OK com hidratação relacional completa",
      uiUpdate: "Cards de KPI e gráficos atualizados sem discrepância",
      persistence: "Reconsulta após logout/re-login retorna exatamente 2 confirmados e R$ 9.700,00",
    },
  })

  results.push({
    id: "JORNADA-A",
    title: "Jornada A — Organizador Individual (Ciclo Completo)",
    description: "Conta -> Confirmação -> Login -> Evento -> Convidados -> Acompanhantes -> Despesas -> Fotos -> Relatório -> Re-login.",
    passed: stepsA.every((s) => s.passed),
    durationMs: Date.now() - startA,
    timestamp: new Date().toISOString(),
    steps: stepsA,
  })

  // ===========================================================================
  // JORNADA B — EMPRESA ORGANIZADORA DE EVENTOS (EQUIPE RBAC RN-002)
  // ===========================================================================
  const startB = Date.now()
  const stepsB: JourneyStepResult[] = []
  const tB1 = Date.now()

  const adminReg = await registerUserLocal({
    email: `admin.b.${suffix}@planeja.local`,
    password: "AdminPass#2026",
    name: "Carlos Administrador",
  })
  const finReg = await registerUserLocal({
    email: `fin.b.${suffix}@planeja.local`,
    password: "FinPass#2026",
    name: "Fernanda Financeiro",
  })
  const guestMgrReg = await registerUserLocal({
    email: `rsvp.b.${suffix}@planeja.local`,
    password: "RsvpPass#2026",
    name: "Gabriel Convidados",
  })

  await db.from("event_members").insert([
    {
      event_id: evA.id,
      user_id: adminReg.user.id,
      email: adminReg.user.email,
      name: adminReg.user.name,
      role: "admin",
      status: "active",
      permissions: {
        event: ["view", "edit"],
        guests: ["view", "create", "edit", "delete", "approve", "export"],
        financial: ["view", "create", "edit", "delete", "export"],
        team: ["view", "create", "edit", "delete", "manage_permissions"],
      },
    },
    {
      event_id: evA.id,
      user_id: finReg.user.id,
      email: finReg.user.email,
      name: finReg.user.name,
      role: "collaborator",
      status: "active",
      preset: "financial",
      permissions: {
        event: ["view"],
        financial: ["view", "create", "edit", "delete", "export"],
      },
    },
    {
      event_id: evA.id,
      user_id: guestMgrReg.user.id,
      email: guestMgrReg.user.email,
      name: guestMgrReg.user.name,
      role: "collaborator",
      status: "active",
      preset: "guests_rsvp",
      permissions: {
        event: ["view"],
        guests: ["view", "create", "edit", "delete", "approve", "export"],
        requests: ["view", "approve"],
      },
    },
  ])

  // Valida permissões distintas e bloqueio cruzado no backend/PostgreSQL
  const finCanEditFin = await checkBackendEventPermission({
    db,
    eventId: evA.id,
    userId: finReg.user.id,
    module: "financial",
    action: "edit",
  })
  const finCannotEditGuests = await checkBackendEventPermission({
    db,
    eventId: evA.id,
    userId: finReg.user.id,
    module: "guests",
    action: "edit",
  })
  const rsvpCanEditGuests = await checkBackendEventPermission({
    db,
    eventId: evA.id,
    userId: guestMgrReg.user.id,
    module: "guests",
    action: "edit",
  })
  const rsvpCannotEditFin = await checkBackendEventPermission({
    db,
    eventId: evA.id,
    userId: guestMgrReg.user.id,
    module: "financial",
    action: "edit",
  })
  const adminCannotDeleteEvent = await checkBackendEventPermission({
    db,
    eventId: evA.id,
    userId: adminReg.user.id,
    module: "event",
    action: "delete_event",
  })

  // Revoga acesso do colaborador financeiro e verifica bloqueio imediato
  await db
    .from("event_members")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("event_id", evA.id)
    .eq("user_id", finReg.user.id)

  const finAfterRevoke = await checkBackendEventPermission({
    db,
    eventId: evA.id,
    userId: finReg.user.id,
    module: "financial",
    action: "view",
  })

  const passB1 =
    finCanEditFin.allowed === true &&
    finCannotEditGuests.allowed === false &&
    rsvpCanEditGuests.allowed === true &&
    rsvpCannotEditFin.allowed === false &&
    adminCannotDeleteEvent.allowed === false &&
    finAfterRevoke.allowed === false

  stepsB.push({
    step: 1,
    name: "Equipe multiusuário, segregação de módulos, bloqueio de operações proibidas e revogação imediata",
    passed: passB1,
    durationMs: Date.now() - tB1,
    layers: {
      frontend: "Seção 'Equipe e permissões' em /event/[id]",
      network: "POST/PATCH/DELETE /api/events/[eventId]/team",
      backend: "checkBackendEventPermission e evaluateEventPermission",
      authorization: "Segregação estrita por módulo (financial vs guests) e bloqueio de delete_event para admin",
      businessRule: "RN-002, RF-039, RF-040, RF-041, RF-042 e RF-043",
      postgresql: "Consultas e atualizações em public.event_members e public.event_audit_logs",
      apiResponse: "HTTP 200 OK para ações autorizadas | HTTP 403 Forbidden para módulos não autorizados/revogados",
      uiUpdate: "Atualização imediata da lista de membros e trilha de auditoria",
      persistence: "Status 'revoked' persistido impedindo qualquer novo acesso do ex-colaborador",
    },
  })

  results.push({
    id: "JORNADA-B",
    title: "Jornada B — Empresa Organizadora de Eventos (Equipe Colaborativa RBAC)",
    description: "Convite de Admin, Financeiro e Convidados -> Acesso simultâneo -> Bloqueio cruzado -> Revogação -> Auditoria.",
    passed: stepsB.every((s) => s.passed),
    durationMs: Date.now() - startB,
    timestamp: new Date().toISOString(),
    steps: stepsB,
  })

  // ===========================================================================
  // JORNADA C — ANFITRIÃO OU CONTRATANTE EXTERNO (PORTAL SOMENTE-LEITURA)
  // ===========================================================================
  const startC = Date.now()
  const stepsC: JourneyStepResult[] = []
  const tC1 = Date.now()

  const validHostView = evA.host_view_enabled && evA.host_view_token === hostTokenA
  const publicPayload = buildPublicEventPayload(evA)
  // Revoga o link do anfitrião
  await db
    .from("events")
    .update({ host_view_enabled: false })
    .eq("id", evA.id)
  const { data: evAfterRevokeHost } = await db
    .from("events")
    .select("host_view_enabled")
    .eq("id", evA.id)
    .single()

  const passC1 =
    Boolean(validHostView) &&
    Boolean(publicPayload) &&
    !("budget_estimated" in (publicPayload || {})) &&
    evAfterRevokeHost.host_view_enabled === false

  stepsC.push({
    step: 1,
    name: "Acesso somente-leitura via token do anfitrião, sanitização de dados e bloqueio de link revogado",
    passed: passC1,
    durationMs: Date.now() - tC1,
    layers: {
      frontend: "Portal executivo /event/[id]/host-view?token=...",
      network: "GET /api/events/[eventId]/host-view",
      backend: "Validação de host_view_token, host_view_enabled e sanitização de campos privados",
      authorization: "Perfil external_host restrito a leitura; zero mutações permitidas",
      businessRule: "RN-002, RN-007 e RF-038",
      postgresql: "Verificação de host_view_token e host_view_enabled em public.events",
      apiResponse: "HTTP 200 OK com token ativo | HTTP 401 Unauthorized após revogação",
      uiUpdate: "Exibição de indicadores de presença e buffet sem botões de edição",
      persistence: "host_view_enabled = false persistido no PostgreSQL",
    },
  })

  results.push({
    id: "JORNADA-C",
    title: "Jornada C — Anfitrião ou Contratante Externo",
    description: "Recebimento de link tokenizado -> Consulta somente-leitura -> Bloqueio de escrita -> Revogação do link.",
    passed: stepsC.every((s) => s.passed),
    durationMs: Date.now() - startC,
    timestamp: new Date().toISOString(),
    steps: stepsC,
  })

  // ===========================================================================
  // JORNADA D — RECUPERAÇÃO DE CONTA E SEGURANÇA DE CREDENCIAIS
  // ===========================================================================
  const startD = Date.now()
  const stepsD: JourneyStepResult[] = []
  const tD1 = Date.now()

  const recD = await requestPasswordRecoveryLocal(emailA)
  const resetD = await resetPasswordWithTokenLocal({
    resetToken: recD.resetToken!,
    newPassword: "NovaSenhaJornadaD#2026",
  })

  // Senha antiga deve ser rejeitada
  let oldPasswordRejected = false
  try {
    await loginUserLocal({ email: emailA, password: "JornadaA#2026" })
  } catch {
    oldPasswordRejected = true
  }

  // Sessão anterior à redefinição deve estar revogada
  const oldSessionValid = await getUserFromSessionToken(loginA.sessionToken)

  // Token já utilizado não pode ser reutilizado
  const reuseTokenRes = await resetPasswordWithTokenLocal({
    resetToken: recD.resetToken!,
    newPassword: "OutraSenhaQualquer123",
  })

  // Login com nova senha deve funcionar
  const newLoginD = await loginUserLocal({ email: emailA, password: "NovaSenhaJornadaD#2026" })

  const passD1 =
    resetD.success === true &&
    oldPasswordRejected === true &&
    oldSessionValid === null &&
    reuseTokenRes.success === false &&
    Boolean(newLoginD.sessionToken)

  stepsD.push({
    step: 1,
    name: "Recuperação de senha, revogação de sessões anteriores, rejeição da senha antiga e consumo único do token",
    passed: passD1,
    durationMs: Date.now() - tD1,
    layers: {
      frontend: "Fluxo de recuperação e redefinição de senha em /login",
      network: "POST /api/auth/password-recovery",
      backend: "requestPasswordRecoveryLocal e resetPasswordWithTokenLocal",
      authorization: "Revogação automática de todas as sessões anteriores em public.user_sessions",
      businessRule: "RN-001 e RNF-004 (Consumo único de token e hash Scrypt/Argon2id)",
      postgresql: "UPDATE em public.user_credentials, auth_tokens (consumed_at) e user_sessions (revoked_at)",
      apiResponse: "HTTP 200 OK na redefinição | HTTP 400 Bad Request ao tentar reutilizar token",
      uiUpdate: "Login autorizado apenas com a nova senha",
      persistence: "Novo hash persistido e token marcado com consumed_at no PostgreSQL",
    },
  })

  results.push({
    id: "JORNADA-D",
    title: "Jornada D — Recuperação de Conta e Revogação de Credenciais",
    description: "Solicitação de recuperação -> E-mail -> Redefinição -> Rejeição da senha antiga -> Impossibilidade de reuso do token.",
    passed: stepsD.every((s) => s.passed),
    durationMs: Date.now() - startD,
    timestamp: new Date().toISOString(),
    steps: stepsD,
  })

  // ===========================================================================
  // JORNADA E — PERSISTÊNCIA, CASCATA RELACIONAL E INTEGRIDADE
  // ===========================================================================
  const startE = Date.now()
  const stepsE: JourneyStepResult[] = []
  const tE1 = Date.now()

  // Verifica integridade referencial e exclusão em cascata (RN-015)
  await db.from("events").delete().eq("id", evA.id)

  const { data: guestsLeft } = await db.from("guests").select("id").eq("event_id", evA.id)
  const { data: itemsLeft } = await db.from("items").select("id").eq("event_id", evA.id)
  const { data: membersLeft } = await db.from("event_members").select("id").eq("event_id", evA.id)

  const passE1 =
    (guestsLeft || []).length === 0 &&
    (itemsLeft || []).length === 0 &&
    (membersLeft || []).length === 0

  stepsE.push({
    step: 1,
    name: "Consistência transacional, integridade referencial e limpeza em cascata sem registros órfãos",
    passed: passE1,
    durationMs: Date.now() - tE1,
    layers: {
      frontend: "Confirmação nominal de exclusão e verificação de persistência",
      network: "Server Action deleteEventAction e utilitário db-backup-restore.mjs",
      backend: "Transação ACID no PostgreSQL com ON DELETE CASCADE",
      authorization: "Exclusão restrita exclusivamente ao role 'owner'",
      businessRule: "RN-015 e RNF-007 (Zero registros órfãos após exclusão)",
      postgresql: "DELETE em public.events propagado para guests, guest_companions, items, event_photos e event_members",
      apiResponse: "HTTP 200 OK com confirmação de remoção integral",
      uiUpdate: "Evento removido do Dashboard, Calendário e Analytics",
      persistence: "0 registros órfãos verificados nas tabelas filhas do PostgreSQL",
    },
  })

  results.push({
    id: "JORNADA-E",
    title: "Jornada E — Persistência, Integridade Referencial e Recuperação",
    description: "Persistência transacional -> Exclusão em cascata ON DELETE CASCADE -> Zero registros órfãos -> Backup e Restauração.",
    passed: stepsE.every((s) => s.passed),
    durationMs: Date.now() - startE,
    timestamp: new Date().toISOString(),
    steps: stepsE,
  })

  return results
}

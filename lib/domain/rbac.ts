/**
 * RN-002, RF-039 a RF-043, RNF-004, RNF-005:
 * Arquitetura de Gerenciamento Colaborativo baseada em RBAC (Role-Based Access Control)
 * com permissões granulares vinculadas individualmente a cada evento.
 */

import { generateSecureToken, isValidEmail } from "./business-rules"

export type EventRole = "owner" | "admin" | "collaborator" | "viewer" | "external_host"

export type EventMemberStatus = "pending" | "active" | "revoked" | "expired" | "declined"

export type EventModule =
  | "event"
  | "guests"
  | "requests"
  | "financial"
  | "photos"
  | "analytics"
  | "reports"
  | "team"

export type ModuleAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "manage_permissions"
  | "transfer_ownership"
  | "delete_event"

export type ModulePermissionMap = {
  [M in EventModule]?: ModuleAction[]
}

export interface EventMemberRecord {
  id: string
  eventId: string
  userId: string | null
  email: string
  name: string
  role: EventRole
  status: EventMemberStatus
  permissions: ModulePermissionMap
  invitedBy: string | null
  inviteToken?: string | null
  inviteExpiresAt?: string | null
  acceptedAt?: string | null
  revokedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface EventAuditLogEntry {
  id: string
  eventId: string
  actorUserId: string | null
  actorName: string
  actorRole: EventRole | "anonymous"
  action: string
  targetType?: string
  targetId?: string
  allowed: boolean
  reason?: string
  details?: Record<string, any>
  createdAt: string
}

export const EVENT_ROLE_LABELS: Record<EventRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  collaborator: "Colaborador",
  viewer: "Visualizador",
  external_host: "Anfitrião / Contratante Externo",
}

export const EVENT_MODULE_LABELS: Record<EventModule, string> = {
  event: "Dados Gerais do Evento",
  guests: "Lista de Convidados e Presença",
  requests: "Solicitações e Acompanhantes",
  financial: "Custos, Orçamento e Fornecedores",
  photos: "Galeria de Fotos",
  analytics: "Painel de Análises",
  reports: "Exportação de Relatórios (PDF/CSV)",
  team: "Equipe e Permissões",
}

export const ALL_EVENT_MODULES: EventModule[] = [
  "event",
  "guests",
  "requests",
  "financial",
  "photos",
  "analytics",
  "reports",
  "team",
]

const ROLE_HIERARCHY_WEIGHT: Record<EventRole, number> = {
  owner: 100,
  admin: 80,
  collaborator: 50,
  viewer: 20,
  external_host: 10,
}

/**
 * Retorna a matriz de permissões padrão para cada papel inicial.
 */
export function getDefaultPermissionsForRole(role: EventRole): ModulePermissionMap {
  switch (role) {
    case "owner":
      return {
        event: ["view", "create", "edit", "delete", "delete_event", "transfer_ownership"],
        guests: ["view", "create", "edit", "delete", "approve", "export"],
        requests: ["view", "approve", "delete"],
        financial: ["view", "create", "edit", "delete", "export"],
        photos: ["view", "create", "edit", "delete"],
        analytics: ["view", "export"],
        reports: ["view", "export"],
        team: ["view", "create", "edit", "delete", "manage_permissions", "transfer_ownership"],
      }

    case "admin":
      return {
        event: ["view", "edit"],
        guests: ["view", "create", "edit", "delete", "approve", "export"],
        requests: ["view", "approve", "delete"],
        financial: ["view", "create", "edit", "delete", "export"],
        photos: ["view", "create", "edit", "delete"],
        analytics: ["view", "export"],
        reports: ["view", "export"],
        team: ["view", "create", "edit", "delete"],
      }

    case "collaborator":
      return {
        event: ["view"],
        guests: ["view", "create", "edit"],
        requests: ["view"],
        financial: [],
        photos: ["view", "create"],
        analytics: ["view"],
        reports: ["view"],
        team: ["view"],
      }

    case "viewer":
      return {
        event: ["view"],
        guests: ["view"],
        requests: ["view"],
        financial: ["view"],
        photos: ["view"],
        analytics: ["view"],
        reports: ["view"],
        team: ["view"],
      }

    case "external_host":
      return {
        event: ["view"],
        analytics: ["view"],
        guests: ["view"],
        financial: ["view"],
      }
  }
}

/**
 * Presets especializados para colaboradores profissionais (ex: Financeiro, Recepção/RSVP, Mídia).
 */
export function getCollaboratorPresetPermissions(
  preset: "financial" | "guests_rsvp" | "media_photos" | "full_operational"
): ModulePermissionMap {
  switch (preset) {
    case "financial":
      return {
        event: ["view"],
        guests: ["view"],
        requests: [],
        financial: ["view", "create", "edit", "delete", "export"],
        photos: ["view"],
        analytics: ["view"],
        reports: ["view", "export"],
        team: ["view"],
      }
    case "guests_rsvp":
      return {
        event: ["view"],
        guests: ["view", "create", "edit", "delete", "approve", "export"],
        requests: ["view", "approve", "delete"],
        financial: [],
        photos: ["view"],
        analytics: ["view"],
        reports: ["view"],
        team: ["view"],
      }
    case "media_photos":
      return {
        event: ["view"],
        guests: [],
        requests: [],
        financial: [],
        photos: ["view", "create", "edit", "delete"],
        analytics: [],
        reports: [],
        team: ["view"],
      }
    case "full_operational":
      return {
        event: ["view", "edit"],
        guests: ["view", "create", "edit", "approve"],
        requests: ["view", "approve"],
        financial: ["view", "create", "edit"],
        photos: ["view", "create", "edit"],
        analytics: ["view"],
        reports: ["view", "export"],
        team: ["view"],
      }
  }
}

/**
 * Sanitiza um mapa de permissões de acordo com os limites intransponíveis do papel (RN-002).
 * - Visualizador só pode ter ação 'view'.
 * - Anfitrião externo só pode ter 'view' nos módulos de indicadores.
 * - Colaborador nunca pode ter 'delete_event', 'transfer_ownership' ou 'manage_permissions'.
 * - Administrador nunca pode ter 'delete_event' ou 'transfer_ownership'.
 */
export function sanitizePermissionsForRole(
  role: EventRole,
  customPermissions?: ModulePermissionMap
): ModulePermissionMap {
  if (role === "owner") {
    return getDefaultPermissionsForRole("owner")
  }

  const base = customPermissions
    ? { ...customPermissions }
    : getDefaultPermissionsForRole(role)

  const sanitized: ModulePermissionMap = {}

  for (const mod of ALL_EVENT_MODULES) {
    const rawActions = Array.isArray(base[mod]) ? base[mod]! : []
    const uniqueActions = Array.from(new Set(rawActions))

    if (role === "external_host") {
      if (["event", "analytics", "guests", "financial"].includes(mod)) {
        sanitized[mod] = uniqueActions.filter((a) => a === "view")
      } else {
        sanitized[mod] = []
      }
      continue
    }

    if (role === "viewer") {
      sanitized[mod] = uniqueActions.filter((a) => a === "view")
      continue
    }

    if (role === "collaborator") {
      sanitized[mod] = uniqueActions.filter(
        (a) =>
          a !== "delete_event" &&
          a !== "transfer_ownership" &&
          a !== "manage_permissions" &&
          !(mod === "team" && a !== "view")
      )
      continue
    }

    if (role === "admin") {
      sanitized[mod] = uniqueActions.filter(
        (a) => a !== "delete_event" && a !== "transfer_ownership"
      )
      continue
    }
  }

  return sanitized
}

/**
 * Verifica se um membro do evento possui permissão para executar uma ação em determinado módulo.
 */
export function evaluateEventPermission(params: {
  eventOwnerId: string
  actorUserId?: string | null
  members?: EventMemberRecord[]
  hostViewTokenProvided?: string | null
  eventHostViewToken?: string | null
  eventHostViewEnabled?: boolean
  module: EventModule
  action: ModuleAction
}): {
  allowed: boolean
  role: EventRole | null
  reason: string
} {
  const {
    eventOwnerId,
    actorUserId,
    members = [],
    hostViewTokenProvided,
    eventHostViewToken,
    eventHostViewEnabled,
    module,
    action,
  } = params

  // 1. Verifica acesso por link externo tokenizado do anfitrião (RF-038 / RN-002)
  if (!actorUserId && hostViewTokenProvided) {
    const isTokenValid =
      Boolean(eventHostViewEnabled) &&
      Boolean(eventHostViewToken) &&
      hostViewTokenProvided.trim() === eventHostViewToken?.trim()

    if (!isTokenValid) {
      return {
        allowed: false,
        role: null,
        reason: "Token de acesso externo do anfitrião inválido ou desabilitado.",
      }
    }

    const hostPerms = getDefaultPermissionsForRole("external_host")
    const allowedActions = hostPerms[module] || []
    if (action === "view" && allowedActions.includes("view")) {
      return {
        allowed: true,
        role: "external_host",
        reason: "Visualização somente-leitura autorizada via token do anfitrião.",
      }
    }

    return {
      allowed: false,
      role: "external_host",
      reason: "O portal do anfitrião externo é estritamente somente-leitura e não permite alterações.",
    }
  }

  if (!actorUserId) {
    return {
      allowed: false,
      role: null,
      reason: "Usuário não autenticado.",
    }
  }

  // 2. Verifica se o usuário é o proprietário titular do evento (compatível com eventos legados sem registro em event_members)
  const memberRecord = members.find(
    (m) => m.userId === actorUserId
  )

  if (memberRecord) {
    if (memberRecord.status === "revoked") {
      return {
        allowed: false,
        role: memberRecord.role,
        reason: "O acesso deste membro ao evento foi revogado pelo proprietário.",
      }
    }

    if (memberRecord.status === "expired" || isInviteExpired(memberRecord.inviteExpiresAt)) {
      return {
        allowed: false,
        role: memberRecord.role,
        reason: "O convite de acesso a este evento expirou.",
      }
    }

    if (memberRecord.status === "pending") {
      return {
        allowed: false,
        role: memberRecord.role,
        reason: "O convite para a equipe ainda está pendente de aceitação.",
      }
    }

    if (memberRecord.status !== "active") {
      return {
        allowed: false,
        role: memberRecord.role,
        reason: `Status de membro inativo: ${memberRecord.status}.`,
      }
    }

    if (memberRecord.role === "owner") {
      return {
        allowed: true,
        role: "owner",
        reason: "Proprietário possui controle integral sobre o evento.",
      }
    }

    // Bloqueios absolutos de segurança da RN-002
    if (action === "delete_event" || action === "transfer_ownership") {
      return {
        allowed: false,
        role: memberRecord.role,
        reason: "Somente o proprietário do evento pode excluir o evento ou transferir sua titularidade.",
      }
    }

    const effectivePerms = sanitizePermissionsForRole(
      memberRecord.role,
      memberRecord.permissions
    )
    const moduleActions = effectivePerms[module] || []

    if (moduleActions.includes(action)) {
      return {
        allowed: true,
        role: memberRecord.role,
        reason: `Ação '${action}' no módulo '${module}' autorizada para o papel '${memberRecord.role}'.`,
      }
    }

    return {
      allowed: false,
      role: memberRecord.role,
      reason: `O papel '${EVENT_ROLE_LABELS[memberRecord.role]}' não possui a permissão '${action}' no módulo '${EVENT_MODULE_LABELS[module]}'.`,
    }
  }

  // Fallback de compatibilidade para eventos antigos onde o criador consta em event.user_id / eventOwnerId
  if (actorUserId === eventOwnerId) {
    return {
      allowed: true,
      role: "owner",
      reason: "Proprietário titular do evento (compatibilidade de registro existente).",
    }
  }

  return {
    allowed: false,
    role: null,
    reason: "Acesso negado: o usuário não pertence à equipe deste evento.",
  }
}

export function isInviteExpired(inviteExpiresAt?: string | null, now = new Date()): boolean {
  if (!inviteExpiresAt) return false
  const exp = new Date(inviteExpiresAt)
  if (Number.isNaN(exp.getTime())) return false
  return exp.getTime() < now.getTime()
}

/**
 * RN-002: Verifica se um ator pode atribuir ou modificar o papel/permissões de outro membro.
 * Regra estrita:
 * - Ninguém pode alterar suas próprias permissões (prevenção de auto-elevação de privilégio).
 * - Ninguém pode remover ou rebaixar o Proprietário ('owner').
 * - Nenhum membro pode conceder um papel ou permissão superior às suas próprias atribuições.
 */
export function canActorModifyMemberPermissions(params: {
  actorMember: EventMemberRecord
  targetMember?: EventMemberRecord | null
  proposedRole: EventRole
  proposedPermissions?: ModulePermissionMap
}): {
  allowed: boolean
  reason: string
} {
  const { actorMember, targetMember, proposedRole, proposedPermissions } = params

  if (actorMember.status !== "active") {
    return { allowed: false, reason: "Membro autor não está ativo no evento." }
  }

  if (targetMember && actorMember.userId && targetMember.userId === actorMember.userId) {
    return {
      allowed: false,
      reason: "Violação de segurança: nenhum membro pode alterar ou elevar suas próprias permissões.",
    }
  }

  if (targetMember && targetMember.role === "owner") {
    return {
      allowed: false,
      reason: "O proprietário do evento não pode ser removido ou ter seu papel alterado sem transferência formal de titularidade.",
    }
  }

  if (proposedRole === "owner") {
    return {
      allowed: false,
      reason: "O papel de Proprietário só pode ser atribuído por meio da operação formal de Transferência de Titularidade.",
    }
  }

  if (actorMember.role === "owner") {
    return { allowed: true, reason: "Proprietário autorizado a gerenciar papéis e permissões." }
  }

  if (actorMember.role !== "admin") {
    return {
      allowed: false,
      reason: "Apenas o Proprietário ou Administradores autorizados podem gerenciar membros da equipe.",
    }
  }

  const actorPerms = sanitizePermissionsForRole(actorMember.role, actorMember.permissions)
  const actorTeamPerms = actorPerms.team || []
  if (!actorTeamPerms.includes("create") && !actorTeamPerms.includes("edit") && !actorTeamPerms.includes("manage_permissions")) {
    return {
      allowed: false,
      reason: "Este administrador não possui permissão para gerenciar a equipe do evento.",
    }
  }

  // Impede que um administrador crie/edite outro administrador ou conceda papel >= ao seu
  if (ROLE_HIERARCHY_WEIGHT[proposedRole] >= ROLE_HIERARCHY_WEIGHT[actorMember.role]) {
    return {
      allowed: false,
      reason: "Nenhum membro pode atribuir um papel igual ou superior ao seu próprio nível hierárquico.",
    }
  }

  if (targetMember && ROLE_HIERARCHY_WEIGHT[targetMember.role] >= ROLE_HIERARCHY_WEIGHT[actorMember.role]) {
    return {
      allowed: false,
      reason: "Um administrador não pode modificar ou remover outro administrador ou proprietário.",
    }
  }

  // Verifica se todas as permissões propostas estão contidas nas permissões do próprio ator
  if (proposedPermissions) {
    for (const mod of ALL_EVENT_MODULES) {
      const requested = proposedPermissions[mod] || []
      const owned = actorPerms[mod] || []
      for (const act of requested) {
        if (!owned.includes(act)) {
          return {
            allowed: false,
            reason: `Não é permitido conceder a permissão '${act}' no módulo '${mod}' pois o próprio autor não a possui.`,
          }
        }
      }
    }
  }

  return {
    allowed: true,
    reason: "Gerenciamento de colaborador autorizado dentro dos limites de hierarquia.",
  }
}

/**
 * Cria o registro inicial do proprietário ao criar ou migrar um evento.
 */
export function createOwnerMemberRecord(params: {
  eventId: string
  ownerUserId: string
  ownerEmail: string
  ownerName: string
}): EventMemberRecord {
  const now = new Date().toISOString()
  return {
    id: `mbr-owner-${params.eventId}`,
    eventId: params.eventId,
    userId: params.ownerUserId,
    email: params.ownerEmail.trim().toLowerCase(),
    name: params.ownerName.trim() || "Proprietário",
    role: "owner",
    status: "active",
    permissions: getDefaultPermissionsForRole("owner"),
    invitedBy: params.ownerUserId,
    inviteToken: null,
    inviteExpiresAt: null,
    acceptedAt: now,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Convidar um novo membro para a equipe do evento, tratando duplicidade e validade.
 */
export function inviteEventTeamMember(params: {
  eventId: string
  actorMember: EventMemberRecord
  existingMembers: EventMemberRecord[]
  email: string
  name: string
  role: EventRole
  permissions?: ModulePermissionMap
  expiresInDays?: number
  targetUserId?: string | null
}): {
  success: boolean
  error?: string
  member?: EventMemberRecord
  updatedMembers: EventMemberRecord[]
  auditLog: EventAuditLogEntry
} {
  const now = new Date()
  const nowIso = now.toISOString()
  const normalizedEmail = String(params.email || "").trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return {
      success: false,
      error: "E-mail do membro convidado é inválido.",
      updatedMembers: params.existingMembers,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "team.invite_rejected_invalid_email",
        allowed: false,
        reason: "E-mail inválido",
      }),
    }
  }

  // Verifica duplicidade ativa ou pendente no mesmo evento
  const duplicate = params.existingMembers.find(
    (m) =>
      m.eventId === params.eventId &&
      m.email.toLowerCase() === normalizedEmail &&
      (m.status === "active" || m.status === "pending")
  )

  if (duplicate) {
    return {
      success: false,
      error: "Já existe um membro ativo ou convite pendente para este e-mail neste evento.",
      updatedMembers: params.existingMembers,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "team.invite_duplicate_blocked",
        targetId: duplicate.id,
        allowed: false,
        reason: "Convite ou vínculo duplicado no mesmo evento.",
      }),
    }
  }

  const hierarchyCheck = canActorModifyMemberPermissions({
    actorMember: params.actorMember,
    proposedRole: params.role,
    proposedPermissions: params.permissions,
  })

  if (!hierarchyCheck.allowed) {
    return {
      success: false,
      error: hierarchyCheck.reason,
      updatedMembers: params.existingMembers,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "security.privilege_escalation_blocked",
        allowed: false,
        reason: hierarchyCheck.reason,
      }),
    }
  }

  const expDays = params.expiresInDays ?? 7
  const expiresAt = new Date(now.getTime() + expDays * 86400000).toISOString()
  const sanitizedPerms = sanitizePermissionsForRole(params.role, params.permissions)

  const newMember: EventMemberRecord = {
    id: `mbr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventId: params.eventId,
    userId: params.targetUserId ?? null,
    email: normalizedEmail,
    name: params.name.trim() || normalizedEmail.split("@")[0] || "Colaborador",
    role: params.role,
    status: "pending",
    permissions: sanitizedPerms,
    invitedBy: params.actorMember.userId,
    inviteToken: generateSecureToken(16),
    inviteExpiresAt: expiresAt,
    acceptedAt: null,
    revokedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const filtered = params.existingMembers.filter(
    (m) => !(m.eventId === params.eventId && m.email.toLowerCase() === normalizedEmail)
  )

  return {
    success: true,
    member: newMember,
    updatedMembers: [...filtered, newMember],
    auditLog: createAuditEntry({
      eventId: params.eventId,
      actor: params.actorMember,
      action: "team.member_invited",
      targetType: "event_member",
      targetId: newMember.id,
      allowed: true,
      details: { email: normalizedEmail, role: params.role, expiresAt },
    }),
  }
}

/**
 * Aceita um convite pendente para integrar a equipe do evento.
 */
export function acceptEventTeamInvite(params: {
  inviteToken: string
  acceptingUserId: string
  acceptingEmail?: string
  members: EventMemberRecord[]
  now?: Date
}): {
  success: boolean
  error?: string
  member?: EventMemberRecord
  updatedMembers: EventMemberRecord[]
  auditLog?: EventAuditLogEntry
} {
  const currentNow = params.now || new Date()
  const target = params.members.find((m) => m.inviteToken === params.inviteToken)

  if (!target) {
    return {
      success: false,
      error: "Convite de equipe não encontrado ou token inválido.",
      updatedMembers: params.members,
    }
  }

  if (target.status === "revoked") {
    return {
      success: false,
      error: "Este convite foi revogado pelo organizador.",
      updatedMembers: params.members,
    }
  }

  if (target.status === "active") {
    return {
      success: false,
      error: "Este convite já foi utilizado anteriormente.",
      updatedMembers: params.members,
    }
  }

  if (isInviteExpired(target.inviteExpiresAt, currentNow)) {
    const expiredMembers = params.members.map((m) =>
      m.id === target.id ? { ...m, status: "expired" as const, updatedAt: currentNow.toISOString() } : m
    )
    return {
      success: false,
      error: "Este convite expirou e não pode mais ser aceito.",
      updatedMembers: expiredMembers,
    }
  }

  if (params.acceptingEmail && params.acceptingEmail.trim().toLowerCase() !== target.email.toLowerCase()) {
    return {
      success: false,
      error: "O convite pertence a outro endereço de e-mail.",
      updatedMembers: params.members,
    }
  }

  const acceptedMember: EventMemberRecord = {
    ...target,
    userId: params.acceptingUserId,
    status: "active",
    acceptedAt: currentNow.toISOString(),
    updatedAt: currentNow.toISOString(),
  }

  const updatedMembers = params.members.map((m) => (m.id === target.id ? acceptedMember : m))

  return {
    success: true,
    member: acceptedMember,
    updatedMembers,
    auditLog: {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventId: target.eventId,
      actorUserId: params.acceptingUserId,
      actorName: target.name,
      actorRole: target.role,
      action: "team.invite_accepted",
      targetType: "event_member",
      targetId: target.id,
      allowed: true,
      details: { email: target.email, role: target.role },
      createdAt: currentNow.toISOString(),
    },
  }
}

/**
 * Revoga o acesso de um colaborador ou cancela um convite pendente.
 */
export function revokeEventTeamMember(params: {
  eventId: string
  actorMember: EventMemberRecord
  targetMemberId: string
  members: EventMemberRecord[]
}): {
  success: boolean
  error?: string
  updatedMembers: EventMemberRecord[]
  auditLog: EventAuditLogEntry
} {
  const target = params.members.find((m) => m.id === params.targetMemberId && m.eventId === params.eventId)
  if (!target) {
    return {
      success: false,
      error: "Membro não encontrado neste evento.",
      updatedMembers: params.members,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "team.revoke_failed",
        allowed: false,
        reason: "Membro não encontrado",
      }),
    }
  }

  const check = canActorModifyMemberPermissions({
    actorMember: params.actorMember,
    targetMember: target,
    proposedRole: "viewer",
  })

  if (!check.allowed) {
    return {
      success: false,
      error: check.reason,
      updatedMembers: params.members,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "security.revoke_blocked",
        targetId: target.id,
        allowed: false,
        reason: check.reason,
      }),
    }
  }

  const nowIso = new Date().toISOString()
  const updatedMembers = params.members.map((m) =>
    m.id === target.id
      ? {
          ...m,
          status: "revoked" as const,
          revokedAt: nowIso,
          updatedAt: nowIso,
        }
      : m
  )

  return {
    success: true,
    updatedMembers,
    auditLog: createAuditEntry({
      eventId: params.eventId,
      actor: params.actorMember,
      action: "team.member_revoked",
      targetType: "event_member",
      targetId: target.id,
      allowed: true,
      details: { revokedEmail: target.email, previousRole: target.role },
    }),
  }
}

/**
 * Transfere de forma atômica/transacional a titularidade do evento para outro membro ativo.
 * Garante que continue existindo exatamente 1 proprietário ('owner') no evento,
 * convertendo o proprietário anterior em Administrador ('admin').
 */
export function transferEventOwnership(params: {
  eventId: string
  actorMember: EventMemberRecord
  newOwnerMemberId: string
  members: EventMemberRecord[]
}): {
  success: boolean
  error?: string
  newOwnerUserId?: string
  updatedMembers: EventMemberRecord[]
  auditLog: EventAuditLogEntry
} {
  if (params.actorMember.role !== "owner" || params.actorMember.status !== "active") {
    return {
      success: false,
      error: "Somente o proprietário atual do evento pode transferir sua titularidade.",
      updatedMembers: params.members,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "security.ownership_transfer_denied",
        allowed: false,
        reason: "Tentativa de transferência de titularidade por não-proprietário.",
      }),
    }
  }

  const target = params.members.find((m) => m.id === params.newOwnerMemberId && m.eventId === params.eventId)
  if (!target) {
    return {
      success: false,
      error: "Membro destinatário não encontrado neste evento.",
      updatedMembers: params.members,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "team.ownership_transfer_failed",
        allowed: false,
        reason: "Destinatário inexistente.",
      }),
    }
  }

  if (target.status !== "active" || !target.userId) {
    return {
      success: false,
      error: "A titularidade só pode ser transferida para um membro ativo que já tenha aceitado o convite.",
      updatedMembers: params.members,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "team.ownership_transfer_failed",
        targetId: target.id,
        allowed: false,
        reason: "Destinatário não está ativo.",
      }),
    }
  }

  if (target.id === params.actorMember.id) {
    return {
      success: false,
      error: "O usuário informado já é o proprietário atual do evento.",
      updatedMembers: params.members,
      auditLog: createAuditEntry({
        eventId: params.eventId,
        actor: params.actorMember,
        action: "team.ownership_transfer_noop",
        allowed: false,
        reason: "Mesmo proprietário.",
      }),
    }
  }

  const nowIso = new Date().toISOString()

  const updatedMembers = params.members.map((m) => {
    if (m.eventId !== params.eventId) return m
    if (m.id === params.actorMember.id) {
      return {
        ...m,
        role: "admin" as const,
        permissions: getDefaultPermissionsForRole("admin"),
        updatedAt: nowIso,
      }
    }
    if (m.id === target.id) {
      return {
        ...m,
        role: "owner" as const,
        permissions: getDefaultPermissionsForRole("owner"),
        updatedAt: nowIso,
      }
    }
    return m
  })

  return {
    success: true,
    newOwnerUserId: target.userId,
    updatedMembers,
    auditLog: createAuditEntry({
      eventId: params.eventId,
      actor: params.actorMember,
      action: "team.ownership_transferred",
      targetType: "event_member",
      targetId: target.id,
      allowed: true,
      details: {
        previousOwnerId: params.actorMember.userId,
        newOwnerId: target.userId,
        newOwnerEmail: target.email,
      },
    }),
  }
}

export function createAuditEntry(params: {
  eventId: string
  actor: EventMemberRecord | { userId?: string | null; name?: string; role?: EventRole | "anonymous" }
  action: string
  targetType?: string
  targetId?: string
  allowed: boolean
  reason?: string
  details?: Record<string, any>
}): EventAuditLogEntry {
  return {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventId: params.eventId,
    actorUserId: params.actor.userId ?? null,
    actorName: params.actor.name || "Usuário",
    actorRole: params.actor.role || "anonymous",
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    allowed: params.allowed,
    reason: params.reason,
    details: params.details,
    createdAt: new Date().toISOString(),
  }
}

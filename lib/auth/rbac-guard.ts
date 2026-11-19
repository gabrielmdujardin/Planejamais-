import {
  createOwnerMemberRecord,
  evaluateEventPermission,
  type EventMemberRecord,
  type EventModule,
  type EventRole,
  type ModuleAction,
  type ModulePermissionMap,
} from "../domain/rbac.ts"

export function mapDbMemberRow(row: any): EventMemberRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id || null,
    email: row.email || "",
    name: row.name || row.email?.split("@")[0] || "Membro",
    role: (row.role || "collaborator") as EventRole,
    status: row.status || "pending",
    permissions: (typeof row.permissions === "object" && row.permissions !== null
      ? row.permissions
      : {}) as ModulePermissionMap,
    invitedBy: row.invited_by || null,
    inviteToken: row.invite_token || null,
    inviteExpiresAt: row.invite_expires_at || null,
    acceptedAt: row.accepted_at || null,
    revokedAt: row.revoked_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

/**
 * Verifica no backend e no PostgreSQL se o usuário autenticado possui permissão
 * para executar `action` no `module` do evento `eventId` (RN-002).
 */
export async function checkBackendEventPermission(params: {
  db: any
  eventId: string
  userId: string
  module: EventModule
  action: ModuleAction
}): Promise<{
  allowed: boolean
  reason: string
  role: EventRole | "none"
  event: any | null
  members: EventMemberRecord[]
}> {
  const { db, eventId, userId, module, action } = params

  const { data: event, error } = await db
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle()

  if (error || !event) {
    return {
      allowed: false,
      reason: "Evento não encontrado.",
      role: "none",
      event: null,
      members: [],
    }
  }

  const { data: rawMembers } = await db
    .from("event_members")
    .select("*")
    .eq("event_id", eventId)

  let members: EventMemberRecord[] = (rawMembers || []).map(mapDbMemberRow)
  if (!members.some((m) => m.role === "owner" && m.status === "active")) {
    members = [
      createOwnerMemberRecord({
        eventId,
        ownerUserId: event.user_id,
        ownerEmail: "owner@planeja.local",
        ownerName: "Proprietário",
      }),
      ...members,
    ]
  }

  const decision = evaluateEventPermission({
    eventOwnerId: event.user_id,
    actorUserId: userId,
    members,
    module,
    action,
  })

  return {
    allowed: decision.allowed,
    reason: decision.reason,
    role: decision.role || "none",
    event,
    members,
  }
}

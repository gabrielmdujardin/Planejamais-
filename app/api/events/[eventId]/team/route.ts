import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseEnvConfigured } from "@/lib/security/route-guard"
import {
  acceptEventTeamInvite,
  canActorModifyMemberPermissions,
  createAuditEntry,
  createOwnerMemberRecord,
  evaluateEventPermission,
  EVENT_ROLE_LABELS,
  inviteEventTeamMember,
  revokeEventTeamMember,
  sanitizePermissionsForRole,
  transferEventOwnership,
  type EventAuditLogEntry,
  type EventMemberRecord,
  type EventRole,
  type ModulePermissionMap,
} from "@/lib/domain/rbac"
import {
  teamInviteSchema,
  teamTransferOwnershipSchema,
  teamUpdateRoleSchema,
} from "@/lib/validation"
import { validateNominalEventDeletion } from "@/lib/domain/business-rules"
import { EmailService } from "@/src/services/email.service"

function mapDbMember(row: any): EventMemberRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id || null,
    email: row.email,
    name: row.name || row.email?.split("@")[0] || "Colaborador",
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

function mapDbAuditLog(row: any): EventAuditLogEntry {
  return {
    id: row.id,
    eventId: row.event_id,
    actorUserId: row.actor_user_id || null,
    actorName: row.actor_name || "Sistema",
    actorRole: row.actor_role || "anonymous",
    action: row.action,
    targetType: row.target_type || undefined,
    targetId: row.target_id || undefined,
    allowed: Boolean(row.allowed ?? true),
    reason: row.reason || undefined,
    details: typeof row.details === "object" && row.details !== null ? row.details : {},
    createdAt: row.created_at || new Date().toISOString(),
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params

  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json({ members: [], auditLogs: [], mode: "local" }, { status: 200 })
  }

  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const { data: event } = await db
    .from("events")
    .select("id, user_id, title")
    .eq("id", eventId)
    .maybeSingle()

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 })
  }

  const { data: rawMembers } = await db
    .from("event_members")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })

  let members = (rawMembers || []).map(mapDbMember)
  if (!members.some((m: EventMemberRecord) => m.role === "owner" && m.status === "active")) {
    members = [
      createOwnerMemberRecord({
        eventId,
        ownerUserId: event.user_id,
        ownerEmail: user.id === event.user_id ? user.email || "owner@planeja.app" : "owner@planeja.app",
        ownerName: user.id === event.user_id ? user.user_metadata?.name || "Proprietário" : "Proprietário",
      }),
      ...members,
    ]
  }

  const access = evaluateEventPermission({
    eventOwnerId: event.user_id,
    actorUserId: user.id,
    members,
    module: "team",
    action: "view",
  })

  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 403 })
  }

  const { data: rawLogs } = await db
    .from("event_audit_logs")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(100)

  return NextResponse.json({
    members,
    auditLogs: (rawLogs || []).map(mapDbAuditLog),
    currentUserRole: access.role,
  })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
  }

  const actionType = body.operation || "invite"

  // Modo de validação direta com estado fornecido ou persistência PostgreSQL
  if (body.actorMember && Array.isArray(body.existingMembers)) {
    const actorMember = body.actorMember as EventMemberRecord
    const existingMembers = body.existingMembers as EventMemberRecord[]

    if (actionType === "invite") {
      const parsed = teamInviteSchema.safeParse({ ...body, eventId })
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Dados de convite inválidos." },
          { status: 400 }
        )
      }

      const result = inviteEventTeamMember({
        eventId,
        actorMember,
        existingMembers,
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role,
        permissions: parsed.data.permissions as ModulePermissionMap | undefined,
        expiresInDays: parsed.data.expiresInDays,
        targetUserId: body.targetUserId ?? null,
      })

      return NextResponse.json(result, { status: result.success ? 201 : 403 })
    }

    if (actionType === "accept_invite") {
      const result = acceptEventTeamInvite({
        inviteToken: String(body.inviteToken || ""),
        acceptingUserId: String(body.acceptingUserId || ""),
        acceptingEmail: body.acceptingEmail ? String(body.acceptingEmail) : undefined,
        members: existingMembers,
      })
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }

    if (actionType === "transfer_ownership") {
      const parsed = teamTransferOwnershipSchema.safeParse({ ...body, eventId })
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Dados inválidos." },
          { status: 400 }
        )
      }
      if (body.eventTitle && !validateNominalEventDeletion(body.eventTitle, parsed.data.confirmationTitle)) {
        return NextResponse.json(
          { error: "Confirmação nominal do título do evento não confere." },
          { status: 400 }
        )
      }
      const result = transferEventOwnership({
        eventId,
        actorMember,
        newOwnerMemberId: parsed.data.newOwnerMemberId,
        members: existingMembers,
      })
      return NextResponse.json(result, { status: result.success ? 200 : 403 })
    }
  }

  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const parsed = teamInviteSchema.safeParse({ ...body, eventId })
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados de convite inválidos." },
      { status: 400 }
    )
  }

  const { data: event } = await db
    .from("events")
    .select("id, user_id, title")
    .eq("id", eventId)
    .maybeSingle()

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 })
  }

  const { data: rawMembers } = await db
    .from("event_members")
    .select("*")
    .eq("event_id", eventId)

  const existingMembers = (rawMembers || []).map(mapDbMember)
  const actorMember =
    existingMembers.find((m: EventMemberRecord) => m.userId === user.id) ||
    (event.user_id === user.id
      ? createOwnerMemberRecord({
          eventId,
          ownerUserId: user.id,
          ownerEmail: user.email || "owner@planeja.app",
          ownerName: user.user_metadata?.name || "Proprietário",
        })
      : null)

  if (!actorMember) {
    return NextResponse.json({ error: "Acesso negado ao evento." }, { status: 403 })
  }

  const inviteResult = inviteEventTeamMember({
    eventId,
    actorMember,
    existingMembers,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    permissions: parsed.data.permissions as ModulePermissionMap | undefined,
    expiresInDays: parsed.data.expiresInDays,
  })

  if (!inviteResult.success || !inviteResult.member) {
    return NextResponse.json({ error: inviteResult.error }, { status: 403 })
  }

  const m = inviteResult.member
  await db.from("event_members").delete().eq("event_id", eventId).eq("email", m.email)

  const { data: inserted, error: insertError } = await db
    .from("event_members")
    .insert({
      id: m.id,
      event_id: eventId,
      user_id: m.userId,
      email: m.email,
      name: m.name,
      role: m.role,
      status: m.status,
      permissions: m.permissions,
      invited_by: user.id,
      invite_token: m.inviteToken,
      invite_expires_at: m.inviteExpiresAt,
    })
    .select("*")
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message || "Erro ao registrar membro" }, { status: 500 })
  }

  await db.from("event_audit_logs").insert({
    event_id: eventId,
    actor_user_id: user.id,
    actor_name: actorMember.name,
    actor_role: actorMember.role,
    action: inviteResult.auditLog.action,
    target_type: "event_member",
    target_id: inserted.id,
    allowed: true,
    details: inviteResult.auditLog.details || {},
  })

  if (m.inviteToken) {
    await EmailService.sendTeamInvitationEmail({
      to: m.email,
      inviteeName: m.name,
      inviterName: actorMember.name,
      eventTitle: event.title,
      eventId,
      roleLabel: EVENT_ROLE_LABELS[m.role] || m.role,
      inviteToken: m.inviteToken,
      expiresAt: m.inviteExpiresAt
        ? new Date(m.inviteExpiresAt).toLocaleDateString("pt-BR")
        : "7 dias",
    }).catch(() => {})
  }

  return NextResponse.json(
    {
      success: true,
      member: mapDbMember(inserted),
      auditLog: inviteResult.auditLog,
    },
    { status: 201 }
  )
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
  }

  if (body.actorMember && Array.isArray(body.existingMembers)) {
    const parsed = teamUpdateRoleSchema.safeParse({ ...body, eventId })
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      )
    }

    const actorMember = body.actorMember as EventMemberRecord
    const existingMembers = body.existingMembers as EventMemberRecord[]
    const targetMember = existingMembers.find((m) => m.id === parsed.data.memberId)

    if (!targetMember) {
      return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 })
    }

    const check = canActorModifyMemberPermissions({
      actorMember,
      targetMember,
      proposedRole: parsed.data.role,
      proposedPermissions: parsed.data.permissions as ModulePermissionMap | undefined,
    })

    if (!check.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: check.reason,
          auditLog: createAuditEntry({
            eventId,
            actor: actorMember,
            action: "security.permission_change_blocked",
            targetId: targetMember.id,
            allowed: false,
            reason: check.reason,
          }),
        },
        { status: 403 }
      )
    }

    const sanitizedPerms = sanitizePermissionsForRole(
      parsed.data.role,
      parsed.data.permissions as ModulePermissionMap | undefined
    )

    const updatedMembers = existingMembers.map((m) =>
      m.id === targetMember.id
        ? {
            ...m,
            role: parsed.data.role,
            permissions: sanitizedPerms,
            updatedAt: new Date().toISOString(),
          }
        : m
    )

    return NextResponse.json({
      success: true,
      updatedMembers,
      auditLog: createAuditEntry({
        eventId,
        actor: actorMember,
        action: "team.permissions_updated",
        targetType: "event_member",
        targetId: targetMember.id,
        allowed: true,
        details: { role: parsed.data.role, email: targetMember.email },
      }),
    })
  }

  // Modo autenticado conectado diretamente ao PostgreSQL local (planeja_plus)
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const { data: event } = await db
    .from("events")
    .select("id, user_id, title")
    .eq("id", eventId)
    .maybeSingle()

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 })
  }

  const { data: rawMembers } = await db
    .from("event_members")
    .select("*")
    .eq("event_id", eventId)

  const existingMembers: EventMemberRecord[] = (rawMembers || []).map(mapDbMember)

  if (body.operation === "accept_invite") {
    const result = acceptEventTeamInvite({
      inviteToken: String(body.inviteToken || ""),
      acceptingUserId: user.id,
      acceptingEmail: user.email,
      members: existingMembers,
    })
    if (!result.success || !result.member) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    await db
      .from("event_members")
      .update({
        user_id: user.id,
        status: "active",
        accepted_at: result.member.acceptedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", result.member.id)

    await db.from("event_audit_logs").insert({
      event_id: eventId,
      actor_user_id: user.id,
      actor_name: user.user_metadata?.name || user.email,
      actor_role: result.member.role,
      action: result.auditLog?.action || "team.invite_accepted",
      target_type: "event_member",
      target_id: result.member.id,
      allowed: true,
      details: result.auditLog?.details || {},
    })

    return NextResponse.json(result, { status: 200 })
  }

  const actorMember =
    existingMembers.find((m) => m.userId === user.id && m.status === "active") ||
    (event.user_id === user.id
      ? createOwnerMemberRecord({
          eventId,
          ownerUserId: user.id,
          ownerEmail: user.email || "owner@planeja.app",
          ownerName: user.user_metadata?.name || "Proprietário",
        })
      : null)

  if (!actorMember) {
    return NextResponse.json({ error: "Acesso negado ao evento." }, { status: 403 })
  }

  if (body.operation === "transfer_ownership") {
    const parsedTransfer = teamTransferOwnershipSchema.safeParse({ ...body, eventId })
    if (!parsedTransfer.success) {
      return NextResponse.json(
        { error: parsedTransfer.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      )
    }

    if (!validateNominalEventDeletion(event.title, parsedTransfer.data.confirmationTitle)) {
      return NextResponse.json(
        { error: "Confirmação nominal do título do evento não confere." },
        { status: 400 }
      )
    }

    const result = transferEventOwnership({
      eventId,
      actorMember,
      newOwnerMemberId: parsedTransfer.data.newOwnerMemberId,
      members: existingMembers,
    })

    const newOwnerMember = result.updatedMembers.find(
      (m) => m.id === parsedTransfer.data.newOwnerMemberId
    )
    if (!result.success || !newOwnerMember) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    await db
      .from("event_members")
      .update({ role: "admin", updated_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("role", "owner")

    await db
      .from("event_members")
      .update({
        role: "owner",
        permissions: newOwnerMember.permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", newOwnerMember.id)

    if (newOwnerMember.userId) {
      await db
        .from("events")
        .update({ user_id: newOwnerMember.userId, updated_at: new Date().toISOString() })
        .eq("id", eventId)
    }

    await db.from("event_audit_logs").insert({
      event_id: eventId,
      actor_user_id: user.id,
      actor_name: actorMember.name,
      actor_role: "owner",
      action: result.auditLog.action,
      target_type: "event_member",
      target_id: newOwnerMember.id,
      allowed: true,
      details: result.auditLog.details || {},
    })

    return NextResponse.json(result, { status: 200 })
  }

  const parsed = teamUpdateRoleSchema.safeParse({ ...body, eventId })
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 }
    )
  }

  const targetMember = existingMembers.find((m) => m.id === parsed.data.memberId)
  if (!targetMember) {
    return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 })
  }

  const check = canActorModifyMemberPermissions({
    actorMember,
    targetMember,
    proposedRole: parsed.data.role,
    proposedPermissions: parsed.data.permissions as ModulePermissionMap | undefined,
  })

  if (!check.allowed) {
    return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
  }

  const sanitizedPerms = sanitizePermissionsForRole(
    parsed.data.role,
    parsed.data.permissions as ModulePermissionMap | undefined
  )

  await db
    .from("event_members")
    .update({
      role: parsed.data.role,
      permissions: sanitizedPerms,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetMember.id)
    .eq("event_id", eventId)

  const auditEntry = createAuditEntry({
    eventId,
    actor: actorMember,
    action: "team.permissions_updated",
    targetType: "event_member",
    targetId: targetMember.id,
    allowed: true,
    details: { role: parsed.data.role, email: targetMember.email },
  })

  await db.from("event_audit_logs").insert({
    event_id: eventId,
    actor_user_id: user.id,
    actor_name: actorMember.name,
    actor_role: actorMember.role,
    action: auditEntry.action,
    target_type: "event_member",
    target_id: targetMember.id,
    allowed: true,
    details: auditEntry.details || {},
  })

  return NextResponse.json({
    success: true,
    auditLog: auditEntry,
  })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params
  const body = await request.json().catch(() => null)

  if (body?.actorMember && Array.isArray(body?.existingMembers) && body?.targetMemberId) {
    const result = revokeEventTeamMember({
      eventId,
      actorMember: body.actorMember as EventMemberRecord,
      targetMemberId: String(body.targetMemberId),
      members: body.existingMembers as EventMemberRecord[],
    })
    return NextResponse.json(result, { status: result.success ? 200 : 403 })
  }

  const targetMemberId = body?.targetMemberId || request.nextUrl.searchParams.get("memberId")
  if (!targetMemberId) {
    return NextResponse.json({ error: "Parâmetros de revogação ausentes." }, { status: 400 })
  }

  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const { data: event } = await db
    .from("events")
    .select("id, user_id, title")
    .eq("id", eventId)
    .maybeSingle()

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 })
  }

  const { data: rawMembers } = await db
    .from("event_members")
    .select("*")
    .eq("event_id", eventId)

  const existingMembers: EventMemberRecord[] = (rawMembers || []).map(mapDbMember)
  const actorMember =
    existingMembers.find((m) => m.userId === user.id && m.status === "active") ||
    (event.user_id === user.id
      ? createOwnerMemberRecord({
          eventId,
          ownerUserId: user.id,
          ownerEmail: user.email || "owner@planeja.app",
          ownerName: user.user_metadata?.name || "Proprietário",
        })
      : null)

  if (!actorMember) {
    return NextResponse.json({ error: "Acesso negado ao evento." }, { status: 403 })
  }

  const result = revokeEventTeamMember({
    eventId,
    actorMember,
    targetMemberId: String(targetMemberId),
    members: existingMembers,
  })

  const revokedMember = result.updatedMembers.find((m) => m.id === String(targetMemberId))
  if (!result.success || !revokedMember) {
    return NextResponse.json({ error: result.error }, { status: 403 })
  }

  await db
    .from("event_members")
    .update({
      status: "revoked",
      revoked_at: revokedMember.revokedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", revokedMember.id)
    .eq("event_id", eventId)

  await db.from("event_audit_logs").insert({
    event_id: eventId,
    actor_user_id: user.id,
    actor_name: actorMember.name,
    actor_role: actorMember.role,
    action: result.auditLog.action,
    target_type: "event_member",
    target_id: revokedMember.id,
    allowed: true,
    details: result.auditLog.details || {},
  })

  return NextResponse.json(result, { status: 200 })
}

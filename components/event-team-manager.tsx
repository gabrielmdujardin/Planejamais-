"use client"

import React, { useMemo, useState } from "react"
import {
  ShieldCheck,
  UserPlus,
  Users,
  Crown,
  KeyRound,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  History,
  ArrowRightLeft,
  Lock,
  Check,
  Copy,
  Mail,
  Settings2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ALL_EVENT_MODULES,
  EVENT_MODULE_LABELS,
  EVENT_ROLE_LABELS,
  acceptEventTeamInvite,
  canActorModifyMemberPermissions,
  createAuditEntry,
  createOwnerMemberRecord,
  evaluateEventPermission,
  getCollaboratorPresetPermissions,
  getDefaultPermissionsForRole,
  inviteEventTeamMember,
  revokeEventTeamMember,
  sanitizePermissionsForRole,
  transferEventOwnership,
  type EventAuditLogEntry,
  type EventMemberRecord,
  type EventModule,
  type EventRole,
  type ModuleAction,
  type ModulePermissionMap,
} from "@/lib/domain/rbac"
import { validateNominalEventDeletion } from "@/lib/domain/business-rules"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useEventStore, type Event } from "@/stores/event-store"

interface EventTeamManagerProps {
  event: Event
}

const AVAILABLE_ACTIONS: { key: ModuleAction; label: string }[] = [
  { key: "view", label: "Ver" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
  { key: "approve", label: "Aprovar" },
  { key: "export", label: "Exportar" },
]

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  pending: {
    label: "Convite Pendente",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  revoked: {
    label: "Acesso Revogado",
    className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  },
  expired: {
    label: "Convite Expirado",
    className: "bg-muted text-muted-foreground border-border",
  },
  declined: {
    label: "Recusado",
    className: "bg-red-500/10 text-red-600 border-red-500/20",
  },
}

export default function EventTeamManager({ event }: EventTeamManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { setEventMembers, appendEventAuditLog } = useEventStore()

  // Garante que todo evento (inclusive eventos antigos) possua o registro do Proprietário
  const members: EventMemberRecord[] = useMemo(() => {
    const existing = Array.isArray(event.members) ? event.members : []
    if (existing.some((m) => m.role === "owner" && m.status === "active")) {
      return existing
    }
    const ownerRecord = createOwnerMemberRecord({
      eventId: event.id,
      ownerUserId: event.ownerId || user?.id || "owner-default",
      ownerEmail: user?.email || "organizador@planeja.app",
      ownerName: user?.name || "Organizador Titular",
    })
    return [ownerRecord, ...existing]
  }, [event.id, event.members, event.ownerId, user?.email, user?.id, user?.name])

  const auditLogs: EventAuditLogEntry[] = useMemo(() => {
    if (Array.isArray(event.auditLogs) && event.auditLogs.length > 0) {
      return event.auditLogs
    }
    return [
      {
        id: `aud-init-${event.id}`,
        eventId: event.id,
        actorUserId: event.ownerId || user?.id || "owner-default",
        actorName: user?.name || "Proprietário",
        actorRole: "owner",
        action: "event.rbac_initialized",
        allowed: true,
        reason: "Controle de acesso colaborativo (RN-002) ativo para este evento.",
        createdAt: event.createdAt || new Date().toISOString(),
      },
    ]
  }, [event.auditLogs, event.createdAt, event.id, event.ownerId, user?.id, user?.name])

  // Membro ativo operando a tela (por padrão o usuário logado ou proprietário)
  const [activeActorMemberId, setActiveActorMemberId] = useState<string>(() => {
    const loggedInMember = members.find((m) => m.userId && m.userId === user?.id && m.status === "active")
    const ownerMember = members.find((m) => m.role === "owner" && m.status === "active")
    return loggedInMember?.id || ownerMember?.id || members[0]?.id || ""
  })

  const actorMember = useMemo(() => {
    return (
      members.find((m) => m.id === activeActorMemberId) ||
      members.find((m) => m.role === "owner" && m.status === "active") ||
      members[0]
    )
  }, [activeActorMemberId, members])

  // Estados do formulário de convite por e-mail
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "collaborator" | "viewer">("collaborator")
  const [invitePreset, setInvitePreset] = useState<"financial" | "guests_rsvp" | "media_photos" | "full_operational">("financial")
  const [inviteExpireDays, setInviteExpireDays] = useState("7")

  // Estado de edição de permissões de um membro selecionado
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<"admin" | "collaborator" | "viewer">("collaborator")
  const [editingPermissions, setEditingPermissions] = useState<ModulePermissionMap>({})

  // Estado para transferência de titularidade
  const [transferTargetMemberId, setTransferTargetMemberId] = useState<string>("")
  const [transferConfirmationTitle, setTransferConfirmationTitle] = useState<string>("")

  const editingMember = useMemo(
    () => members.find((m) => m.id === editingMemberId) || null,
    [editingMemberId, members]
  )

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actorMember) return

    const initialPermissions =
      inviteRole === "collaborator"
        ? getCollaboratorPresetPermissions(invitePreset)
        : getDefaultPermissionsForRole(inviteRole)

    const result = inviteEventTeamMember({
      eventId: event.id,
      actorMember,
      existingMembers: members,
      email: inviteEmail,
      name: inviteName,
      role: inviteRole,
      permissions: initialPermissions,
      expiresInDays: Number(inviteExpireDays) || 7,
    })

    appendEventAuditLog(event.id, result.auditLog)

    if (!result.success) {
      toast({
        title: "Convite bloqueado pela política de acesso",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    setEventMembers(event.id, result.updatedMembers)
    setInviteName("")
    setInviteEmail("")
    toast({
      title: "Convite de equipe gerado",
      description: `${result.member?.name} (${result.member?.email}) foi convidado como ${EVENT_ROLE_LABELS[inviteRole]}.`,
    })
  }

  const handleAcceptPendingInvite = (member: EventMemberRecord) => {
    if (!member.inviteToken) return
    const result = acceptEventTeamInvite({
      inviteToken: member.inviteToken,
      acceptingUserId: member.userId || `usr-${member.id}`,
      acceptingEmail: member.email,
      members,
    })

    if (result.auditLog) {
      appendEventAuditLog(event.id, result.auditLog)
    }

    if (!result.success) {
      toast({
        title: "Não foi possível aceitar o convite",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    setEventMembers(event.id, result.updatedMembers)
    toast({
      title: "Convite aceito com sucesso",
      description: `${member.name} agora é um membro ativo da equipe (${EVENT_ROLE_LABELS[member.role]}).`,
    })
  }

  const handleOpenEditPermissions = (member: EventMemberRecord) => {
    setEditingMemberId(member.id)
    setEditingRole(member.role === "owner" ? "admin" : (member.role as "admin" | "collaborator" | "viewer"))
    setEditingPermissions(sanitizePermissionsForRole(member.role, member.permissions))
  }

  const handleToggleModuleAction = (mod: EventModule, act: ModuleAction) => {
    setEditingPermissions((prev) => {
      const current = prev[mod] || []
      const exists = current.includes(act)
      const next = exists ? current.filter((a) => a !== act) : [...current, act]
      return {
        ...prev,
        [mod]: next,
      }
    })
  }

  const handleSaveMemberPermissions = () => {
    if (!actorMember || !editingMember) return

    const check = canActorModifyMemberPermissions({
      actorMember,
      targetMember: editingMember,
      proposedRole: editingRole,
      proposedPermissions: editingPermissions,
    })

    if (!check.allowed) {
      appendEventAuditLog(
        event.id,
        createAuditEntry({
          eventId: event.id,
          actor: actorMember,
          action: "security.permission_change_blocked",
          targetId: editingMember.id,
          allowed: false,
          reason: check.reason,
        })
      )
      toast({
        title: "Operação negada pelo controle RBAC",
        description: check.reason,
        variant: "destructive",
      })
      return
    }

    const sanitized = sanitizePermissionsForRole(editingRole, editingPermissions)
    const updated = members.map((m) =>
      m.id === editingMember.id
        ? {
            ...m,
            role: editingRole,
            permissions: sanitized,
            updatedAt: new Date().toISOString(),
          }
        : m
    )

    setEventMembers(event.id, updated)
    appendEventAuditLog(
      event.id,
      createAuditEntry({
        eventId: event.id,
        actor: actorMember,
        action: "team.permissions_updated",
        targetType: "event_member",
        targetId: editingMember.id,
        allowed: true,
        details: { memberEmail: editingMember.email, newRole: editingRole },
      })
    )
    setEditingMemberId(null)
    toast({
      title: "Permissões atualizadas",
      description: `O papel e as permissões de ${editingMember.name} foram salvos.`,
    })
  }

  const handleRevokeMember = (target: EventMemberRecord) => {
    if (!actorMember) return
    const result = revokeEventTeamMember({
      eventId: event.id,
      actorMember,
      targetMemberId: target.id,
      members,
    })

    appendEventAuditLog(event.id, result.auditLog)

    if (!result.success) {
      toast({
        title: "Revogação impedida",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    setEventMembers(event.id, result.updatedMembers)
    toast({
      title: target.status === "pending" ? "Convite cancelado" : "Acesso revogado",
      description: `O vínculo de ${target.name} (${target.email}) foi revogado.`,
    })
  }

  const handleTransferOwnership = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actorMember) return

    if (!validateNominalEventDeletion(event.title, transferConfirmationTitle)) {
      toast({
        title: "Confirmação nominal incorreta",
        description: `Digite exatamente "${event.title}" para confirmar a transferência de titularidade.`,
        variant: "destructive",
      })
      return
    }

    const result = transferEventOwnership({
      eventId: event.id,
      actorMember,
      newOwnerMemberId: transferTargetMemberId,
      members,
    })

    appendEventAuditLog(event.id, result.auditLog)

    if (!result.success) {
      toast({
        title: "Transferência de titularidade negada",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    setEventMembers(event.id, result.updatedMembers, result.newOwnerUserId)
    setTransferTargetMemberId("")
    setTransferConfirmationTitle("")
    toast({
      title: "Titularidade transferida com sucesso",
      description: "O novo proprietário assumiu o controle integral e o proprietário anterior passou a ser Administrador.",
    })
  }

  const activeEligibleTransferTargets = members.filter(
    (m) => m.status === "active" && m.role !== "owner" && Boolean(m.userId)
  )

  return (
    <div className="space-y-6" data-testid="event-team-section">
      {/* Cabeçalho RBAC e Seletor de Perspectiva de Membro */}
      <Card className="border-emerald-500/25 bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-foreground">
                  Equipe e Permissões do Evento (RBAC — RN-002)
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-3xl">
                Gerencie os profissionais envolvidos na organização deste evento, atribua papéis
                (Proprietário, Administrador, Colaborador, Visualizador), configure permissões granulares por módulo
                e acompanhe o histórico de auditoria.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-muted/40 p-3 rounded-lg border border-border">
              <div className="text-xs">
                <span className="text-muted-foreground block font-medium">Operando como membro:</span>
                <span className="font-semibold text-foreground">
                  {actorMember?.name} ({EVENT_ROLE_LABELS[actorMember?.role || "owner"]})
                </span>
              </div>
              <select
                aria-label="Selecionar membro ativo para testar permissões"
                value={actorMember?.id || ""}
                onChange={(e) => setActiveActorMemberId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground"
              >
                {members
                  .filter((m) => m.status === "active")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {EVENT_ROLE_LABELS[m.role]}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna 1: Convidar Novo Membro por E-mail */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              Convidar Membro para a Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="team-invite-name">Nome do profissional</Label>
                <Input
                  id="team-invite-name"
                  placeholder="Ex: Fernanda Oliveira"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team-invite-email">E-mail de acesso</Label>
                <Input
                  id="team-invite-email"
                  type="email"
                  placeholder="fernanda@agenciaeventos.com.br"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team-invite-role">Papel no evento</Label>
                <select
                  id="team-invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "collaborator" | "viewer")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="admin">Administrador (Gestão operacional)</option>
                  <option value="collaborator">Colaborador (Módulos específicos)</option>
                  <option value="viewer">Visualizador (Somente leitura)</option>
                </select>
              </div>

              {inviteRole === "collaborator" && (
                <div className="space-y-1.5">
                  <Label htmlFor="team-invite-preset">Especialidade / Escopo inicial</Label>
                  <select
                    id="team-invite-preset"
                    value={invitePreset}
                    onChange={(e) =>
                      setInvitePreset(
                        e.target.value as "financial" | "guests_rsvp" | "media_photos" | "full_operational"
                      )
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="financial">Financeiro (Custos, Fornecedores e Relatórios)</option>
                    <option value="guests_rsvp">Recepção & RSVP (Convidados e Solicitações)</option>
                    <option value="media_photos">Mídia & Fotografia (Galeria de Fotos)</option>
                    <option value="full_operational">Operacional Multissetorial</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="team-invite-expire">Validade do convite (dias)</Label>
                <Input
                  id="team-invite-expire"
                  type="number"
                  min={1}
                  max={90}
                  value={inviteExpireDays}
                  onChange={(e) => setInviteExpireDays(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Convite de Equipe
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Coluna 2 e 3: Lista de Membros Ativos, Convites Pendentes e Matriz de Permissões */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Membros e Convites Vinculados ({members.length})
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                1 Proprietário Exclusivo
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.map((member) => {
              const statusMeta = STATUS_BADGE[member.status] || STATUS_BADGE.pending
              const effectivePerms = sanitizePermissionsForRole(member.role, member.permissions)
              const activeModulesCount = ALL_EVENT_MODULES.filter(
                (mod) => (effectivePerms[mod] || []).length > 0
              ).length

              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-border p-4 space-y-3 bg-background/60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {member.role === "owner" && (
                          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-semibold text-foreground">{member.name}</span>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {EVENT_ROLE_LABELS[member.role]}
                        </Badge>
                        <Badge className={`text-xs border ${statusMeta.className}`}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {member.email} • {activeModulesCount} módulo(s) autorizado(s)
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {member.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptPendingInvite(member)}
                          className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Aceitar Convite
                        </Button>
                      )}

                      {member.role !== "owner" && member.status !== "revoked" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditPermissions(member)}
                          >
                            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                            Permissões
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevokeMember(member)}
                            className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            {member.status === "pending" ? "Cancelar" : "Revogar"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Resumo compacto de permissões por módulo */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ALL_EVENT_MODULES.map((mod) => {
                      const acts = effectivePerms[mod] || []
                      if (acts.length === 0) return null
                      return (
                        <span
                          key={mod}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          <strong className="text-foreground">{EVENT_MODULE_LABELS[mod].split(" ")[0]}:</strong>{" "}
                          {acts.join(", ")}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Editor Granular de Papéis e Permissões por Módulo */}
            {editingMember && (
              <div className="rounded-xl border-2 border-primary/40 bg-primary/[0.03] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Configurar Papel e Permissões — {editingMember.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Defina o papel e restrinja individualmente visualização, criação, edição e exclusão em cada módulo.
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingMemberId(null)}>
                    Fechar
                  </Button>
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <Label>Papel atribuído</Label>
                  <select
                    value={editingRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as "admin" | "collaborator" | "viewer"
                      setEditingRole(nextRole)
                      setEditingPermissions(getDefaultPermissionsForRole(nextRole))
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
                  >
                    <option value="admin">Administrador</option>
                    <option value="collaborator">Colaborador</option>
                    <option value="viewer">Visualizador (Somente leitura)</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-2 pr-3">Módulo do Sistema</th>
                        {AVAILABLE_ACTIONS.map((a) => (
                          <th key={a.key} className="py-2 px-2 text-center">
                            {a.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_EVENT_MODULES.map((mod) => {
                        const modActions = editingPermissions[mod] || []
                        return (
                          <tr key={mod} className="border-b border-border/50">
                            <td className="py-2 pr-3 font-medium text-foreground">
                              {EVENT_MODULE_LABELS[mod]}
                            </td>
                            {AVAILABLE_ACTIONS.map((act) => {
                              const checked = modActions.includes(act.key)
                              const disabled = editingRole === "viewer" && act.key !== "view"
                              return (
                                <td key={act.key} className="py-2 px-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => handleToggleModuleAction(mod, act.key)}
                                    className="h-3.5 w-3.5 rounded border-border"
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingMemberId(null)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveMemberPermissions} className="bg-emerald-600 hover:bg-emerald-700">
                    Salvar Permissões
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transferência de Titularidade e Histórico de Auditoria */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transferência Transacional de Titularidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-4 w-4 text-amber-600" />
              Transferir Titularidade do Evento (Exclusivo do Proprietário)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransferOwnership} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                A transferência de titularidade promove um membro ativo da equipe a novo Proprietário único do evento e converte o proprietário atual em Administrador.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="transfer-target-member">Novo Proprietário (Membro Ativo)</Label>
                <select
                  id="transfer-target-member"
                  value={transferTargetMemberId}
                  onChange={(e) => setTransferTargetMemberId(e.target.value)}
                  required
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Selecione um membro ativo da equipe...</option>
                  {activeEligibleTransferTargets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email}) — atual {EVENT_ROLE_LABELS[m.role]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transfer-confirm-title">
                  Confirmação nominal: digite <strong className="text-foreground">{event.title}</strong>
                </Label>
                <Input
                  id="transfer-confirm-title"
                  placeholder={event.title}
                  value={transferConfirmationTitle}
                  onChange={(e) => setTransferConfirmationTitle(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={!transferTargetMemberId}
                className="w-full border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              >
                <Crown className="mr-2 h-4 w-4" />
                Confirmar Transferência de Titularidade
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Histórico de Alterações e Auditoria de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-emerald-600" />
              Histórico de Alterações e Auditoria ({auditLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded-lg border p-3 text-xs ${
                    log.allowed
                      ? "border-border bg-muted/20"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className={log.allowed ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                      {log.allowed ? "✓ AUTORIZADO" : "✗ BLOQUEADO"} — {log.action}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <div className="mt-1 text-foreground">
                    <strong>Ator:</strong> {log.actorName} ({log.actorRole})
                  </div>
                  {log.reason && (
                    <div className="mt-0.5 text-muted-foreground">{log.reason}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

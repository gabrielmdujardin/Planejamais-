"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Mail,
  Phone,
  User,
  Users,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Companion {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  status: string
}

interface PendingGuest {
  id: string
  name: string
  email: string
  phone: string
  notes?: string
  dietaryRestrictions?: string
  accessibilityNeeds?: string
  requestedCompanionsCount: number
  companions: Companion[]
  createdAt: string
}

interface PendingRequestsListProps {
  eventId: string
}

export default function PendingRequestsList({ eventId }: PendingRequestsListProps) {
  const [requests, setRequests] = useState<PendingGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedCompanions, setSelectedCompanions] = useState<Record<string, Set<string>>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingGuest, setRejectingGuest] = useState<PendingGuest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    fetchPendingRequests()
  }, [eventId])

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/pending-requests`)
      const data = await response.json()

      if (response.ok) {
        setRequests(data.guests || [])
        // Inicializar seleção de acompanhantes (todos selecionados por padrão)
        const initialSelection: Record<string, Set<string>> = {}
        for (const guest of data.guests || []) {
          initialSelection[guest.id] = new Set(guest.companions.map((c: Companion) => c.id))
        }
        setSelectedCompanions(initialSelection)
      }
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const toggleCompanion = (guestId: string, companionId: string) => {
    const current = selectedCompanions[guestId] || new Set()
    const newSet = new Set(current)
    if (newSet.has(companionId)) {
      newSet.delete(companionId)
    } else {
      newSet.add(companionId)
    }
    setSelectedCompanions({ ...selectedCompanions, [guestId]: newSet })
  }

  const selectAllCompanions = (guestId: string, companions: Companion[]) => {
    setSelectedCompanions({
      ...selectedCompanions,
      [guestId]: new Set(companions.map((c) => c.id)),
    })
  }

  const deselectAllCompanions = (guestId: string) => {
    setSelectedCompanions({
      ...selectedCompanions,
      [guestId]: new Set(),
    })
  }

  const handleApprove = async (guest: PendingGuest) => {
    setProcessingId(guest.id)

    const selected = selectedCompanions[guest.id] || new Set()
    const approvedCompanionIds = Array.from(selected)
    const rejectedCompanionIds = guest.companions
      .filter((c) => !selected.has(c.id))
      .map((c) => c.id)

    try {
      const response = await fetch(`/api/guests/${guest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedCompanionIds,
          rejectedCompanionIds,
          confirmationDeadlineDays: 7,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Convidado aprovado",
          description: `${guest.name} foi aprovado e receberá um email de confirmação.`,
        })
        // Remover da lista
        setRequests(requests.filter((r) => r.id !== guest.id))
      } else {
        throw new Error(data.error || "Erro ao aprovar")
      }
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectingGuest) return

    setProcessingId(rejectingGuest.id)

    try {
      const response = await fetch(`/api/guests/${rejectingGuest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Solicitação recusada",
          description: `A solicitação de ${rejectingGuest.name} foi recusada.`,
        })
        // Remover da lista
        setRequests(requests.filter((r) => r.id !== rejectingGuest.id))
      } else {
        throw new Error(data.error || "Erro ao recusar")
      }
    } catch (error) {
      toast({
        title: "Erro ao recusar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
      setRejectDialogOpen(false)
      setRejectingGuest(null)
      setRejectReason("")
    }
  }

  const handleCompanionAction = async (companionId: string, action: "approve" | "reject") => {
    setProcessingId(companionId)

    try {
      const response = await fetch(`/api/companions/${companionId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Erro ao atualizar acompanhante")

      toast({
        title: action === "approve" ? "Acompanhante aprovado" : "Acompanhante recusado",
        description: "A solicitação do acompanhante foi atualizada.",
      })

      fetchPendingRequests()
    } catch (error) {
      toast({
        title: "Erro ao atualizar acompanhante",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (guest: PendingGuest) => {
    setRejectingGuest(guest)
    setRejectDialogOpen(true)
  }

  const renderAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

    return (
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-amber-100 text-amber-800">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((guest) => {
        const isExpanded = expandedIds.has(guest.id)
        const selected = selectedCompanions[guest.id] || new Set()
        const isProcessing = processingId === guest.id

        return (
          <Card key={guest.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {renderAvatar(guest.name)}
                  <div>
                    <CardTitle className="text-base">{guest.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {guest.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {guest.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Aguardando
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(guest.createdAt)}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Informações adicionais */}
              {(guest.notes || guest.dietaryRestrictions || guest.accessibilityNeeds) && (
                <div className="grid gap-2 text-sm">
                  {guest.dietaryRestrictions && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Restrições alimentares:</span>
                      <span>{guest.dietaryRestrictions}</span>
                    </div>
                  )}
                  {guest.accessibilityNeeds && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Acessibilidade:</span>
                      <span>{guest.accessibilityNeeds}</span>
                    </div>
                  )}
                  {guest.notes && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Observações:</span>
                      <span>{guest.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Acompanhantes */}
              {guest.companions.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleExpand(guest.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {guest.companions.length} acompanhante{guest.companions.length > 1 ? "s" : ""}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {selected.size} selecionado{selected.size !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t">
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Selecione os acompanhantes a aprovar:</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectAllCompanions(guest.id, guest.companions)}
                          >
                            Selecionar todos
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deselectAllCompanions(guest.id)}
                          >
                            Limpar
                          </Button>
                        </div>
                      </div>
                      <div className="divide-y">
                        {guest.companions.map((companion) => (
                          <label
                            key={companion.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer"
                          >
                            <Checkbox
                              checked={selected.has(companion.id)}
                              onCheckedChange={() => toggleCompanion(guest.id, companion.id)}
                            />
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{companion.name}</p>
                              {(companion.email || companion.phone) && (
                                <p className="text-xs text-muted-foreground">
                                  {companion.email && companion.email}
                                  {companion.email && companion.phone && " • "}
                                  {companion.phone && companion.phone}
                                </p>
                              )}
                              {companion.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{companion.notes}</p>
                              )}
                            </div>
                            {companion.status === "awaiting_approval" && (
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    handleCompanionAction(companion.id, "approve")
                                  }}
                                  disabled={processingId === companion.id}
                                >
                                  <Check className="h-4 w-4 text-emerald-600" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    handleCompanionAction(companion.id, "reject")
                                  }}
                                  disabled={processingId === companion.id}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  {guest.companions.length > 0 && (
                    <span>
                      {selected.size} de {guest.companions.length} acompanhantes serão aprovados
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRejectDialog(guest)}
                    disabled={isProcessing}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Recusar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(guest)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Dialog de Rejeição */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recusar Solicitação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a recusar a solicitação de <strong>{rejectingGuest?.name}</strong>.
              {rejectingGuest?.companions && rejectingGuest.companions.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Os {rejectingGuest.companions.length} acompanhantes também serão recusados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo (opcional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="Informe o motivo da recusa..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={processingId !== null}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar Recusa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

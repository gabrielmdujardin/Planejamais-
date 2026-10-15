"use client"

import { useState } from "react"
import { Check, Clock, Copy, Download, Edit, Mail, MoreHorizontal, Printer, Send, Trash2, Users, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"

type GuestStatus = "pending" | "confirmed" | "declined" | "awaiting_approval" | "pending_approval" | "rejected"

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  status: GuestStatus
}

interface GuestListProps {
  guests: Guest[]
  eventId: string
}

const statusOrder: Record<GuestStatus, number> = {
  confirmed: 0,
  pending: 1,
  awaiting_approval: 2,
  pending_approval: 2,
  declined: 3,
  rejected: 4,
}

export default function GuestList({ guests, eventId }: GuestListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "declined" | "approval">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const { toast } = useToast()
  const { updateGuest, updateGuestStatus, removeGuest } = useEventStore()

  const filteredGuests = [...guests]
    .filter((guest) => {
      if (filter === "confirmed" && guest.status !== "confirmed") return false
      if (filter === "pending" && guest.status !== "pending") return false
      if (filter === "declined" && !["declined", "rejected"].includes(guest.status)) return false
      if (filter === "approval" && !["awaiting_approval", "pending_approval"].includes(guest.status)) return false
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      return guest.name.toLowerCase().includes(term) || guest.email.toLowerCase().includes(term) || guest.phone.includes(term)
    })
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  const counts = {
    confirmed: guests.filter((guest) => guest.status === "confirmed").length,
    pending: guests.filter((guest) => guest.status === "pending").length,
    declined: guests.filter((guest) => ["declined", "rejected"].includes(guest.status)).length,
    approval: guests.filter((guest) => ["awaiting_approval", "pending_approval"].includes(guest.status)).length,
  }

  const statusText = (status: GuestStatus) => {
    if (status === "confirmed") return "confirmado"
    if (status === "pending") return "pendente"
    if (status === "declined" || status === "rejected") return "recusado"
    return "aguardando aprovação"
  }

  const handleUpdateStatus = async (guestId: string, status: GuestStatus) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 250))
      updateGuestStatus(eventId, guestId, status)
      toast({ title: "Status atualizado", description: `Convidado marcado como ${statusText(status)}.` })
    } catch (error) {
      toast({ title: "Erro ao atualizar status", description: "Tente novamente em instantes.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveGuest = async (guest: Guest) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 250))
      removeGuest(eventId, guest.id)
      toast({ title: "Convidado removido", description: `${guest.name} saiu da lista deste evento.` })
    } catch (error) {
      toast({ title: "Erro ao remover convidado", description: "Tente novamente em instantes.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteLink = async (guest: Guest) => {
    let url = `${window.location.origin}/confirm-invitation/${eventId}/${guest.id}`

    try {
      const response = await fetch(`/api/guests/${guest.id}/confirmation-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })
      const data = await response.json().catch(() => null)
      if (response.ok && data?.url) url = data.url
    } catch (error) {
      // Fallback local
    }

    await navigator.clipboard.writeText(url)
    toast({ title: "Link copiado", description: "O link individual do convite foi copiado." })
  }

  const sendInvite = async (guest: Guest) => {
    setSendingInviteId(guest.id)
    try {
      const response = await fetch(`/api/guests/${guest.id}/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Envio indisponível")
      toast({ title: "Convite enviado", description: `Convite enviado para ${guest.email}.` })
    } catch (error) {
      toast({
        title: "Envio real indisponível",
        description: "Configure Supabase/Resend para enviar por email. O link individual pode ser copiado agora.",
        variant: "destructive",
      })
    } finally {
      setSendingInviteId(null)
    }
  }

  const sendAllPending = async () => {
    const pendingGuests = guests.filter((guest) => guest.status === "pending")
    if (pendingGuests.length === 0) {
      toast({ title: "Nenhum convidado pendente", description: "Todos os convidados já foram tratados." })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${eventId}/send-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: pendingGuests.map((guest) => guest.id) }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Envio indisponível")
      toast({ title: "Convites processados", description: `${pendingGuests.length} convite(s) processado(s).` })
    } catch (error) {
      toast({
        title: "Envio real indisponível",
        description: "Configure Supabase/Resend para envio em lote. Os links individuais continuam disponíveis.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveGuest = () => {
    if (!editingGuest) return
    if (!editingGuest.name.trim() || !editingGuest.email.trim()) {
      toast({ title: "Dados incompletos", description: "Nome e e-mail são obrigatórios.", variant: "destructive" })
      return
    }
    updateGuest(eventId, editingGuest.id, editingGuest)
    setEditingGuest(null)
    toast({ title: "Convidado atualizado", description: "Os dados do convidado foram salvos." })
  }

  const avatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    return (
      <Avatar>
        <AvatarFallback className="bg-slate-100 text-slate-800 font-semibold">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  const statusBadge = (status: GuestStatus) => {
    if (status === "confirmed") {
      return <Badge variant="paid"><Check className="mr-1 h-3 w-3" /> Confirmado</Badge>
    }
    if (status === "pending") {
      return <Badge variant="pending"><Clock className="mr-1 h-3 w-3" /> Pendente</Badge>
    }
    if (status === "declined" || status === "rejected") {
      return <Badge variant="destructive"><X className="mr-1 h-3 w-3" /> Recusado</Badge>
    }
    return <Badge variant="info"><Clock className="mr-1 h-3 w-3" /> Aguardando aprovação</Badge>
  }

  const handleExportCSV = () => {
    if (guests.length === 0) {
      toast({ title: "Lista vazia", description: "Não há convidados para exportar.", variant: "destructive" })
      return
    }

    const headers = ["Nome", "E-mail", "Telefone", "Status", "Acompanhantes", "Restricoes_Alimentares"]
    const rows = guests.map((g: any) => [
      `"${(g.name || "").replace(/"/g, '""')}"`,
      `"${(g.email || "").replace(/"/g, '""')}"`,
      `"${(g.phone || "").replace(/"/g, '""')}"`,
      `"${statusText(g.status)}"`,
      `"${g.companions?.length || 0}"`,
      `"${(g.dietary_restrictions || g.dietaryRestrictions || "").replace(/"/g, '""')}"`,
    ])

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `lista-convidados-evento-${eventId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({ title: "Lista exportada!", description: "Arquivo CSV compatível com Excel baixado com sucesso." })
  }

  const handleCopyAllLinks = async () => {
    if (guests.length === 0) return

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const linksList = guests
      .map((g: any) => {
        const link = g.token || g.confirmation_token
          ? `${baseUrl}/confirm/${g.token || g.confirmation_token}`
          : `${baseUrl}/confirm-invitation/${eventId}/${g.id}`
        return `• ${g.name}: ${link}`
      })
      .join("\n")

    const fullMessage = `Convites com Link de RSVP:\n\n${linksList}`
    await navigator.clipboard.writeText(fullMessage)
    toast({
      title: "Links copiados!",
      description: `${guests.length} link(s) nominal(is) copiados para a área de transferência.`,
    })
  }

  const handlePrintList = () => {
    window.print()
  }

  if (guests.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum convidado adicionado"
        description="Adicione convidados ao seu evento para começar o controle automatizado de RSVP e confirmações."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho exclusivo para impressão em papel */}
      <div className="hidden print:block mb-4 border-b pb-2">
        <h1 className="text-xl font-bold">Planeja+ · Lista de Credenciamento e Presença</h1>
        <p className="text-sm text-gray-500">
          Total de convidados: {guests.length} | Confirmados: {counts.confirmed} | Impresso em: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todos ({guests.length})</Button>
          <Button variant={filter === "confirmed" ? "default" : "outline"} size="sm" onClick={() => setFilter("confirmed")}>Confirmados ({counts.confirmed})</Button>
          <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>Pendentes ({counts.pending})</Button>
          <Button variant={filter === "approval" ? "default" : "outline"} size="sm" onClick={() => setFilter("approval")}>Aprovar ({counts.approval})</Button>
          <Button variant={filter === "declined" ? "default" : "outline"} size="sm" onClick={() => setFilter("declined")}>Recusados ({counts.declined})</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {counts.pending > 0 ? (
            <Button size="sm" variant="outline" onClick={sendAllPending} disabled={isLoading} className="text-xs gap-1">
              <Mail className="h-3.5 w-3.5" /> Disparar e-mails ({counts.pending})
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={handleCopyAllLinks} className="text-xs gap-1" title="Copiar links para WhatsApp">
            <Copy className="h-3.5 w-3.5" /> Copiar Links
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs gap-1" title="Baixar planilha Excel">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrintList} className="text-xs gap-1" title="Imprimir lista de presença">
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
        </div>
      </div>

      <Input placeholder="Buscar por nome, e-mail ou telefone..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="max-w-sm print:hidden" />

      <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse bg-white dark:bg-slate-900">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="p-3 font-semibold">Convidado</th>
              <th className="p-3 font-semibold">Contato</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="hidden print:table-cell p-3 font-semibold">Check-in / Assinatura</th>
              <th className="p-3 text-right font-semibold print:hidden">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {filteredGuests.map((guest) => (
              <tr key={guest.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {avatar(guest.name)}
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{guest.name}</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {guest.department ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {guest.department}
                          </Badge>
                        ) : null}
                        {guest.tableNumber ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Mesa {guest.tableNumber}
                          </span>
                        ) : null}
                        {guest.dietaryRestrictions ? (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            🥗 {guest.dietaryRestrictions}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  <div>{guest.email}</div>
                  <div className="text-xs text-slate-400">{guest.phone}</div>
                </td>
                <td className="p-3">{statusBadge(guest.status)}</td>
                <td className="hidden print:table-cell p-3 font-mono text-xs text-slate-500">
                  [ &nbsp; ] ____________________
                </td>
                <td className="p-3 text-right print:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateStatus(guest.id, "confirmed")}><Check className="mr-2 h-4 w-4 text-emerald-600" /> Marcar confirmado</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(guest.id, "pending")}><Clock className="mr-2 h-4 w-4 text-amber-600" /> Marcar pendente</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(guest.id, "declined")}><X className="mr-2 h-4 w-4 text-red-600" /> Marcar recusado</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingGuest(guest)}><Edit className="mr-2 h-4 w-4" /> Editar convidado</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => sendInvite(guest)} disabled={sendingInviteId === guest.id}><Send className="mr-2 h-4 w-4" /> {sendingInviteId === guest.id ? "Enviando..." : "Enviar por e-mail"}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyInviteLink(guest)}><Copy className="mr-2 h-4 w-4" /> Copiar link</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveGuest(guest)}><Trash2 className="mr-2 h-4 w-4" /> Remover</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar convidado</DialogTitle></DialogHeader>
          {editingGuest ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Nome *</Label><Input value={editingGuest.name} onChange={(event) => setEditingGuest({ ...editingGuest, name: event.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>E-mail</Label><Input value={editingGuest.email} onChange={(event) => setEditingGuest({ ...editingGuest, email: event.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone / WhatsApp</Label><Input value={editingGuest.phone} onChange={(event) => setEditingGuest({ ...editingGuest, phone: event.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Departamento / Setor</Label><Input placeholder="Ex: RH, Comercial" value={editingGuest.department || ""} onChange={(event) => setEditingGuest({ ...editingGuest, department: event.target.value })} /></div>
                <div className="space-y-2"><Label>Mesa / Assento</Label><Input placeholder="Ex: 04, VIP" value={editingGuest.tableNumber || ""} onChange={(event) => setEditingGuest({ ...editingGuest, tableNumber: event.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Restrições Alimentares</Label><Input placeholder="Ex: Vegetariano, Vegano, Celíaco" value={editingGuest.dietaryRestrictions || ""} onChange={(event) => setEditingGuest({ ...editingGuest, dietaryRestrictions: event.target.value })} /></div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGuest(null)}>Cancelar</Button>
            <Button onClick={saveGuest}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

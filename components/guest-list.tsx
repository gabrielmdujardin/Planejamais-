"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Check, Clock, Copy, Mail, MoreHorizontal, Send, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"
import { Input } from "@/components/ui/input"

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  status: "pending" | "confirmed" | "declined"
}

interface GuestListProps {
  guests: Guest[]
  eventId: string
}

export default function GuestList({ guests, eventId }: GuestListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "declined">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { updateGuestStatus, removeGuest } = useEventStore()

  // Filtrar e ordenar convidados
  const filteredGuests = [...guests]
    .filter((guest) => {
      // Filtro por status
      if (filter !== "all" && guest.status !== filter) return false
      // Filtro por busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          guest.name.toLowerCase().includes(term) ||
          guest.email.toLowerCase().includes(term) ||
          guest.phone.includes(term)
        )
      }
      return true
    })
    .sort((a, b) => {
      const statusOrder = { confirmed: 0, pending: 1, declined: 2 }
      return statusOrder[a.status] - statusOrder[b.status]
    })

  const handleUpdateStatus = async (guestId: string, status: "confirmed" | "pending" | "declined") => {
    setIsLoading(true)
    try {
      // Simular uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 500))
      updateGuestStatus(eventId, guestId, status)

      toast({
        title: "Status atualizado",
        description: `O status do convidado foi atualizado para ${
          status === "confirmed" ? "confirmado" : status === "pending" ? "pendente" : "recusado"
        }.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status do convidado.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveGuest = async (guestId: string, guestName: string) => {
    setIsLoading(true)
    try {
      // Simular uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 500))
      removeGuest(eventId, guestId)

      toast({
        title: "Convidado removido",
        description: `${guestName} foi removido da lista de convidados.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao remover convidado",
        description: "Ocorreu um erro ao remover o convidado.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendInvite = async (guest: Guest) => {
    setSendingInviteId(guest.id)
    try {
      // Chamar API para enviar convite
      const response = await fetch(`/api/guests/${guest.id}/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok) {
        toast({
          title: "Convite enviado!",
          description: `O convite foi enviado para ${guest.name} (${guest.email}).`,
        })
      } else {
        throw new Error(data?.error || "Erro ao enviar")
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar convite",
        description: "Não foi possível enviar o convite. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSendingInviteId(null)
    }
  }

  const handleSendToAllPending = async () => {
    const pendingGuests = guests.filter((g) => g.status === "pending")
    if (pendingGuests.length === 0) {
      toast({
        title: "Nenhum convidado pendente",
        description: "Todos os convidados já foram notificados.",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${eventId}/send-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: pendingGuests.map((g) => g.id) }),
      })
      const data = await response.json().catch(() => null)

      if (response.ok) {
        const failed = data?.results?.failed || 0
        toast({
          title: failed > 0 ? "Convites processados com falhas" : "Convites enviados!",
          description:
            failed > 0
              ? data.results.errors.join("; ")
              : `${pendingGuests.length} convite(s) enviado(s) com sucesso.`,
          variant: failed > 0 ? "destructive" : "default",
        })
      } else {
        throw new Error(data?.error || "Erro ao enviar")
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar convites",
        description: "Não foi possível enviar os convites. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyInviteLink = async (guest: Guest) => {
    const response = await fetch(`/api/guests/${guest.id}/confirmation-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    })
    const data = await response.json()

    if (!response.ok || !data.url) {
      toast({
        title: "Erro ao copiar",
        description: data.error || "Não foi possível gerar o link. Tente novamente.",
        variant: "destructive",
      })
      return
    }

    // Copiar para a área de transferência
    navigator.clipboard.writeText(data.url).then(
      () => {
        toast({
          title: "Link copiado",
          description: "O link do convite foi copiado para a área de transferência.",
        })
      },
      () => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link. Tente novamente.",
          variant: "destructive",
        })
      },
    )
  }

  // Renderizar avatar
  const renderAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

    return (
      <Avatar>
        <AvatarFallback className="bg-emerald-100 text-emerald-800">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  // Renderizar badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <Check className="h-3 w-3 mr-1" /> Confirmado
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" /> Pendente
          </Badge>
        )
      case "declined":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <X className="h-3 w-3 mr-1" /> Recusado
          </Badge>
        )
      default:
        return null
    }
  }

  if (guests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">Nenhum convidado adicionado</p>
        <p className="text-sm text-gray-400 mb-4">Adicione convidados para o seu evento</p>
      </div>
    )
  }

  const pendingCount = guests.filter((g) => g.status === "pending").length
  const confirmedCount = guests.filter((g) => g.status === "confirmed").length
  const declinedCount = guests.filter((g) => g.status === "declined").length

  return (
    <div className="space-y-4">
      {/* Barra de filtros e ações */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos ({guests.length})
          </Button>
          <Button
            variant={filter === "confirmed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("confirmed")}
            className={filter === "confirmed" ? "" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
          >
            <Check className="h-3 w-3 mr-1" />
            Confirmados ({confirmedCount})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "" : "text-amber-600 border-amber-200 hover:bg-amber-50"}
          >
            <Clock className="h-3 w-3 mr-1" />
            Pendentes ({pendingCount})
          </Button>
          <Button
            variant={filter === "declined" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("declined")}
            className={filter === "declined" ? "" : "text-red-600 border-red-200 hover:bg-red-50"}
          >
            <X className="h-3 w-3 mr-1" />
            Recusados ({declinedCount})
          </Button>
        </div>
        
        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendToAllPending}
            disabled={isLoading}
            className="gap-1"
          >
            <Mail className="h-4 w-4" />
            Enviar convites ({pendingCount})
          </Button>
        )}
      </div>

      {/* Campo de busca */}
      <Input
        placeholder="Buscar por nome, email ou telefone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">Convidado</th>
              <th className="pb-2 font-medium">Contato</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => (
              <tr key={guest.id} className="border-b last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {renderAvatar(guest.name)}
                    <span className="font-medium">{guest.name}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-600">{guest.email}</span>
                    <span className="text-sm text-gray-600">{guest.phone}</span>
                  </div>
                </td>
                <td className="py-3">{renderStatusBadge(guest.status)}</td>
                <td className="py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateStatus(guest.id, "confirmed")}>
                        <Check className="mr-2 h-4 w-4 text-emerald-600" /> Marcar como confirmado
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(guest.id, "pending")}>
                        <span className="mr-2 h-4 w-4 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        </span>
                        Marcar como pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(guest.id, "declined")}>
                        <X className="mr-2 h-4 w-4 text-red-600" /> Marcar como recusado
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleResendInvite(guest)} disabled={sendingInviteId === guest.id}>
                        <Send className="mr-2 h-4 w-4" /> 
                        {sendingInviteId === guest.id ? "Enviando..." : "Enviar convite por email"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyInviteLink(guest)}>
                        <Copy className="mr-2 h-4 w-4" /> Copiar link do convite
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleRemoveGuest(guest.id, guest.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remover convidado
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

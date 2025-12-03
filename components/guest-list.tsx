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
import { Check, Copy, MoreHorizontal, Send, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"

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
  const { toast } = useToast()
  const { updateGuestStatus, removeGuest } = useEventStore()

  // Ordenar convidados: confirmados primeiro, depois pendentes, depois recusados
  const sortedGuests = [...guests].sort((a, b) => {
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

  const handleResendInvite = (guest: Guest) => {
    toast({
      title: "Convite reenviado",
      description: `O convite foi reenviado para ${guest.name}.`,
    })
  }

  const handleCopyInviteLink = (guest: Guest) => {
    // Em um app real, você geraria um link único
    const inviteLink = `${window.location.origin}/confirm-invitation/${eventId}/${guest.id}`

    // Copiar para a área de transferência
    navigator.clipboard.writeText(inviteLink).then(
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

  return (
    <div className="space-y-4">
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
            {sortedGuests.map((guest) => (
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
                      <DropdownMenuItem onClick={() => handleResendInvite(guest)}>
                        <Send className="mr-2 h-4 w-4" /> Reenviar convite
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

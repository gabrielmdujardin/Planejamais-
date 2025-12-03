"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Mail } from "lucide-react"

interface EmailPreviewProps {
  eventId: string
  guestId: string
  eventTitle: string
  guestName: string
  eventDate: string
  eventTime: string
  eventLocation: string
}

export default function EmailPreview({
  eventId,
  guestId,
  eventTitle,
  guestName,
  eventDate,
  eventTime,
  eventLocation,
}: EmailPreviewProps) {
  const [open, setOpen] = useState(false)

  // Gerar link de confirmação
  const confirmationLink = `${window.location.origin}/confirm-invitation/${eventId}/${guestId}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2">
          <Mail className="h-4 w-4" /> Visualizar email de convite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Prévia do Email de Convite</DialogTitle>
          <DialogDescription>Assim será o email enviado aos convidados</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-6 bg-white">
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Mail className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Planeja+ App</p>
                <p className="text-xs text-gray-500">convites@planejaapp.com</p>
              </div>
            </div>
            <h2 className="text-xl font-bold">Você foi convidado para {eventTitle}!</h2>
          </div>

          <div className="space-y-4">
            <p>Olá {guestName},</p>
            <p>
              Você foi convidado para o evento <strong>{eventTitle}</strong>. Esperamos contar com a sua presença!
            </p>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Detalhes do evento:</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="font-medium">Data:</span> {eventDate}
                </li>
                <li>
                  <span className="font-medium">Horário:</span> {eventTime}
                </li>
                <li>
                  <span className="font-medium">Local:</span> {eventLocation}
                </li>
              </ul>
            </div>

            <p>Por favor, confirme sua presença clicando em um dos botões abaixo:</p>

            <div className="flex gap-4 justify-center py-2">
              <a
                href={`${confirmationLink}?response=confirm`}
                className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-md font-medium no-underline"
              >
                Confirmar presença
              </a>
              <a
                href={`${confirmationLink}?response=decline`}
                className="inline-block px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium no-underline"
              >
                Não poderei ir
              </a>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Se você tiver alguma dúvida, entre em contato com o organizador do evento.
            </p>

            <div className="border-t pt-4 mt-6 text-sm text-gray-500">
              <p>Este é um email automático, por favor não responda.</p>
              <p>Você está recebendo este email porque foi convidado para um evento através do Planeja+ App.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

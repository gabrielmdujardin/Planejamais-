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
import { MessageSquare } from "lucide-react"

interface SmsPreviewProps {
  eventId: string
  guestId: string
  eventTitle: string
  guestName: string
}

export default function SmsPreview({ eventId, guestId, eventTitle, guestName }: SmsPreviewProps) {
  const [open, setOpen] = useState(false)

  // Gerar link de confirmação
  const confirmationLink = `${window.location.origin}/confirm-invitation/${eventId}/${guestId}`

  // Texto do SMS (limitado a 160 caracteres para SMS padrão)
  const smsText = `Olá ${guestName}! Você foi convidado para ${eventTitle}. Confirme sua presença: ${confirmationLink}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2">
          <MessageSquare className="h-4 w-4" /> Visualizar SMS de convite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Prévia do SMS de Convite</DialogTitle>
          <DialogDescription>Assim será o SMS enviado aos convidados</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Planeja+ App</p>
              <p className="text-sm">{smsText}</p>
              <p className="text-xs text-gray-500 mt-2">
                {smsText.length} caracteres ({Math.ceil(smsText.length / 160)} SMS)
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

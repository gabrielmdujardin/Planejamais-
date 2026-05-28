"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Check, Copy, Link2, Loader2, MessageSquare, RefreshCw } from "lucide-react"

interface PublicInviteShareProps {
  eventId: string
  eventTitle: string
  eventType?: string
  eventCategory?: string
  eventDate: string
  eventTime: string
  eventFullDate?: string
  eventLocation: string
  eventDescription?: string
  confirmedGuests?: number
  totalGuests?: number
}

export default function PublicInviteShare({
  eventId,
  eventTitle,
  eventType,
  eventCategory,
  eventDate,
  eventTime,
  eventFullDate,
  eventLocation,
  eventDescription,
  confirmedGuests,
  totalGuests,
}: PublicInviteShareProps) {
  const [publicUrl, setPublicUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<"link" | "message" | null>(null)
  const { toast } = useToast()

  const buildLocalInviteUrl = () => {
    const payload = {
      id: eventId,
      title: eventTitle,
      type: eventType,
      category: eventCategory,
      date: eventFullDate || eventDate,
      displayDate: eventDate,
      time: eventTime,
      location: eventLocation,
      description: eventDescription,
      confirmedGuests,
      totalGuests,
    }
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    return `${window.location.origin}/convite/local?data=${encodeURIComponent(encoded)}`
  }

  const inviteText = useMemo(() => {
    const link = publicUrl || "gere o link abaixo"

    return [
      `Olá! Você está convidado(a) para ${eventTitle}.`,
      `Data: ${eventDate}`,
      `Horário: ${eventTime || "A definir"}`,
      `Local: ${eventLocation || "A definir"}`,
      "",
      "Para confirmar presença, preencha seus dados neste link:",
      link,
    ].join("\n")
  }, [eventDate, eventLocation, eventTime, eventTitle, publicUrl])

  const generateLink = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/events/${eventId}/public-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            id: eventId,
            title: eventTitle,
            type: eventType,
            category: eventCategory,
            date: eventDate,
            time: eventTime,
            fullDate: eventFullDate,
            location: eventLocation,
            description: eventDescription,
            confirmedGuests,
            totalGuests,
          },
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Não foi possível gerar o link público")
      }

      setPublicUrl(data.url)
      toast({
        title: "Link público pronto",
        description: "O convite avulso pode ser compartilhado com pessoas que não estão na lista.",
      })
    } catch (error) {
      const localUrl = buildLocalInviteUrl()
      setPublicUrl(localUrl)
      toast({
        title: "Link local gerado",
        description:
          "O Supabase não respondeu para salvar um link público. Gere novamente após configurar login/Supabase para registrar respostas no banco.",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (value: string, type: "link" | "message") => {
    if (!value || value.includes("gere o link abaixo")) {
      await generateLink()
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopied(type)
      toast({
        title: type === "link" ? "Link copiado" : "Convite copiado",
        description: "Agora é só colar onde quiser enviar.",
      })
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível acessar a área de transferência.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <MessageSquare className="h-4 w-4 text-primary" />
            Convite avulso
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Para pessoas que não estão salvas como contato: copie o texto e envie por WhatsApp, SMS ou e-mail.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={generateLink} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Gerar link
        </Button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="space-y-2">
          <Label htmlFor="public-invite-link">Link público</Label>
          <div className="flex gap-2">
            <Input
              id="public-invite-link"
              value={publicUrl}
              readOnly
              placeholder="Clique em gerar link"
              className="min-w-0"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(publicUrl, "link")}
              aria-label="Copiar link público"
            >
              {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="public-invite-message">Texto para copiar e colar</Label>
          <Textarea id="public-invite-message" value={inviteText} readOnly rows={7} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 sm:w-auto"
            onClick={() => copyToClipboard(inviteText, "message")}
          >
            {copied === "message" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copiar convite
          </Button>
        </div>
      </div>
    </div>
  )
}

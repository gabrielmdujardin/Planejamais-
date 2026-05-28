"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle, Clock, Loader2, MapPin } from "lucide-react"
import PublicRequestForm from "@/components/public-request-form"

interface EventInfo {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  rsvpDeadline?: string
  allowCompanions: boolean
  maxCompanions: number
  autoApprovePublicGuests: boolean
  localMode?: boolean
}

export default function PublicInvitePage() {
  const params = useParams()
  const token = params.token as string
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const formatEventDate = (date: string) => {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("pt-BR")
  }

  useEffect(() => {
    async function fetchEvent() {
      try {
        if (token === "local") {
          const encoded = new URLSearchParams(window.location.search).get("data")
          if (!encoded) {
            setError("Link local inválido")
            return
          }

          const snapshot = JSON.parse(decodeURIComponent(escape(atob(encoded))))
          setEvent({
            id: snapshot.id || "local",
            title: snapshot.title || "Evento",
            date: snapshot.date || snapshot.displayDate || "",
            time: snapshot.time || "",
            location: snapshot.location || "",
            description: snapshot.description || "",
            allowCompanions: true,
            maxCompanions: 1,
            autoApprovePublicGuests: true,
            localMode: true,
          })
          return
        }

        const response = await fetch(`/api/public-events/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Convite público não encontrado")
          return
        }

        setEvent(data.event)
        setExpired(Boolean(data.expired))
      } catch {
        setError("Erro ao carregar convite público")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Convite indisponível</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Prazo expirado</CardTitle>
            <CardDescription>O prazo para confirmar presença neste evento já terminou.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Recebemos sua resposta</CardTitle>
            <CardDescription>
              Sua confirmação para <strong>{event.title}</strong> foi registrada.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit">
              Convite público
            </Badge>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatEventDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{event.time || "Horário a definir"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{event.location || "Local a definir"}</span>
              </div>
            </div>
            {event.description && <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>}
          </CardContent>
        </Card>

        <PublicRequestForm
          eventId={event.id}
          eventTitle={event.title}
          publicToken={event.localMode ? undefined : token}
          localMode={event.localMode}
          allowCompanions={event.allowCompanions}
          maxCompanions={event.maxCompanions}
          onSuccess={() => setSubmitted(true)}
        />
      </div>
    </div>
  )
}

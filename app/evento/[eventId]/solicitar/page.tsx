"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, CheckCircle, Loader2 } from "lucide-react"
import PublicRequestForm from "@/components/public-request-form"

interface EventInfo {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
}

export default function SolicitarParticipacaoPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${eventId}/public-info`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Evento não encontrado")
          } else {
            setError("Erro ao carregar informações do evento")
          }
          return
        }

        const data = await response.json()
        setEvent(data.event)
      } catch (err) {
        setError("Erro ao carregar informações do evento")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando informações do evento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
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
            <CardTitle>Solicitação Enviada!</CardTitle>
            <CardDescription className="text-base">
              Sua solicitação de participação para <strong>{event?.title}</strong> foi enviada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              <p>
                Você receberá um email quando sua participação for analisada pelo organizador do evento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header do Evento */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  Solicitação de Participação
                </Badge>
                <CardTitle className="text-2xl">{event?.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event?.date
                    ? new Date(event.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Data a definir"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{event?.time || "Horário a definir"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{event?.location || "Local a definir"}</span>
              </div>
            </div>
            {event?.description && (
              <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Formulário de Solicitação */}
        <PublicRequestForm
          eventId={eventId}
          eventTitle={event?.title || "Evento"}
          onSuccess={() => setSubmitted(true)}
        />
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Check,
  Clock,
  Loader2,
  MapPin,
  PartyPopper,
  User,
  Users,
  X,
  AlertCircle,
} from "lucide-react"

interface Companion {
  id: string
  name: string
}

interface GuestData {
  id: string
  name: string
  email: string
  status: string
  confirmationDeadline?: string
  dietaryRestrictions?: string
  accessibilityNeeds?: string
  respondedAt?: string
}

interface EventData {
  id: string
  title: string
  date: string
  time: string
  location: string
  description?: string
}

interface InviteData {
  guest: GuestData
  event: EventData
  companions: Companion[]
  alreadyResponded: boolean
  expired: boolean
}

export default function ConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [data, setData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [response, setResponse] = useState<"confirmed" | "declined" | null>(null)

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/confirm/${token}`)
        const result = await res.json()

        if (!res.ok) {
          setError(result.error || "Convite não encontrado")
          return
        }

        setData(result)
      } catch (err) {
        setError("Erro ao carregar convite")
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token])

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/confirm/${token}/accept`, {
        method: "POST",
      })

      if (res.ok) {
        setResponse("confirmed")
      } else {
        const result = await res.json()
        setError(result.error || "Erro ao confirmar presença")
      }
    } catch (err) {
      setError("Erro ao confirmar presença")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/confirm/${token}/decline`, {
        method: "POST",
      })

      if (res.ok) {
        setResponse("declined")
      } else {
        const result = await res.json()
        setError(result.error || "Erro ao registrar resposta")
      }
    } catch (err) {
      setError("Erro ao registrar resposta")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatDeadline = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getGoogleCalendarUrl = () => {
    if (!data?.event) return "#"

    const start = new Date(`${data.event.date}T${data.event.time || "00:00"}:00`)
    const safeStart = Number.isNaN(start.getTime()) ? new Date(data.event.date) : start
    const safeEnd = new Date(safeStart.getTime() + 2 * 60 * 60 * 1000)
    const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: data.event.title,
      dates: `${formatGoogleDate(safeStart)}/${formatGoogleDate(safeEnd)}`,
      details: data.event.description || "",
      location: data.event.location || "",
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const CalendarActions = () => (
    <div className="grid gap-3 pt-2">
      <Button asChild variant="outline" className="w-full">
        <a href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer">
          <Calendar className="h-4 w-4 mr-2" />
          Adicionar ao Google Calendar
        </a>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <a href={`/api/confirm/${token}/calendar.ics`}>
          <Calendar className="h-4 w-4 mr-2" />
          Adicionar ao calendário
        </a>
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) return null

  // Já respondeu
  if (data.alreadyResponded) {
    const isConfirmed = data.guest.status === "confirmed"
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div
              className={`mx-auto w-12 h-12 rounded-full ${isConfirmed ? "bg-primary/10" : "bg-muted"} flex items-center justify-center mb-4`}
            >
              {isConfirmed ? (
                <Check className="h-6 w-6 text-primary" />
              ) : (
                <X className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <CardTitle>{isConfirmed ? "Presença Confirmada" : "Presença Recusada"}</CardTitle>
            <CardDescription>
              Você já respondeu a este convite para <strong>{data.event.title}</strong>.
            </CardDescription>
          </CardHeader>
          {isConfirmed && (
            <CardContent>
              <CalendarActions />
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  // Expirado
  if (data.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-amber-600">Prazo Expirado</CardTitle>
            <CardDescription>
              O prazo para confirmação de presença em <strong>{data.event.title}</strong> já expirou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Entre em contato com o organizador do evento se ainda deseja participar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Resposta registrada
  if (response) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div
              className={`mx-auto w-16 h-16 rounded-full ${response === "confirmed" ? "bg-primary/10" : "bg-muted"} flex items-center justify-center mb-4`}
            >
              {response === "confirmed" ? (
                <PartyPopper className="h-8 w-8 text-primary" />
              ) : (
                <X className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <CardTitle className={response === "confirmed" ? "text-primary" : ""}>
              {response === "confirmed" ? "Presença Confirmada!" : "Resposta Registrada"}
            </CardTitle>
            <CardDescription className="text-base">
              {response === "confirmed" ? (
                <>
                  Obrigado por confirmar sua presença em <strong>{data.event.title}</strong>. Estamos
                  ansiosos para vê-lo(a)!
                </>
              ) : (
                <>
                  Sentiremos sua falta em <strong>{data.event.title}</strong>. Esperamos vê-lo(a) em
                  uma próxima oportunidade!
                </>
              )}
            </CardDescription>
          </CardHeader>
          {response === "confirmed" && (
            <CardContent>
              <CalendarActions />
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  // Formulário de confirmação
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Confirmação de Presença
          </Badge>
          <h1 className="text-2xl font-bold text-foreground">Olá, {data.guest.name}!</h1>
          <p className="text-muted-foreground mt-2">
            Você foi convidado(a) para participar do evento
          </p>
        </div>

        {/* Event Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{data.event.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(data.event.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{data.event.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{data.event.location}</span>
              </div>
            </div>

            {data.event.description && (
              <p className="text-sm text-muted-foreground border-t pt-4">{data.event.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Companions */}
        {data.companions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Acompanhantes Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.companions.map((companion) => (
                  <li key={companion.id} className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {companion.name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Deadline Warning */}
        {data.guest.confirmationDeadline && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Confirme até <strong>{formatDeadline(data.guest.confirmationDeadline)}</strong>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Confirmar Presença
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleDecline}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Não Poderei Ir
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Ao confirmar ou recusar, você não poderá alterar sua resposta.
        </p>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Loader2,
  MapPin,
  PartyPopper,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseFlexibleEventDate } from "@/lib/domain/business-rules"

interface Companion {
  id: string
  name: string
  status?: string
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
  startDate?: string | null
  time: string
  location: string
  description?: string
  allowCompanions?: boolean
  maxCompanions?: number
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
  const token = params.token as string

  const [data, setData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [response, setResponse] = useState<"confirmed" | "declined" | null>(null)
  const [dietaryRestrictions, setDietaryRestrictions] = useState("")
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("")
  const [newCompanions, setNewCompanions] = useState<Array<{ name: string; relationship: string }>>([])

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/confirm/${encodeURIComponent(token)}`)
        const result = await res.json()

        if (!res.ok) {
          setError(result.error || "Convite não encontrado")
          return
        }

        setData(result)
        setDietaryRestrictions(result.guest?.dietaryRestrictions || "")
        setAccessibilityNeeds(result.guest?.accessibilityNeeds || "")
      } catch {
        setError("Erro ao carregar convite")
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token])

  const maxAllowedCompanions = data?.event?.allowCompanions ? Number(data.event.maxCompanions || 0) : 0
  const remainingCompanions = Math.max(0, maxAllowedCompanions - (data?.companions?.length || 0))

  const handleAddCompanionRow = () => {
    if (newCompanions.length >= remainingCompanions) return
    setNewCompanions((prev) => [...prev, { name: "", relationship: "" }])
  }

  const handleRemoveCompanionRow = (index: number) => {
    setNewCompanions((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const validCompanions = newCompanions
        .map((c) => ({ name: c.name.trim(), relationship: c.relationship.trim() || undefined }))
        .filter((c) => c.name.length >= 2)

      const res = await fetch(`/api/confirm/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietaryRestrictions: dietaryRestrictions.trim() || undefined,
          accessibilityNeeds: accessibilityNeeds.trim() || undefined,
          companions: validCompanions.length > 0 ? validCompanions : undefined,
        }),
      })

      if (res.ok) {
        setResponse("confirmed")
      } else {
        const result = await res.json().catch(() => ({}))
        setError(result.error || "Erro ao confirmar presença")
      }
    } catch {
      setError("Erro ao confirmar presença")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/confirm/${encodeURIComponent(token)}/decline`, {
        method: "POST",
      })

      if (res.ok) {
        setResponse("declined")
      } else {
        const result = await res.json().catch(() => ({}))
        setError(result.error || "Erro ao registrar resposta")
      }
    } catch {
      setError("Erro ao registrar resposta")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (eventObj: EventData) => {
    const parsed = parseFlexibleEventDate({
      startDate: eventObj.startDate,
      date: eventObj.date,
      time: eventObj.time,
    })
    if (!parsed) return eventObj.date
    return parsed.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatDeadline = (dateString: string) => {
    const parsed = parseFlexibleEventDate(dateString)
    if (!parsed) return dateString
    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getGoogleCalendarUrl = () => {
    if (!data?.event) return "#"

    const safeStart =
      parseFlexibleEventDate({
        startDate: data.event.startDate,
        date: data.event.date,
        time: data.event.time,
      }) || new Date()
    const safeEnd = new Date(safeStart.getTime() + 2 * 60 * 60 * 1000)
    const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const urlParams = new URLSearchParams({
      action: "TEMPLATE",
      text: data.event.title,
      dates: `${formatGoogleDate(safeStart)}/${formatGoogleDate(safeEnd)}`,
      details: data.event.description || "",
      location: data.event.location || "",
    })

    return `https://calendar.google.com/calendar/render?${urlParams.toString()}`
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
        <a href={`/api/confirm/${encodeURIComponent(token)}/calendar.ics`}>
          <Calendar className="h-4 w-4 mr-2" />
          Baixar convite .ics
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
                  Obrigado por confirmar sua presença em <strong>{data.event.title}</strong>. Estamos ansiosos para
                  vê-lo(a)!
                </>
              ) : (
                <>
                  Sentiremos sua falta em <strong>{data.event.title}</strong>. Esperamos vê-lo(a) em uma próxima
                  oportunidade!
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Confirmação de Presença
          </Badge>
          <h1 className="text-2xl font-bold text-foreground">Olá, {data.guest.name}!</h1>
          <p className="text-muted-foreground mt-2">Você foi convidado(a) para participar do evento</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{data.event.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(data.event)}</span>
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

        {data.companions && data.companions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Acompanhantes Registrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.companions.map((companion) => (
                  <li key={companion.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {companion.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {companion.status === "approved" ? "Aprovado" : "Pendente de aprovação"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações adicionais (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dietary">Restrições alimentares</Label>
              <Input
                id="dietary"
                placeholder="Ex: Vegetariano, Intolerância à lactose"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessibility">Necessidades de acessibilidade</Label>
              <Input
                id="accessibility"
                placeholder="Ex: Rampa de acesso, assento reservado"
                value={accessibilityNeeds}
                onChange={(e) => setAccessibilityNeeds(e.target.value)}
              />
            </div>

            {remainingCompanions > 0 && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Acompanhantes (até {remainingCompanions} — sujeitos à aprovação do organizador)
                  </Label>
                  {newCompanions.length < remainingCompanions && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCompanionRow}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                  )}
                </div>
                {newCompanions.map((comp, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Nome do acompanhante"
                      value={comp.name}
                      onChange={(e) => {
                        const copy = [...newCompanions]
                        copy[idx] = { ...copy[idx], name: e.target.value }
                        setNewCompanions(copy)
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCompanionRow(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {data.guest.confirmationDeadline && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Confirme até <strong>{formatDeadline(data.guest.confirmationDeadline)}</strong>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={handleConfirm} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Confirmar Presença
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={handleDecline} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
            Não Poderei Ir
          </Button>
        </div>
      </div>
    </div>
  )
}

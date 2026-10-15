"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Share2,
  Users,
  UtensilsCrossed,
  XCircle,
  Copy,
  Check,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"
import { getEventTerminology } from "@/lib/terminology"
import { getEventById as fetchEventById } from "@/app/actions/events"

export default function HostViewPage() {
  const params = useParams()
  const eventId = params.id as string
  const { getEventById } = useEventStore()
  const storedEvent = getEventById(eventId)
  const [remoteEvent, setRemoteEvent] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const event = storedEvent || remoteEvent

  useEffect(() => {
    let active = true

    async function load() {
      if (storedEvent) {
        setIsLoading(false)
        return
      }

      const res = await fetchEventById(eventId)
      if (active && res.data) {
        setRemoteEvent(res.data)
      }
      setIsLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [eventId, storedEvent])

  const terminology = useMemo(() => {
    return getEventTerminology(event?.type)
  }, [event?.type])

  const stats = useMemo(() => {
    const guests = event?.guests || []
    const confirmed = guests.filter((g: any) => g.status === "confirmed")
    const pending = guests.filter((g: any) => g.status === "pending")
    const declined = guests.filter((g: any) => g.status === "declined" || g.status === "rejected")

    // Calcular restrições alimentares
    const dietaryMap: Record<string, number> = {}
    guests.forEach((g: any) => {
      const rest = g.dietary_restrictions || g.dietaryRestrictions
      if (rest && typeof rest === "string" && rest.trim()) {
        const items = rest.split(",").map((s) => s.trim().toLowerCase())
        items.forEach((item) => {
          if (!item) return
          const key = item.charAt(0).toUpperCase() + item.slice(1)
          dietaryMap[key] = (dietaryMap[key] || 0) + 1
        })
      }
    })

    const total = guests.length || event?.totalGuests || 0
    const rate = total > 0 ? Math.round((confirmed.length / total) * 100) : 0

    return {
      total,
      confirmedList: confirmed,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      declinedCount: declined.length,
      rate,
      dietaryMap,
    }
  }, [event])

  const filteredConfirmed = useMemo(() => {
    if (!searchTerm.trim()) return stats.confirmedList
    const term = searchTerm.toLowerCase()
    return stats.confirmedList.filter(
      (g: any) =>
        (g.name || "").toLowerCase().includes(term) ||
        (g.email || "").toLowerCase().includes(term) ||
        (g.department || "").toLowerCase().includes(term)
    )
  }, [stats.confirmedList, searchTerm])

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast({ title: "Link copiado!", description: "Compartilhe este link com noivos, diretoria ou anfitriões." })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando painel do anfitrião...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      {/* Header Fixo de Modo Leitura */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
              Modo Visualização do Anfitrião
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">Acompanhamento em tempo real</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Link Copiado" : "Compartilhar Painel"}
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Banner do Evento */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className="bg-emerald-600 text-white">{event.type || "Evento"}</Badge>
              <span className="text-xs text-muted-foreground">{terminology.hostLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{event.title}</h1>
            {event.description && <p className="text-sm text-muted-foreground max-w-2xl">{event.description}</p>}

            <div className="flex flex-wrap gap-4 pt-2 text-xs sm:text-sm text-muted-foreground border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{event.date} {event.time ? `às ${event.time}` : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{event.location || event.address || "Local a confirmar"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground">Total de {terminology.guestsLabel}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-bold">{stats.total}</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-emerald-500/20 bg-emerald-500/5">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Confirmados</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.confirmedCount}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-amber-500/20 bg-amber-500/5">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Aguardando Resposta</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.pendingCount}</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground">Não comparecerão</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">{stats.declinedCount}</span>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Barra de Progresso de RSVP */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-foreground">Taxa de Confirmação de Presença</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{stats.rate}%</span>
          </div>
          <Progress value={stats.rate} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.confirmedCount} de {stats.total} {terminology.guestsLabel.toLowerCase()} com presença garantida.
          </p>
        </Card>

        {/* Relatório de Restrições Alimentares (Buffet) */}
        {Object.keys(stats.dietaryMap).length > 0 && (
          <Card className="p-5">
            <CardHeader className="p-0 pb-3 flex flex-row items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Cardápio & Restrições Alimentares (Relatório Buffet)</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(stats.dietaryMap).map(([restriction, count]) => (
                <div key={restriction} className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-muted text-xs">
                  <span className="font-medium">{restriction}:</span>
                  <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px]">
                    {count} pessoa(s)
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Lista Nominal de Confirmados */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <CardTitle className="text-base">Lista de Presenças Confirmadas</CardTitle>
              <p className="text-xs text-muted-foreground">Visualização nominal dos confirmados até o momento.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar confirmado..."
                className="pl-8 text-xs h-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredConfirmed.length > 0 ? (
            <div className="divide-y border rounded-md max-h-80 overflow-y-auto bg-card text-xs">
              {filteredConfirmed.map((guest: any, idx: number) => (
                <div key={guest.id || idx} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground text-sm block">{guest.name}</span>
                    <span className="text-muted-foreground">{guest.email || "Sem e-mail"}</span>
                    {guest.department && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-medium">
                        {guest.department}
                      </span>
                    )}
                  </div>
                  <Badge variant="success" size="sm" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Confirmado
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Nenhuma confirmação encontrada para a busca.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

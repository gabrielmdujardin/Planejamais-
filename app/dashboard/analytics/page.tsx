"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FilterX,
  Lightbulb,
  Loader2,
  Target,
  Users,
} from "lucide-react"
import { BackButton } from "@/components/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEventStore } from "@/stores/event-store"

type ChartItem = {
  name: string
  value?: number
  total?: number
  confirmed?: number
  pending?: number
  declined?: number
  responseRate?: number
  events?: number
  guests?: number
  share?: number
  cumulative?: number
  detail?: string
  level?: string
  reason?: string
  confirmationRate?: number
  totalGuests?: number
  totalCost?: number
  costPerGuest?: number
  publicRequests?: number
  companions?: number
  daysUntilEvent?: number | null
}

type Insight = {
  tone: "warning" | "success" | "info" | "risk"
  title: string
  description: string
  reason?: string
}

type AnalyticsData = {
  filters: {
    selectedEventId: string
    events: Array<{ id: string; title: string }>
  }
  metrics: {
    totalEvents: number
    totalGuests: number
    confirmedGuests: number
    pendingGuests: number
    declinedGuests: number
    confirmationRate: number
    responseRate: number
    pendingRequests: number
    requestedCompanions: number
    approvedCompanions: number
    pendingCompanions: number
    rejectedCompanions: number
    publicInviteGuests: number
    totalPeopleEstimated: number
    totalPeopleConfirmed: number
    projectedPeopleLikely: number
    projectedPeopleMax: number
    estimatedCost: number
    confirmedCost: number
    likelyCost: number
    maxCost: number
    averageCostPerGuest: number
    averageCostPerConfirmed: number
    itemsCount: number
    highRiskEvents: number
  }
  charts: {
    rsvpStatus: ChartItem[]
    companionStatus: ChartItem[]
    confirmationFunnel: ChartItem[]
    attendanceProjection: ChartItem[]
    costProjection: ChartItem[]
    paretoCosts: ChartItem[]
    costByEvent: ChartItem[]
    costByItem: ChartItem[]
    confirmationsByEvent: ChartItem[]
    confirmationsOverTime: ChartItem[]
    eventsByStatus: ChartItem[]
    eventsByMonth: ChartItem[]
    advancedComparison: ChartItem[]
    riskMatrix: ChartItem[]
  }
  insights: Insight[]
  rankings: {
    attentionEvents: Array<{ name: string; score: number; level: string; reason: string }>
  }
}

type LocalEvent = {
  id: string
  title: string
  type: string
  category?: string
  status?: string
  date: string
  createdAt?: string
  guests?: Array<{
    id: string
    name: string
    status: "pending" | "confirmed" | "declined"
  }>
  items?: Array<{
    id: string
    name: string
    price: number
  }>
}

const RSVP_COLORS = ["#059669", "#d97706", "#dc2626", "#2563eb"]
const COMPANION_COLORS = ["#2563eb", "#d97706", "#dc2626"]
const STATUS_COLORS = ["#2563eb", "#059669", "#dc2626", "#7c3aed"]
const RISK_COLORS: Record<string, string> = {
  Baixo: "#059669",
  Médio: "#d97706",
  Alto: "#dc2626",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatPercent(value: number) {
  return `${(value || 0).toFixed(0)}%`
}

function buildLocalAnalytics(events: LocalEvent[], selectedEventId: string): AnalyticsData {
  const filteredEvents = selectedEventId === "all" ? events : events.filter((event) => event.id === selectedEventId)
  const allGuests = filteredEvents.flatMap((event) => event.guests || [])
  const allItems = filteredEvents.flatMap((event) => itemEventPairs(event))
  const confirmedGuests = allGuests.filter((guest) => guest.status === "confirmed").length
  const pendingGuests = allGuests.filter((guest) => guest.status === "pending").length
  const declinedGuests = allGuests.filter((guest) => guest.status === "declined").length
  const estimatedCost = allItems.reduce((sum, item) => sum + item.value, 0)
  const confirmationRate = allGuests.length > 0 ? (confirmedGuests / allGuests.length) * 100 : 0
  const responseRate = allGuests.length > 0 ? ((confirmedGuests + declinedGuests) / allGuests.length) * 100 : 0
  const projectedPeopleLikely = confirmedGuests + Math.ceil(pendingGuests * 0.45)
  const projectedPeopleMax = confirmedGuests + pendingGuests
  const costPerPersonBase = projectedPeopleMax > 0 ? estimatedCost / projectedPeopleMax : 0

  const costByEvent = filteredEvents
    .map((event) => ({
      name: event.title,
      value: (event.items || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  let cumulativeCost = 0
  const paretoCosts = allItems
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((item) => {
      cumulativeCost += item.value
      return {
        name: item.name,
        value: item.value,
        share: estimatedCost > 0 ? (item.value / estimatedCost) * 100 : 0,
        cumulative: estimatedCost > 0 ? (cumulativeCost / estimatedCost) * 100 : 0,
      }
    })

  const confirmationsByEvent = filteredEvents.map((event) => {
    const guests = event.guests || []
    const confirmed = guests.filter((guest) => guest.status === "confirmed").length
    const pending = guests.filter((guest) => guest.status === "pending").length
    const declined = guests.filter((guest) => guest.status === "declined").length
    return {
      name: event.title,
      total: guests.length,
      confirmed,
      pending,
      declined,
      responseRate: guests.length > 0 ? Math.round(((confirmed + declined) / guests.length) * 100) : 0,
    }
  })

  const advancedComparison = filteredEvents.map((event) => {
    const guests = event.guests || []
    const confirmed = guests.filter((guest) => guest.status === "confirmed").length
    const pending = guests.filter((guest) => guest.status === "pending").length
    const totalCost = (event.items || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    return {
      name: event.title,
      confirmationRate: guests.length > 0 ? Math.round((confirmed / guests.length) * 100) : 0,
      totalGuests: guests.length,
      confirmed,
      totalCost,
      costPerGuest: guests.length > 0 ? totalCost / guests.length : 0,
      pending,
      publicRequests: 0,
      companions: 0,
    }
  })

  const riskMatrix = advancedComparison.map((event) => {
    const score = (event.confirmationRate < 45 && event.totalGuests > 0 ? 3 : 0) + (event.pending >= 3 ? 2 : 0)
    return {
      name: event.name,
      value: score,
      level: score >= 5 ? "Alto" : score >= 2 ? "Médio" : "Baixo",
      confirmationRate: event.confirmationRate,
      pending: event.pending,
      costPerGuest: event.costPerGuest,
      reason: score > 0 ? "baixa confirmação ou muitos pendentes" : "sem sinais críticos",
    }
  })

  const eventsByStatusMap = filteredEvents.reduce<Record<string, number>>((acc, event) => {
    const status = event.status || "pending"
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const eventsByMonthMap = filteredEvents.reduce<Record<string, { events: number; guests: number }>>((acc, event) => {
    const date = new Date(event.createdAt || event.date || "")
    const label = Number.isNaN(date.getTime())
      ? "Sem data"
      : date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    if (!acc[label]) acc[label] = { events: 0, guests: 0 }
    acc[label].events += 1
    acc[label].guests += (event.guests || []).length
    return acc
  }, {})

  const metrics = {
    totalEvents: filteredEvents.length,
    totalGuests: allGuests.length,
    confirmedGuests,
    pendingGuests,
    declinedGuests,
    confirmationRate,
    responseRate,
    pendingRequests: 0,
    requestedCompanions: 0,
    approvedCompanions: 0,
    pendingCompanions: 0,
    rejectedCompanions: 0,
    publicInviteGuests: 0,
    totalPeopleEstimated: projectedPeopleMax,
    totalPeopleConfirmed: confirmedGuests,
    projectedPeopleLikely,
    projectedPeopleMax,
    estimatedCost,
    confirmedCost: costPerPersonBase * confirmedGuests,
    likelyCost: costPerPersonBase * projectedPeopleLikely,
    maxCost: costPerPersonBase * projectedPeopleMax,
    averageCostPerGuest: allGuests.length > 0 ? estimatedCost / allGuests.length : 0,
    averageCostPerConfirmed: confirmedGuests > 0 ? estimatedCost / confirmedGuests : 0,
    itemsCount: allItems.length,
    highRiskEvents: riskMatrix.filter((event) => event.level === "Alto").length,
  }

  return {
    filters: {
      selectedEventId,
      events: events.map((event) => ({ id: event.id, title: event.title })),
    },
    metrics,
    charts: {
      rsvpStatus: [
        { name: "Confirmados", value: confirmedGuests },
        { name: "Pendentes", value: pendingGuests },
        { name: "Recusados", value: declinedGuests },
        { name: "Aguardando aprovação", value: 0 },
      ],
      companionStatus: [
        { name: "Aprovados", value: 0 },
        { name: "Pendentes", value: 0 },
        { name: "Recusados", value: 0 },
      ],
      confirmationFunnel: [
        { name: "Total de convidados", value: allGuests.length },
        { name: "Pendentes", value: pendingGuests },
        { name: "Confirmados", value: confirmedGuests },
        { name: "Recusados", value: declinedGuests },
        { name: "Aguardando aprovação", value: 0 },
        { name: "Acompanhantes solicitados", value: 0 },
        { name: "Acompanhantes aprovados", value: 0 },
      ],
      attendanceProjection: [
        { name: "Mínima", value: confirmedGuests, detail: "Apenas confirmados" },
        { name: "Provável", value: projectedPeopleLikely, detail: "Confirmados + parte dos pendentes" },
        { name: "Máxima", value: projectedPeopleMax, detail: "Confirmados + pendentes" },
      ],
      costProjection: [
        { name: "Atual estimado", value: estimatedCost },
        { name: "Confirmados", value: costPerPersonBase * confirmedGuests },
        { name: "Provável", value: costPerPersonBase * projectedPeopleLikely },
        { name: "Máximo", value: costPerPersonBase * projectedPeopleMax },
        { name: "Médio por pessoa", value: costPerPersonBase },
      ],
      paretoCosts,
      costByEvent,
      costByItem: paretoCosts,
      confirmationsByEvent,
      confirmationsOverTime: [],
      eventsByStatus: Object.entries(eventsByStatusMap).map(([name, value]) => ({ name, value })),
      eventsByMonth: Object.entries(eventsByMonthMap).map(([name, value]) => ({
        name,
        events: value.events,
        guests: value.guests,
      })),
      advancedComparison,
      riskMatrix,
    },
    insights: [
      {
        tone: "info",
        title: "Modo local em uso",
        description:
          "O Supabase não está configurado neste ambiente, então o dashboard está usando os eventos salvos localmente no navegador.",
        reason: "A API de analytics retornou ausência de configuração ou sessão Supabase.",
      },
      ...(confirmationRate < 45 && allGuests.length > 0
        ? [
            {
              tone: "risk" as const,
              title: "Taxa de confirmação baixa",
              description: `A taxa atual é de ${confirmationRate.toFixed(0)}%.`,
              reason: "Menos de 45% dos convidados locais estão confirmados.",
            },
          ]
        : []),
      ...(allItems.length === 0
        ? [
            {
              tone: "info" as const,
              title: "Custos ainda não cadastrados",
              description: "Adicione itens ao evento para liberar análises financeiras.",
              reason: "Nenhum item local foi encontrado no recorte atual.",
            },
          ]
        : []),
    ],
    rankings: {
      attentionEvents: riskMatrix
        .filter((event) => (event.value || 0) > 0)
        .map((event) => ({
          name: event.name,
          score: event.value || 0,
          level: event.level || "Baixo",
          reason: event.reason || "Sem alertas relevantes.",
        })),
    },
  }
}

function itemEventPairs(event: LocalEvent) {
  return (event.items || []).map((item) => ({
    name: item.name,
    value: Number(item.price) || 0,
    eventName: event.title,
  }))
}

function getToneClasses(tone: "positive" | "attention" | "critical" | "neutral") {
  const classes = {
    positive: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
    attention: "border-amber-200 bg-amber-50/70 text-amber-700",
    critical: "border-red-200 bg-red-50/70 text-red-700",
    neutral: "border-slate-200 bg-slate-50/70 text-slate-700",
  }
  return classes[tone]
}

function getInsightIcon(tone: Insight["tone"]) {
  if (tone === "success") return CheckCircle2
  if (tone === "warning" || tone === "risk") return AlertTriangle
  return Lightbulb
}

function getInsightClasses(tone: Insight["tone"]) {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (tone === "risk") return "border-red-200 bg-red-50 text-red-800"
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-800"
  return "border-blue-200 bg-blue-50 text-blue-800"
}

function EmptyChart({ label = "Sem dados suficientes para este gráfico." }: { label?: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed bg-slate-50/70 p-6 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyAnalyticsState({
  title,
  description,
  reason,
  onClearFilters,
}: {
  title: string
  description: string
  reason?: string
  onClearFilters: () => void
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-500">
          <ClipboardList className="h-9 w-9" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">{description}</p>
          {reason && <p className="mx-auto max-w-xl text-xs text-slate-500">{reason}</p>}
        </div>
        <div className="grid w-full max-w-2xl gap-3 text-left md:grid-cols-3">
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-sm font-medium">1. Verifique a sessão</p>
            <p className="mt-1 text-xs text-muted-foreground">As análises usam apenas dados Supabase do usuário autenticado.</p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-sm font-medium">2. Cadastre dados</p>
            <p className="mt-1 text-xs text-muted-foreground">Eventos, convidados e custos liberam os gráficos do dashboard.</p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-sm font-medium">3. Revise filtros</p>
            <p className="mt-1 text-xs text-muted-foreground">Um recorte restrito pode ocultar eventos que já existem.</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 bg-white hover:border-emerald-300" onClick={onClearFilters}>
          <FilterX className="h-4 w-4" />
          Limpar filtros
        </Button>
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  helper,
  icon: Icon,
  tone = "neutral",
}: {
  title: string
  value: string | number
  detail?: string
  helper: string
  icon: typeof Calendar
  tone?: "positive" | "attention" | "critical" | "neutral"
}) {
  return (
    <Card
      title={helper}
      className="group border-slate-200 bg-white/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
          {detail && <CardDescription className="text-xs">{detail}</CardDescription>}
        </div>
        <div className={`rounded-lg border p-2 ${getToneClasses(tone)}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-950">{value}</div>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={`border-slate-200 bg-white/95 shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-950">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-white p-3 text-sm shadow-lg">
      <p className="mb-2 font-medium text-slate-950">{label || payload[0]?.name}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-slate-900">
              {String(entry.dataKey || "").toLowerCase().includes("cost") || entry.name?.toLowerCase().includes("custo")
                ? formatCurrency(Number(entry.value))
                : entry.value}
            </span>
          </div>
        ))}
      </div>
      {payload[0]?.payload?.detail && <p className="mt-2 max-w-xs text-xs text-muted-foreground">{payload[0].payload.detail}</p>}
      {payload[0]?.payload?.reason && <p className="mt-2 max-w-xs text-xs text-muted-foreground">{payload[0].payload.reason}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [selectedEventId, setSelectedEventId] = useState("all")
  const [period, setPeriod] = useState("all")
  const [eventStatus, setEventStatus] = useState("all")
  const [guestStatus, setGuestStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { events: localEvents } = useEventStore()

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        eventId: selectedEventId,
        period,
        eventStatus,
        guestStatus,
      })
      if (period === "custom" && startDate) params.set("startDate", startDate)
      if (period === "custom" && endDate) params.set("endDate", endDate)

      try {
        const response = await fetch(`/api/analytics?${params.toString()}`, { cache: "no-store" })
        const payload = await response.json()

        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar as análises.")
        const hasServerData =
          payload.metrics?.totalEvents > 0 || payload.metrics?.totalGuests > 0 || payload.metrics?.itemsCount > 0
        const shouldUseLocalFallback =
          !hasServerData &&
          localEvents.length > 0 &&
          ["Supabase não configurado", "Sessão Supabase ausente"].includes(payload.insights?.[0]?.title)

        if (!cancelled) {
          setData(shouldUseLocalFallback ? buildLocalAnalytics(localEvents as LocalEvent[], selectedEventId) : payload)
        }
      } catch (caught) {
        if (!cancelled) {
          if (localEvents.length > 0) {
            setData(buildLocalAnalytics(localEvents as LocalEvent[], selectedEventId))
            setError(null)
          } else {
            setError(caught instanceof Error ? caught.message : "Erro inesperado.")
            setData(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAnalytics()

    return () => {
      cancelled = true
    }
  }, [endDate, eventStatus, guestStatus, localEvents, period, selectedEventId, startDate])

  const hasAnyData = useMemo(() => {
    if (!data) return false
    return data.metrics.totalEvents > 0 || data.metrics.totalGuests > 0 || data.metrics.itemsCount > 0
  }, [data])

  const clearFilters = () => {
    setSelectedEventId("all")
    setPeriod("all")
    setEventStatus("all")
    setGuestStatus("all")
    setStartDate("")
    setEndDate("")
  }

  const metricTone = data?.metrics.confirmationRate
    ? data.metrics.confirmationRate >= 70
      ? "positive"
      : data.metrics.confirmationRate >= 45
        ? "attention"
        : "critical"
    : "neutral"

  return (
    <div className="min-h-screen bg-slate-50 p-4 pt-16 text-slate-950 md:p-8 md:pt-20">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Planeja+ Analytics</p>
            <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Painel de decisão com dados reais dos seus eventos, convidados, aprovações e custos.
            </p>
          </div>
          <BackButton />
        </div>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Filtros e visão geral"
            title="Contexto da análise"
            description="Selecione o recorte desejado para atualizar todos os indicadores, gráficos e insights sem recarregar a página."
          />
          <Card className="border-slate-200 bg-white/95 shadow-sm">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label>Evento</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-white transition hover:border-emerald-300">
                      <SelectValue placeholder="Selecionar evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os eventos</SelectItem>
                      {(data?.filters.events || []).map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="bg-white transition hover:border-emerald-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      <SelectItem value="this-month">Este mês</SelectItem>
                      <SelectItem value="last-30-days">Últimos 30 dias</SelectItem>
                      <SelectItem value="upcoming">Próximos eventos</SelectItem>
                      <SelectItem value="finished">Eventos finalizados</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status do evento</Label>
                  <Select value={eventStatus} onValueChange={setEventStatus}>
                    <SelectTrigger className="bg-white transition hover:border-emerald-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="confirmed">Ativos</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status de convidados</Label>
                  <Select value={guestStatus} onValueChange={setGuestStatus}>
                    <SelectTrigger className="bg-white transition hover:border-emerald-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="confirmed">Confirmados</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="declined">Recusados</SelectItem>
                      <SelectItem value="awaiting_approval">Aguardando aprovação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full gap-2 bg-white hover:border-emerald-300" onClick={clearFilters}>
                    <FilterX className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                </div>
              </div>

              {period === "custom" && (
                <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {loading && (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border bg-white">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando análises...
            </div>
          </div>
        )}

        {!loading && error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 pt-6 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && data && !hasAnyData && (
          <EmptyAnalyticsState
            title={data.insights[0]?.title || "Ainda não há dados para analisar"}
            description={
              data.insights[0]?.description ||
              "Nenhum evento, convidado ou custo foi encontrado para os filtros atuais."
            }
            reason={data.insights[0]?.reason}
            onClearFilters={clearFilters}
          />
        )}

        {!loading && !error && data && hasAnyData && (
          <>
            <section className="space-y-4">
              <SectionHeader
                eyebrow="Indicadores principais"
                title="Resumo executivo"
                description="Métricas de topo para acompanhar volume, confirmação, orçamento e risco operacional."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Eventos filtrados" value={data.metrics.totalEvents} helper="Total de eventos do usuário autenticado no recorte atual." icon={Calendar} />
                <MetricCard
                  title="Convidados"
                  value={data.metrics.totalGuests}
                  detail={`${data.metrics.confirmedGuests} confirmados`}
                  helper="Total de convidados encontrados nos eventos filtrados."
                  icon={Users}
                  tone="neutral"
                />
                <MetricCard
                  title="Taxa de confirmação"
                  value={formatPercent(data.metrics.confirmationRate)}
                  detail={`${formatPercent(data.metrics.responseRate)} de resposta`}
                  helper="Taxa baseada em convidados confirmados sobre total de convidados."
                  icon={CheckCircle2}
                  tone={metricTone}
                />
                <MetricCard
                  title="Custo estimado"
                  value={formatCurrency(data.metrics.estimatedCost)}
                  detail={`${data.metrics.itemsCount} item(ns) cadastrados`}
                  helper="Soma dos custos reais cadastrados nos itens dos eventos filtrados."
                  icon={DollarSign}
                  tone={data.metrics.estimatedCost > 0 ? "positive" : "attention"}
                />
                <MetricCard
                  title="Pendências"
                  value={data.metrics.pendingGuests + data.metrics.pendingRequests}
                  detail={`${data.metrics.pendingRequests} aguardando aprovação`}
                  helper="Convidados pendentes e solicitações públicas que ainda precisam de ação."
                  icon={ClipboardList}
                  tone={data.metrics.pendingGuests + data.metrics.pendingRequests > 0 ? "attention" : "positive"}
                />
                <MetricCard
                  title="Acompanhantes"
                  value={data.metrics.requestedCompanions}
                  detail={`${data.metrics.approvedCompanions} aprovados, ${data.metrics.pendingCompanions} pendentes`}
                  helper="Solicitações de acompanhantes vinculadas aos convidados filtrados."
                  icon={Users}
                  tone={data.metrics.pendingCompanions > 0 ? "attention" : "neutral"}
                />
                <MetricCard
                  title="Presença provável"
                  value={data.metrics.projectedPeopleLikely}
                  detail={`${data.metrics.totalPeopleConfirmed} presença mínima`}
                  helper="Cenário provável com confirmados, acompanhantes aprovados e parte dos pendentes."
                  icon={Target}
                  tone="positive"
                />
                <MetricCard
                  title="Eventos em risco alto"
                  value={data.metrics.highRiskEvents}
                  helper="Quantidade de eventos classificados como risco alto pela matriz de risco."
                  icon={AlertTriangle}
                  tone={data.metrics.highRiskEvents > 0 ? "critical" : "positive"}
                />
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader
                eyebrow="Confirmações e convidados"
                title="Participação e gargalos"
                description="Acompanhe onde os convidados estão na jornada e como a presença pode variar."
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Funil de confirmação" description="Mostra os gargalos entre convidados, respostas, aprovações e acompanhantes.">
                  {data.charts.confirmationFunnel.some((item) => (item.value || 0) > 0) ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={data.charts.confirmationFunnel} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Quantidade" radius={[0, 8, 8, 0]} fill="#0f766e" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="Este evento ainda não possui convidados suficientes para gerar um funil." />
                  )}
                </ChartCard>

                <ChartCard title="Projeção de presença" description="Cenários de mínima, provável e máxima para planejamento de espaço e recursos.">
                  {data.charts.attendanceProjection.some((item) => (item.value || 0) > 0) ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={data.charts.attendanceProjection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Pessoas" radius={[8, 8, 0, 0]}>
                          {data.charts.attendanceProjection.map((entry, index) => (
                            <Cell key={entry.name} fill={["#059669", "#2563eb", "#d97706"][index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="Adicione convidados ou aprovações para projetar presença." />
                  )}
                </ChartCard>

                <ChartCard title="Status de RSVP" description="Distribuição atual dos convidados por confirmação, pendência, recusa e aprovação.">
                  {data.charts.rsvpStatus.some((item) => (item.value || 0) > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={data.charts.rsvpStatus} dataKey="value" nameKey="name" outerRadius={100} label>
                          {data.charts.rsvpStatus.map((entry, index) => (
                            <Cell key={entry.name} fill={RSVP_COLORS[index % RSVP_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="Nenhum status de RSVP encontrado para o filtro atual." />
                  )}
                </ChartCard>

                <ChartCard title="Linha do tempo de confirmações" description="Evolução diária usando confirmed_at, responded_at ou created_at quando necessário.">
                  {data.charts.confirmationsOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.charts.confirmationsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="value" name="Confirmações" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="Este evento ainda não possui confirmações suficientes para gerar uma linha do tempo." />
                  )}
                </ChartCard>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader
                eyebrow="Projeções e riscos"
                title="Cenários que pedem decisão"
                description="Veja estimativas financeiras e eventos ordenados por prioridade de atenção."
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Projeção de custo por cenário" description="Estimativa de custo conforme mínima, provável e máxima presença possível.">
                  {data.charts.costProjection.some((item) => (item.value || 0) > 0) ? (
                    <ResponsiveContainer width="100%" height={310}>
                      <BarChart data={data.charts.costProjection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Custo" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="Cadastre custos e convidados para calcular cenários financeiros." />
                  )}
                </ChartCard>

                <ChartCard title="Matriz de risco do evento" description="Risco baseado em confirmação, pendências, proximidade, custo e aprovações.">
                  {data.charts.riskMatrix.length > 0 ? (
                    <div className="space-y-3">
                      {data.charts.riskMatrix.map((event) => (
                        <div key={event.name} className="rounded-lg border p-4 transition hover:border-emerald-200 hover:shadow-sm" title={event.reason}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <p className="text-sm text-muted-foreground">{event.reason}</p>
                            </div>
                            <Badge style={{ backgroundColor: RISK_COLORS[event.level || "Baixo"] }} className="text-white">
                              {event.level}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                            <span>{formatPercent(event.confirmationRate || 0)} confirmação</span>
                            <span>{event.pending || 0} pendências</span>
                            <span>{formatCurrency(event.costPerGuest || 0)} por convidado</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyChart label="Sem eventos suficientes para calcular risco." />
                  )}
                </ChartCard>

                <ChartCard title="Ranking de eventos que precisam de atenção" description="Ordenado por sinais de risco e pendências operacionais." className="lg:col-span-2">
                  {data.rankings.attentionEvents.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {data.rankings.attentionEvents.map((event) => (
                        <div key={event.name} className="rounded-lg border bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md" title={event.reason}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{event.reason}</p>
                            </div>
                            <Badge variant={event.level === "Alto" ? "destructive" : "outline"}>{event.level}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyChart label="Nenhum evento exige atenção no recorte atual." />
                  )}
                </ChartCard>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader
                eyebrow="Custos"
                title="Impacto financeiro"
                description="Identifique itens e eventos que concentram orçamento para agir onde há maior impacto."
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Pareto de custos" description="Itens ordenados por impacto, com linha de participação acumulada.">
                  {data.charts.paretoCosts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={330}>
                      <ComposedChart data={data.charts.paretoCosts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(Number(value))} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="value" name="Custo" fill="#0f766e" radius={[8, 8, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" name="% acumulado" stroke="#dc2626" strokeWidth={2} />
                        <ReferenceLine yAxisId="right" y={80} stroke="#d97706" strokeDasharray="4 4" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="Nenhum item de custo cadastrado para gerar Pareto." />
                  )}
                </ChartCard>

                <ChartCard title="Custo total por evento" description="Ranking dos eventos com maior custo estimado.">
                  {data.charts.costByEvent.length > 0 ? (
                    <ResponsiveContainer width="100%" height={330}>
                      <BarChart data={data.charts.costByEvent} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(Number(value))} />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Custo" fill="#2563eb" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="Nenhum custo cadastrado nos eventos filtrados." />
                  )}
                </ChartCard>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader
                eyebrow="Comparativos entre eventos"
                title="Desempenho por evento"
                description="Compare confirmação, volume, custos, solicitações e acompanhantes quando estiver analisando múltiplos eventos."
              />
              <div className="grid gap-6">
                <ChartCard title="Comparativo de confirmações" description="Total de convidados por status em cada evento.">
                  {data.charts.confirmationsByEvent.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={data.charts.confirmationsByEvent}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="confirmed" name="Confirmados" stackId="a" fill="#059669" />
                        <Bar dataKey="pending" name="Pendentes" stackId="a" fill="#d97706" />
                        <Bar dataKey="declined" name="Recusados" stackId="a" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartCard>

                <Card className="border-slate-200 bg-white/95 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Comparativo avançado</CardTitle>
                    <CardDescription>Indicadores por evento para priorizar decisões.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    {data.charts.advancedComparison.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Confirmação</TableHead>
                            <TableHead>Convidados</TableHead>
                            <TableHead>Confirmados</TableHead>
                            <TableHead>Custo</TableHead>
                            <TableHead>Custo/convidado</TableHead>
                            <TableHead>Pendências</TableHead>
                            <TableHead>Solicitações</TableHead>
                            <TableHead>Acompanhantes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.charts.advancedComparison.map((event) => (
                            <TableRow key={event.name}>
                              <TableCell className="min-w-[180px] font-medium">{event.name}</TableCell>
                              <TableCell>{formatPercent(event.confirmationRate || 0)}</TableCell>
                              <TableCell>{event.totalGuests || 0}</TableCell>
                              <TableCell>{event.confirmed || 0}</TableCell>
                              <TableCell>{formatCurrency(event.totalCost || 0)}</TableCell>
                              <TableCell>{formatCurrency(event.costPerGuest || 0)}</TableCell>
                              <TableCell>{event.pending || 0}</TableCell>
                              <TableCell>{event.publicRequests || 0}</TableCell>
                              <TableCell>{event.companions || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyChart label="Sem eventos suficientes para comparar." />
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader
                eyebrow="Insights automáticos"
                title="Alertas e oportunidades"
                description="Mensagens calculadas a partir dos dados reais filtrados, classificadas por impacto."
              />
              <div className="grid gap-3 md:grid-cols-2">
                {data.insights.map((insight) => {
                  const Icon = getInsightIcon(insight.tone)
                  return (
                    <div
                      key={`${insight.title}-${insight.description}`}
                      title={insight.reason}
                      className={`rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${getInsightClasses(insight.tone)}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{insight.title}</h3>
                            <Badge variant="outline" className="bg-white/70 capitalize">
                              {insight.tone === "risk" ? "Risco" : insight.tone === "warning" ? "Atenção" : insight.tone === "success" ? "Oportunidade" : "Informação"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm opacity-90">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

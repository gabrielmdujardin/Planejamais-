"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton-loader"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Plus,
  CalendarDays,
  Grid3X3,
  MapPin,
  Clock,
  Filter,
  Users,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Wallet,
  PiggyBank,
  Receipt,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
} from "lucide-react"
import EventCard from "@/components/event-card"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useEventStore } from "@/stores/event-store"
import { getEvents } from "@/app/actions/events"
import { motion } from "framer-motion"
import { AnimatedCard } from "@/components/animated-card"
import { Calendar, dateFnsLocalizer, type View, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addHours } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import "react-big-calendar/lib/css/react-big-calendar.css"

// Configuração do localizador para português
const locales = {
  "pt-BR": ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
})

// Mensagens em português
const messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há eventos neste período.",
  showMore: (total: number) => `+ Ver mais (${total})`,
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    location: string
    description: string
    type: string
    status: "confirmed" | "pending" | "cancelled"
    originalDate: string
    originalTime: string
  }
}

interface DatabaseEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  type: string
  status: "confirmed" | "pending" | "cancelled"
}

// Dados mockados removidos

export default function Dashboard() {
  const { user } = useAuth()
  const { events, setEvents } = useEventStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")

  // Estados do calendário
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEventType, setSelectedEventType] = useState<string>("all")
  const [eventTypes, setEventTypes] = useState<string[]>([])

  // Simular carregamento de eventos do usuário
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await getEvents()
        if (!result.error) {
          setEvents(result.data)
        }
      } catch (error) {
        console.error("Erro ao carregar eventos:", error)
        toast({
          title: "Erro ao carregar eventos",
          description: "Não foi possível buscar seus eventos no Supabase.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [setEvents, toast])

  // Buscar eventos mockados para o calendário
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (activeTab !== "calendar") return

      try {
        setCalendarLoading(true)

        const data: DatabaseEvent[] = events.map((event) => ({
          id: event.id,
          title: event.title,
          date: event.fullDate || event.date,
          time: event.time,
          location: event.location,
          description: event.description,
          type: event.type,
          status: "confirmed",
        }))

        // Converter eventos do banco para formato do calendário
        const calendarEventsData: CalendarEvent[] = data.map((event) => {
          const [day, month, year] = event.date.split("/")
          const [hours, minutes] = event.time.split(":")

          const startDate = new Date(
            Number.parseInt(year),
            Number.parseInt(month) - 1,
            Number.parseInt(day),
            Number.parseInt(hours),
            Number.parseInt(minutes),
          )

          const endDate = addHours(startDate, 2)

          return {
            id: event.id,
            title: event.title,
            start: startDate,
            end: endDate,
            resource: {
              location: event.location,
              description: event.description,
              type: event.type,
              status: event.status,
              originalDate: event.date,
              originalTime: event.time,
            },
          }
        })

        setCalendarEvents(calendarEventsData)

        // Extrair tipos únicos de eventos
        const types = Array.from(new Set(data.map((event) => event.type)))
        setEventTypes(types)

        toast({
          title: "Eventos carregados",
          description: `${calendarEventsData.length} eventos encontrados no calendário.`,
        })
      } catch (error) {
        console.error("Erro ao buscar eventos:", error)
        toast({
          title: "Erro ao carregar eventos",
          description: "Não foi possível carregar os eventos do calendário.",
          variant: "destructive",
        })
      } finally {
        setCalendarLoading(false)
      }
    }

    fetchCalendarEvents()
  }, [activeTab, events, toast])

  // Filtrar eventos por tipo
  useEffect(() => {
    if (selectedEventType === "all") {
      setFilteredEvents(calendarEvents)
    } else {
      setFilteredEvents(calendarEvents.filter((event) => event.resource.type === selectedEventType))
    }
  }, [calendarEvents, selectedEventType])

  // Estilo dos eventos baseado no status
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3174ad"
    let borderColor = "#3174ad"

    switch (event.resource.status) {
      case "confirmed":
        backgroundColor = "#10b981"
        borderColor = "#059669"
        break
      case "pending":
        backgroundColor = "#f59e0b"
        borderColor = "#d97706"
        break
      case "cancelled":
        backgroundColor = "#ef4444"
        borderColor = "#dc2626"
        break
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: "white",
        border: `2px solid ${borderColor}`,
        borderRadius: "6px",
        fontSize: "12px",
        padding: "2px 6px",
      },
    }
  }

  // Componente customizado para eventos
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer">
            <div className="font-medium text-xs truncate">{event.title}</div>
            <div className="text-xs opacity-90 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {event.resource.originalTime}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">{event.title}</div>
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3" />
              {event.resource.location}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{event.resource.description}</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {event.resource.type}
              </Badge>
              <Badge variant={event.resource.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                {event.resource.status === "confirmed"
                  ? "Confirmado"
                  : event.resource.status === "pending"
                    ? "Pendente"
                    : "Cancelado"}
              </Badge>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  // Manipular clique no evento
  const handleSelectEvent = (event: CalendarEvent) => {
    window.location.href = `/event/${event.id}`
  }

  // Manipular mudança de visualização
  const handleViewChange = (view: View) => {
    setCurrentView(view)
  }

  // Manipular navegação de data
  const handleNavigate = (date: Date) => {
    setCurrentDate(date)
  }

  // Estatísticas dos eventos
  const eventStats = useMemo(() => {
    const total = filteredEvents.length
    const confirmed = filteredEvents.filter((e) => e.resource.status === "confirmed").length
    const pending = filteredEvents.filter((e) => e.resource.status === "pending").length
    const cancelled = filteredEvents.filter((e) => e.resource.status === "cancelled").length

    return { total, confirmed, pending, cancelled }
  }, [filteredEvents])

  // Indicadores consolidados com dados reais de presença
  const eventMetrics = useMemo(() => {
    const totalEvents = events.length
    const totalConfirmedGuests = events.reduce((acc, ev) => acc + (ev.confirmedGuests || 0), 0)
    const totalGuests = events.reduce((acc, ev) => acc + (ev.totalGuests || 0), 0)
    const collaborativeEvents = events.filter((ev) => ev.type === "Colaborativo").length
    const confirmationRate = totalGuests > 0 ? Math.round((totalConfirmedGuests / totalGuests) * 100) : 0

    return {
      totalEvents,
      totalConfirmedGuests,
      totalGuests,
      collaborativeEvents,
      confirmationRate,
    }
  }, [events])

  // Consolidação Financeira Executiva (PLAN-003: Saldo vs. Orçamento vs. Rateio em <3s)
  const financialOverview = useMemo(() => {
    let totalBudgetAllocated = 0
    let totalExpenses = 0
    let totalPaid = 0
    let totalPendingPayment = 0
    let collaborativeExpenses = 0
    let collaborativeConfirmedGuests = 0
    let corporateExpenses = 0
    let corporateConfirmedGuests = 0
    let eventsWithBudgetCount = 0

    interface DivergenceItem {
      id: string
      eventId: string
      eventTitle: string
      type: "budget_exceeded" | "unallocated_budget" | "pending_invoices"
      severity: "high" | "medium" | "low"
      title: string
      description: string
      impact: string
      actionLabel: string
      actionHref: string
    }

    const divergences: DivergenceItem[] = []

    events.forEach((ev) => {
      const budget = Number(ev.budgetEstimated || 0)
      if (budget > 0) {
        totalBudgetAllocated += budget
        eventsWithBudgetCount++
      }

      let eventExpense = 0
      let eventPaid = 0
      let eventPending = 0

      if (Array.isArray(ev.items)) {
        ev.items.forEach((item) => {
          const price = Number(item.price || item.actualCost || item.estimatedCost || 0)
          eventExpense += price
          if (item.paymentStatus === "paid") {
            eventPaid += price
          } else {
            eventPending += price
          }
        })
      }

      totalExpenses += eventExpense
      totalPaid += eventPaid
      totalPendingPayment += eventPending

      const isCorporate = ev.financialMode === "corporate_budget" || ev.type !== "Colaborativo"
      const confirmed = Number(ev.confirmedGuests || 0)

      if (isCorporate) {
        corporateExpenses += eventExpense
        corporateConfirmedGuests += confirmed
      } else {
        collaborativeExpenses += eventExpense
        collaborativeConfirmedGuests += confirmed
      }

      // Detecção de divergências orçamentárias e financeiras
      if (budget > 0 && eventExpense > budget) {
        divergences.push({
          id: `overbudget-${ev.id}`,
          eventId: ev.id,
          eventTitle: ev.title,
          type: "budget_exceeded",
          severity: "high",
          title: "Estouro de Verba Orçamentária",
          description: `Gastos de R$ ${eventExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ultrapassam o teto aprovado de R$ ${budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
          impact: `Déficit de R$ ${(eventExpense - budget).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          actionLabel: "Revisar itens e teto",
          actionHref: `/event/${ev.id}`,
        })
      } else if (isCorporate && budget === 0 && eventExpense > 0) {
        divergences.push({
          id: `unallocated-${ev.id}`,
          eventId: ev.id,
          eventTitle: ev.title,
          type: "unallocated_budget",
          severity: "medium",
          title: "Evento sem Teto Formal",
          description: `Evento corporativo possui R$ ${eventExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em gastos sem limite de verba definido.`,
          impact: "Ausência de teto orçamentário aprovado",
          actionLabel: "Definir orçamento",
          actionHref: `/event/${ev.id}`,
        })
      }

      if (eventPending > 0 && eventExpense > 0 && eventPending / eventExpense > 0.6) {
        divergences.push({
          id: `pending-${ev.id}`,
          eventId: ev.id,
          eventTitle: ev.title,
          type: "pending_invoices",
          severity: "medium",
          title: "Volume Alto de Pagamentos Pendentes",
          description: `${Math.round((eventPending / eventExpense) * 100)}% das despesas contratadas ainda estão pendentes de liquidação com fornecedores.`,
          impact: `R$ ${eventPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a pagar`,
          actionLabel: "Ver pagamentos",
          actionHref: `/event/${ev.id}`,
        })
      }
    })

    const availableBudget = totalBudgetAllocated - totalExpenses
    const isOverBudget = availableBudget < 0
    const overBudgetAmount = isOverBudget ? Math.abs(availableBudget) : 0
    const budgetExecutionRate =
      totalBudgetAllocated > 0
        ? Math.round((totalExpenses / totalBudgetAllocated) * 100)
        : 0

    const paidPercentage =
      totalExpenses > 0 ? Math.round((totalPaid / totalExpenses) * 100) : 0
    const pendingPercentage =
      totalExpenses > 0 ? Math.round((totalPendingPayment / totalExpenses) * 100) : 0

    const averageCollaborativeSplit =
      collaborativeConfirmedGuests > 0
        ? collaborativeExpenses / collaborativeConfirmedGuests
        : 0

    const averageCorporateCostPerAttendee =
      corporateConfirmedGuests > 0
        ? corporateExpenses / corporateConfirmedGuests
        : 0

    return {
      totalBudgetAllocated,
      totalExpenses,
      totalPaid,
      totalPendingPayment,
      availableBudget,
      isOverBudget,
      overBudgetAmount,
      budgetExecutionRate,
      paidPercentage,
      pendingPercentage,
      averageCollaborativeSplit,
      averageCorporateCostPerAttendee,
      eventsWithBudgetCount,
      divergences,
    }
  }, [events])

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  // Variantes para animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      {/* Cabeçalho Editorial com Ações Primárias e SLA Ativo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-border/60"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-semibold px-2.5 py-0.5">
              <Sparkles className="h-3 w-3 mr-1" />
              M2.1 · Dashboard Vivo
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Conciliação em tempo real (&lt;100ms)
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Painel Executivo &amp; Orçamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle integrado de Saldo Disponível, Orçamento Aprovado e Rateio por participante com conciliação contínua.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Link href="/dashboard/analytics" className="w-full sm:w-auto">
            <Button variant="outline" size="default" className="w-full sm:w-auto gap-2 font-medium">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Relatórios &amp; BI
            </Button>
          </Link>
          <Link href="/create-event" className="w-full sm:w-auto">
            <Button size="default" className="w-full sm:w-auto shadow-sm font-medium gap-2">
              <Plus className="h-4 w-4" /> Novo Evento
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* SEÇÃO PRINCIPAL (PLAN-003): Painel de Saldo vs Orçamento vs Rateio (<3s) */}
      <section aria-label="Painel Financeiro Executivo" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              Conciliação Financeira Executiva
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {financialOverview.eventsWithBudgetCount} evento(s) com teto formal
          </span>
        </div>

        {/* Os 4 Cards Executivos Consolidados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Saldo Disponível (Verba Livre) */}
          <Card
            className={`p-4 border transition-all ${
              financialOverview.isOverBudget
                ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
                : "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Saldo Disponível
              </span>
              <div
                className={`p-1.5 rounded-md ${
                  financialOverview.isOverBudget
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-bold tracking-tight ${
                financialOverview.isOverBudget
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {financialOverview.isOverBudget
                ? `- ${formatBRL(financialOverview.overBudgetAmount)}`
                : formatBRL(financialOverview.availableBudget)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {financialOverview.isOverBudget ? "Estouro de verba" : "Verba livre restante"}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-4 ${
                  financialOverview.isOverBudget
                    ? "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10"
                    : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                }`}
              >
                {financialOverview.isOverBudget ? "Déficit" : "Dentro da Meta"}
              </Badge>
            </div>
          </Card>

          {/* Card 2: Orçamento Aprovado (Teto Global) */}
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/80 hover:border-border transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Orçamento Aprovado
              </span>
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatBRL(financialOverview.totalBudgetAllocated)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Execução orçamentária</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {financialOverview.budgetExecutionRate}% empenhado
              </Badge>
            </div>
          </Card>

          {/* Card 3: Gastos Comprometidos (Realizados) */}
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/80 hover:border-border transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Gastos Comprometidos
              </span>
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatBRL(financialOverview.totalExpenses)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {formatBRL(financialOverview.totalPaid)} pago
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {formatBRL(financialOverview.totalPendingPayment)} a pagar
              </span>
            </div>
          </Card>

          {/* Card 4: Rateio & Custo Médio por Convidado */}
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/80 hover:border-border transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Custo / Rateio Médio
              </span>
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {financialOverview.averageCorporateCostPerAttendee > 0
                ? `${formatBRL(financialOverview.averageCorporateCostPerAttendee)}/pax`
                : financialOverview.averageCollaborativeSplit > 0
                  ? `${formatBRL(financialOverview.averageCollaborativeSplit)}/pax`
                  : "R$ 0,00"}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Por participante confirmado</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {eventMetrics.totalConfirmedGuests} confirmados
              </Badge>
            </div>
          </Card>
        </div>

        {/* Régua de Conciliação Financeira Viva (Visual Balance Gauge) */}
        <Card className="p-4 bg-card/70 backdrop-blur-sm border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Régua de Conciliação Orçamentária
              </div>
              <div className="text-sm font-medium text-foreground">
                Distribuição de Pagamentos e Saldo sobre o Teto Aprovado
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Pago: <strong>{formatBRL(financialOverview.totalPaid)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Pendente: <strong>{formatBRL(financialOverview.totalPendingPayment)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Saldo Livre: <strong>{formatBRL(Math.max(0, financialOverview.availableBudget))}</strong>
              </span>
            </div>
          </div>

          {/* Barra proporcional segmentada */}
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex shadow-inner">
            {financialOverview.totalBudgetAllocated > 0 ? (
              <>
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      (financialOverview.totalPaid / financialOverview.totalBudgetAllocated) * 100
                    )}%`,
                  }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Pago: ${formatBRL(financialOverview.totalPaid)}`}
                />
                <div
                  style={{
                    width: `${Math.min(
                      100 - Math.min(100, (financialOverview.totalPaid / financialOverview.totalBudgetAllocated) * 100),
                      (financialOverview.totalPendingPayment / financialOverview.totalBudgetAllocated) * 100
                    )}%`,
                  }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Pendente: ${formatBRL(financialOverview.totalPendingPayment)}`}
                />
                {!financialOverview.isOverBudget && (
                  <div
                    style={{
                      width: `${Math.max(
                        0,
                        100 -
                          ((financialOverview.totalExpenses / financialOverview.totalBudgetAllocated) * 100)
                      )}%`,
                    }}
                    className="bg-blue-400/60 dark:bg-blue-500/50 transition-all duration-500"
                    title={`Saldo Disponível: ${formatBRL(financialOverview.availableBudget)}`}
                  />
                )}
                {financialOverview.isOverBudget && (
                  <div
                    style={{ width: "100%" }}
                    className="bg-red-500/80 transition-all duration-500"
                    title={`Estouro de Orçamento: ${formatBRL(financialOverview.overBudgetAmount)}`}
                  />
                )}
              </>
            ) : (
              <div
                style={{
                  width: financialOverview.totalExpenses > 0 ? "100%" : "0%",
                }}
                className="bg-muted-foreground/30"
              />
            )}
          </div>

          <div className="mt-2 flex justify-between items-center text-[11px] text-muted-foreground">
            <span>R$ 0,00</span>
            <span>
              {financialOverview.totalBudgetAllocated > 0
                ? `Teto: ${formatBRL(financialOverview.totalBudgetAllocated)}`
                : "Sem teto orçamentário global configurado"}
            </span>
          </div>
        </Card>

        {/* Central de Divergências & Decisão Rápida (Smart Decision Center) */}
        {financialOverview.divergences.length > 0 ? (
          <Card className="p-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Divergências Orçamentárias que Requerem Atenção
                    <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {financialOverview.divergences.length} alerta(s)
                    </Badge>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Ação recomendada para manter conformidade contábil
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {financialOverview.divergences.map((div) => (
                    <div
                      key={div.id}
                      className="p-3 rounded-md bg-card/80 border border-border flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {div.eventTitle}
                          </span>
                          <Badge
                            variant={div.severity === "high" ? "destructive" : "outline"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {div.title}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {div.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          {div.impact}
                        </span>
                        <Link href={div.actionHref}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-primary hover:text-primary font-medium"
                          >
                            {div.actionLabel}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : events.length > 0 ? (
          <Card className="p-3 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Saúde Orçamentária Excelente: Nenhuma divergência crítica identificada entre saldo, orçamento e rateio.
              </span>
              <Link href="/dashboard/analytics">
                <span className="hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                  Ver auditoria contábil completa <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </Card>
        ) : null}
      </section>

      {/* Indicadores Compactos de Participação & Eventos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Eventos</span>
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{eventMetrics.totalEvents}</div>
          <p className="text-xs text-muted-foreground mt-1">cadastrados no sistema</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Confirmados</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{eventMetrics.totalConfirmedGuests}</div>
          <p className="text-xs text-muted-foreground mt-1">
            de {eventMetrics.totalGuests} convidados ({eventMetrics.confirmationRate}%)
          </p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Colaborativos</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{eventMetrics.collaborativeEvents}</div>
          <p className="text-xs text-muted-foreground mt-1">com divisão de tarefas e itens</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/80">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Taxa de Adesão</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{eventMetrics.confirmationRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">média geral de presença</p>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full sm:w-80 grid-cols-2 p-1 bg-muted/60 rounded-lg">
          <TabsTrigger value="events" className="flex items-center gap-2 text-xs font-medium">
            <Grid3X3 className="h-3.5 w-3.5" />
            Meus Eventos ({events.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2 text-xs font-medium">
            <CalendarDays className="h-3.5 w-3.5" />
            Calendário
          </TabsTrigger>
        </TabsList>

        {/* Aba de Eventos */}
        <TabsContent value="events" className="space-y-6 outline-none">
          {isLoading ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : events.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {events.map((event, index) => (
                <AnimatedCard key={event.id} delay={index * 0.05}>
                  <Link href={`/event/${event.id}`} className="block h-full">
                    <EventCard event={event} />
                  </Link>
                </AnimatedCard>
              ))}

              {/* Card Compacto para Adicionar Novo Evento */}
              <AnimatedCard delay={events.length * 0.05}>
                <Link href="/create-event" className="block h-full">
                  <Card
                    variant="interactive"
                    className="border-dashed border-2 border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all p-6 flex flex-col items-center justify-center text-center h-full min-h-[220px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-base mb-1">Criar novo evento</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mb-3">
                      Defina local, convidados e tarefas em poucos minutos.
                    </p>
                    <Button variant="outline" size="sm" className="pointer-events-none">
                      Começar agora
                    </Button>
                  </Card>
                </Link>
              </AnimatedCard>
            </motion.div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum evento criado ainda"
              description="Você ainda não possui eventos planejados. Crie seu primeiro evento e comece a convidar seus amigos e gerenciar tarefas."
              actionLabel="Criar meu primeiro evento"
              actionHref="/create-event"
              className="my-8"
            />
          )}
        </TabsContent>

        {/* Aba do Calendário */}
        <TabsContent value="calendar" className="space-y-6">
          {calendarLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Filtros e Estatísticas */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Calendário de Eventos</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Visualize todos os seus eventos organizados por data
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Filtro por tipo */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {eventTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estatísticas rápidas */}
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                    >
                      {eventStats.confirmed} Confirmados
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                    >
                      {eventStats.pending} Pendentes
                    </Badge>
                    {eventStats.cancelled > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                      >
                        {eventStats.cancelled} Cancelados
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendário */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="calendar-container" style={{ height: "600px" }}>
                    <Calendar
                      localizer={localizer}
                      events={filteredEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: "100%" }}
                      messages={messages}
                      culture="pt-BR"
                      view={currentView}
                      onView={handleViewChange}
                      date={currentDate}
                      onNavigate={handleNavigate}
                      onSelectEvent={handleSelectEvent}
                      eventPropGetter={eventStyleGetter}
                      components={{
                        event: EventComponent,
                      }}
                      views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                      step={60}
                      showMultiDayTimes
                      popup
                      popupOffset={30}
                      formats={{
                        monthHeaderFormat: (date) => format(date, "MMMM yyyy", { locale: ptBR }),
                        dayHeaderFormat: (date) => format(date, "EEEE, dd/MM", { locale: ptBR }),
                        dayRangeHeaderFormat: ({ start, end }) =>
                          `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM", { locale: ptBR })}`,
                        agendaDateFormat: (date) => format(date, "dd/MM/yyyy", { locale: ptBR }),
                        agendaTimeFormat: (date) => format(date, "HH:mm", { locale: ptBR }),
                        agendaTimeRangeFormat: ({ start, end }) =>
                          `${format(start, "HH:mm", { locale: ptBR })} - ${format(end, "HH:mm", { locale: ptBR })}`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Legenda */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4 items-center justify-center">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Legenda:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                      <span className="text-sm">Confirmado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-amber-500 rounded"></div>
                      <span className="text-sm">Pendente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">Cancelado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Estilos customizados para o calendário */}
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        
        .rbc-header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
          padding: 12px 8px;
        }
        
        .dark .rbc-header {
          background-color: #1f2937;
          border-bottom-color: #374151;
          color: #f3f4f6;
        }
        
        .rbc-month-view {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .dark .rbc-month-view {
          border-color: #374151;
        }
        
        .rbc-date-cell {
          padding: 8px;
          text-align: right;
        }
        
        .rbc-today {
          background-color: #fef3c7;
        }
        
        .dark .rbc-today {
          background-color: #451a03;
        }
        
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        
        .dark .rbc-off-range-bg {
          background-color: #111827;
        }
        
        .rbc-toolbar {
          margin-bottom: 20px;
          padding: 0 10px;
        }
        
        .rbc-toolbar button {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .dark .rbc-toolbar button {
          background-color: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        
        .rbc-toolbar button:hover {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }
        
        .dark .rbc-toolbar button:hover {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        .rbc-toolbar button.rbc-active {
          background-color: #10b981;
          border-color: #059669;
          color: white;
        }
        
        .rbc-toolbar button.rbc-active:hover {
          background-color: #059669;
        }
        
        .rbc-event {
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .rbc-event:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .rbc-show-more {
          background-color: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          cursor: pointer;
        }
        
        .dark .rbc-show-more {
          background-color: #374151;
          color: #9ca3af;
          border-color: #4b5563;
        }
        
        .rbc-show-more:hover {
          background-color: #e5e7eb;
        }
        
        .dark .rbc-show-more:hover {
          background-color: #4b5563;
        }
        
        .rbc-agenda-view {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        
        .dark .rbc-agenda-view {
          border-color: #374151;
        }
        
        .rbc-agenda-view table {
          width: 100%;
        }
        
        .rbc-agenda-view .rbc-agenda-date-cell,
        .rbc-agenda-view .rbc-agenda-time-cell {
          background-color: #f8fafc;
          border-right: 1px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
        }
        
        .dark .rbc-agenda-view .rbc-agenda-date-cell,
        .dark .rbc-agenda-view .rbc-agenda-time-cell {
          background-color: #1f2937;
          border-right-color: #374151;
          color: #f3f4f6;
        }
        
        .rbc-agenda-view .rbc-agenda-event-cell {
          padding: 12px;
        }
        
        .rbc-time-view .rbc-time-gutter {
          background-color: #f8fafc;
        }
        
        .dark .rbc-time-view .rbc-time-gutter {
          background-color: #1f2937;
        }
        
        .rbc-time-view .rbc-time-content {
          border-left: 1px solid #e2e8f0;
        }
        
        .dark .rbc-time-view .rbc-time-content {
          border-left-color: #374151;
        }
        
        .rbc-time-view .rbc-time-header {
          border-bottom: 1px solid #e2e8f0;
        }
        
        .dark .rbc-time-view .rbc-time-header {
          border-bottom-color: #374151;
        }
        
        .rbc-time-slot {
          border-top: 1px solid #f1f5f9;
        }
        
        .dark .rbc-time-slot {
          border-top-color: #374151;
        }
        
        .rbc-timeslot-group {
          border-bottom: 1px solid #e2e8f0;
        }
        
        .dark .rbc-timeslot-group {
          border-bottom-color: #374151;
        }
        
        .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }
        
        .rbc-calendar,
        .rbc-time-view,
        .rbc-month-view,
        .rbc-agenda-view {
          background-color: transparent;
        }
        
        .dark .rbc-calendar,
        .dark .rbc-time-view,
        .dark .rbc-month-view,
        .dark .rbc-agenda-view {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  )
}

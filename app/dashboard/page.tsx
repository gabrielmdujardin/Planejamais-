"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  CheckCircle2,
  TrendingUp,
  Wallet,
  PiggyBank,
  Receipt,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
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

  // Estados da lista de eventos
  const [eventsSearch, setEventsSearch] = useState("")
  const [eventsTypeFilter, setEventsTypeFilter] = useState("all")
  const [eventsViewMode, setEventsViewMode] = useState<"table" | "grid">("table")

  // Estados do calendário
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEventType, setSelectedEventType] = useState<string>("all")
  const [eventTypes, setEventTypes] = useState<string[]>([])

  // Carregamento de eventos do usuário com preservação do store local
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await getEvents()
        if (!result.error && result.data && result.data.length > 0) {
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

  // Lista filtrada para a tabela e grade de eventos
  const filteredTableEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        eventsSearch.trim() === "" ||
        event.title.toLowerCase().includes(eventsSearch.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(eventsSearch.toLowerCase()))

      const matchesType =
        eventsTypeFilter === "all" ||
        event.type === eventsTypeFilter ||
        (eventsTypeFilter === "Corporativo" &&
          (event.financialMode === "corporate_budget" || event.type === "Corporativo")) ||
        (eventsTypeFilter === "Colaborativo" &&
          (event.financialMode === "collaborative_split" || event.type === "Colaborativo"))

      return matchesSearch && matchesType
    })
  }, [events, eventsSearch, eventsTypeFilter])

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
        staggerChildren: 0.05,
      },
    },
  }

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4 space-y-6">
      {/* Cabeçalho: título e criação de evento */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Seus eventos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {events.length} {events.length === 1 ? "evento criado" : "eventos criados"}
          </p>
        </div>
        <Link href="/create-event">
          <Button size="sm" className="h-8 gap-1.5 text-xs font-medium shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            Novo Evento
          </Button>
        </Link>
      </div>

      {/* 5 & 6. Lista / Tabela Compacta de Eventos e Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full sm:w-64 grid-cols-2 p-1 bg-muted/60 rounded-lg">
          <TabsTrigger value="events" className="flex items-center gap-2 text-xs font-medium">
            <Grid3X3 className="h-3.5 w-3.5" />
            Eventos ({events.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2 text-xs font-medium">
            <CalendarDays className="h-3.5 w-3.5" />
            Calendário
          </TabsTrigger>
        </TabsList>

        {/* Aba de Eventos com Tabela Compacta de Alta Densidade */}
        <TabsContent value="events" className="space-y-3 outline-none">
          {/* Barra de Filtros e Alternador de Exibição */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Lista de Eventos ({filteredTableEvents.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Campo de Busca Rápida */}
              <div className="relative w-44 sm:w-56">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar evento..."
                  value={eventsSearch}
                  onChange={(e) => setEventsSearch(e.target.value)}
                  className="h-7 pl-7 text-xs"
                />
              </div>

              {/* Filtro por Tipo */}
              <Select value={eventsTypeFilter} onValueChange={setEventsTypeFilter}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Corporativo">Corporativo</SelectItem>
                  <SelectItem value="Colaborativo">Colaborativo</SelectItem>
                  <SelectItem value="Casamento">Casamento</SelectItem>
                  <SelectItem value="Festa">Festa</SelectItem>
                  <SelectItem value="Formatura">Formatura</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>

              {/* Alternador Tabela / Grade */}
              <div className="flex items-center border border-border rounded-md p-0.5 bg-muted/40">
                <Button
                  variant={eventsViewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setEventsViewMode("table")}
                  className="h-6 w-6 p-0"
                  title="Visualização em Tabela Compacta"
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  variant={eventsViewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setEventsViewMode("grid")}
                  className="h-6 w-6 p-0"
                  title="Visualização em Grade de Cards"
                >
                  <LayoutGrid className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : eventsViewMode === "table" ? (
            <Card className="border-border/80 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="text-xs font-semibold py-2">Evento</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Tipo</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Presença</TableHead>
                    <TableHead className="text-xs font-semibold text-right py-2">Teto Aprovado</TableHead>
                    <TableHead className="text-xs font-semibold text-right py-2">Comprometido</TableHead>
                    <TableHead className="text-xs font-semibold text-right py-2">Saldo / Rateio</TableHead>
                    <TableHead className="text-xs font-semibold text-right w-20 py-2">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTableEvents.length > 0 ? (
                    filteredTableEvents.map((ev) => {
                      const isCollab =
                        ev.financialMode === "collaborative_split" || ev.type === "Colaborativo"
                      const totalExpense = Array.isArray(ev.items)
                        ? ev.items.reduce(
                            (acc, item) =>
                              acc + Number(item.price || item.actualCost || item.estimatedCost || 0),
                            0,
                          )
                        : 0
                      const budget = Number(ev.budgetEstimated || 0)
                      const balance = budget > 0 ? budget - totalExpense : null
                      const isOver = balance !== null && balance < 0
                      const confirmed = Number(ev.confirmedGuests || 0)
                      const totalGuests = Number(ev.totalGuests || 0)
                      const rateioPax =
                        isCollab && totalExpense > 0
                          ? totalExpense / (confirmed > 0 ? confirmed : totalGuests > 0 ? totalGuests : 1)
                          : 0

                      return (
                        <TableRow key={ev.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="py-2.5">
                            <Link
                              href={`/event/${ev.id}`}
                              className="font-medium text-xs text-foreground hover:underline block truncate max-w-xs"
                            >
                              {ev.title}
                            </Link>
                            <span className="text-[11px] text-muted-foreground block">
                              {ev.fullDate || ev.date} {ev.time && `· ${ev.time}`}
                            </span>
                          </TableCell>

                          <TableCell className="py-2.5">
                            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                              {ev.type}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-muted-foreground">
                            <span>{confirmed}/{totalGuests}</span>
                            {totalGuests > 0 && (
                              <span className="text-[10px] ml-1 text-muted-foreground/70">
                                ({Math.round((confirmed / totalGuests) * 100)}%)
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-right font-medium">
                            {budget > 0 ? (
                              formatBRL(budget)
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-right font-medium">
                            {totalExpense > 0 ? (
                              formatBRL(totalExpense)
                            ) : (
                              <span className="text-muted-foreground/50">R$ 0,00</span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-right">
                            {isCollab ? (
                              <span className="text-primary font-medium">
                                {rateioPax > 0 ? `${formatBRL(rateioPax)}/pax` : "—"}
                              </span>
                            ) : balance !== null ? (
                              <span
                                className={`font-semibold ${
                                  isOver
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {isOver ? `- ${formatBRL(Math.abs(balance))}` : `+ ${formatBRL(balance)}`}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Sem teto</span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 text-right">
                            <Link href={`/event/${ev.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2 text-primary hover:text-primary gap-0.5"
                              >
                                Abrir <ChevronRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        Nenhum evento encontrado com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          ) : (
            /* Visualização Opcional em Grade */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTableEvents.map((event, index) => (
                <AnimatedCard key={event.id} delay={index * 0.03}>
                  <Link href={`/event/${event.id}`} className="block h-full">
                    <EventCard event={event} />
                  </Link>
                </AnimatedCard>
              ))}
            </div>
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

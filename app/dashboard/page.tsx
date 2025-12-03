"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, CalendarDays, Grid3X3, MapPin, Clock, Filter } from "lucide-react"
import EventCard from "@/components/event-card"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useEventStore } from "@/stores/event-store"
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

// Dados mockados para demonstração
const mockCalendarEvents: DatabaseEvent[] = [
  {
    id: "1",
    title: "Festa de Aniversário da Maria",
    date: "15/01/2025",
    time: "19:00",
    location: "Salão de Festas do Condomínio",
    description: "Festa de 30 anos da Maria com tema tropical",
    type: "festa",
    status: "confirmed",
  },
  {
    id: "2",
    title: "Reunião de Trabalho",
    date: "18/01/2025",
    time: "14:00",
    location: "Escritório Central",
    description: "Reunião mensal da equipe de desenvolvimento",
    type: "trabalho",
    status: "confirmed",
  },
  {
    id: "3",
    title: "Casamento do João",
    date: "25/01/2025",
    time: "16:00",
    location: "Igreja São José",
    description: "Cerimônia de casamento seguida de recepção",
    type: "casamento",
    status: "pending",
  },
  {
    id: "4",
    title: "Churrasco da Família",
    date: "02/02/2025",
    time: "12:00",
    location: "Casa da Vovó",
    description: "Almoço de domingo em família",
    type: "família",
    status: "confirmed",
  },
  {
    id: "5",
    title: "Conferência Tech",
    date: "10/02/2025",
    time: "09:00",
    location: "Centro de Convenções",
    description: "Conferência anual de tecnologia",
    type: "trabalho",
    status: "pending",
  },
  {
    id: "6",
    title: "Aniversário Cancelado",
    date: "20/02/2025",
    time: "20:00",
    location: "Restaurante Central",
    description: "Evento cancelado devido ao tempo",
    type: "festa",
    status: "cancelled",
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { events } = useEventStore()
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsLoading(false)
    }

    loadEvents()
  }, [])

  // Buscar eventos mockados para o calendário
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (activeTab !== "calendar") return

      try {
        setCalendarLoading(true)

        // Simular delay de rede
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Usar dados mockados
        const data = mockCalendarEvents

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
  }, [activeTab, toast])

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
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Gerencie seus eventos e visualize seu calendário</p>
        </div>
        <Link href="/create-event">
          <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
            <Plus className="h-4 w-4 mr-2" /> Criar novo evento
          </Button>
        </Link>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Meus Eventos
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        {/* Aba de Eventos */}
        <TabsContent value="events" className="space-y-8">
          {isLoading ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-[280px] animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {events.length > 0
                ? events.map((event, index) => (
                    <AnimatedCard key={event.id} delay={index * 0.1}>
                      <Link href={`/event/${event.id}`}>
                        <EventCard event={event} />
                      </Link>
                    </AnimatedCard>
                  ))
                : null}

              {/* Create Event Card */}
              <AnimatedCard delay={events.length * 0.1}>
                <Link href="/create-event">
                  <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer h-full">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[280px]">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-center">Criar novo evento</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                        Comece a planejar seu próximo evento com facilidade
                      </p>
                      <Button variant="outline" className="mt-2 bg-transparent">
                        Começar agora
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </AnimatedCard>
            </motion.div>
          )}

          {!isLoading && events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-12"
            >
              <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                <CalendarDays className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Nenhum evento criado</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Você ainda não criou nenhum evento. Comece agora mesmo a organizar seu próximo evento!
              </p>
              <Link href="/create-event">
                <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                  <Plus className="h-4 w-4 mr-2" /> Criar meu primeiro evento
                </Button>
              </Link>
            </motion.div>
          ) : null}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <h2 className="text-2xl font-bold mb-6">Eventos Recentes</h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Você ainda não tem eventos passados</p>
                  <Button variant="outline">Ver tutoriais</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Aba do Calendário */}
        <TabsContent value="calendar" className="space-y-6">
          {calendarLoading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

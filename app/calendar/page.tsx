"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowRight, CalendarIcon, ChevronLeft, ChevronRight, Clock, Download, MapPin, Users } from "lucide-react"
import { getEvents } from "@/app/actions/events"
import { BackButton } from "@/components/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { buildIcsCalendar, parseFlexibleEventDate } from "@/lib/domain/business-rules"
import { useEventStore } from "@/stores/event-store"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const { isDemoMode } = useAuth()
  const { toast } = useToast()
  const { events, setEvents } = useEventStore()

  useEffect(() => {
    if (isDemoMode) return
    let active = true
    async function load() {
      const res = await getEvents()
      if (active && !res.error && Array.isArray(res.data)) {
        setEvents(res.data)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [isDemoMode, setEvents])

  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(events.map((ev) => ev.type || "Outro")))
    if (selectedTypes.length === 0 && types.length > 0) {
      setSelectedTypes(types)
    }
    return types
  }, [events, selectedTypes.length])

  const calendarEvents = useMemo(() => {
    return events
      .map((event) => {
        const parsedDate = parseFlexibleEventDate({
          startDate: event.startDate,
          fullDate: event.fullDate,
          date: event.date,
          startTime: event.startTime,
          time: event.time,
        })
        if (!parsedDate) return null

        return {
          id: event.id,
          title: event.title,
          date: parsedDate,
          startDate: event.startDate || null,
          endDate: event.endDate || null,
          endTime: event.endTime || null,
          time: event.startTime || event.time || "09:00",
          location: event.location,
          description: event.description,
          type: event.type || "Outro",
          category: event.category,
          confirmedGuests: event.confirmedGuests,
          totalGuests: event.totalGuests,
        }
      })
      .filter((ev): ev is NonNullable<typeof ev> => ev !== null)
      .filter((event) => selectedTypes.length === 0 || selectedTypes.includes(event.type))
  }, [events, selectedTypes])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const leadingEmptyDays = Array.from({ length: monthStart.getDay() })

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return calendarEvents.filter((event) => isSameDay(event.date, selectedDate))
  }, [calendarEvents, selectedDate])

  const hasEventsOnDate = (date: Date) => {
    return calendarEvents.some((event) => isSameDay(event.date, date))
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "Colaborativo":
        return "bg-emerald-500 dark:bg-emerald-600"
      case "Corporativo":
        return "bg-indigo-500 dark:bg-indigo-600"
      case "Casamento":
        return "bg-rose-500 dark:bg-rose-600"
      case "Festa":
        return "bg-blue-500 dark:bg-blue-600"
      default:
        return "bg-slate-500 dark:bg-slate-600"
    }
  }

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  const downloadIcsForEvents = (targetEvents: typeof calendarEvents, filename: string) => {
    if (targetEvents.length === 0) {
      toast({
        title: "Sem eventos para exportar",
        description: "Cadastre pelo menos um evento antes de baixar o arquivo .ics.",
        variant: "destructive",
      })
      return
    }

    const icsContent = buildIcsCalendar(
      targetEvents.map((ev) => ({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        location: ev.location,
        startDate: ev.startDate || format(ev.date, "yyyy-MM-dd"),
        startTime: ev.time,
        endDate: ev.endDate || format(ev.date, "yyyy-MM-dd"),
        endTime: ev.endTime || undefined,
      })),
      "Planeja+ Agenda de Eventos"
    )

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Agenda exportada (.ics)",
      description: "Importe o arquivo no Google Calendar, Apple Calendar ou Outlook.",
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Calendário de Eventos</h1>
            <p className="text-muted-foreground">Visualize seus eventos por data e exporte para agendas externas</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadIcsForEvents(calendarEvents, "planejamais-eventos.ics")}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar Agenda (.ics)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl capitalize">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {leadingEmptyDays.map((_, idx) => (
                  <div key={`empty-${idx}`} className="p-2" aria-hidden="true" />
                ))}
                {monthDays.map((day) => {
                  const hasEvents = hasEventsOnDate(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-2 rounded-lg text-center transition-colors min-h-[40px]
                        ${!isSameMonth(day, currentDate) ? "text-muted-foreground/40" : ""}
                        ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                        ${isToday && !isSelected ? "border-2 border-primary" : ""}
                      `}
                    >
                      <div className="text-sm">{format(day, "d")}</div>
                      {hasEvents && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {calendarEvents
                            .filter((e) => isSameDay(e.date, day))
                            .slice(0, 3)
                            .map((event, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(event.type)}`} />
                            ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
              </CardTitle>
              <CardDescription>
                {eventsForSelectedDate.length > 0
                  ? `${eventsForSelectedDate.length} evento(s) neste dia`
                  : "Nenhum evento neste dia"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {eventsForSelectedDate.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{event.title}</h3>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location || "Local a definir"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {event.confirmedGuests}/{event.totalGuests} confirmados
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={event.type === "Colaborativo" ? "default" : "secondary"}>{event.type}</Badge>
                          <Link href={`/event/${event.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                              Abrir <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum evento neste dia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navegação Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d)
                  if (d) setCurrentDate(d)
                }}
                className="rounded-md border"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
              <CardDescription>Mostrar ou ocultar eventos por tipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableTypes.length > 0 ? (
                availableTypes.map((type) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(type)}`} />
                      <span className="text-sm">{type}</span>
                    </div>
                    <Button
                      variant={selectedTypes.includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleType(type)}
                    >
                      {selectedTypes.includes(type) ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum tipo de evento cadastrado ainda.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{calendarEvents.length}</div>
                <p className="text-sm text-muted-foreground">Total de eventos filtrados</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {calendarEvents.filter((e) => isSameMonth(e.date, currentDate)).length}
                </div>
                <p className="text-sm text-muted-foreground">Eventos neste mês</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Detalhes rápidos do evento selecionado</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Data e Horário</h4>
                <p className="text-sm text-muted-foreground">
                  {format(selectedEvent.date, "dd/MM/yyyy", { locale: ptBR })} às {selectedEvent.time}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Local</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.location || "Não informado"}</p>
              </div>
              {selectedEvent.description ? (
                <div>
                  <h4 className="font-semibold mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              ) : null}
              <div>
                <h4 className="font-semibold mb-1">Convidados</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.confirmedGuests} de {selectedEvent.totalGuests} confirmados
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadIcsForEvents([selectedEvent], `evento-${selectedEvent.id}.ics`)}
                >
                  <Download className="h-4 w-4 mr-1.5" /> Baixar .ics
                </Button>
                <Link href={`/event/${selectedEvent.id}`}>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    Abrir central do evento <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

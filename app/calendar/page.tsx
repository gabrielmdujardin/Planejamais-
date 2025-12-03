"use client"

import { useState, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, MapPin, Users, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEventStore } from "@/stores/event-store"
import { BackButton } from "@/components/back-button"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Festa", "Colaborativo"])

  const { events } = useEventStore()

  // Converter eventos para o formato do calendário
  const calendarEvents = useMemo(() => {
    return events
      .filter((event) => event.fullDate)
      .map((event) => {
        // Converter DD/MM/YYYY para Date
        const [day, month, year] = event.fullDate!.split("/")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

        return {
          id: event.id,
          title: event.title,
          date,
          time: event.time,
          location: event.location,
          description: event.description,
          type: event.type,
          category: event.category,
          confirmedGuests: event.confirmedGuests,
          totalGuests: event.totalGuests,
        }
      })
      .filter((event) => selectedTypes.includes(event.type))
  }, [events, selectedTypes])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

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
      case "Festa":
        return "bg-blue-500 dark:bg-blue-600"
      default:
        return "bg-gray-500 dark:bg-gray-600"
    }
  }

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold">Calendário de Eventos</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualize e gerencie seus eventos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</CardTitle>
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
                  <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day) => {
                  const hasEvents = hasEventsOnDate(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-2 rounded-lg text-center transition-colors
                        ${!isSameMonth(day, currentDate) ? "text-gray-300 dark:text-gray-700" : ""}
                        ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
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
                              <div key={i} className={`w-1 h-1 rounded-full ${getEventTypeColor(event.type)}`} />
                            ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Eventos do Dia Selecionado */}
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
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{event.title}</h3>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Users className="h-4 w-4" />
                              <span>
                                {event.confirmedGuests}/{event.totalGuests} confirmados
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant={event.type === "Colaborativo" ? "default" : "secondary"}>{event.type}</Badge>
                          {event.category && <Badge variant="outline">{event.category}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum evento neste dia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mini Calendário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navegação Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
              <CardDescription>Mostrar/ocultar eventos por tipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Colaborativo</span>
                </div>
                <Button
                  variant={selectedTypes.includes("Colaborativo") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType("Colaborativo")}
                >
                  {selectedTypes.includes("Colaborativo") ? "Visível" : "Oculto"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Festa</span>
                </div>
                <Button
                  variant={selectedTypes.includes("Festa") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType("Festa")}
                >
                  {selectedTypes.includes("Festa") ? "Visível" : "Oculto"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{calendarEvents.length}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de eventos</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {calendarEvents.filter((e) => isSameMonth(e.date, currentDate)).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eventos este mês</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Detalhes do evento</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Data e Horário</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(selectedEvent.date, "dd/MM/yyyy", { locale: ptBR })} às {selectedEvent.time}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Local</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.location}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Descrição</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Convidados</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedEvent.confirmedGuests} de {selectedEvent.totalGuests} confirmados
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={selectedEvent.type === "Colaborativo" ? "default" : "secondary"}>
                  {selectedEvent.type}
                </Badge>
                {selectedEvent.category && <Badge variant="outline">{selectedEvent.category}</Badge>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

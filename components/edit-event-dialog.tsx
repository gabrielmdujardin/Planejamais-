"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarIcon, MapPin, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"

interface EditEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

export default function EditEventDialog({ open, onOpenChange, eventId }: EditEventDialogProps) {
  const { toast } = useToast()
  const { getEventById, updateEvent } = useEventStore()
  const event = getEventById(eventId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventType, setEventType] = useState<string | undefined>(undefined)
  const [eventName, setEventName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")

  // Carregar dados do evento quando o diálogo for aberto
  useEffect(() => {
    if (event && open) {
      setEventType(event.type === "Festa" ? "festa" : "colaborativo")
      setEventName(event.title)
      setEventDescription(event.description)

      // Converter a data do formato string para Date
      if (event.fullDate) {
        const [day, month, year] = event.fullDate.split("/").map(Number)
        setDate(new Date(year, month - 1, day))
      }

      setEventTime(event.time)
      setEventLocation(event.location)
    }
  }, [event, open])

  const handleUpdateEvent = async () => {
    if (!event) return

    if (!eventName || !date || !eventTime || !eventLocation) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Atualizar evento
      const updatedEvent = {
        ...event,
        title: eventName,
        type: eventType === "festa" ? "Festa" : "Colaborativo",
        date: date ? format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : event.date,
        time: eventTime,
        fullDate: date ? format(date, "dd/MM/yyyy") : event.fullDate,
        location: eventLocation,
        description: eventDescription,
      }

      updateEvent(event.id, updatedEvent)
      onOpenChange(false)

      toast({
        title: "Evento atualizado",
        description: "As informações do evento foram atualizadas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar evento",
        description: "Ocorreu um erro ao atualizar o evento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>Atualize as informações do seu evento.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="event-type">Tipo de evento</Label>
              <RadioGroup value={eventType} onValueChange={setEventType} className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <RadioItem value="festa" id="festa" className="peer sr-only" />
                  <Label
                    htmlFor="festa"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emerald-500 [&:has([data-state=checked])]:border-emerald-500"
                  >
                    <div className="text-center">
                      <h3 className="font-semibold">Festa</h3>
                      <p className="text-sm text-gray-500">Você é o anfitrião e os convidados não precisam pagar</p>
                    </div>
                  </Label>
                </div>

                <div>
                  <RadioItem value="colaborativo" id="colaborativo" className="peer sr-only" />
                  <Label
                    htmlFor="colaborativo"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emerald-500 [&:has([data-state=checked])]:border-emerald-500"
                  >
                    <div className="text-center">
                      <h3 className="font-semibold">Colaborativo</h3>
                      <p className="text-sm text-gray-500">Cada convidado contribui com uma parte dos custos</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-name">Nome do evento*</Label>
              <Input
                id="event-name"
                placeholder="Ex: Churrasco de aniversário"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Descrição (opcional)</Label>
              <Textarea
                id="event-description"
                placeholder="Detalhes sobre o evento..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-time">Horário*</Label>
                <div className="relative">
                  <Input id="event-time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Local*</Label>
              <div className="relative">
                <Input
                  id="event-location"
                  placeholder="Endereço do evento"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
                <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateEvent} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { updateEventDetails } from "@/app/actions/events"
import { useAuth } from "@/context/auth-context"
import { useEventStore } from "@/stores/event-store"

interface EditEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

const eventTypes = ["Festa", "Casamento", "Aniversario", "Corporativo", "Viagem", "Religioso", "Colaborativo", "Outro"]

const toNumberOrNull = (value: string) => {
  if (!value.trim()) return null
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

const toInputDate = (event: any) => {
  if (event?.startDate) return event.startDate
  if (!event?.fullDate) return ""
  const [day, month, year] = String(event.fullDate).split("/").map(Number)
  if (!day || !month || !year) return ""
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export default function EditEventDialog({ open, onOpenChange, eventId }: EditEventDialogProps) {
  const { toast } = useToast()
  const { isDemoMode } = useAuth()
  const { getEventById, updateEvent } = useEventStore()
  const event = getEventById(eventId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Festa",
    status: "active",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    address: "",
    mapsUrl: "",
    eventMode: "presential",
    meetingUrl: "",
    capacity: "",
    allowCompanions: false,
    maxCompanionsPerGuest: "0",
    companionsRequireApproval: true,
    publicInviteEnabled: false,
    rsvpDeadline: "",
    budgetEstimated: "",
    initialEstimatedCost: "",
    financialNotes: "",
  })

  useEffect(() => {
    if (!event || !open) return
    setForm({
      title: event.title || "",
      description: event.description || "",
      type: event.type || "Festa",
      status: event.status || "active",
      startDate: toInputDate(event),
      startTime: event.startTime || event.time || "",
      endDate: event.endDate || toInputDate(event),
      endTime: event.endTime || "",
      location: event.location || "",
      address: event.address || "",
      mapsUrl: event.mapsUrl || "",
      eventMode: event.eventMode || "presential",
      meetingUrl: event.meetingUrl || "",
      capacity: event.capacity == null ? "" : String(event.capacity),
      allowCompanions: Boolean(event.allowCompanions),
      maxCompanionsPerGuest: String(event.maxCompanionsPerGuest ?? 0),
      companionsRequireApproval: event.companionsRequireApproval ?? true,
      publicInviteEnabled: Boolean(event.publicInviteEnabled),
      rsvpDeadline: event.rsvpDeadline || "",
      budgetEstimated: event.budgetEstimated == null ? "" : String(event.budgetEstimated),
      initialEstimatedCost: event.initialEstimatedCost == null ? "" : String(event.initialEstimatedCost),
      financialNotes: event.financialNotes || "",
    })
  }, [event, open])

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const validate = () => {
    const capacity = toNumberOrNull(form.capacity)
    const maxCompanions = toNumberOrNull(form.maxCompanionsPerGuest)
    const budget = toNumberOrNull(form.budgetEstimated)
    const initialCost = toNumberOrNull(form.initialEstimatedCost)

    if (!form.title.trim()) return "Informe o nome do evento."
    if (!form.startDate) return "Informe a data do evento."
    if (!form.startTime) return "Informe o horario de inicio."
    if (form.endTime && form.startTime && form.endTime <= form.startTime) return "O horario final precisa ser depois do inicio."
    if (form.eventMode !== "online" && !form.location.trim()) return "Informe o local para eventos presenciais ou hibridos."
    if (form.eventMode !== "presential" && !form.meetingUrl.trim()) return "Informe o link da reuniao para eventos online ou hibridos."
    if (capacity !== null && capacity < 0) return "A capacidade nao pode ser negativa."
    if (maxCompanions !== null && maxCompanions < 0) return "O maximo de acompanhantes nao pode ser negativo."
    if (form.rsvpDeadline && form.startDate && form.rsvpDeadline > form.startDate) {
      return "A data limite de confirmacao nao pode ser depois da data do evento."
    }
    if (budget !== null && budget < 0) return "O orcamento previsto nao pode ser negativo."
    if (initialCost !== null && initialCost < 0) return "O custo inicial nao pode ser negativo."
    return null
  }

  const handleUpdateEvent = async () => {
    if (!event) return
    const error = validate()
    if (error) {
      toast({ title: "Revise os campos", description: error, variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const displayDate = format(new Date(`${form.startDate}T00:00:00`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      const fullDate = format(new Date(`${form.startDate}T00:00:00`), "dd/MM/yyyy")
      const payload = {
        ...event,
        title: form.title.trim(),
        description: form.description,
        type: form.type,
        category: form.type,
        status: form.status,
        date: displayDate,
        fullDate,
        time: form.startTime,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate || form.startDate,
        endTime: form.endTime,
        location: form.location,
        address: form.address,
        mapsUrl: form.mapsUrl,
        eventMode: form.eventMode,
        meetingUrl: form.meetingUrl,
        capacity: toNumberOrNull(form.capacity),
        allowCompanions: form.allowCompanions,
        maxCompanionsPerGuest: toNumberOrNull(form.maxCompanionsPerGuest) || 0,
        companionsRequireApproval: form.companionsRequireApproval,
        publicInviteEnabled: form.publicInviteEnabled,
        rsvpDeadline: form.rsvpDeadline || null,
        budgetEstimated: toNumberOrNull(form.budgetEstimated),
        initialEstimatedCost: toNumberOrNull(form.initialEstimatedCost),
        financialNotes: form.financialNotes,
      }

      if (!isDemoMode) {
        const result = await updateEventDetails(event.id, payload)
        if (result.error || !result.data) throw new Error(result.error || "Nao foi possivel atualizar o evento.")
      }

      updateEvent(event.id, payload)
      onOpenChange(false)
      toast({ title: "Evento atualizado", description: "A central de gestao ja reflete as novas informacoes." })
    } catch (error) {
      toast({
        title: "Erro ao atualizar evento",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>Atualize os dados principais, RSVP, convidados e informacoes financeiras.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="event-title">Nome do evento*</Label>
              <Input id="event-title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(value) => setField("type", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{eventTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setField("status", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluido</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descricao</Label>
              <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Data*</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inicio*</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setField("startTime", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setField("endTime", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Modo</Label>
              <Select value={form.eventMode} onValueChange={(value) => setField("eventMode", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presential">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hibrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Local</Label>
              <Input value={form.location} onChange={(e) => setField("location", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereco completo</Label>
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Google Maps</Label>
              <Input value={form.mapsUrl} onChange={(e) => setField("mapsUrl", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Link da reuniao</Label>
              <Input value={form.meetingUrl} onChange={(e) => setField("meetingUrl", e.target.value)} />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input type="number" min="0" value={form.capacity} onChange={(e) => setField("capacity", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max. acompanhantes</Label>
              <Input type="number" min="0" value={form.maxCompanionsPerGuest} onChange={(e) => setField("maxCompanionsPerGuest", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Limite RSVP</Label>
              <Input type="date" value={form.rsvpDeadline} onChange={(e) => setField("rsvpDeadline", e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Permitir acompanhantes</Label>
              <Switch checked={form.allowCompanions} onCheckedChange={(checked) => setField("allowCompanions", checked)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Acompanhante exige aprovacao</Label>
              <Switch checked={form.companionsRequireApproval} onCheckedChange={(checked) => setField("companionsRequireApproval", checked)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Link publico ativo</Label>
              <Switch checked={form.publicInviteEnabled} onCheckedChange={(checked) => setField("publicInviteEnabled", checked)} />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Orcamento previsto</Label>
              <Input value={form.budgetEstimated} onChange={(e) => setField("budgetEstimated", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Custo inicial estimado</Label>
              <Input value={form.initialEstimatedCost} onChange={(e) => setField("initialEstimatedCost", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Observacoes financeiras</Label>
              <Textarea value={form.financialNotes} onChange={(e) => setField("financialNotes", e.target.value)} />
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleUpdateEvent} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

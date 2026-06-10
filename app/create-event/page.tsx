"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  DollarSign,
  Eye,
  Link2,
  Loader2,
  MapPin,
  Send,
  Users,
} from "lucide-react"

import { createEvent } from "@/app/actions/events"
import { BackButton } from "@/components/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { useContactStore } from "@/stores/contact-store"
import { useEventStore } from "@/stores/event-store"

const steps = [
  { title: "Informações básicas", icon: ClipboardList },
  { title: "Data e local", icon: CalendarDays },
  { title: "Convidados", icon: Users },
  { title: "Convite e RSVP", icon: Send },
  { title: "Orçamento", icon: DollarSign },
  { title: "Revisão", icon: Eye },
]

const eventTypes = ["Festa", "Casamento", "Aniversário", "Corporativo", "Viagem", "Religioso", "Colaborativo", "Outro"]
const statuses = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "completed", label: "Concluído" },
  { value: "canceled", label: "Cancelado" },
]

type FormState = {
  title: string
  description: string
  type: string
  status: string
  visibility: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string
  address: string
  mapsUrl: string
  eventMode: string
  meetingUrl: string
  capacity: string
  allowGuests: boolean
  allowCompanions: boolean
  maxCompanionsPerGuest: string
  companionsRequireApproval: boolean
  publicInviteEnabled: boolean
  autoApprovePublicGuests: boolean
  rsvpEnabled: boolean
  rsvpDeadline: string
  allowDecline: boolean
  allowResponseEdit: boolean
  invitationMessage: string
  budgetEstimated: string
  initialEstimatedCost: string
  currency: string
  financialNotes: string
}

const initialForm: FormState = {
  title: "",
  description: "",
  type: "Festa",
  status: "active",
  visibility: "private",
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
  allowGuests: true,
  allowCompanions: false,
  maxCompanionsPerGuest: "0",
  companionsRequireApproval: false,
  publicInviteEnabled: false,
  autoApprovePublicGuests: false,
  rsvpEnabled: true,
  rsvpDeadline: "",
  allowDecline: true,
  allowResponseEdit: true,
  invitationMessage: "",
  budgetEstimated: "",
  initialEstimatedCost: "",
  currency: "BRL",
  financialNotes: "",
}

function toNumberOrNull(value: string) {
  if (value.trim() === "") return null
  return Number(value)
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function CreateEvent() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading, isDemoMode } = useAuth()
  const { addEvent } = useEventStore()
  const { contacts, contactLists, searchContacts, getContactsByList, initializeData } = useContactStore()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const selectedContactsData = useMemo(() => {
    const individualContacts = contacts.filter((contact) => selectedContacts.includes(contact.id))
    const listContacts = selectedLists.flatMap((listId) => getContactsByList(listId))
    const allContacts = [...individualContacts, ...listContacts]

    return allContacts.filter((contact, index, self) => index === self.findIndex((item) => item.id === contact.id))
  }, [contacts, getContactsByList, selectedContacts, selectedLists])

  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts
  const progress = ((step + 1) / steps.length) * 100
  const publicUrl =
    createdEvent?.publicInviteEnabled && createdEvent?.publicInviteToken
      ? `${window.location.origin}/convite/${createdEvent.publicInviteToken}`
      : ""

  const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const validate = (targetStep = step) => {
    const errors: string[] = []
    const capacity = toNumberOrNull(form.capacity)
    const maxCompanions = toNumberOrNull(form.maxCompanionsPerGuest)
    const budget = toNumberOrNull(form.budgetEstimated)
    const initialCost = toNumberOrNull(form.initialEstimatedCost)

    if (targetStep >= 0 && !form.title.trim()) errors.push("Informe o nome do evento.")
    if (targetStep >= 1 && !form.startDate) errors.push("Informe a data do evento.")
    if (targetStep >= 1 && !form.startTime) errors.push("Informe o horário de início.")
    if (targetStep >= 1 && form.endTime && form.startTime && form.endTime <= form.startTime) {
      errors.push("O horário de término precisa ser depois do início.")
    }
    if (targetStep >= 1 && form.eventMode !== "online" && !form.location.trim()) {
      errors.push("Informe o local para eventos presenciais ou híbridos.")
    }
    if (targetStep >= 1 && form.eventMode !== "presential" && !form.meetingUrl.trim()) {
      errors.push("Informe o link da reunião para eventos online ou híbridos.")
    }
    if (targetStep >= 2 && capacity !== null && capacity < 0) errors.push("A capacidade não pode ser negativa.")
    if (targetStep >= 2 && maxCompanions !== null && maxCompanions < 0) {
      errors.push("O máximo de acompanhantes não pode ser negativo.")
    }
    if (targetStep >= 3 && form.rsvpDeadline && form.startDate && form.rsvpDeadline > form.startDate) {
      errors.push("A data limite de confirmação não pode ser depois da data do evento.")
    }
    if (targetStep >= 4 && budget !== null && budget < 0) errors.push("O orçamento previsto não pode ser negativo.")
    if (targetStep >= 4 && initialCost !== null && initialCost < 0) {
      errors.push("O custo estimado inicial não pode ser negativo.")
    }

    if (errors.length > 0) {
      toast({
        title: "Revise os campos",
        description: errors[0],
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const goNext = () => {
    if (!validate(step)) return
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const saveEvent = async (statusOverride?: "draft" | "active") => {
    const finalStatus = statusOverride || form.status
    if (!validate(steps.length - 1)) return
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Entre com uma conta Supabase para salvar eventos no banco.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const displayDate = form.startDate
        ? format(new Date(`${form.startDate}T00:00:00`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : ""
      const fullDate = form.startDate ? format(new Date(`${form.startDate}T00:00:00`), "dd/MM/yyyy") : ""

      if (isDemoMode) {
        const token = form.publicInviteEnabled ? crypto.randomUUID() : null
        const demoEvent = {
          id: Date.now().toString(),
          title: form.title.trim(),
          type: form.type,
          category: form.type,
          status: finalStatus,
          visibility: form.visibility,
          date: displayDate,
          time: form.startTime,
          fullDate,
          startDate: form.startDate,
          startTime: form.startTime,
          endDate: form.endDate || form.startDate,
          endTime: form.endTime,
          location: form.eventMode === "online" ? form.meetingUrl : form.location,
          address: form.address,
          mapsUrl: form.mapsUrl,
          eventMode: form.eventMode,
          meetingUrl: form.meetingUrl,
          description: form.description,
          capacity: toNumberOrNull(form.capacity),
          allowGuests: form.allowGuests,
          allowCompanions: form.allowCompanions,
          maxCompanionsPerGuest: toNumberOrNull(form.maxCompanionsPerGuest) || 0,
          companionsRequireApproval: form.companionsRequireApproval,
          autoApprovePublicGuests: form.autoApprovePublicGuests,
          rsvpEnabled: form.rsvpEnabled,
          rsvpDeadline: form.rsvpDeadline,
          allowDecline: form.allowDecline,
          allowResponseEdit: form.allowResponseEdit,
          invitationMessage: form.invitationMessage,
          budgetEstimated: toNumberOrNull(form.budgetEstimated),
          initialEstimatedCost: toNumberOrNull(form.initialEstimatedCost),
          currency: form.currency,
          financialNotes: form.financialNotes,
          confirmedGuests: 0,
          totalGuests: selectedContactsData.length,
          items: [],
          guests: selectedContactsData.map((contact, index) => ({
            id: `g-${Date.now()}-${index}`,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            status: "pending" as const,
            contactId: contact.id,
          })),
          photos: [],
          publicInviteEnabled: form.publicInviteEnabled,
          publicInviteToken: token,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        addEvent(demoEvent)
        setCreatedEvent(demoEvent)
        toast({
          title: finalStatus === "draft" ? "Rascunho demo salvo" : "Evento demo criado",
          description: "Modo demo salva no navegador. Configure o Supabase para persistir no banco.",
        })
        return
      }

      const result = await createEvent({
        ...form,
        status: finalStatus,
        date: displayDate,
        fullDate,
        time: form.startTime,
        capacity: toNumberOrNull(form.capacity),
        maxCompanionsPerGuest: toNumberOrNull(form.maxCompanionsPerGuest) || 0,
        budgetEstimated: toNumberOrNull(form.budgetEstimated),
        initialEstimatedCost: toNumberOrNull(form.initialEstimatedCost),
        guests: selectedContactsData.map((contact) => ({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          contactId: contact.id,
        })),
      })

      if (result.error || !result.data) {
        throw new Error(
          result.error === "Not authenticated"
            ? "Sua sessão Supabase não está ativa. Faça login novamente e tente criar o evento."
            : result.error || "Não foi possível criar o evento.",
        )
      }

      addEvent(result.data)
      setCreatedEvent(result.data)
      toast({
        title: finalStatus === "draft" ? "Rascunho salvo" : "Evento criado",
        description: "O evento foi salvo no Supabase com segurança.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar evento",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPublicUrl = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  if (createdEvent) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardHeader>
            <Badge className="w-fit">{createdEvent.publicInviteEnabled ? "Link público ativo" : "Evento privado"}</Badge>
            <CardTitle className="text-2xl">Próximos passos para {createdEvent.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {publicUrl ? (
              <div className="space-y-2">
                <Label>Link público do evento</Label>
                <div className="flex gap-2">
                  <Input value={publicUrl} readOnly />
                  <Button type="button" variant="outline" size="icon" onClick={copyPublicUrl}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href={`/event/${createdEvent.id}`}>
                <Button className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Adicionar convidados
                </Button>
              </Link>
              <Link href={`/event/${createdEvent.id}`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cadastrar custos
                </Button>
              </Link>
              <Link href={`/event/${createdEvent.id}`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Criar tarefas
                </Button>
              </Link>
              {publicUrl ? (
                <Link href={publicUrl}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Link2 className="h-4 w-4" />
                    Ver página pública
                  </Button>
                </Link>
              ) : null}
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Ir para o dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Criar novo evento</h1>
            <p className="text-muted-foreground">Configure o evento, convites, RSVP e orçamento em um fluxo guiado.</p>
          </div>
        </div>

        <div className="mb-6 rounded-md border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">
                Etapa {step + 1} de {steps.length}
              </div>
              <div className="text-sm text-muted-foreground">{steps[step].title}</div>
            </div>
            <Badge variant="outline">{Math.round(progress)}%</Badge>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = steps[step].icon
                  return <Icon className="h-5 w-5 text-emerald-600" />
                })()}
                {steps[step].title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === 0 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="title">Nome do evento *</Label>
                    <Input id="title" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={form.description}
                      onChange={(event) => updateForm("description", event.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo do evento</Label>
                      <Select value={form.type} onValueChange={(value) => updateForm("type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status inicial</Label>
                      <Select value={form.status} onValueChange={(value) => updateForm("status", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Visibilidade</Label>
                      <Select value={form.visibility} onValueChange={(value) => updateForm("visibility", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Privado</SelectItem>
                          <SelectItem value="public">Público</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Data do evento *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={form.startDate}
                        onChange={(event) => {
                          updateForm("startDate", event.target.value)
                          if (!form.endDate) updateForm("endDate", event.target.value)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={form.eventMode} onValueChange={(value) => updateForm("eventMode", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presential">Presencial</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="hybrid">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Horário de início *</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={form.startTime}
                        onChange={(event) => updateForm("startTime", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time">Horário de término</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={form.endTime}
                        onChange={(event) => updateForm("endTime", event.target.value)}
                      />
                    </div>
                  </div>

                  {form.eventMode !== "online" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location">Local *</Label>
                        <Input
                          id="location"
                          value={form.location}
                          onChange={(event) => updateForm("location", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço completo</Label>
                        <Input
                          id="address"
                          value={form.address}
                          onChange={(event) => updateForm("address", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="maps-url">Link do Google Maps</Label>
                        <Input
                          id="maps-url"
                          value={form.mapsUrl}
                          onChange={(event) => updateForm("mapsUrl", event.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}

                  {form.eventMode !== "presential" ? (
                    <div className="space-y-2">
                      <Label htmlFor="meeting-url">Link da reunião *</Label>
                      <Input
                        id="meeting-url"
                        value={form.meetingUrl}
                        onChange={(event) => updateForm("meetingUrl", event.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacidade máxima</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="0"
                        value={form.capacity}
                        onChange={(event) => updateForm("capacity", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-companions">Máximo de acompanhantes por convidado</Label>
                      <Input
                        id="max-companions"
                        type="number"
                        min="0"
                        value={form.maxCompanionsPerGuest}
                        onChange={(event) => updateForm("maxCompanionsPerGuest", event.target.value)}
                        disabled={!form.allowCompanions}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <ToggleRow
                      label="Permitir convidados"
                      checked={form.allowGuests}
                      onCheckedChange={(checked) => updateForm("allowGuests", checked)}
                    />
                    <ToggleRow
                      label="Permitir acompanhantes"
                      checked={form.allowCompanions}
                      onCheckedChange={(checked) => updateForm("allowCompanions", checked)}
                    />
                    <ToggleRow
                      label="Acompanhante precisa de aprovação"
                      checked={form.companionsRequireApproval}
                      onCheckedChange={(checked) => updateForm("companionsRequireApproval", checked)}
                    />
                    <ToggleRow
                      label="Permitir convidados via link público"
                      checked={form.publicInviteEnabled}
                      onCheckedChange={(checked) => updateForm("publicInviteEnabled", checked)}
                    />
                    <ToggleRow
                      label="Autoaprovar convidados do link público"
                      description="Quando desligado, pessoas vindas do link entram aguardando aprovação."
                      checked={form.autoApprovePublicGuests}
                      onCheckedChange={(checked) => updateForm("autoApprovePublicGuests", checked)}
                    />
                  </div>

                  <Tabs defaultValue="contacts">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="contacts">Contatos</TabsTrigger>
                      <TabsTrigger value="lists">Listas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="contacts" className="space-y-3">
                      <Input
                        placeholder="Buscar contatos"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                      />
                      <div className="max-h-72 overflow-auto rounded-md border">
                        {filteredContacts.map((contact) => (
                          <label key={contact.id} className="flex cursor-pointer items-center justify-between gap-3 border-b p-3">
                            <span>
                              <span className="block text-sm font-medium">{contact.name}</span>
                              <span className="block text-xs text-muted-foreground">{contact.email}</span>
                            </span>
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) =>
                                setSelectedContacts((current) =>
                                  checked ? [...current, contact.id] : current.filter((id) => id !== contact.id),
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="lists">
                      <div className="max-h-72 overflow-auto rounded-md border">
                        {contactLists.map((list) => (
                          <label key={list.id} className="flex cursor-pointer items-center justify-between gap-3 border-b p-3">
                            <span>
                              <span className="block text-sm font-medium">{list.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {getContactsByList(list.id).length} contatos
                              </span>
                            </span>
                            <Checkbox
                              checked={selectedLists.includes(list.id)}
                              onCheckedChange={(checked) =>
                                setSelectedLists((current) =>
                                  checked ? [...current, list.id] : current.filter((id) => id !== list.id),
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                  <Badge variant="outline">{selectedContactsData.length} convidado(s) selecionado(s)</Badge>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <div className="grid gap-3">
                    <ToggleRow
                      label="Permitir confirmação de presença"
                      checked={form.rsvpEnabled}
                      onCheckedChange={(checked) => updateForm("rsvpEnabled", checked)}
                    />
                    <ToggleRow
                      label="Permitir recusa de presença"
                      checked={form.allowDecline}
                      onCheckedChange={(checked) => updateForm("allowDecline", checked)}
                    />
                    <ToggleRow
                      label="Permitir alteração após confirmação"
                      checked={form.allowResponseEdit}
                      onCheckedChange={(checked) => updateForm("allowResponseEdit", checked)}
                    />
                    <ToggleRow
                      label="Ativar link público do evento"
                      checked={form.publicInviteEnabled}
                      onCheckedChange={(checked) => updateForm("publicInviteEnabled", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="rsvp-deadline">Data limite de confirmação</Label>
                      </TooltipTrigger>
                      <TooltipContent>Essa data será usada nos convites e na página pública.</TooltipContent>
                    </Tooltip>
                    <Input
                      id="rsvp-deadline"
                      type="date"
                      value={form.rsvpDeadline}
                      onChange={(event) => updateForm("rsvpDeadline", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invitation-message">Mensagem personalizada do convite</Label>
                    <Textarea
                      id="invitation-message"
                      rows={5}
                      value={form.invitationMessage}
                      onChange={(event) => updateForm("invitationMessage", event.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Orçamento previsto</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        value={form.budgetEstimated}
                        onChange={(event) => updateForm("budgetEstimated", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initial-cost">Custo estimado inicial</Label>
                      <Input
                        id="initial-cost"
                        type="number"
                        min="0"
                        value={form.initialEstimatedCost}
                        onChange={(event) => updateForm("initialEstimatedCost", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Moeda</Label>
                      <Select value={form.currency} onValueChange={(value) => updateForm("currency", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="financial-notes">Observações financeiras</Label>
                    <Textarea
                      id="financial-notes"
                      rows={4}
                      value={form.financialNotes}
                      onChange={(event) => updateForm("financialNotes", event.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Nome", form.title || "Sem nome"],
                    ["Tipo", form.type],
                    ["Data e horário", `${form.startDate || "Sem data"} às ${form.startTime || "--:--"}`],
                    ["Local", form.eventMode === "online" ? form.meetingUrl : form.location || "A definir"],
                    ["Capacidade", form.capacity || "Sem limite definido"],
                    ["Acompanhantes", form.allowCompanions ? `Até ${form.maxCompanionsPerGuest}` : "Não permitido"],
                    ["Link público", form.publicInviteEnabled ? "Ativado" : "Desativado"],
                    ["Limite RSVP", form.rsvpDeadline || "Sem limite"],
                    ["Orçamento", form.budgetEstimated ? `${form.currency} ${form.budgetEstimated}` : "Não informado"],
                    ["Convidados iniciais", String(selectedContactsData.length)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border p-3">
                      <div className="text-xs uppercase text-muted-foreground">{label}</div>
                      <div className="mt-1 text-sm font-medium">{value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0 || isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button type="button" variant="outline" onClick={() => saveEvent("draft")} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar como rascunho
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={goNext}>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={() => saveEvent("active")} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Criar evento
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">{form.title || "Nome do evento"}</div>
                  <div className="text-muted-foreground">{form.type} · {form.status}</div>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <CalendarDays className="mt-0.5 h-4 w-4" />
                  <span>{form.startDate || "Data"} {form.startTime ? `às ${form.startTime}` : ""}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>{form.eventMode === "online" ? form.meetingUrl || "Online" : form.location || "Local"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedContactsData.length} convidados</Badge>
                  {form.publicInviteEnabled ? <Badge>Link público</Badge> : null}
                  {form.allowCompanions ? <Badge variant="secondary">Acompanhantes</Badge> : null}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  )
}

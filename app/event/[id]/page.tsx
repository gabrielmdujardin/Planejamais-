"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit3,
  ImageIcon,
  LinkIcon,
  Mail,
  MapPin,
  Plus,
  Send,
  Users,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AddGuestDialog from "@/components/add-guest-dialog"
import AddItemDialog from "@/components/add-item-dialog"
import EditEventDialog from "@/components/edit-event-dialog"
import EventGallery from "@/components/event-gallery"
import GuestList from "@/components/guest-list"
import ItemsList from "@/components/items-list"
import PendingRequestsList from "@/components/pending-requests-list"
import PublicInviteShare from "@/components/public-invite-share"
import { getEventById as fetchEventById } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  completed: "Concluido",
  canceled: "Cancelado",
}

const modeLabel: Record<string, string> = {
  presential: "Presencial",
  presencial: "Presencial",
  online: "Online",
  hybrid: "Hibrido",
  hibrido: "Hibrido",
}

const requestStatuses = new Set(["awaiting_approval", "pending_approval"])

export default function EventPage() {
  const { addEvent, getEventById, updateEvent } = useEventStore()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const storedEvent = getEventById(id)
  const [remoteEvent, setRemoteEvent] = useState<any | null>(null)
  const event = storedEvent || remoteEvent
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false

    async function loadEvent() {
      if (storedEvent) {
        setIsLoading(false)
        return
      }

      const result = await fetchEventById(id)
      if (cancelled) return

      if (result.data) {
        setRemoteEvent(result.data)
        if (getEventById(result.data.id)) updateEvent(result.data.id, result.data)
        else addEvent(result.data)
      }
      setIsLoading(false)
    }

    loadEvent()
    return () => {
      cancelled = true
    }
  }, [addEvent, getEventById, id, storedEvent, updateEvent])

  useEffect(() => {
    if (!isLoading && !event) {
      toast({
        title: "Evento nao encontrado",
        description: "Voltei para a visao geral porque este evento nao esta disponivel neste modo.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [event, isLoading, router, toast])

  const stats = useMemo(() => {
    const guests = event?.guests || []
    const items = event?.items || []
    const photos = event?.photos || []
    const confirmed = guests.filter((guest: any) => guest.status === "confirmed").length
    const declined = guests.filter((guest: any) => guest.status === "declined" || guest.status === "rejected").length
    const requests = guests.filter((guest: any) => requestStatuses.has(guest.status)).length
    const pending = guests.filter((guest: any) => guest.status === "pending").length
    const pendingCompanions = guests.reduce((total: number, guest: any) => {
      return total + (guest.companions || []).filter((companion: any) => companion.status === "pending").length
    }, 0)
    const totalCost = items.reduce((sum: number, item: any) => sum + Number(item.price || item.estimatedCost || item.estimated_cost || 0), 0)
    const initialCost = Number(event?.initialEstimatedCost || 0)
    const effectiveCost = totalCost + initialCost

    return {
      totalGuests: guests.length || event?.totalGuests || 0,
      confirmed,
      pending,
      declined,
      requests,
      pendingCompanions,
      itemCount: items.length,
      photoCount: photos.length,
      totalCost: effectiveCost,
      confirmationRate: guests.length > 0 ? Math.round((confirmed / guests.length) * 100) : 0,
      costPerConfirmed: confirmed > 0 ? effectiveCost / confirmed : 0,
    }
  }, [event])

  const recommendations = useMemo(() => {
    if (!event) return []
    const notes: string[] = []
    if (stats.totalGuests === 0) notes.push("Este evento ainda nao possui convidados.")
    if (stats.pending > 0) notes.push(`${stats.pending} convidado(s) ainda aguardam resposta.`)
    if (stats.requests > 0) notes.push("Ha solicitacoes de entrada aguardando aprovacao.")
    if (stats.pendingCompanions > 0) notes.push("Ha acompanhantes aguardando aprovacao.")
    if (stats.itemCount === 0) notes.push("Este evento ainda nao possui gastos cadastrados.")
    if (!event.location && event.eventMode !== "online") notes.push("O evento esta sem local definido.")
    if (!event.budgetEstimated) notes.push("O orcamento previsto ainda nao foi definido.")
    if (event.rsvpDeadline) {
      const days = Math.ceil((new Date(`${event.rsvpDeadline}T00:00:00`).getTime() - Date.now()) / 86400000)
      if (days >= 0 && days <= 7) notes.push("A data limite de confirmacao esta proxima.")
    }
    return notes
  }, [event, stats])

  const publicUrl =
    typeof window !== "undefined" && event?.publicInviteEnabled && event?.publicInviteToken
      ? `${window.location.origin}/convite/${event.publicInviteToken}`
      : ""

  const copyText = async (text: string, title: string, description: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title, description })
  }

  const handleShare = async () => {
    if (publicUrl) {
      await copyText(publicUrl, "Link publico copiado", "O link publico seguro do evento foi copiado.")
      return
    }

    toast({
      title: "Link publico nao ativado",
      description: "Ative o link publico na edicao do evento ou use a aba Solicitacoes para gerar um link.",
      variant: "destructive",
    })
    setActiveTab("requests")
  }

  const handleResendInvites = async () => {
    const pendingGuests = (event?.guests || []).filter((guest: any) => guest.status === "pending")
    if (pendingGuests.length === 0) {
      toast({ title: "Nenhum convite pendente", description: "Nao ha convidados pendentes para reenviar." })
      return
    }

    setIsSendingInvites(true)
    try {
      const response = await fetch(`/api/events/${event.id}/send-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: pendingGuests.map((guest: any) => guest.id) }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Envio indisponivel")

      toast({
        title: "Convites processados",
        description: `${pendingGuests.length} convite(s) foram enviados ou processados pela API.`,
      })
    } catch (error) {
      toast({
        title: "Envio real indisponivel",
        description: "Configure Supabase/Resend para envio por email. Os links individuais podem ser copiados na aba Convidados.",
        variant: "destructive",
      })
    } finally {
      setIsSendingInvites(false)
    }
  }

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-56 rounded bg-muted" />
            <div className="h-64 rounded-lg bg-muted" />
            <div className="grid gap-4 md:grid-cols-4">
              <div className="h-28 rounded-lg bg-muted" />
              <div className="h-28 rounded-lg bg-muted" />
              <div className="h-28 rounded-lg bg-muted" />
              <div className="h-28 rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const eventDateLine = [event.date, event.startTime || event.time, event.endTime ? `ate ${event.endTime}` : ""].filter(Boolean).join(" ")
  const capacityLine = event.capacity ? `${stats.totalGuests}/${event.capacity} convidados` : `${stats.totalGuests} convidados`

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Visao geral dos eventos
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analises globais
            </Button>
          </Link>
        </div>

        <section className="mb-6 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20">{event.type || "Evento"}</Badge>
                <Badge variant="outline">{statusLabel[event.status || "active"] || event.status}</Badge>
                <Badge variant="outline">{modeLabel[event.eventMode || "presential"] || event.eventMode || "Presencial"}</Badge>
                {event.publicInviteEnabled ? <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20">Link publico ativo</Badge> : null}
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-normal text-foreground">{event.title}</h1>
                {event.description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{event.description}</p> : null}
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex gap-2"><Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {eventDateLine || "Data nao definida"}</div>
                <div className="flex gap-2"><MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {event.location || event.address || "Local nao definido"}</div>
                <div className="flex gap-2"><Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {capacityLine}</div>
                {event.address ? <div className="sm:col-span-2">Endereco: {event.address}</div> : null}
                {event.meetingUrl ? <div className="sm:col-span-2">Reuniao: {event.meetingUrl}</div> : null}
                {event.rsvpDeadline ? <div>Limite RSVP: {new Date(`${event.rsvpDeadline}T00:00:00`).toLocaleDateString("pt-BR")}</div> : null}
                {event.budgetEstimated ? <div>Orcamento: {currency.format(Number(event.budgetEstimated))}</div> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button variant="outline" onClick={() => setIsEditEventOpen(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Editar evento
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
              {publicUrl ? (
                <Button variant="outline" onClick={() => copyText(publicUrl, "Link copiado", "Link publico copiado para a area de transferencia.")}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link publico
                </Button>
              ) : null}
              <Button onClick={handleResendInvites} disabled={isSendingInvites} className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="mr-2 h-4 w-4" />
                {isSendingInvites ? "Enviando..." : "Enviar convites"}
              </Button>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total de convidados" value={stats.totalGuests} icon={<Users className="h-4 w-4" />} />
          <MetricCard title="Confirmados" value={stats.confirmed} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
          <MetricCard title="Pendentes" value={stats.pending} icon={<Clock className="h-4 w-4" />} tone="amber" />
          <MetricCard title="Recusados" value={stats.declined} icon={<XCircle className="h-4 w-4" />} tone="red" />
          <MetricCard title="Solicitacoes pendentes" value={stats.requests} icon={<Mail className="h-4 w-4" />} />
          <MetricCard title="Acompanhantes pendentes" value={stats.pendingCompanions} icon={<Users className="h-4 w-4" />} />
          <MetricCard title="Gastos" value={currency.format(stats.totalCost)} icon={<DollarSign className="h-4 w-4" />} />
          <MetricCard title="Fotos" value={stats.photoCount} icon={<ImageIcon className="h-4 w-4" />} />
        </div>

        <Card className="mb-6">
          <CardContent className="flex flex-wrap gap-2 p-4">
            <Button size="sm" variant="outline" onClick={() => setIsEditEventOpen(true)}><Edit3 className="mr-2 h-4 w-4" /> Editar evento</Button>
            <Button size="sm" variant="outline" onClick={() => setIsAddGuestOpen(true)}><Plus className="mr-2 h-4 w-4" /> Adicionar convidado</Button>
            <Button size="sm" variant="outline" onClick={handleResendInvites}><Mail className="mr-2 h-4 w-4" /> Enviar convites</Button>
            <Button size="sm" variant="outline" onClick={handleShare}><Copy className="mr-2 h-4 w-4" /> Copiar link publico</Button>
            <Button size="sm" variant="outline" onClick={() => setIsAddItemOpen(true)}><DollarSign className="mr-2 h-4 w-4" /> Adicionar gasto</Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("requests")}><Mail className="mr-2 h-4 w-4" /> Ver solicitacoes</Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("photos")}><ImageIcon className="mr-2 h-4 w-4" /> Galeria</Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("analytics")}><BarChart3 className="mr-2 h-4 w-4" /> Analises do evento</Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">Visao geral</TabsTrigger>
            <TabsTrigger value="guests">Convidados ({stats.totalGuests})</TabsTrigger>
            <TabsTrigger value="requests">Solicitacoes ({stats.requests})</TabsTrigger>
            <TabsTrigger value="expenses">Gastos ({stats.itemCount})</TabsTrigger>
            <TabsTrigger value="photos">Fotos ({stats.photoCount})</TabsTrigger>
            <TabsTrigger value="analytics">Analises</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Resumo do evento</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Confirmacoes</span>
                      <span>{stats.confirmed}/{stats.totalGuests}</span>
                    </div>
                    <Progress value={stats.confirmationRate} className="h-2" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <InfoBox label="Capacidade" value={event.capacity ? `${stats.totalGuests}/${event.capacity}` : "Sem limite"} />
                    <InfoBox label="Acompanhantes" value={event.allowCompanions ? `Ate ${event.maxCompanionsPerGuest || 0}` : "Nao permitido"} />
                    <InfoBox label="Link publico" value={event.publicInviteEnabled ? "Ativado" : "Desativado"} />
                    <InfoBox label="Custo total" value={currency.format(stats.totalCost)} />
                    <InfoBox label="Custo por confirmado" value={currency.format(stats.costPerConfirmed)} />
                    <InfoBox label="Orcamento" value={event.budgetEstimated ? currency.format(Number(event.budgetEstimated)) : "Nao definido"} />
                  </div>
                  {event.financialNotes ? <p className="rounded-md bg-muted/50 p-3 text-sm text-foreground">Notas financeiras: {event.financialNotes}</p> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Proximas acoes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.length > 0 ? recommendations.map((note) => (
                    <div key={note} className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">{note}</div>
                  )) : (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                      O evento esta com dados basicos, convidados e custos em dia.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Convidados</CardTitle>
                <Button size="sm" onClick={() => setIsAddGuestOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent><GuestList guests={event.guests || []} eventId={event.id} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader><CardTitle>Solicitacoes e link publico</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <PublicInviteShare
                  eventId={event.id}
                  eventTitle={event.title}
                  eventType={event.type}
                  eventCategory={event.category}
                  eventDate={event.date}
                  eventTime={event.time}
                  eventFullDate={event.fullDate}
                  eventLocation={event.location}
                  eventDescription={event.description}
                  confirmedGuests={stats.confirmed}
                  totalGuests={stats.totalGuests}
                />
                <PendingRequestsList eventId={event.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gastos do evento</CardTitle>
                <Button size="sm" onClick={() => setIsAddItemOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar gasto
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <ItemsList items={event.items || []} eventId={event.id} />
                <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
                  <div className="flex justify-between"><span>Total de gastos cadastrados</span><strong>{currency.format(stats.totalCost)}</strong></div>
                  <div className="flex justify-between"><span>Custo medio por confirmado</span><strong>{currency.format(stats.costPerConfirmed)}</strong></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <EventGallery eventId={event.id} photos={event.photos || []} canUpload currentUser="Usuario atual" />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader><CardTitle>Analises deste evento</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <InfoBox label="Taxa de confirmacao" value={`${stats.confirmationRate}%`} />
                <InfoBox label="Solicitacoes pendentes" value={String(stats.requests)} />
                <InfoBox label="Custo total" value={currency.format(stats.totalCost)} />
                <InfoBox label="Convidados sem resposta" value={String(stats.pending)} />
                <InfoBox label="Acompanhantes pendentes" value={String(stats.pendingCompanions)} />
                <InfoBox label="Fotos" value={String(stats.photoCount)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddItemDialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen} eventId={event.id} />
        <AddGuestDialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen} eventId={event.id} />
        <EditEventDialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen} eventId={event.id} />
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, tone = "slate" }: { title: string; value: string | number; icon: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "red" }) {
  const tones = {
    slate: "text-muted-foreground bg-muted",
    emerald: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/50",
    amber: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/50",
    red: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/50",
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${tones[tone]}`}>{icon}</div>
      </CardContent>
    </Card>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}

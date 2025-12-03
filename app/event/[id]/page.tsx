"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, ArrowLeft } from "lucide-react"
import GuestList from "@/components/guest-list"
import ItemsList from "@/components/items-list"
import EventGallery from "@/components/event-gallery"
import EventHero from "@/components/event-hero"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"
import { useRouter } from "next/navigation"
import AddItemDialog from "@/components/add-item-dialog"
import AddGuestDialog from "@/components/add-guest-dialog"
import EditEventDialog from "@/components/edit-event-dialog"
import Link from "next/link"
import EmailPreview from "@/components/email-preview"
import SmsPreview from "@/components/sms-preview"
import { getEventTheme } from "@/lib/event-theme"

export default function EventPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const { getEventById } = useEventStore()
  const event = getEventById(params.id)

  useEffect(() => {
    const loadEvent = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsLoading(false)

      if (!event && !isLoading) {
        toast({
          title: "Evento não encontrado",
          description: "O evento que você está procurando não existe.",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    }

    loadEvent()
  }, [event, isLoading, router, toast])

  const handleResendInvites = () => {
    toast({
      title: "Convites reenviados",
      description: "Os convites foram reenviados para os convidados pendentes.",
    })
  }

  const handleEditEvent = () => {
    setIsEditEventOpen(true)
  }

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-[500px] bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const theme = getEventTheme(event.type)

  const totalCost = event.items ? event.items.reduce((sum, item) => sum + item.price, 0) : 0
  const costPerPerson = event.confirmedGuests > 0 ? (totalCost / event.confirmedGuests).toFixed(2) : "0.00"
  const pendingGuests =
    event.totalGuests -
    event.confirmedGuests -
    (event.guests ? event.guests.filter((g) => g.status === "declined").length : 0)
  const declinedGuests = event.guests ? event.guests.filter((g) => g.status === "declined").length : 0

  return (
    <div className={`min-h-screen ${theme.gradient}`}>
      <div className="container mx-auto max-w-7xl py-8 px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm hover:bg-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <EventHero event={event} onEdit={handleEditEvent} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Confirmações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-gray-600">
                      {event.confirmedGuests}/{event.totalGuests}
                    </span>
                  </div>
                  <Progress
                    value={event.totalGuests > 0 ? (event.confirmedGuests / event.totalGuests) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{event.confirmedGuests}</p>
                    <p className="text-xs text-gray-600">Confirmados</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{pendingGuests}</p>
                    <p className="text-xs text-gray-600">Pendentes</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{declinedGuests}</p>
                    <p className="text-xs text-gray-600">Recusados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de itens</span>
                  <span className="text-2xl font-bold">{event.items?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Custo total</span>
                  <span className="text-2xl font-bold text-emerald-600">R$ {totalCost.toFixed(2)}</span>
                </div>
                {event.type === "Colaborativo" && event.confirmedGuests > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Por pessoa</span>
                      <span className="text-lg font-semibold text-emerald-600">R$ {costPerPerson}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Galeria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de fotos</span>
                  <span className="text-2xl font-bold">{event.photos?.length || 0}</span>
                </div>
                <Button variant="outline" className="w-full bg-transparent" onClick={handleResendInvites}>
                  Reenviar Convites
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="items" className="mb-8">
          <TabsList className="mb-6 bg-white/80 backdrop-blur-sm p-1">
            <TabsTrigger value="items" className="data-[state=active]:bg-white">
              Itens ({event.items?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="guests" className="data-[state=active]:bg-white">
              Convidados ({event.guests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-white">
              Fotos ({event.photos?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Itens do evento</CardTitle>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setIsAddItemOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar item
                </Button>
              </CardHeader>
              <CardContent>
                <ItemsList items={event.items || []} eventId={event.id} />

                {event.type === "Colaborativo" && event.items && event.items.length > 0 && (
                  <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Resumo de custos</h3>
                      <Badge variant="outline" className="bg-white">
                        Colaborativo
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Custo total:</span>
                        <span className="font-medium">R$ {totalCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Número de participantes:</span>
                        <span className="font-medium">{event.confirmedGuests}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-emerald-200 text-emerald-700 font-semibold">
                        <span>Valor por pessoa:</span>
                        <span>R$ {costPerPerson}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Lista de convidados</CardTitle>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setIsAddGuestOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar convidados
                </Button>
              </CardHeader>
              <CardContent>
                <GuestList guests={event.guests || []} eventId={event.id} />
                <div className="flex flex-wrap gap-2 mt-4">
                  <EmailPreview
                    eventId={event.id}
                    guestId={event.guests?.[0]?.id || "example"}
                    eventTitle={event.title}
                    guestName={event.guests?.[0]?.name || "Convidado Exemplo"}
                    eventDate={event.date}
                    eventTime={event.time}
                    eventLocation={event.location}
                  />
                  <SmsPreview
                    eventId={event.id}
                    guestId={event.guests?.[0]?.id || "example"}
                    eventTitle={event.title}
                    guestName={event.guests?.[0]?.name || "Convidado Exemplo"}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <EventGallery eventId={event.id} photos={event.photos || []} canUpload={true} currentUser="Usuário Atual" />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddItemDialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen} eventId={event.id} />
        <AddGuestDialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen} eventId={event.id} />
        <EditEventDialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen} eventId={event.id} />
      </div>
    </div>
  )
}

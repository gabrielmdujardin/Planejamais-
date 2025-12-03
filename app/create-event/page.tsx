"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  CalendarIcon,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  Tag,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"
import { useContactStore } from "@/stores/contact-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"

export default function CreateEvent() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [step, setStep] = useState(1)
  const [eventType, setEventType] = useState<string | undefined>(undefined)
  const [eventCategory, setEventCategory] = useState("")
  const [eventName, setEventName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para gerenciar convidados
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("contacts")

  const router = useRouter()
  const { toast } = useToast()
  const { addEvent } = useEventStore()
  const { contacts, contactLists, searchContacts, getContactsByList, initializeData } = useContactStore()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  // Filtrar contatos com base na pesquisa
  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts

  // Obter todos os contatos selecionados (individuais + das listas)
  const getAllSelectedContacts = () => {
    const individualContacts = contacts.filter((contact) => selectedContacts.includes(contact.id))
    const listContacts = selectedLists.flatMap((listId) => getContactsByList(listId))

    // Remover duplicatas
    const allContacts = [...individualContacts, ...listContacts]
    const uniqueContacts = allContacts.filter(
      (contact, index, self) => index === self.findIndex((c) => c.id === contact.id),
    )

    return uniqueContacts
  }

  const handleCreateEvent = async () => {
    setIsSubmitting(true)

    try {
      // Simulando criação de evento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const selectedContactsData = getAllSelectedContacts()

      // Criar novo evento
      const newEvent = {
        id: Date.now().toString(),
        title: eventName,
        type: eventType === "festa" ? "Festa" : "Colaborativo",
        category: eventCategory || "Sem categoria",
        date: date ? format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "",
        time: eventTime,
        fullDate: date ? format(date, "dd/MM/yyyy") : "",
        location: eventLocation,
        description: eventDescription,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Adicionar evento ao store
      addEvent(newEvent)

      toast({
        title: "Evento criado com sucesso!",
        description: `Seu evento foi criado com ${selectedContactsData.length} convidados.`,
      })

      // Redirecionar para o dashboard
      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Erro ao criar evento",
        description: "Ocorreu um erro ao criar seu evento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedStep1 = !!eventType
  const canProceedStep2 = !!eventName && !!date && !!eventTime && !!eventLocation
  const canProceedStep3 = true // Pode prosseguir mesmo sem convidados

  // Renderizar avatar
  const renderAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold">Criar novo evento</h1>
          <p className="text-gray-600 dark:text-gray-400">Preencha os detalhes do seu evento</p>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tipo de evento</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={eventType}
              onValueChange={setEventType}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioItem value="festa" id="festa" className="peer sr-only" />
                <Label
                  htmlFor="festa"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emerald-500 [&:has([data-state=checked])]:border-emerald-500 cursor-pointer"
                >
                  <CalendarDays className="mb-3 h-8 w-8 text-emerald-500" />
                  <div className="text-center">
                    <h3 className="font-semibold">Festa</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Você é o anfitrião e os convidados não precisam pagar
                    </p>
                  </div>
                </Label>
              </div>

              <div>
                <RadioItem value="colaborativo" id="colaborativo" className="peer sr-only" />
                <Label
                  htmlFor="colaborativo"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-emerald-500 [&:has([data-state=checked])]:border-emerald-500 cursor-pointer"
                >
                  <Users className="mb-3 h-8 w-8 text-emerald-500" />
                  <div className="text-center">
                    <h3 className="font-semibold">Colaborativo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cada convidado contribui com uma parte dos custos
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleNext} disabled={!canProceedStep1} className="bg-emerald-600 hover:bg-emerald-700">
              Continuar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="event-name">Nome do evento *</Label>
              <Input
                id="event-name"
                placeholder="Ex: Churrasco de aniversário"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-category">
                Categoria do evento <span className="text-sm text-gray-500 dark:text-gray-400">(opcional)</span>
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="event-category"
                  placeholder="Ex: Aniversário, Casamento, Confraternização..."
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Defina uma categoria personalizada para organizar seus eventos
              </p>
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
                <Label>Data *</Label>
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
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-time">Horário *</Label>
                <div className="relative">
                  <Input id="event-time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Local *</Label>
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button onClick={handleNext} disabled={!canProceedStep2} className="bg-emerald-600 hover:bg-emerald-700">
              Continuar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Convidados</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecione contatos da sua lista ou listas inteiras
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="contacts">Contatos Individuais</TabsTrigger>
                <TabsTrigger value="lists">Listas de Contatos</TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar contatos..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[300px] rounded-md border">
                  {filteredContacts.length > 0 ? (
                    <div className="divide-y">
                      {filteredContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            {renderAvatar(contact.name)}
                            <div>
                              <h3 className="font-medium text-sm">{contact.name}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
                            </div>
                          </div>
                          <Checkbox
                            id={`contact-${contact.id}`}
                            checked={selectedContacts.includes(contact.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedContacts([...selectedContacts, contact.id])
                              } else {
                                setSelectedContacts(selectedContacts.filter((id) => id !== contact.id))
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Nenhum contato encontrado</p>
                      <Button variant="outline" size="sm" onClick={() => router.push("/contacts")} className="text-xs">
                        Gerenciar contatos
                      </Button>
                    </div>
                  )}
                </ScrollArea>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedContacts.length} contato(s) selecionado(s)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="lists" className="space-y-4">
                <ScrollArea className="h-[300px] rounded-md border">
                  {contactLists.length > 0 ? (
                    <div className="divide-y">
                      {contactLists.map((list) => {
                        const listContacts = getContactsByList(list.id)
                        return (
                          <div key={list.id} className="flex items-center justify-between p-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-sm">{list.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {listContacts.length} contatos
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {listContacts.slice(0, 3).map((contact) => (
                                  <span key={contact.id} className="text-xs text-gray-500 dark:text-gray-400">
                                    {contact.name}
                                  </span>
                                ))}
                                {listContacts.length > 3 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{listContacts.length - 3} mais
                                  </span>
                                )}
                              </div>
                            </div>
                            <Checkbox
                              id={`list-${list.id}`}
                              checked={selectedLists.includes(list.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLists([...selectedLists, list.id])
                                } else {
                                  setSelectedLists(selectedLists.filter((id) => id !== list.id))
                                }
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Nenhuma lista de contatos encontrada
                      </p>
                      <Button variant="outline" size="sm" onClick={() => router.push("/contacts")} className="text-xs">
                        Criar listas de contatos
                      </Button>
                    </div>
                  )}
                </ScrollArea>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedLists.length} lista(s) selecionada(s)
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Resumo dos convidados selecionados */}
            {(selectedContacts.length > 0 || selectedLists.length > 0) && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-md border border-emerald-200 dark:border-emerald-800">
                <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2 flex items-center">
                  <Check className="h-4 w-4 mr-2" /> Resumo dos convidados
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Total de convidados selecionados: <strong>{getAllSelectedContacts().length}</strong>
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {getAllSelectedContacts()
                    .slice(0, 5)
                    .map((contact) => (
                      <Badge key={contact.id} variant="secondary" className="text-xs">
                        {contact.name}
                      </Badge>
                    ))}
                  {getAllSelectedContacts().length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{getAllSelectedContacts().length - 5} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={isSubmitting || !canProceedStep3}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? "Criando evento..." : "Finalizar"}{" "}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

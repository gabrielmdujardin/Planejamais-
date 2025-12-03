"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"
import { useContactStore } from "@/stores/contact-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { isValidEmail, isValidPhone, formatPhone } from "@/lib/validation"
import { Loader2, Mail, MessageSquare, Search, UserPlus, Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddGuestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

export default function AddGuestDialog({ open, onOpenChange, eventId }: AddGuestDialogProps) {
  const [activeTab, setActiveTab] = useState("contacts")
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [bulkGuests, setBulkGuests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  const { toast } = useToast()
  const { addGuests, getEventById } = useEventStore()
  const { contacts, searchContacts } = useContactStore()
  const event = getEventById(eventId)

  // Filtrar contatos com base na pesquisa
  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts

  // Verificar se um contato já está no evento
  const isContactInEvent = (contactId: string) => {
    if (!event || !event.guests) return false
    return event.guests.some((guest) => guest.contactId === contactId)
  }

  const validateIndividualGuest = () => {
    if (!guestName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do convidado.",
        variant: "destructive",
      })
      return false
    }

    if (!guestEmail.trim() || !isValidEmail(guestEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email válido.",
        variant: "destructive",
      })
      return false
    }

    if (!guestPhone.trim() || !isValidPhone(guestPhone)) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, informe um número de telefone válido (DDD + número).",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const validateBulkGuests = (guests: Array<{ name: string; email: string; phone: string }>) => {
    const invalidGuests = guests.filter(
      (guest) => !guest.name.trim() || !isValidEmail(guest.email) || !isValidPhone(guest.phone),
    )

    if (invalidGuests.length > 0) {
      toast({
        title: "Dados inválidos",
        description: `${invalidGuests.length} convidado(s) com dados incompletos ou inválidos.`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const parseBulkGuests = () => {
    try {
      const lines = bulkGuests.split("\n").filter((line) => line.trim())
      return lines.map((line) => {
        const [name, email, phone] = line.split(",").map((item) => item.trim())
        return { name, email, phone }
      })
    } catch (error) {
      toast({
        title: "Formato inválido",
        description: "O formato deve ser: Nome, Email, Telefone (um por linha)",
        variant: "destructive",
      })
      return []
    }
  }

  const handleAddIndividualGuest = async () => {
    if (!validateIndividualGuest()) return

    setIsSubmitting(true)

    try {
      const newGuest = {
        id: `g-${Date.now()}`,
        name: guestName.trim(),
        email: guestEmail.trim(),
        phone: formatPhone(guestPhone.trim()),
        status: "pending" as const,
      }

      addGuests(eventId, [newGuest])

      // Limpar formulário
      setGuestName("")
      setGuestEmail("")
      setGuestPhone("")

      // Simular envio de convites
      await sendInvites([newGuest])

      toast({
        title: "Convidado adicionado",
        description: `${newGuest.name} foi adicionado ao evento e o convite foi enviado.`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro ao adicionar convidado",
        description: "Ocorreu um erro ao adicionar o convidado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddBulkGuests = async () => {
    const parsedGuests = parseBulkGuests()

    if (parsedGuests.length === 0) {
      toast({
        title: "Nenhum convidado informado",
        description: "Por favor, informe pelo menos um convidado.",
        variant: "destructive",
      })
      return
    }

    if (!validateBulkGuests(parsedGuests)) return

    setIsSubmitting(true)

    try {
      const newGuests = parsedGuests.map((guest, index) => ({
        id: `g-${Date.now()}-${index}`,
        name: guest.name,
        email: guest.email,
        phone: formatPhone(guest.phone),
        status: "pending" as const,
      }))

      addGuests(eventId, newGuests)

      // Simular envio de convites
      await sendInvites(newGuests)

      // Limpar formulário
      setBulkGuests("")

      toast({
        title: "Convidados adicionados",
        description: `${newGuests.length} convidados foram adicionados ao evento e os convites foram enviados.`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro ao adicionar convidados",
        description: "Ocorreu um erro ao adicionar os convidados. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddContactsAsGuests = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "Nenhum contato selecionado",
        description: "Por favor, selecione pelo menos um contato.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Filtrar apenas contatos que não estão no evento
      const contactsToAdd = contacts
        .filter((contact) => selectedContacts.includes(contact.id) && !isContactInEvent(contact.id))
        .map((contact) => ({
          id: `g-${Date.now()}-${contact.id}`,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          status: "pending" as const,
          contactId: contact.id,
        }))

      if (contactsToAdd.length === 0) {
        toast({
          title: "Contatos já adicionados",
          description: "Todos os contatos selecionados já foram adicionados ao evento.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      addGuests(eventId, contactsToAdd)

      // Simular envio de convites
      await sendInvites(contactsToAdd)

      // Limpar seleção
      setSelectedContacts([])

      toast({
        title: "Contatos adicionados",
        description: `${contactsToAdd.length} contatos foram adicionados como convidados e os convites foram enviados.`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro ao adicionar contatos",
        description: "Ocorreu um erro ao adicionar os contatos como convidados. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendInvites = async (guests: any[]) => {
    if (!event) return

    setIsSendingInvites(true)

    try {
      // Simulando envio de convites
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Convites enviados",
        description: `${guests.length} convite(s) enviado(s) por email e SMS.`,
      })
    } catch (error) {
      console.error("Erro ao enviar convites:", error)
    } finally {
      setIsSendingInvites(false)
    }
  }

  // Formatar telefone enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permitir apenas números, parênteses, espaços e hífen
    const cleaned = value.replace(/[^\d\s()-]/g, "")
    setGuestPhone(cleaned)
  }

  // Renderizar avatar
  const renderAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

    return (
      <Avatar>
        <AvatarFallback className="bg-emerald-100 text-emerald-800">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar convidados</DialogTitle>
          <DialogDescription>Adicione novos convidados ao seu evento.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="bulk">Em massa</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4 py-4">
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
                  {filteredContacts.map((contact) => {
                    const isInEvent = isContactInEvent(contact.id)
                    return (
                      <div key={contact.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          {renderAvatar(contact.name)}
                          <div>
                            <h3 className="font-medium">{contact.name}</h3>
                            <p className="text-xs text-gray-500">{contact.email}</p>
                            <p className="text-xs text-gray-500">{contact.phone}</p>
                          </div>
                        </div>
                        {isInEvent ? (
                          <div className="flex items-center text-xs text-emerald-600">
                            <Check className="mr-1 h-3 w-3" /> Já convidado
                          </div>
                        ) : (
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
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <p className="text-sm text-gray-500 mb-2">Nenhum contato encontrado</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("individual")} className="text-xs">
                    <UserPlus className="h-3 w-3 mr-1" /> Adicionar novo contato
                  </Button>
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{selectedContacts.length} contato(s) selecionado(s)</p>
              <Button
                onClick={handleAddContactsAsGuests}
                disabled={isSubmitting || selectedContacts.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSendingInvites ? "Enviando convites..." : "Adicionando..."}
                  </>
                ) : (
                  "Adicionar selecionados"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Nome completo*</Label>
              <Input
                id="guest-name"
                placeholder="Nome do convidado"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email">Email*</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="email@exemplo.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">Será enviado um convite para este email</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-phone">Telefone*</Label>
              <Input id="guest-phone" placeholder="(00) 00000-0000" value={guestPhone} onChange={handlePhoneChange} />
              <p className="text-xs text-gray-500">Formato: (DDD) XXXXX-XXXX - Será enviado um SMS para este número</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
              <MessageSquare className="h-4 w-4" />
              <p>Um convite será enviado por email e SMS após adicionar o convidado.</p>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-guests">Adicionar múltiplos convidados</Label>
              <Textarea
                id="bulk-guests"
                placeholder="Nome, Email, Telefone (um por linha)
João Silva, joao@exemplo.com, (11) 98765-4321
Maria Oliveira, maria@exemplo.com, (11) 91234-5678"
                className="min-h-[150px]"
                value={bulkGuests}
                onChange={(e) => setBulkGuests(e.target.value)}
              />
              <p className="text-xs text-gray-500">Formato: Nome, Email, Telefone (um convidado por linha)</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
              <Mail className="h-4 w-4" />
              <p>Convites serão enviados por email e SMS após adicionar os convidados.</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          {activeTab === "contacts" ? (
            <Button
              onClick={handleAddContactsAsGuests}
              disabled={isSubmitting || selectedContacts.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSendingInvites ? "Enviando convites..." : "Adicionando..."}
                </>
              ) : (
                "Adicionar selecionados"
              )}
            </Button>
          ) : activeTab === "individual" ? (
            <Button
              onClick={handleAddIndividualGuest}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSendingInvites ? "Enviando convites..." : "Adicionando..."}
                </>
              ) : (
                "Adicionar e enviar convite"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleAddBulkGuests}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSendingInvites ? "Enviando convites..." : "Adicionando..."}
                </>
              ) : (
                "Adicionar e enviar convites"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

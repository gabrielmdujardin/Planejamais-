"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
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
import {
  Loader2,
  Mail,
  Search,
  UserPlus,
  Check,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface AddGuestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

interface ParsedGuest {
  name: string
  email: string
  phone: string
  department?: string
  valid: boolean
  error?: string
}

export default function AddGuestDialog({ open, onOpenChange, eventId }: AddGuestDialogProps) {
  const [activeTab, setActiveTab] = useState("bulk")
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [bulkGuests, setBulkGuests] = useState("")
  const [sendInvitesImmediately, setSendInvitesImmediately] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()
  const { addGuests, getEventById } = useEventStore()
  const { contacts, searchContacts } = useContactStore()
  const event = getEventById(eventId)

  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts

  const isContactInEvent = (contactId: string) => {
    if (!event || !event.guests) return false
    return event.guests.some((guest) => guest.contactId === contactId)
  }

  // Parser inteligente para planilhas e texto colado
  const parsedBulkGuests: ParsedGuest[] = useMemo(() => {
    if (!bulkGuests.trim()) return []

    const lines = bulkGuests
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) return []

    // Detectar separador mais provável
    const firstLine = lines[0]
    let separator = ","
    if (firstLine.includes(";")) separator = ";"
    else if (firstLine.includes("\t")) separator = "\t"

    const isHeader = (line: string) => {
      const lower = line.toLowerCase()
      return (
        lower.includes("nome") ||
        lower.includes("name") ||
        lower.includes("email") ||
        lower.includes("mail") ||
        lower.includes("telefone") ||
        lower.includes("departamento") ||
        lower.includes("cargo")
      )
    }

    const startIndex = isHeader(firstLine) ? 1 : 0
    const results: ParsedGuest[] = []

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(separator).map((item) => item.trim().replace(/^["']|["']$/g, ""))
      if (parts.length === 0 || (parts.length === 1 && !parts[0])) continue

      const name = parts[0] || ""
      const email = (parts[1] || "").toLowerCase()
      const phone = parts[2] ? formatPhone(parts[2]) : ""
      const department = parts[3] || undefined

      const validEmail = isValidEmail(email)
      const validName = name.length >= 2
      const validPhone = !phone || isValidPhone(phone)

      let error = ""
      if (!validName) error = "Nome muito curto"
      else if (!validEmail) error = "E-mail inválido"
      else if (!validPhone) error = "Telefone com formato incorreto"

      results.push({
        name,
        email,
        phone,
        department,
        valid: validName && validEmail && validPhone,
        error,
      })
    }

    return results
  }, [bulkGuests])

  const validParsedGuests = parsedBulkGuests.filter((g) => g.valid)
  const invalidParsedGuests = parsedBulkGuests.filter((g) => !g.valid)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        setBulkGuests(text)
        toast({
          title: "Arquivo carregado",
          description: `Arquivo ${file.name} lido com sucesso. Verifique a prévia abaixo.`,
        })
      }
    }
    reader.onerror = () => {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível processar o arquivo selecionado.",
        variant: "destructive",
      })
    }
    reader.readAsText(file, "UTF-8")
  }

  const handleDownloadTemplate = () => {
    const csvContent =
      "Nome,Email,Telefone,Departamento\n" +
      "Ana Silva,ana.silva@empresa.com.br,(11) 98765-4321,Recursos Humanos\n" +
      "Carlos Santos,carlos.santos@empresa.com.br,(11) 91234-5678,Tecnologia\n" +
      "Juliana Costa,juliana.costa@empresa.com.br,,Marketing\n"

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "modelo_importacao_planejamais.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const createGuestsAndSendEmail = async (guests: any[], sendEmail = true) => {
    setIsSendingInvites(true)

    try {
      const response = await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guests: guests.map((guest) => ({
            name: guest.name,
            email: guest.email,
            phone: guest.phone || "",
            contactId: guest.contactId,
          })),
          sendEmail,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível cadastrar no Supabase")
      }

      if (sendEmail && data.email?.failed > 0) {
        toast({
          title: "Convidados salvos",
          description: "Os convidados foram cadastrados. Para disparo automático por e-mail, configure a chave RESEND_API_KEY no servidor.",
        })
      }

      return (data.guests || []).map((guest: any) => ({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone || "",
        status: guest.status,
        contactId: guest.contact_id || undefined,
      }))
    } catch (error) {
      toast({
        title: "Modo demo/local",
        description: error instanceof Error ? error.message : "Os dados foram armazenados no navegador.",
      })
      return guests
    } finally {
      setIsSendingInvites(false)
    }
  }

  const handleAddIndividualGuest = async () => {
    if (!guestName.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome do convidado.", variant: "destructive" })
      return
    }

    if (!guestEmail.trim() || !isValidEmail(guestEmail)) {
      toast({ title: "Email inválido", description: "Informe um e-mail válido.", variant: "destructive" })
      return
    }

    if (guestPhone.trim() && !isValidPhone(guestPhone)) {
      toast({ title: "Telefone inválido", description: "Informe um telefone válido com DDD.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const newGuest = {
        id: `g-${Date.now()}`,
        name: guestName.trim(),
        email: guestEmail.trim().toLowerCase(),
        phone: guestPhone.trim() ? formatPhone(guestPhone.trim()) : "",
        status: "pending" as const,
      }

      const createdGuests = await createGuestsAndSendEmail([newGuest], sendInvitesImmediately)
      addGuests(eventId, createdGuests)

      setGuestName("")
      setGuestEmail("")
      setGuestPhone("")

      toast({
        title: "Convidado adicionado",
        description: `${newGuest.name} foi adicionado à lista do evento.`,
      })

      onOpenChange(false)
    } catch {
      toast({
        title: "Erro ao adicionar convidado",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddBulkGuests = async () => {
    if (validParsedGuests.length === 0) {
      toast({
        title: "Nenhum convidado válido",
        description: "Revise a lista ou faça upload de uma planilha válida com Nome e E-mail.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const newGuests = validParsedGuests.map((guest, index) => ({
        id: `g-${Date.now()}-${index}`,
        name: guest.name,
        email: guest.email,
        phone: guest.phone || "",
        status: "pending" as const,
      }))

      const createdGuests = await createGuestsAndSendEmail(newGuests, sendInvitesImmediately)
      addGuests(eventId, createdGuests)

      setBulkGuests("")

      toast({
        title: "Importação concluída!",
        description: `${newGuests.length} convidado(s) adicionados com sucesso ao evento.`,
      })

      onOpenChange(false)
    } catch {
      toast({
        title: "Erro ao importar convidados",
        description: "Ocorreu um erro ao processar os convidados. Tente novamente.",
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
        description: "Selecione ao menos um contato.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const contactsToAdd = contacts
        .filter((contact) => selectedContacts.includes(contact.id) && !isContactInEvent(contact.id))
        .map((contact) => ({
          id: `g-${Date.now()}-${contact.id}`,
          name: contact.name,
          email: contact.email,
          phone: contact.phone || "",
          status: "pending" as const,
          contactId: contact.id,
        }))

      if (contactsToAdd.length === 0) {
        toast({
          title: "Contatos já adicionados",
          description: "Todos os contatos selecionados já constam no evento.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const createdGuests = await createGuestsAndSendEmail(contactsToAdd, sendInvitesImmediately)
      addGuests(eventId, createdGuests)

      setSelectedContacts([])
      toast({
        title: "Contatos adicionados",
        description: `${contactsToAdd.length} contatos foram adicionados como convidados.`,
      })

      onOpenChange(false)
    } catch {
      toast({
        title: "Erro ao adicionar contatos",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

    return (
      <Avatar>
        <AvatarFallback className="bg-emerald-100 text-emerald-800 font-semibold">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Adicionar convidados ao evento
          </DialogTitle>
          <DialogDescription>
            Importe planilhas de colaboradores (CSV/Excel), adicione contatos existentes ou cadastre individualmente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bulk" className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              Importar Planilha / CSV
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <Users className="h-4 w-4" />
              Da Minha Agenda
            </TabsTrigger>
            <TabsTrigger value="individual" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* ABA: IMPORTAÇÃO EM MASSA / CSV */}
          <TabsContent value="bulk" className="space-y-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <p className="text-sm font-medium">Carregar lista de colaboradores</p>
                <p className="text-xs text-muted-foreground">
                  Suporta arquivos .csv ou copiar e colar direto do Excel / Sheets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-xs gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  Modelo CSV
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-1"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Subir Arquivo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-guests" className="text-xs font-semibold text-muted-foreground uppercase">
                Cole aqui as linhas da sua planilha (Nome, E-mail, Telefone, Departamento)
              </Label>
              <Textarea
                id="bulk-guests"
                placeholder="Exemplo:&#10;Mariana Lima; mariana.lima@empresa.com.br; (11) 98765-4321; DHO&#10;Lucas Ribeiro; lucas.ribeiro@empresa.com.br; ; Engenharia"
                className="font-mono text-xs min-h-[110px]"
                value={bulkGuests}
                onChange={(e) => setBulkGuests(e.target.value)}
              />
            </div>

            {/* PREVIEW DA IMPORTAÇÃO */}
            {parsedBulkGuests.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Pré-visualização da Importação</span>
                    <Badge variant="success" size="sm" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {validParsedGuests.length} válido(s)
                    </Badge>
                    {invalidParsedGuests.length > 0 && (
                      <Badge variant="destructive" size="sm" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {invalidParsedGuests.length} inválido(s)
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Total: {parsedBulkGuests.length} linhas</span>
                </div>

                <div className="max-h-40 overflow-y-auto rounded border bg-background">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground border-b">
                      <tr>
                        <th className="p-2">Nome</th>
                        <th className="p-2">E-mail</th>
                        <th className="p-2">Telefone</th>
                        <th className="p-2">Setor</th>
                        <th className="p-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedBulkGuests.slice(0, 30).map((guest, idx) => (
                        <tr key={idx} className={guest.valid ? "" : "bg-red-500/10 text-red-700 dark:text-red-400"}>
                          <td className="p-2 font-medium">{guest.name || "(sem nome)"}</td>
                          <td className="p-2">{guest.email || "(sem e-mail)"}</td>
                          <td className="p-2">{guest.phone || "-"}</td>
                          <td className="p-2">{guest.department || "-"}</td>
                          <td className="p-2 text-right">
                            {guest.valid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Pronto</span>
                            ) : (
                              <span className="text-red-500">{guest.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedBulkGuests.length > 30 && (
                  <p className="text-center text-xs text-muted-foreground">
                    ... e mais {parsedBulkGuests.length - 30} convidados detectados.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="send-invites-bulk"
                checked={sendInvitesImmediately}
                onCheckedChange={(checked) => setSendInvitesImmediately(Boolean(checked))}
              />
              <label htmlFor="send-invites-bulk" className="text-xs font-medium cursor-pointer">
                Disparar convites com link de RSVP por e-mail imediatamente após a importação
              </label>
            </div>
          </TabsContent>

          {/* ABA: CONTATOS DA AGENDA */}
          <TabsContent value="contacts" className="space-y-4 py-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome ou e-mail..."
                className="pl-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[240px] rounded-md border">
              {filteredContacts.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredContacts.map((contact) => {
                    const isInEvent = isContactInEvent(contact.id)
                    return (
                      <div key={contact.id} className="flex items-center justify-between p-2.5">
                        <div className="flex items-center gap-3">
                          {renderAvatar(contact.name)}
                          <div>
                            <h3 className="text-sm font-medium">{contact.name}</h3>
                            <p className="text-xs text-muted-foreground">{contact.email}</p>
                            {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
                          </div>
                        </div>
                        {isInEvent ? (
                          <div className="flex items-center text-xs text-emerald-600 font-medium">
                            <Check className="mr-1 h-3 w-3" /> No evento
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
                  <p className="text-sm text-muted-foreground mb-2">Nenhum contato encontrado</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("individual")} className="text-xs">
                    <UserPlus className="h-3 w-3 mr-1" /> Cadastrar individualmente
                  </Button>
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedContacts.length} contato(s) selecionado(s)</span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-invites-contacts"
                  checked={sendInvitesImmediately}
                  onCheckedChange={(checked) => setSendInvitesImmediately(Boolean(checked))}
                />
                <label htmlFor="send-invites-contacts" className="cursor-pointer">
                  Enviar convites agora
                </label>
              </div>
            </div>
          </TabsContent>

          {/* ABA: INDIVIDUAL */}
          <TabsContent value="individual" className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="guest-name" className="text-xs">
                Nome completo *
              </Label>
              <Input
                id="guest-name"
                placeholder="Ex: Ana Carolina Silva"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guest-email" className="text-xs">
                E-mail corporativo ou pessoal *
              </Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="nome@empresa.com.br"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guest-phone" className="text-xs">
                Telefone / WhatsApp (opcional)
              </Label>
              <Input
                id="guest-phone"
                placeholder="(11) 98765-4321"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="send-invites-individual"
                checked={sendInvitesImmediately}
                onCheckedChange={(checked) => setSendInvitesImmediately(Boolean(checked))}
              />
              <label htmlFor="send-invites-individual" className="text-xs font-medium cursor-pointer">
                Disparar convite por e-mail com link de RSVP assim que salvar
              </label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          {activeTab === "bulk" ? (
            <Button
              onClick={handleAddBulkGuests}
              disabled={isSubmitting || validParsedGuests.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSendingInvites ? "Enviando convites..." : "Importando..."}
                </>
              ) : (
                `Importar ${validParsedGuests.length > 0 ? `${validParsedGuests.length} convidados` : ""}`
              )}
            </Button>
          ) : activeTab === "contacts" ? (
            <Button
              onClick={handleAddContactsAsGuests}
              disabled={isSubmitting || selectedContacts.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSendingInvites ? "Processando..." : "Adicionando..."}
                </>
              ) : (
                `Adicionar (${selectedContacts.length})`
              )}
            </Button>
          ) : (
            <Button
              onClick={handleAddIndividualGuest}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Convidado"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users, Edit, Trash2, Mail, Phone, ListFilter } from "lucide-react"
import { useContactStore } from "@/stores/contact-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [isAddListOpen, setIsAddListOpen] = useState(false)
  const [isEditContactOpen, setIsEditContactOpen] = useState(false)
  const [isEditListOpen, setIsEditListOpen] = useState(false)

  // Estados para novo contato
  const [newContactName, setNewContactName] = useState("")
  const [newContactEmail, setNewContactEmail] = useState("")
  const [newContactPhone, setNewContactPhone] = useState("")
  const [selectedListsForContact, setSelectedListsForContact] = useState<string[]>([])

  // Estados para nova lista
  const [newListName, setNewListName] = useState("")
  const [selectedContactsForList, setSelectedContactsForList] = useState<string[]>([])

  // Estados para edição
  const [editingContact, setEditingContact] = useState<any>(null)
  const [editingList, setEditingList] = useState<any>(null)

  const { toast } = useToast()
  const {
    contacts,
    contactLists,
    searchContacts,
    addContact,
    updateContact,
    deleteContact,
    addContactList,
    updateContactList,
    deleteContactList,
    getContactsByList,
    initializeData,
  } = useContactStore()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts

  const handleAddContact = () => {
    if (!newContactName || !newContactEmail || !newContactPhone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos do contato.",
        variant: "destructive",
      })
      return
    }

    addContact({
      name: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      listIds: selectedListsForContact,
    })

    toast({
      title: "Contato adicionado!",
      description: `${newContactName} foi adicionado com sucesso.`,
    })

    setNewContactName("")
    setNewContactEmail("")
    setNewContactPhone("")
    setSelectedListsForContact([])
    setIsAddContactOpen(false)
  }

  const handleEditContact = () => {
    if (!editingContact) return

    updateContact(editingContact.id, {
      name: editingContact.name,
      email: editingContact.email,
      phone: editingContact.phone,
      listIds: editingContact.listIds,
    })

    toast({
      title: "Contato atualizado!",
      description: `${editingContact.name} foi atualizado com sucesso.`,
    })

    setEditingContact(null)
    setIsEditContactOpen(false)
  }

  const handleDeleteContact = (id: string, name: string) => {
    deleteContact(id)
    toast({
      title: "Contato removido",
      description: `${name} foi removido dos contatos.`,
    })
  }

  const handleAddList = () => {
    if (!newListName) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a lista.",
        variant: "destructive",
      })
      return
    }

    addContactList({
      name: newListName,
      contactIds: selectedContactsForList,
    })

    toast({
      title: "Lista criada!",
      description: `A lista "${newListName}" foi criada com sucesso.`,
    })

    setNewListName("")
    setSelectedContactsForList([])
    setIsAddListOpen(false)
  }

  const handleEditList = () => {
    if (!editingList) return

    updateContactList(editingList.id, {
      name: editingList.name,
      contactIds: editingList.contactIds,
    })

    toast({
      title: "Lista atualizada!",
      description: `A lista "${editingList.name}" foi atualizada.`,
    })

    setEditingList(null)
    setIsEditListOpen(false)
  }

  const handleDeleteList = (id: string, name: string) => {
    deleteContactList(id)
    toast({
      title: "Lista removida",
      description: `A lista "${name}" foi removida.`,
    })
  }

  const renderAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

    return (
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-emerald-100 text-emerald-800">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Contatos</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie seus contatos e listas</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="lists">Listas</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar contatos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Contato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Contato</DialogTitle>
                  <DialogDescription>Preencha os dados do novo contato</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Nome completo"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adicionar às listas (opcional)</Label>
                    <ScrollArea className="h-32 rounded-md border p-4">
                      {contactLists.map((list) => (
                        <div key={list.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`list-${list.id}`}
                            checked={selectedListsForContact.includes(list.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedListsForContact([...selectedListsForContact, list.id])
                              } else {
                                setSelectedListsForContact(selectedListsForContact.filter((id) => id !== list.id))
                              }
                            }}
                          />
                          <Label htmlFor={`list-${list.id}`} className="cursor-pointer">
                            {list.name}
                          </Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddContactOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddContact} className="bg-emerald-600 hover:bg-emerald-700">
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    {renderAvatar(contact.name)}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingContact(contact)
                          setIsEditContactOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{contact.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                  {contact.listIds && contact.listIds.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {contact.listIds.map((listId) => {
                        const list = contactLists.find((l) => l.id === listId)
                        return list ? (
                          <Badge key={listId} variant="secondary" className="text-xs">
                            {list.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredContacts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum contato encontrado</p>
                <Button onClick={() => setIsAddContactOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar primeiro contato
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lists" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isAddListOpen} onOpenChange={setIsAddListOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Lista
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Lista</DialogTitle>
                  <DialogDescription>Crie uma lista para organizar seus contatos</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="list-name">Nome da Lista *</Label>
                    <Input
                      id="list-name"
                      placeholder="Ex: Família, Amigos, Trabalho..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adicionar contatos (opcional)</Label>
                    <ScrollArea className="h-48 rounded-md border p-4">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`contact-${contact.id}`}
                            checked={selectedContactsForList.includes(contact.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedContactsForList([...selectedContactsForList, contact.id])
                              } else {
                                setSelectedContactsForList(selectedContactsForList.filter((id) => id !== contact.id))
                              }
                            }}
                          />
                          <Label htmlFor={`contact-${contact.id}`} className="cursor-pointer">
                            {contact.name}
                          </Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddListOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddList} className="bg-emerald-600 hover:bg-emerald-700">
                    Criar Lista
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contactLists.map((list) => {
              const listContacts = getContactsByList(list.id)
              return (
                <Card key={list.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <ListFilter className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingList(list)
                          setIsEditListOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteList(list.id, list.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-3">
                      {listContacts.length} contatos
                    </Badge>
                    <div className="space-y-2">
                      {listContacts.slice(0, 3).map((contact) => (
                        <div key={contact.id} className="flex items-center gap-2 text-sm">
                          {renderAvatar(contact.name)}
                          <span className="truncate">{contact.name}</span>
                        </div>
                      ))}
                      {listContacts.length > 3 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">+{listContacts.length - 3} mais</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {contactLists.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ListFilter className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhuma lista criada</p>
                <Button onClick={() => setIsAddListOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira lista
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para editar contato */}
      <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={editingContact.email}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editingContact.phone}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditContactOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditContact} className="bg-emerald-600 hover:bg-emerald-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar lista */}
      <Dialog open={isEditListOpen} onOpenChange={setIsEditListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lista</DialogTitle>
          </DialogHeader>
          {editingList && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Lista</Label>
                <Input
                  value={editingList.name}
                  onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditListOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditList} className="bg-emerald-600 hover:bg-emerald-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

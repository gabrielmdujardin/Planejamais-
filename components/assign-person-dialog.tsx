"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { updateEventItemAction } from "@/app/actions/items"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useContactStore } from "@/stores/contact-store"
import { useEventStore } from "@/stores/event-store"

interface Person {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  price: number
  assignedTo: Person[] | null
}

interface AssignPersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
  eventId: string
}

export default function AssignPersonDialog({ open, onOpenChange, item, eventId }: AssignPersonDialogProps) {
  const [newPersonName, setNewPersonName] = useState("")
  const [selectedPersons, setSelectedPersons] = useState<Person[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const { isDemoMode } = useAuth()
  const { getEventById, updateItem } = useEventStore()
  const { contacts, initializeData } = useContactStore()
  const event = getEventById(eventId)

  useEffect(() => {
    if (open) {
      initializeData()
    }
    if (item && open) {
      setSelectedPersons(item.assignedTo || [])
    }
  }, [initializeData, item, open])

  const handleAddPerson = () => {
    if (!newPersonName.trim()) return

    const newPerson: Person = {
      id: `free-${Date.now()}`,
      name: newPersonName.trim(),
    }

    setSelectedPersons([...selectedPersons, newPerson])
    setNewPersonName("")
  }

  const handleRemovePerson = (personId: string) => {
    setSelectedPersons(selectedPersons.filter((p) => p.id !== personId))
  }

  const handleTogglePerson = (person: { id: string; name: string }) => {
    const isAlreadySelected = selectedPersons.some((p) => p.id === person.id)

    if (isAlreadySelected) {
      setSelectedPersons(selectedPersons.filter((p) => p.id !== person.id))
    } else {
      setSelectedPersons([...selectedPersons, { id: person.id, name: person.name }])
    }
  }

  const handleSaveAssignments = async () => {
    if (!item) return

    setIsSubmitting(true)

    try {
      const assignedTo = selectedPersons.length > 0 ? selectedPersons : null
      const updatedItem = {
        ...item,
        assignedTo,
      }

      if (!isDemoMode) {
        const res = await updateEventItemAction(eventId, item.id, { assignedTo })
        if (res.error) {
          throw new Error(res.error)
        }
      }

      updateItem(eventId, item.id, updatedItem)
      onOpenChange(false)

      toast({
        title: "Responsáveis atribuídos",
        description: `Os responsáveis foram atribuídos ao item ${item.name}.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atribuir responsáveis",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atribuir os responsáveis.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir responsáveis</DialogTitle>
          <DialogDescription>
            {item ? `Atribua convidados, contatos ou nomes livres ao item "${item.name}".` : "Atribua responsáveis."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Responsáveis selecionados</Label>
            <div className="min-h-10 p-2 border rounded-md flex flex-wrap gap-1">
              {selectedPersons.length > 0 ? (
                selectedPersons.map((person) => (
                  <Badge key={person.id} variant="secondary" className="flex items-center gap-1">
                    {person.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemovePerson(person.id)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </Badge>
                ))
              ) : (
                <div className="text-sm text-gray-500 py-1">Nenhum responsável selecionado</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-person">Digitar nome livremente</Label>
            <div className="flex gap-2">
              <Input
                id="new-person"
                placeholder="Nome do responsável"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddPerson()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddPerson}
                disabled={!newPersonName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Adicionar
              </Button>
            </div>
          </div>

          {event?.guests && event.guests.length > 0 && (
            <div className="space-y-2">
              <Label>Selecionar dos convidados do evento</Label>
              <div className="border rounded-md max-h-36 overflow-y-auto">
                {event.guests.map((guest) => (
                  <div key={guest.id} className="flex items-center space-x-2 p-2 border-b last:border-0">
                    <Checkbox
                      id={`guest-${guest.id}`}
                      checked={selectedPersons.some((p) => p.id === guest.id)}
                      onCheckedChange={() => handleTogglePerson({ id: guest.id, name: guest.name })}
                    />
                    <Label htmlFor={`guest-${guest.id}`} className="flex-1 cursor-pointer">
                      {guest.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contacts.length > 0 && (
            <div className="space-y-2">
              <Label>Selecionar da agenda de contatos</Label>
              <div className="border rounded-md max-h-36 overflow-y-auto">
                {contacts.map((contact) => {
                  const contactKey = `contact-${contact.id}`
                  return (
                    <div key={contactKey} className="flex items-center space-x-2 p-2 border-b last:border-0">
                      <Checkbox
                        id={contactKey}
                        checked={selectedPersons.some((p) => p.id === contactKey)}
                        onCheckedChange={() => handleTogglePerson({ id: contactKey, name: contact.name })}
                      />
                      <Label htmlFor={contactKey} className="flex-1 cursor-pointer">
                        {contact.name}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAssignments}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

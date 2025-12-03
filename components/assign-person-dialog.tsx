"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

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
  const { getEventById, updateItem } = useEventStore()
  const event = getEventById(eventId)

  // Carregar pessoas já atribuídas quando o diálogo for aberto
  useEffect(() => {
    if (item && open) {
      setSelectedPersons(item.assignedTo || [])
    }
  }, [item, open])

  const handleAddPerson = () => {
    if (!newPersonName.trim()) return

    const newPerson: Person = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
    }

    setSelectedPersons([...selectedPersons, newPerson])
    setNewPersonName("")
  }

  const handleRemovePerson = (personId: string) => {
    setSelectedPersons(selectedPersons.filter((p) => p.id !== personId))
  }

  const handleSelectGuest = (guest: any) => {
    const isAlreadySelected = selectedPersons.some((p) => p.id === guest.id)

    if (isAlreadySelected) {
      setSelectedPersons(selectedPersons.filter((p) => p.id !== guest.id))
    } else {
      setSelectedPersons([...selectedPersons, { id: guest.id, name: guest.name }])
    }
  }

  const handleSaveAssignments = () => {
    if (!item) return

    setIsSubmitting(true)

    try {
      // Atualizar item com as pessoas atribuídas
      const updatedItem = {
        ...item,
        assignedTo: selectedPersons.length > 0 ? selectedPersons : null,
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
        description: "Ocorreu um erro ao atribuir os responsáveis. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir responsáveis</DialogTitle>
          <DialogDescription>
            {item ? `Atribua responsáveis para o item "${item.name}".` : "Atribua responsáveis para o item."}
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
            <Label htmlFor="new-person">Adicionar novo responsável</Label>
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
              <Label>Selecionar dos convidados</Label>
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {event.guests.map((guest) => (
                  <div key={guest.id} className="flex items-center space-x-2 p-2 border-b last:border-0">
                    <Checkbox
                      id={`guest-${guest.id}`}
                      checked={selectedPersons.some((p) => p.id === guest.id)}
                      onCheckedChange={() => handleSelectGuest(guest)}
                    />
                    <Label htmlFor={`guest-${guest.id}`} className="flex-1 cursor-pointer">
                      {guest.name}
                    </Label>
                  </div>
                ))}
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

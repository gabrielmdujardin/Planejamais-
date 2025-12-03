"use client"

import { useEffect, useState } from "react"
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
import ImageUpload from "@/components/image-upload"

interface Person {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  price: number
  assignedTo: Person[] | null
  image?: string | null
}

interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
  eventId: string
}

export default function EditItemDialog({ open, onOpenChange, item, eventId }: EditItemDialogProps) {
  const [itemName, setItemName] = useState("")
  const [itemPrice, setItemPrice] = useState("")
  const [itemImage, setItemImage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const { updateItem } = useEventStore()

  // Carregar dados do item quando o diálogo for aberto
  useEffect(() => {
    if (item && open) {
      setItemName(item.name)
      setItemPrice(item.price.toString())
      setItemImage(item.image || "")
    }
  }, [item, open])

  const handleUpdateItem = () => {
    if (!item) return

    if (!itemName) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do item.",
        variant: "destructive",
      })
      return
    }

    const price = Number.parseFloat(itemPrice.replace(",", "."))
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para o item.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Atualizar item
      const updatedItem = {
        ...item,
        name: itemName,
        price,
        image: itemImage,
      }

      updateItem(eventId, item.id, updatedItem)
      onOpenChange(false)

      toast({
        title: "Item atualizado",
        description: `${itemName} foi atualizado com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar item",
        description: "Ocorreu um erro ao atualizar o item. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar item</DialogTitle>
          <DialogDescription>Atualize as informações do item.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-item-name">Nome do item*</Label>
            <Input
              id="edit-item-name"
              placeholder="Ex: Carne para churrasco"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-item-price">Valor (R$)*</Label>
            <Input
              id="edit-item-price"
              placeholder="Ex: 150,00"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Foto do item (opcional)</Label>
            <ImageUpload onImageSelect={setItemImage} currentImage={itemImage} />
            <p className="text-xs text-gray-500 mt-1">
              Adicione uma foto do item comprado para compartilhar com os participantes
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateItem} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

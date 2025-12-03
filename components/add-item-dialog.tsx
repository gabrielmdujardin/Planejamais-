"use client"

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
import ImageUpload from "@/components/image-upload"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

export default function AddItemDialog({ open, onOpenChange, eventId }: AddItemDialogProps) {
  const [itemName, setItemName] = useState("")
  const [itemPrice, setItemPrice] = useState("")
  const [itemImage, setItemImage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const { addItem } = useEventStore()

  const handleAddItem = () => {
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
      // Adicionar item ao evento
      const newItem = {
        id: Date.now().toString(),
        name: itemName,
        price,
        assignedTo: null,
        image: itemImage || null,
      }

      addItem(eventId, newItem)

      // Limpar formulário
      setItemName("")
      setItemPrice("")
      setItemImage("")
      onOpenChange(false)

      toast({
        title: "Item adicionado",
        description: `${itemName} foi adicionado ao evento.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar item",
        description: "Ocorreu um erro ao adicionar o item. Tente novamente.",
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
          <DialogTitle>Adicionar item</DialogTitle>
          <DialogDescription>Adicione um novo item ao seu evento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Nome do item*</Label>
            <Input
              id="item-name"
              placeholder="Ex: Carne para churrasco"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-price">Valor (R$)*</Label>
            <Input
              id="item-price"
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
          <Button onClick={handleAddItem} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? "Adicionando..." : "Adicionar item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
  category?: string
  description?: string
  quantity?: number
  unitPrice?: number
  estimatedCost?: number
  actualCost?: number
  paymentStatus?: "estimated" | "pending" | "partial" | "paid" | string
  supplier?: string
  dueDate?: string
  invoiceNumber?: string
  notes?: string
}

interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
  eventId: string
}

export default function EditItemDialog({ open, onOpenChange, item, eventId }: EditItemDialogProps) {
  const [itemName, setItemName] = useState("")
  const [category, setCategory] = useState("")
  const [supplier, setSupplier] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [dueDate, setDueDate] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unitPrice, setUnitPrice] = useState("")
  const [itemPrice, setItemPrice] = useState("")
  const [itemImage, setItemImage] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const { updateItem } = useEventStore()

  // Carregar dados do item quando o diálogo for aberto
  useEffect(() => {
    if (item && open) {
      setItemName(item.name || "")
      setCategory(item.category || "")
      setSupplier(item.supplier || "")
      setPaymentStatus(item.paymentStatus || "pending")
      setDueDate(item.dueDate || "")
      setInvoiceNumber(item.invoiceNumber || "")
      setQuantity(item.quantity ? String(item.quantity) : "1")
      setUnitPrice(item.unitPrice ? String(item.unitPrice) : (item.price ? String(item.price) : ""))
      setItemPrice(item.price ? String(item.price) : "")
      setItemImage(item.image || "")
      setNotes(item.notes || "")
    }
  }, [item, open])

  // Recalcular preço total quando quantidade ou valor unitário mudar
  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val)
    const q = Number(quantity.replace(",", ".")) || 1
    const u = Number(val.replace(",", ".")) || 0
    if (u > 0) {
      setItemPrice((q * u).toFixed(2))
    }
  }

  const handleQuantityChange = (val: string) => {
    setQuantity(val)
    const q = Number(val.replace(",", ".")) || 1
    const u = Number(unitPrice.replace(",", ".")) || 0
    if (u > 0) {
      setItemPrice((q * u).toFixed(2))
    }
  }

  const handleUpdateItem = () => {
    if (!item) return

    if (!itemName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do item ou serviço.",
        variant: "destructive",
      })
      return
    }

    const price = Number.parseFloat(itemPrice.replace(",", "."))
    if (isNaN(price) || price < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para o item.",
        variant: "destructive",
      })
      return
    }

    const parsedQty = Number.parseFloat(quantity.replace(",", ".")) || 1
    const parsedUnitPrice = Number.parseFloat(unitPrice.replace(",", ".")) || (price / parsedQty)

    setIsSubmitting(true)

    try {
      const updatedItem: Item = {
        ...item,
        name: itemName.trim(),
        category: category.trim() || undefined,
        supplier: supplier.trim() || undefined,
        paymentStatus,
        dueDate: dueDate || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        quantity: parsedQty,
        unitPrice: parsedUnitPrice,
        price,
        actualCost: paymentStatus === "paid" ? price : undefined,
        notes: notes.trim() || undefined,
        image: itemImage || null,
      }

      updateItem(eventId, item.id, updatedItem)
      onOpenChange(false)

      toast({
        title: "Item atualizado",
        description: `${itemName} foi atualizado com sucesso.`,
      })
    } catch {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar gasto / fornecedor</DialogTitle>
          <DialogDescription>Atualize as informações do contrato, valores e status de pagamento.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-item-name">Nome do serviço / item *</Label>
              <Input
                id="edit-item-name"
                placeholder="Ex: Buffet de Confraternização, DJ"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-item-supplier">Fornecedor / Empresa Contratada</Label>
              <Input
                id="edit-item-supplier"
                placeholder="Ex: Buffet Fasano, DJ Som & Luz"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="edit-item-category">Categoria</Label>
              <Input
                id="edit-item-category"
                placeholder="Ex: Alimentação, Som"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-status">Status de Pagamento</Label>
              <select
                id="edit-item-status"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="estimated">Orçamento / Estimado</option>
                <option value="pending">Pendente de Pagamento</option>
                <option value="partial">Pago Parcialmente</option>
                <option value="paid">Pago Integral</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-due">Vencimento</Label>
              <Input
                id="edit-item-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-invoice">Nº Nota Fiscal / Contrato</Label>
              <Input
                id="edit-item-invoice"
                placeholder="Ex: NF-10492"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="edit-item-quantity">Quantidade</Label>
              <Input
                id="edit-item-quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-unitprice">Valor Unitário (R$)</Label>
              <Input
                id="edit-item-unitprice"
                placeholder="Ex: 150,00"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-price">Valor Total (R$) *</Label>
              <Input
                id="edit-item-price"
                placeholder="Ex: 150,00"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto / Comprovante (opcional)</Label>
            <ImageUpload onImageSelect={setItemImage} currentImage={itemImage} />
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

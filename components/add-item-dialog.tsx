"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import ImageUpload from "@/components/image-upload"
import { useEventStore } from "@/stores/event-store"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

const parseMoney = (value: string) => Number(value.replace(",", "."))

export default function AddItemDialog({ open, onOpenChange, eventId }: AddItemDialogProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [supplier, setSupplier] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [dueDate, setDueDate] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unitPrice, setUnitPrice] = useState("")
  const [notes, setNotes] = useState("")
  const [image, setImage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { addItem } = useEventStore()

  const total = (Number(quantity.replace(",", ".")) || 0) * (Number(unitPrice.replace(",", ".")) || 0)

  const reset = () => {
    setName("")
    setCategory("")
    setSupplier("")
    setPaymentStatus("pending")
    setDueDate("")
    setInvoiceNumber("")
    setDescription("")
    setQuantity("1")
    setUnitPrice("")
    setNotes("")
    setImage("")
  }

  const handleAddItem = () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome do gasto ou serviço.", variant: "destructive" })
      return
    }

    const parsedQuantity = Number(quantity.replace(",", "."))
    const parsedUnitPrice = parseMoney(unitPrice)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      toast({ title: "Valor inválido", description: "Informe quantidade maior que zero e valor unitário válido.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const price = parsedQuantity * parsedUnitPrice
      addItem(eventId, {
        id: Date.now().toString(),
        name: name.trim(),
        category: category.trim() || "Geral",
        supplier: supplier.trim() || undefined,
        paymentStatus,
        dueDate: dueDate || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        description,
        quantity: parsedQuantity,
        unitPrice: parsedUnitPrice,
        price,
        estimatedCost: price,
        notes,
        assignedTo: null,
        image: image || null,
      })
      reset()
      onOpenChange(false)
      toast({ title: "Gasto adicionado", description: `${name} cadastrado com sucesso no evento.` })
    } catch (error) {
      toast({ title: "Erro ao adicionar gasto", description: "Tente novamente em instantes.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar gasto ou fornecedor</DialogTitle>
          <DialogDescription>Cadastre serviços contratados, fornecedores, notas fiscais e custos previstos.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do serviço / item *</Label>
              <Input placeholder="Ex: Buffet, Iluminação, Segurança, Bebidas" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor / Empresa Contratada</Label>
              <Input placeholder="Ex: Buffet Fasano, DJ Som & Luz" value={supplier} onChange={(event) => setSupplier(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input placeholder="Ex: Alimentação, Som" value={category} onChange={(event) => setCategory(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status de Pagamento</Label>
              <select
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
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nº Nota Fiscal / Contrato</Label>
              <Input placeholder="Ex: NF-10492" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="0" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valor unitário (R$) *</Label>
              <Input placeholder="Ex: 150,00" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Total Calculado</Label>
              <Input readOnly className="font-semibold" value={`R$ ${total.toFixed(2)}`} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Foto do comprovante ou item (demo/local)</Label>
            <ImageUpload onImageSelect={setImage} currentImage={image} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAddItem} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? "Adicionando..." : "Adicionar gasto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

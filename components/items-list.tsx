"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreHorizontal, Trash2, Edit, User, Users, ImageIcon, Receipt } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"
import { useState } from "react"
import EditItemDialog from "@/components/edit-item-dialog"
import AssignPersonDialog from "@/components/assign-person-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  paymentStatus?: string
  supplier?: string
  dueDate?: string
  invoiceNumber?: string
  notes?: string
}

interface ItemsListProps {
  items: Item[]
  eventId: string
}

export default function ItemsList({ items, eventId }: ItemsListProps) {
  const { toast } = useToast()
  const { removeItem } = useEventStore()
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [assigningItem, setAssigningItem] = useState<Item | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleAssignPerson = (item: Item) => {
    setAssigningItem(item)
    setIsAssignDialogOpen(true)
  }

  const handleRemoveItem = (item: Item) => {
    removeItem(eventId, item.id)
    toast({
      title: "Item removido",
      description: `O item ${item.name} foi removido.`,
    })
  }

  const handleViewImage = (imageUrl: string) => {
    setViewingImage(imageUrl)
    setIsImageDialogOpen(true)
  }

  const paymentBadge = (status?: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="paid">Pago</Badge>
      case "partial":
        return <Badge variant="info">Parcial</Badge>
      case "pending":
        return <Badge variant="pending">Pendente</Badge>
      default:
        return <Badge variant="secondary">Estimado</Badge>
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhum gasto ou fornecedor cadastrado"
        description="Adicione custos, contratos de fornecedores e serviços ao seu evento para gerenciar o orçamento."
      />
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gasto / Serviço</TableHead>
            <TableHead>Fornecedor & Contrato</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável(is)</TableHead>
            <TableHead>Comprovante</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                {item.description ? <div className="text-xs text-muted-foreground">{item.description}</div> : null}
              </TableCell>
              <TableCell>
                {item.supplier ? (
                  <div>
                    <span className="font-medium text-foreground">{item.supplier}</span>
                    {item.invoiceNumber ? (
                      <span className="block text-xs text-muted-foreground">NF: {item.invoiceNumber}</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{item.category || "Geral"}</TableCell>
              <TableCell className="font-semibold">R$ {Number(item.price || item.estimatedCost || 0).toFixed(2)}</TableCell>
              <TableCell>{paymentBadge(item.paymentStatus)}</TableCell>
              <TableCell>
                {item.assignedTo && item.assignedTo.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.assignedTo.map((person, index) => (
                      <Badge key={index} variant="info">
                        {person.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-7 px-2"
                    onClick={() => handleAssignPerson(item)}
                  >
                    <User className="h-3.5 w-3.5 mr-1" /> Atribuir
                  </Button>
                )}
              </TableCell>
              <TableCell>
                {item.image ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary h-7 px-2"
                    onClick={() => handleViewImage(item.image as string)}
                  >
                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Anexo
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem anexo</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center" onClick={() => handleEditItem(item)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center" onClick={() => handleAssignPerson(item)}>
                      <Users className="mr-2 h-4 w-4" /> Atribuir responsável
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 flex items-center" onClick={() => handleRemoveItem(item)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Diálogo para editar item */}
      <EditItemDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} item={editingItem} eventId={eventId} />

      {/* Diálogo para atribuir responsável */}
      <AssignPersonDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        item={assigningItem}
        eventId={eventId}
      />

      {/* Diálogo para visualizar imagem */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Foto do item</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {viewingImage && (
              <img
                src={viewingImage || "/placeholder.svg"}
                alt="Foto do item"
                className="max-h-[60vh] object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, Eye, Edit, Trash2, Plus, X, Calendar, User, Tag, ImageIcon } from "lucide-react"
import { useEventStore } from "@/stores/event-store"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface EventPhoto {
  id: string
  url: string
  filename: string
  uploadedBy: string
  uploadedAt: string
  description?: string
  tags?: string[]
}

interface EventGalleryProps {
  eventId: string
  photos: EventPhoto[]
  canUpload?: boolean
  currentUser?: string
}

export default function EventGallery({
  eventId,
  photos,
  canUpload = false,
  currentUser = "Usuário Atual",
}: EventGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<EventPhoto | null>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadTags, setUploadTags] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editTags, setEditTags] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addPhoto, removePhoto, updatePhoto } = useEventStore()
  const { toast } = useToast()

  // Simular upload de arquivo (em produção, usar serviço real)
  const simulateFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Gerar URL placeholder baseada no nome do arquivo
        const url = `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(file.name.split(".")[0])}`
        resolve(url)
      }, 1000)
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length !== files.length) {
      toast({
        title: "Arquivos inválidos",
        description: "Apenas arquivos de imagem são permitidos.",
        variant: "destructive",
      })
    }

    setUploadFiles(imageFiles)
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return

    try {
      for (const file of uploadFiles) {
        const url = await simulateFileUpload(file)

        const tags = uploadTags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)

        addPhoto(eventId, {
          url,
          filename: file.name,
          uploadedBy: currentUser,
          description: uploadDescription,
          tags: tags.length > 0 ? tags : undefined,
        })
      }

      toast({
        title: "Fotos enviadas!",
        description: `${uploadFiles.length} foto${uploadFiles.length > 1 ? "s" : ""} adicionada${uploadFiles.length > 1 ? "s" : ""} ao evento.`,
      })

      // Limpar formulário
      setUploadFiles([])
      setUploadDescription("")
      setUploadTags("")
      setIsUploadOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar as fotos. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (photo: EventPhoto) => {
    setEditingPhoto(photo)
    setEditDescription(photo.description || "")
    setEditTags(photo.tags?.join(", ") || "")
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingPhoto) return

    const tags = editTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    updatePhoto(eventId, editingPhoto.id, {
      description: editDescription,
      tags: tags.length > 0 ? tags : undefined,
    })

    toast({
      title: "Foto atualizada",
      description: "As informações da foto foram atualizadas.",
    })

    setIsEditOpen(false)
    setEditingPhoto(null)
    setEditDescription("")
    setEditTags("")
  }

  const handleDelete = (photoId: string) => {
    removePhoto(eventId, photoId)
    toast({
      title: "Foto removida",
      description: "A foto foi removida da galeria.",
    })
  }

  const handleDownload = (photo: EventPhoto) => {
    // Em produção, implementar download real
    toast({
      title: "Download iniciado",
      description: `Baixando ${photo.filename}...`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Galeria de Fotos
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {photos.length} foto{photos.length !== 1 ? "s" : ""} compartilhada{photos.length !== 1 ? "s" : ""}
            </p>
          </div>

          {canUpload && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fotos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Fotos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photos">Selecionar fotos</Label>
                    <Input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="mt-1"
                    />
                    {uploadFiles.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {uploadFiles.length} arquivo{uploadFiles.length > 1 ? "s" : ""} selecionado
                        {uploadFiles.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva as fotos..."
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (opcional)</Label>
                    <Input
                      id="tags"
                      placeholder="festa, amigos, diversão (separadas por vírgula)"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpload} disabled={uploadFiles.length === 0} className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma foto ainda</h3>
            <p className="text-gray-600 mb-4">
              {canUpload
                ? "Seja o primeiro a compartilhar fotos deste evento!"
                : "As fotos do evento aparecerão aqui quando forem compartilhadas."}
            </p>
            {canUpload && (
              <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeira foto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.filename}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />

                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedPhoto(photo)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(photo)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {canUpload && photo.uploadedBy === currentUser && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(photo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(photo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações da foto */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium truncate">{photo.filename}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    {photo.uploadedBy}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(photo.uploadedAt)}
                  </div>
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {photo.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {photo.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{photo.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de visualização */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedPhoto && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  {selectedPhoto.filename}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPhoto(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Image
                    src={selectedPhoto.url || "/placeholder.svg"}
                    alt={selectedPhoto.filename}
                    width={800}
                    height={600}
                    className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                  />
                </div>

                <div className="lg:w-80 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Informações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>Enviado por {selectedPhoto.uploadedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(selectedPhoto.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPhoto.description && (
                    <div>
                      <h4 className="font-medium mb-2">Descrição</h4>
                      <p className="text-sm text-gray-600">{selectedPhoto.description}</p>
                    </div>
                  )}

                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedPhoto.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedPhoto)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                    {canUpload && selectedPhoto.uploadedBy === currentUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPhoto(null)
                          handleEdit(selectedPhoto)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                placeholder="Descreva a foto..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                placeholder="festa, amigos, diversão (separadas por vírgula)"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveEdit} className="flex-1">
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

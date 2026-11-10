"use client"

import type React from "react"
import { useRef, useState } from "react"
import Image from "next/image"
import { Calendar, Download, Edit, Eye, ImageIcon, Plus, Tag, Trash2, Upload, User, X } from "lucide-react"
import { deleteEventPhotoAction, uploadEventPhotoAction } from "@/app/actions/photos"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"

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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Falha ao ler imagem"))
    reader.readAsDataURL(file)
  })
}

export default function EventGallery({
  eventId,
  photos,
  canUpload = false,
  currentUser = "Organizador",
}: EventGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<EventPhoto | null>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadTags, setUploadTags] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editTags, setEditTags] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, isDemoMode } = useAuth()
  const { addPhoto, removePhoto, updatePhoto } = useEventStore()
  const { toast } = useToast()

  const uploaderName = user?.name || currentUser

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

    setIsUploading(true)
    try {
      const tags = uploadTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      for (const file of uploadFiles) {
        const dataUrl = await readFileAsDataUrl(file)

        if (!isDemoMode) {
          const res = await uploadEventPhotoAction({
            eventId,
            url: dataUrl,
            filename: file.name,
            description: uploadDescription || undefined,
            tags,
          })
          if (res.error) {
            throw new Error(res.error)
          }
          addPhoto(eventId, {
            url: res.data?.url || dataUrl,
            filename: res.data?.filename || file.name,
            uploadedBy: res.data?.uploadedBy || uploaderName,
            description: uploadDescription || undefined,
            tags: tags.length > 0 ? tags : undefined,
          })
        } else {
          addPhoto(eventId, {
            url: dataUrl,
            filename: file.name,
            uploadedBy: uploaderName,
            description: uploadDescription || undefined,
            tags: tags.length > 0 ? tags : undefined,
          })
        }
      }

      toast({
        title: "Fotos enviadas!",
        description: `${uploadFiles.length} foto${uploadFiles.length > 1 ? "s" : ""} adicionada${uploadFiles.length > 1 ? "s" : ""} ao evento.`,
      })

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
        description: error instanceof Error ? error.message : "Não foi possível enviar as fotos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
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

  const handleDelete = async (photoId: string) => {
    try {
      if (!isDemoMode) {
        const res = await deleteEventPhotoAction(eventId, photoId)
        if (!res.success && res.error) {
          throw new Error(res.error)
        }
      }
      removePhoto(eventId, photoId)
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null)
      toast({
        title: "Foto removida",
        description: "A foto foi removida da galeria pelo organizador.",
      })
    } catch (error) {
      toast({
        title: "Erro ao remover foto",
        description: error instanceof Error ? error.message : "Somente o organizador pode excluir fotos do evento.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (photo: EventPhoto) => {
    const link = document.createElement("a")
    link.href = photo.url
    link.download = photo.filename || "foto-evento.jpg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return dateString
    return d.toLocaleDateString("pt-BR", {
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
            <p className="text-sm text-muted-foreground mt-1">
              {photos.length} foto{photos.length !== 1 ? "s" : ""} registrada{photos.length !== 1 ? "s" : ""} no evento
            </p>
          </div>

          {canUpload && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar fotos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar fotos do evento</DialogTitle>
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
                      <p className="text-sm text-muted-foreground mt-1">
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
                      placeholder="festa, equipe, celebração (separadas por vírgula)"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpload} disabled={uploadFiles.length === 0 || isUploading} className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Enviando..." : "Enviar"}
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
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma foto ainda</h3>
            <p className="text-muted-foreground mb-4">
              {canUpload
                ? "Adicione registros fotográficos deste evento na galeria."
                : "As fotos do evento aparecerão aqui quando forem adicionadas pelo organizador."}
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
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.filename}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedPhoto(photo)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(photo)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {canUpload && (
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

                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium truncate">{photo.filename}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {photo.uploadedBy}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Enviado por {selectedPhoto.uploadedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(selectedPhoto.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPhoto.description && (
                    <div>
                      <h4 className="font-medium mb-2">Descrição</h4>
                      <p className="text-sm text-muted-foreground">{selectedPhoto.description}</p>
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
                    {canUpload && (
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
                placeholder="festa, equipe, celebração (separadas por vírgula)"
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

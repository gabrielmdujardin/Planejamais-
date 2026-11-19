"use server"

import { checkBackendEventPermission } from "@/lib/auth/rbac-guard"
import { isSupabaseEnvConfigured } from "@/lib/security/route-guard"
import {
  deleteFileFromLocalStorage,
  saveFileToLocalStorage,
} from "@/lib/storage/local-storage"
import { createClient } from "@/lib/supabase/server"
import { photoCreateSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function uploadEventPhotoAction(rawInput: unknown) {
  const parsed = photoCreateSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados da foto inválidos" }
  }

  const input = parsed.data
  if (!isSupabaseEnvConfigured()) {
    return { data: null, localOnly: true, error: null }
  }

  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return { data: null, error: "Usuário não autenticado" }
  }

  const perm = await checkBackendEventPermission({
    db,
    eventId: input.eventId,
    userId: user.id,
    module: "photos",
    action: "create",
  })

  if (!perm.allowed) {
    return { data: null, error: perm.reason || "Sem permissão para adicionar fotos ao evento" }
  }

  // Salva a imagem em volume persistente local (/storage/uploads/event-photos) e registra metadados
  let storedPublicUrl = input.url
  let storedMeta: Record<string, any> = {}

  try {
    const saved = saveFileToLocalStorage({
      bucket: "event-photos",
      filename: input.filename,
      content: input.url,
      eventId: input.eventId,
      userId: user.id,
    })
    storedPublicUrl = saved.publicUrl
    storedMeta = {
      storedFileId: saved.id,
      checksumSha256: saved.checksumSha256,
      sizeBytes: saved.sizeBytes,
      mimeType: saved.mimeType,
    }

    await db.from("stored_files").insert({
      id: saved.id,
      event_id: input.eventId,
      user_id: user.id,
      bucket: "event-photos",
      filename: saved.filename,
      original_name: saved.originalName,
      mime_type: saved.mimeType,
      size_bytes: saved.sizeBytes,
      storage_path: saved.storagePath,
      public_url: saved.publicUrl,
      checksum_sha256: saved.checksumSha256,
    })
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Falha ao armazenar arquivo da foto",
    }
  }

  const uploadedBy =
    user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Organizador"

  const { data: photo, error } = await db
    .from("event_photos")
    .insert({
      event_id: input.eventId,
      url: storedPublicUrl,
      filename: input.filename,
      uploaded_by: uploadedBy,
      description: input.description || null,
      tags: input.tags || [],
      metadata: storedMeta,
    })
    .select()
    .single()

  if (error || !photo) {
    return { data: null, error: error?.message || "Erro ao registrar foto do evento" }
  }

  revalidatePath(`/event/${input.eventId}`)
  return {
    data: {
      id: photo.id,
      url: photo.url,
      filename: photo.filename,
      uploadedBy: photo.uploaded_by,
      uploadedAt: photo.uploaded_at,
      description: photo.description || undefined,
      tags: photo.tags || [],
    },
    error: null,
  }
}

export async function deleteEventPhotoAction(eventId: string, photoId: string) {
  if (!isSupabaseEnvConfigured()) {
    return { success: true, localOnly: true, error: null }
  }

  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    return { success: false, error: "Usuário não autenticado" }
  }

  const perm = await checkBackendEventPermission({
    db,
    eventId,
    userId: user.id,
    module: "photos",
    action: "delete",
  })

  if (!perm.allowed) {
    return { success: false, error: perm.reason || "Sem permissão para remover fotos do evento" }
  }

  const { data: existingPhoto } = await db
    .from("event_photos")
    .select("id, url")
    .eq("id", photoId)
    .eq("event_id", eventId)
    .maybeSingle()

  const { error } = await db
    .from("event_photos")
    .delete()
    .eq("id", photoId)
    .eq("event_id", eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  if (existingPhoto?.url) {
    deleteFileFromLocalStorage("event-photos", existingPhoto.url)
  }

  revalidatePath(`/event/${eventId}`)
  return { success: true, error: null }
}

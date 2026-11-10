"use server"

import { canOrganizerModifyPhoto } from "@/lib/domain/business-rules"
import { isSupabaseEnvConfigured } from "@/lib/security/route-guard"
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Usuário não autenticado" }
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, user_id")
    .eq("id", input.eventId)
    .maybeSingle()

  if (!event || !canOrganizerModifyPhoto(event.user_id, user.id)) {
    return { data: null, error: "Apenas o organizador pode adicionar fotos ao evento" }
  }

  const uploadedBy =
    user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Organizador"

  const { data: photo, error } = await supabase
    .from("event_photos")
    .insert({
      event_id: input.eventId,
      url: input.url,
      filename: input.filename,
      uploaded_by: uploadedBy,
      description: input.description || null,
      tags: input.tags || [],
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Usuário não autenticado" }
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, user_id")
    .eq("id", eventId)
    .maybeSingle()

  if (!event || !canOrganizerModifyPhoto(event.user_id, user.id)) {
    return { success: false, error: "Somente o organizador do evento pode remover fotos" }
  }

  const { error } = await supabase
    .from("event_photos")
    .delete()
    .eq("id", photoId)
    .eq("event_id", eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/event/${eventId}`)
  return { success: true, error: null }
}


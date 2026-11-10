"use server"

import { isSupabaseEnvConfigured } from "@/lib/security/route-guard"
import { createClient } from "@/lib/supabase/server"
import { profileUpdateSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function updateUserProfileAction(rawInput: unknown) {
  const parsed = profileUpdateSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados do perfil inválidos" }
  }

  if (!isSupabaseEnvConfigured()) {
    return { data: parsed.data, localOnly: true, error: null }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Usuário não autenticado" }
  }

  const v = parsed.data
  const nextMetadata = {
    ...(user.user_metadata || {}),
    ...(v.name !== undefined ? { name: v.name } : {}),
    ...(v.phone !== undefined ? { phone: v.phone } : {}),
    ...(v.location !== undefined ? { location: v.location } : {}),
    ...(v.avatar !== undefined ? { avatar_url: v.avatar } : {}),
  }

  await supabase.auth.updateUser({
    ...(v.email && v.email !== user.email ? { email: v.email } : {}),
    data: nextMetadata,
  })

  const profilePayload: Record<string, any> = {
    id: user.id,
    email: v.email || user.email || "",
    name: v.name ?? user.user_metadata?.name ?? null,
    avatar: v.avatar ?? user.user_metadata?.avatar_url ?? null,
    metadata: nextMetadata,
  }

  const { error } = await supabase.from("users").upsert({
    ...profilePayload,
    phone: v.phone ?? null,
    location: v.location ?? null,
  } as any)

  if (error) {
    await supabase.from("users").upsert(profilePayload as any)
  }

  revalidatePath("/profile")
  return {
    data: {
      id: user.id,
      email: v.email || user.email || "",
      name: v.name ?? user.user_metadata?.name ?? "",
      phone: v.phone ?? "",
      location: v.location ?? "",
      avatar: v.avatar ?? user.user_metadata?.avatar_url ?? undefined,
    },
    error: null,
  }
}


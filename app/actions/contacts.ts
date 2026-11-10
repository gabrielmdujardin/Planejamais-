"use server"

import { isSupabaseEnvConfigured } from "@/lib/security/route-guard"
import { createClient } from "@/lib/supabase/server"
import { contactListSchema, contactSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function getContactsDataAction() {
  if (!isSupabaseEnvConfigured()) {
    return { contacts: [], contactLists: [], localOnly: true, error: null }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { contacts: [], contactLists: [], localOnly: false, error: "Usuário não autenticado" }
  }

  const [{ data: contactsData, error: contactsError }, { data: listsData, error: listsError }] = await Promise.all([
    supabase.from("contacts").select("*").eq("user_id", user.id).order("name", { ascending: true }),
    supabase.from("contact_lists").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ])

  if (contactsError || listsError) {
    return {
      contacts: [],
      contactLists: [],
      localOnly: true,
      error: contactsError?.message || listsError?.message || null,
    }
  }

  return {
    contacts: (contactsData || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      tags: Array.isArray(c.tags) ? c.tags : [],
      lists: Array.isArray(c.lists) ? c.lists : [],
      notes: c.notes || undefined,
      createdAt: c.created_at,
    })),
    contactLists: (listsData || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      description: l.description || "",
      color: l.color || "#3b82f6",
      contacts: Array.isArray(l.contacts) ? l.contacts : [],
      createdAt: l.created_at,
    })),
    localOnly: false,
    error: null,
  }
}

export async function createContactAction(rawInput: unknown) {
  const parsed = contactSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados do contato inválidos" }
  }

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

  const v = parsed.data
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      name: v.name,
      email: v.email || "",
      phone: v.phone || "",
      tags: v.tags,
      lists: v.lists,
      notes: v.notes || null,
    })
    .select()
    .single()

  if (error || !data) {
    return { data: null, localOnly: true, error: error?.message || "Erro ao criar contato" }
  }

  revalidatePath("/contacts")
  return {
    data: {
      id: data.id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      tags: data.tags || [],
      lists: data.lists || [],
      notes: data.notes || undefined,
      createdAt: data.created_at,
    },
    error: null,
  }
}

export async function updateContactAction(id: string, rawInput: unknown) {
  const parsed = contactSchema.partial().safeParse(rawInput)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados do contato inválidos" }
  }

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

  const v = parsed.data
  const updatePayload: Record<string, any> = {}
  if (v.name !== undefined) updatePayload.name = v.name
  if (v.email !== undefined) updatePayload.email = v.email
  if (v.phone !== undefined) updatePayload.phone = v.phone
  if (v.tags !== undefined) updatePayload.tags = v.tags
  if (v.lists !== undefined) updatePayload.lists = v.lists
  if (v.notes !== undefined) updatePayload.notes = v.notes

  const { data, error } = await supabase
    .from("contacts")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error || !data) {
    return { data: null, localOnly: true, error: error?.message || "Erro ao atualizar contato" }
  }

  revalidatePath("/contacts")
  return {
    data: {
      id: data.id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      tags: data.tags || [],
      lists: data.lists || [],
      notes: data.notes || undefined,
      createdAt: data.created_at,
    },
    error: null,
  }
}

export async function deleteContactAction(id: string) {
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

  const { error } = await supabase.from("contacts").delete().eq("id", id).eq("user_id", user.id)
  if (error) {
    return { success: false, localOnly: true, error: error.message }
  }

  revalidatePath("/contacts")
  return { success: true, error: null }
}

export async function createContactListAction(rawInput: unknown) {
  const parsed = contactListSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados da lista inválidos" }
  }

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

  const v = parsed.data
  const { data, error } = await supabase
    .from("contact_lists")
    .insert({
      user_id: user.id,
      name: v.name,
      description: v.description || "",
      color: v.color || "#3b82f6",
      contacts: v.contacts || [],
    })
    .select()
    .single()

  if (error || !data) {
    return { data: null, localOnly: true, error: error?.message || "Erro ao criar lista" }
  }

  revalidatePath("/contacts")
  return {
    data: {
      id: data.id,
      name: data.name,
      description: data.description || "",
      color: data.color || "#3b82f6",
      contacts: data.contacts || [],
      createdAt: data.created_at,
    },
    error: null,
  }
}

export async function updateContactListAction(id: string, rawInput: unknown) {
  const parsed = contactListSchema.partial().safeParse(rawInput)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados da lista inválidos" }
  }

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

  const v = parsed.data
  const updatePayload: Record<string, any> = {}
  if (v.name !== undefined) updatePayload.name = v.name
  if (v.description !== undefined) updatePayload.description = v.description
  if (v.color !== undefined) updatePayload.color = v.color
  if (v.contacts !== undefined) updatePayload.contacts = v.contacts

  const { data, error } = await supabase
    .from("contact_lists")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error || !data) {
    return { data: null, localOnly: true, error: error?.message || "Erro ao atualizar lista" }
  }

  revalidatePath("/contacts")
  return {
    data: {
      id: data.id,
      name: data.name,
      description: data.description || "",
      color: data.color || "#3b82f6",
      contacts: data.contacts || [],
      createdAt: data.created_at,
    },
    error: null,
  }
}

export async function deleteContactListAction(id: string) {
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

  const { error } = await supabase.from("contact_lists").delete().eq("id", id).eq("user_id", user.id)
  if (error) {
    return { success: false, localOnly: true, error: error.message }
  }

  revalidatePath("/contacts")
  return { success: true, error: null }
}


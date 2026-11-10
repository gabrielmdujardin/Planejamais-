"use server"

import { normalizeItemValue } from "@/lib/domain/business-rules"
import { isSupabaseEnvConfigured } from "@/lib/security/route-guard"
import { createClient } from "@/lib/supabase/server"
import { itemCreateSchema, itemUpdateSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

function mapDbItemToClient(row: any) {
  const metadata = typeof row?.metadata === "object" && row.metadata !== null ? row.metadata : {}
  const price = normalizeItemValue(row)
  const quantity = Number(row?.quantity || metadata.quantity || 1)
  return {
    id: row.id,
    name: row.name,
    price,
    unitPrice: Number(row?.unit_price ?? metadata.unitPrice ?? (quantity > 0 ? price / quantity : price)),
    quantity,
    category: row?.category || metadata.category || "Geral",
    supplier: row?.supplier || metadata.supplier || undefined,
    paymentStatus: row?.payment_status || metadata.paymentStatus || "pending",
    dueDate: row?.due_date || metadata.dueDate || undefined,
    invoiceNumber: row?.invoice_number || metadata.invoiceNumber || undefined,
    notes: row?.notes || metadata.notes || undefined,
    image: row?.image || undefined,
    assignedTo: row?.assigned_to ?? metadata.assignedTo ?? undefined,
  }
}

export async function createEventItemAction(rawInput: unknown) {
  const parsed = itemCreateSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados do item inválidos" }
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
    .select("id")
    .eq("id", input.eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!event) {
    return { data: null, error: "Evento não encontrado ou acesso negado" }
  }

  const metadata = {
    category: input.category,
    supplier: input.supplier || null,
    paymentStatus: input.paymentStatus,
    unitPrice: input.unitPrice ?? input.price,
    quantity: input.quantity,
    dueDate: input.dueDate || null,
    invoiceNumber: input.invoiceNumber || null,
    notes: input.notes || null,
    assignedTo: input.assignedTo ?? null,
  }

  let { data: inserted, error } = await supabase
    .from("items")
    .insert({
      event_id: input.eventId,
      name: input.name,
      price: input.price,
      estimated_cost: input.price,
      unit_price: input.unitPrice ?? input.price,
      quantity: input.quantity,
      category: input.category,
      supplier: input.supplier || null,
      payment_status: input.paymentStatus,
      due_date: input.dueDate || null,
      invoice_number: input.invoiceNumber || null,
      notes: input.notes || null,
      image: input.image || null,
      assigned_to: (input.assignedTo as any) ?? null,
      status: input.assignedTo ? "assigned" : "pending",
      metadata,
    } as any)
    .select()
    .single()

  if (error) {
    const fallback = await supabase
      .from("items")
      .insert({
        event_id: input.eventId,
        name: input.name,
        price: input.price,
        estimated_cost: input.price,
        quantity: input.quantity,
        image: input.image || null,
        assigned_to: (input.assignedTo as any) ?? null,
        status: input.assignedTo ? "assigned" : "pending",
        metadata,
      } as any)
      .select()
      .single()

    inserted = fallback.data
    error = fallback.error
  }

  if (error || !inserted) {
    return { data: null, error: error?.message || "Erro ao cadastrar item" }
  }

  revalidatePath(`/event/${input.eventId}`)
  revalidatePath("/dashboard")
  return { data: mapDbItemToClient(inserted), error: null }
}

export async function updateEventItemAction(eventId: string, itemId: string, rawUpdates: unknown) {
  const parsed = itemUpdateSchema.safeParse(rawUpdates)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados de atualização inválidos" }
  }

  const updates = parsed.data
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

  const { data: existing } = await supabase
    .from("items")
    .select("*, events!inner(user_id)")
    .eq("id", itemId)
    .eq("event_id", eventId)
    .maybeSingle()

  if (!existing || (existing as any).events?.user_id !== user.id) {
    return { data: null, error: "Item não encontrado ou acesso negado" }
  }

  const prevMeta =
    typeof existing.metadata === "object" && existing.metadata !== null ? (existing.metadata as Record<string, any>) : {}

  const nextPrice = updates.price !== undefined ? updates.price : Number(existing.price || 0)
  const nextQuantity = updates.quantity !== undefined ? updates.quantity : Number(existing.quantity || 1)
  const nextCategory = updates.category ?? (existing as any).category ?? prevMeta.category ?? "Geral"
  const nextSupplier = updates.supplier !== undefined ? updates.supplier : (existing as any).supplier ?? prevMeta.supplier ?? null
  const nextPaymentStatus =
    updates.paymentStatus ?? (existing as any).payment_status ?? prevMeta.paymentStatus ?? "pending"
  const nextNotes = updates.notes !== undefined ? updates.notes : (existing as any).notes ?? prevMeta.notes ?? null
  const nextAssignedTo =
    updates.assignedTo !== undefined ? updates.assignedTo : existing.assigned_to ?? prevMeta.assignedTo ?? null

  const metadata = {
    ...prevMeta,
    category: nextCategory,
    supplier: nextSupplier,
    paymentStatus: nextPaymentStatus,
    quantity: nextQuantity,
    notes: nextNotes,
    assignedTo: nextAssignedTo,
  }

  let { data: updated, error } = await supabase
    .from("items")
    .update({
      name: updates.name ?? existing.name,
      price: nextPrice,
      estimated_cost: nextPrice,
      unit_price: updates.unitPrice ?? (nextQuantity > 0 ? nextPrice / nextQuantity : nextPrice),
      quantity: nextQuantity,
      category: nextCategory,
      supplier: nextSupplier,
      payment_status: nextPaymentStatus,
      notes: nextNotes,
      image: updates.image !== undefined ? updates.image : existing.image,
      assigned_to: nextAssignedTo as any,
      status: nextAssignedTo ? "assigned" : "pending",
      metadata,
    } as any)
    .eq("id", itemId)
    .eq("event_id", eventId)
    .select()
    .single()

  if (error) {
    const fallback = await supabase
      .from("items")
      .update({
        name: updates.name ?? existing.name,
        price: nextPrice,
        estimated_cost: nextPrice,
        quantity: nextQuantity,
        image: updates.image !== undefined ? updates.image : existing.image,
        assigned_to: nextAssignedTo as any,
        status: nextAssignedTo ? "assigned" : "pending",
        metadata,
      } as any)
      .eq("id", itemId)
      .eq("event_id", eventId)
      .select()
      .single()

    updated = fallback.data
    error = fallback.error
  }

  if (error || !updated) {
    return { data: null, error: error?.message || "Erro ao atualizar item" }
  }

  revalidatePath(`/event/${eventId}`)
  revalidatePath("/dashboard")
  return { data: mapDbItemToClient(updated), error: null }
}

export async function deleteEventItemAction(eventId: string, itemId: string) {
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
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!event) {
    return { success: false, error: "Evento não encontrado ou acesso negado" }
  }

  const { error } = await supabase.from("items").delete().eq("id", itemId).eq("event_id", eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/event/${eventId}`)
  revalidatePath("/dashboard")
  return { success: true, error: null }
}


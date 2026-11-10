"use server"

import {
  calculateConfirmedParticipants,
  filterEffectiveGuests,
  generateSecureToken,
  normalizeItemValue,
  validateNominalEventDeletion,
} from "@/lib/domain/business-rules"
import { isSupabaseEnvConfigured } from "@/lib/security/route-guard"
import { createClient } from "@/lib/supabase/server"
import { eventPayloadSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

function toDisplayGuest(guest: any) {
  const metadata = typeof guest?.metadata === "object" && guest.metadata !== null ? guest.metadata : {}
  const rawCompanions = Array.isArray(guest?.guest_companions)
    ? guest.guest_companions
    : Array.isArray(guest?.companions)
    ? guest.companions
    : []

  return {
    id: guest.id,
    name: guest.name,
    email: guest.email || "",
    phone: guest.phone || "",
    status: guest.status || "pending",
    source: guest.source || "manual",
    contactId: guest.contact_id || guest.contactId || undefined,
    token: guest.token || guest.confirmation_token || undefined,
    notes: guest.notes || undefined,
    department: guest.department || metadata.department || undefined,
    dietaryRestrictions: guest.dietary_restrictions ?? guest.dietaryRestrictions ?? undefined,
    accessibilityNeeds: guest.accessibility_needs ?? guest.accessibilityNeeds ?? undefined,
    requestedCompanionsCount: guest.requested_companions_count ?? rawCompanions.length ?? 0,
    companions: rawCompanions.map((comp: any) => ({
      id: comp.id,
      name: comp.name,
      email: comp.email || undefined,
      phone: comp.phone || undefined,
      notes: comp.notes || undefined,
      status: comp.status || "awaiting_approval",
    })),
  }
}

function toDisplayItem(item: any) {
  const metadata = typeof item?.metadata === "object" && item.metadata !== null ? item.metadata : {}
  const price = normalizeItemValue(item)
  const quantity = Number(item?.quantity || metadata.quantity || 1)
  const paymentStatus = item?.payment_status || item?.paymentStatus || metadata.paymentStatus || "pending"
  const category = item?.category || metadata.category || "Geral"
  const supplier = item?.supplier || metadata.supplier || undefined
  const assignedTo = item?.assigned_to ?? item?.assignedTo ?? metadata.assignedTo ?? undefined
  const notes = item?.notes || metadata.notes || undefined

  return {
    id: item.id,
    name: item.name,
    price,
    unitPrice: Number(item?.unit_price ?? item?.unitPrice ?? (quantity > 0 ? price / quantity : price)),
    quantity,
    category,
    supplier,
    paymentStatus,
    dueDate: item?.due_date || metadata.dueDate || undefined,
    invoiceNumber: item?.invoice_number || metadata.invoiceNumber || undefined,
    notes,
    image: item?.image || undefined,
    assignedTo,
  }
}

function toDisplayPhoto(photo: any) {
  return {
    id: photo.id,
    url: photo.url,
    filename: photo.filename,
    uploadedBy: photo.uploaded_by || photo.uploadedBy || "Organizador",
    uploadedAt: photo.uploaded_at || photo.uploadedAt || new Date().toISOString(),
    description: photo.description || undefined,
    tags: Array.isArray(photo.tags) ? photo.tags : [],
  }
}

function toDisplayEvent(event: any, rawGuests: any[] = [], rawItems: any[] = [], rawPhotos: any[] = []) {
  const metadata = typeof event.metadata === "object" && event.metadata !== null ? event.metadata : {}
  const financialMode =
    event.financial_mode ||
    event.financialMode ||
    metadata.financial_mode ||
    (event.type === "Colaborativo" ? "collaborative_split" : "corporate_budget")

  const effectiveRawGuests = filterEffectiveGuests(rawGuests)
  const guests = effectiveRawGuests.map(toDisplayGuest)
  const items = (rawItems || []).map(toDisplayItem)
  const photos = (rawPhotos || []).map(toDisplayPhoto)

  const confirmedGuests =
    rawGuests && rawGuests.length > 0
      ? calculateConfirmedParticipants(guests)
      : Number(event.confirmed_guests || 0)

  const totalGuests =
    rawGuests && rawGuests.length > 0
      ? guests.length
      : Number(event.total_guests || 0)

  return {
    id: event.id,
    title: event.title,
    type: event.type,
    category: event.category || undefined,
    status: event.status || "active",
    visibility: event.visibility || "private",
    financialMode,
    image: event.image || metadata.image || undefined,
    date: event.date,
    time: event.time,
    fullDate: event.full_date || undefined,
    startDate: event.start_date || null,
    startTime: event.start_time || event.time || null,
    endDate: event.end_date || null,
    endTime: event.end_time || null,
    location: event.location,
    address: event.address || null,
    mapsUrl: event.maps_url || null,
    eventMode: event.event_mode || "presential",
    meetingUrl: event.meeting_url || null,
    description: event.description || "",
    capacity: event.capacity ?? null,
    allowGuests: event.allow_guests ?? true,
    allowCompanions: event.allow_companions ?? false,
    maxCompanionsPerGuest: event.max_companions ?? event.max_companions_per_guest ?? 0,
    companionsRequireApproval: event.companions_require_approval ?? false,
    autoApprovePublicGuests: event.auto_approve_public_guests ?? false,
    rsvpEnabled: event.rsvp_enabled ?? true,
    rsvpDeadline: event.rsvp_deadline || null,
    allowResponseEdit: event.allow_response_edit ?? true,
    invitationMessage: event.invitation_message || null,
    budgetEstimated: event.budget_estimated !== null && event.budget_estimated !== undefined ? Number(event.budget_estimated) : null,
    initialEstimatedCost:
      event.initial_estimated_cost !== null && event.initial_estimated_cost !== undefined
        ? Number(event.initial_estimated_cost)
        : null,
    currency: event.currency || "BRL",
    financialNotes: event.financial_notes || null,
    confirmedGuests,
    totalGuests,
    items,
    guests,
    photos,
    publicInviteToken: event.public_invite_token || null,
    publicInviteEnabled: Boolean(event.public_invite_enabled),
    hostViewToken: event.host_view_token || metadata.host_view_token || null,
    hostViewEnabled: Boolean(event.host_view_enabled ?? metadata.host_view_enabled ?? false),
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  }
}

export async function getEvents() {
  if (!isSupabaseEnvConfigured()) {
    return { data: [], error: "Supabase not configured" }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: [], error: "Not authenticated" }
  }

  let { data: events, error } = await supabase
    .from("events")
    .select(
      `
      *,
      guests (*, guest_companions (*)),
      items (*),
      event_photos (*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    const fallback = await supabase
      .from("events")
      .select(
        `
        *,
        guests (*),
        items (*),
        event_photos (*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    events = fallback.data as any
    error = fallback.error
  }

  if (error) {
    return { data: [], error: error.message }
  }

  const transformedEvents = (events || []).map((event: any) =>
    toDisplayEvent(event, event.guests || [], event.items || [], event.event_photos || [])
  )

  return { data: transformedEvents, error: null }
}

export async function getEventById(eventId: string) {
  if (!isSupabaseEnvConfigured()) {
    return { data: null, error: "Supabase not configured" }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: "Not authenticated" }
  }

  let { data: event, error } = await supabase
    .from("events")
    .select(
      `
      *,
      guests (*, guest_companions (*)),
      items (*),
      event_photos (*)
    `
    )
    .eq("id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    const fallback = await supabase
      .from("events")
      .select(
        `
        *,
        guests (*),
        items (*),
        event_photos (*)
      `
      )
      .eq("id", eventId)
      .eq("user_id", user.id)
      .maybeSingle()
    event = fallback.data as any
    error = fallback.error
  }

  if (error) {
    return { data: null, error: error.message }
  }

  if (!event) {
    return { data: null, error: "Evento não encontrado" }
  }

  return {
    data: toDisplayEvent(event, event.guests || [], event.items || [], event.event_photos || []),
    error: null,
  }
}

export async function updateEventDetails(eventId: string, eventData: any) {
  if (!isSupabaseEnvConfigured()) {
    return { data: null, error: "Supabase not configured" }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data: existingEvent } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!existingEvent) {
    return { data: null, error: "Evento não encontrado ou acesso negado" }
  }

  const existingMeta =
    typeof existingEvent.metadata === "object" && existingEvent.metadata !== null
      ? (existingEvent.metadata as Record<string, any>)
      : {}

  const mergedPayload = {
    title: eventData.title ?? existingEvent.title,
    type: eventData.type ?? existingEvent.type,
    category: eventData.category !== undefined ? eventData.category : existingEvent.category,
    status: eventData.status ?? existingEvent.status ?? "active",
    visibility: eventData.visibility ?? existingEvent.visibility ?? "private",
    financialMode:
      eventData.financialMode ||
      (existingEvent as any).financial_mode ||
      existingMeta.financial_mode ||
      (eventData.type === "Colaborativo" ? "collaborative_split" : "corporate_budget"),
    image: eventData.image !== undefined ? eventData.image : existingEvent.image,
    date: eventData.date ?? existingEvent.date,
    time: eventData.startTime ?? eventData.time ?? existingEvent.time,
    fullDate: eventData.fullDate !== undefined ? eventData.fullDate : existingEvent.full_date,
    startDate: eventData.startDate !== undefined ? eventData.startDate : existingEvent.start_date,
    startTime: eventData.startTime ?? eventData.time ?? existingEvent.start_time ?? existingEvent.time,
    endDate: eventData.endDate !== undefined ? eventData.endDate : existingEvent.end_date,
    endTime: eventData.endTime !== undefined ? eventData.endTime : existingEvent.end_time,
    location: eventData.location ?? existingEvent.location,
    address: eventData.address !== undefined ? eventData.address : existingEvent.address,
    mapsUrl: eventData.mapsUrl !== undefined ? eventData.mapsUrl : existingEvent.maps_url,
    eventMode: eventData.eventMode ?? existingEvent.event_mode ?? "presential",
    meetingUrl: eventData.meetingUrl !== undefined ? eventData.meetingUrl : existingEvent.meeting_url,
    description: eventData.description ?? existingEvent.description ?? "",
    capacity: eventData.capacity !== undefined ? eventData.capacity : existingEvent.capacity,
    allowGuests: eventData.allowGuests ?? existingEvent.allow_guests ?? true,
    allowCompanions: eventData.allowCompanions ?? existingEvent.allow_companions ?? false,
    maxCompanionsPerGuest:
      eventData.maxCompanionsPerGuest ?? eventData.maxCompanions ?? existingEvent.max_companions ?? 0,
    companionsRequireApproval:
      eventData.companionsRequireApproval ?? existingEvent.companions_require_approval ?? false,
    publicInviteEnabled: eventData.publicInviteEnabled ?? existingEvent.public_invite_enabled ?? false,
    publicInviteToken: eventData.publicInviteToken !== undefined ? eventData.publicInviteToken : existingEvent.public_invite_token,
    autoApprovePublicGuests:
      eventData.autoApprovePublicGuests ?? existingEvent.auto_approve_public_guests ?? false,
    rsvpEnabled: eventData.rsvpEnabled ?? existingEvent.rsvp_enabled ?? true,
    rsvpDeadline: eventData.rsvpDeadline !== undefined ? eventData.rsvpDeadline : existingEvent.rsvp_deadline,
    allowResponseEdit: eventData.allowResponseEdit ?? existingEvent.allow_response_edit ?? true,
    invitationMessage:
      eventData.invitationMessage !== undefined ? eventData.invitationMessage : existingEvent.invitation_message,
    budgetEstimated:
      eventData.budgetEstimated !== undefined ? eventData.budgetEstimated : existingEvent.budget_estimated,
    initialEstimatedCost:
      eventData.initialEstimatedCost !== undefined
        ? eventData.initialEstimatedCost
        : existingEvent.initial_estimated_cost,
    currency: eventData.currency ?? existingEvent.currency ?? "BRL",
    financialNotes: eventData.financialNotes !== undefined ? eventData.financialNotes : existingEvent.financial_notes,
  }

  const parsed = eventPayloadSchema.safeParse(mergedPayload)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados do evento inválidos" }
  }

  const v = parsed.data
  const publicInviteToken = v.publicInviteEnabled
    ? v.publicInviteToken || generateSecureToken(16)
    : v.publicInviteToken || null

  const dbUpdatePayload: Record<string, any> = {
    title: v.title,
    type: v.type,
    category: v.category || null,
    status: v.status,
    visibility: v.visibility,
    image: v.image || null,
    date: v.date || v.startDate || "",
    time: v.startTime || v.time || "",
    full_date: v.fullDate || v.startDate || null,
    start_date: v.startDate || null,
    start_time: v.startTime || v.time || null,
    end_date: v.endDate || v.startDate || null,
    end_time: v.endTime || null,
    location: v.location,
    address: v.address || null,
    maps_url: v.mapsUrl || null,
    event_mode: v.eventMode,
    meeting_url: v.meetingUrl || null,
    description: v.description || "",
    capacity: v.capacity ?? null,
    allow_guests: v.allowGuests,
    allow_companions: v.allowCompanions,
    max_companions: v.maxCompanionsPerGuest,
    companions_require_approval: v.companionsRequireApproval,
    public_invite_enabled: v.publicInviteEnabled,
    public_invite_token: publicInviteToken,
    auto_approve_public_guests: v.autoApprovePublicGuests,
    rsvp_enabled: v.rsvpEnabled,
    rsvp_deadline: v.rsvpDeadline || null,
    allow_response_edit: v.allowResponseEdit,
    invitation_message: v.invitationMessage || null,
    budget_estimated: v.budgetEstimated ?? null,
    initial_estimated_cost: v.initialEstimatedCost ?? null,
    currency: v.currency,
    financial_notes: v.financialNotes || null,
    metadata: {
      ...existingMeta,
      financial_mode: v.financialMode || "corporate_budget",
    },
  }

  const { data, error } = await supabase
    .from("events")
    .update(dbUpdatePayload)
    .eq("id", eventId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  revalidatePath(`/event/${eventId}`)

  const refreshed = await getEventById(eventId)
  return { data: refreshed.data || toDisplayEvent(data), error: null }
}

export async function createEvent(eventData: any) {
  if (!isSupabaseEnvConfigured()) {
    return { data: null, error: "Supabase not configured" }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: "Not authenticated" }
  }

  const parsed = eventPayloadSchema.safeParse(eventData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || "Dados do evento inválidos" }
  }

  const v = parsed.data
  const selectedGuests = Array.isArray(v.guests) ? v.guests : []
  const publicInviteToken = v.publicInviteEnabled ? generateSecureToken(16) : null
  const hostViewToken = generateSecureToken(16)
  const financialMode =
    v.financialMode || (v.type === "Colaborativo" ? "collaborative_split" : "corporate_budget")

  const insertPayload: Record<string, any> = {
    title: v.title,
    type: v.type,
    category: v.category || null,
    date: v.date || v.startDate || "",
    time: v.startTime || v.time || "",
    full_date: v.fullDate || v.startDate || null,
    location: v.location,
    description: v.description || "",
    status: v.status || "active",
    image: v.image || null,
    start_date: v.startDate || null,
    start_time: v.startTime || v.time || null,
    end_date: v.endDate || v.startDate || null,
    end_time: v.endTime || null,
    address: v.address || null,
    maps_url: v.mapsUrl || null,
    event_mode: v.eventMode,
    meeting_url: v.meetingUrl || null,
    capacity: v.capacity ?? null,
    allow_guests: v.allowGuests,
    allow_companions: v.allowCompanions,
    max_companions: v.maxCompanionsPerGuest,
    companions_require_approval: v.companionsRequireApproval,
    public_invite_enabled: v.publicInviteEnabled,
    public_invite_token: publicInviteToken,
    auto_approve_public_guests: v.autoApprovePublicGuests,
    rsvp_enabled: v.rsvpEnabled,
    rsvp_deadline: v.rsvpDeadline || null,
    allow_response_edit: v.allowResponseEdit,
    invitation_message: v.invitationMessage || null,
    budget_estimated: v.budgetEstimated ?? null,
    initial_estimated_cost: v.initialEstimatedCost ?? null,
    currency: v.currency,
    financial_notes: v.financialNotes || null,
    visibility: v.visibility,
    confirmed_guests: 0,
    total_guests: selectedGuests.length,
    metadata: {
      financial_mode: financialMode,
      host_view_token: hostViewToken,
      host_view_enabled: true,
    },
    user_id: user.id,
  }

  const { data, error } = await supabase.from("events").insert(insertPayload).select().single()

  if (error) {
    return { data: null, error: error.message }
  }

  let insertedGuests: any[] = []
  if (selectedGuests.length > 0) {
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .insert(
        selectedGuests.map((guest) => {
          const token = generateSecureToken(16)
          return {
            event_id: data.id,
            name: guest.name,
            email: (guest.email || "").toLowerCase(),
            phone: guest.phone || "",
            status: "pending",
            source: "manual",
            contact_id: guest.contactId || null,
            token,
            confirmation_token: token,
          }
        })
      )
      .select()

    if (guestsError) {
      return { data: toDisplayEvent(data), error: "Evento criado, mas não foi possível adicionar convidados." }
    }

    insertedGuests = guests || []
  }

  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  revalidatePath(`/event/${data.id}`)
  return { data: toDisplayEvent(data, insertedGuests), error: null }
}

export async function deleteEventAction(id: string, confirmTitle?: string) {
  if (!isSupabaseEnvConfigured()) {
    return { success: true, localOnly: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Usuário não autenticado." }
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from("events")
    .select("id, title, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (fetchError || !existingEvent) {
    return { success: false, error: "Evento não encontrado ou sem permissão." }
  }

  if (confirmTitle !== undefined && !validateNominalEventDeletion(existingEvent.title, confirmTitle)) {
    return {
      success: false,
      error: "O título digitado não confere com o nome do evento.",
    }
  }

  const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  return { success: true }
}

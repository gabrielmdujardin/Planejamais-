"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type GuestInput = {
  name: string
  email?: string
  phone?: string
  contactId?: string
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Boolean(
    url &&
      key &&
      !url.includes("example.supabase.co") &&
      !url.includes("your-project.supabase.co") &&
      !key.includes("dummy") &&
      !key.includes("your-supabase"),
  )
}

function toDisplayEvent(event: any, guests: any[] = [], items: any[] = [], photos: any[] = []) {
  const metadata = typeof event.metadata === "object" && event.metadata !== null ? event.metadata : {}
  const financialMode =
    event.financial_mode ||
    event.financialMode ||
    metadata.financial_mode ||
    (event.type === "Colaborativo" ? "collaborative_split" : "corporate_budget")

  return {
    id: event.id,
    title: event.title,
    type: event.type,
    category: event.category || undefined,
    status: event.status || "active",
    visibility: event.visibility || "private",
    financialMode,
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
    description: event.description,
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
    budgetEstimated: event.budget_estimated ?? null,
    initialEstimatedCost: event.initial_estimated_cost ?? null,
    currency: event.currency || "BRL",
    financialNotes: event.financial_notes || null,
    confirmedGuests: event.confirmed_guests,
    totalGuests: event.total_guests,
    items,
    guests,
    photos,
    publicInviteToken: event.public_invite_token || null,
    publicInviteEnabled: event.public_invite_enabled || false,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  }
}

export async function getEvents() {
  if (!isSupabaseConfigured()) {
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


  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      *,
      guests (*),
      items (*),
      event_photos (*)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }


  const transformedEvents = events?.map((event) =>
    toDisplayEvent(event, event.guests || [], event.items || [], event.event_photos || []),
  )

  return { data: transformedEvents || [], error: null }
}

export async function getEventById(eventId: string) {
  if (!isSupabaseConfigured()) {
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

  const { data: event, error } = await supabase
    .from("events")
    .select(
      `
      *,
      guests (*),
      items (*),
      event_photos (*)
    `,
    )
    .eq("id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

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
  if (!isSupabaseConfigured()) {
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

  const title = String(eventData.title || "").trim()
  const startDate = eventData.startDate || null
  const startTime = eventData.startTime || eventData.time
  const location = String(eventData.location || "").trim()
  const capacity = eventData.capacity ?? null
  const maxCompanions = eventData.maxCompanionsPerGuest ?? eventData.maxCompanions ?? 0
  const budgetEstimated = eventData.budgetEstimated ?? null
  const initialEstimatedCost = eventData.initialEstimatedCost ?? null

  if (!title) return { data: null, error: "Nome do evento é obrigatório" }
  if (!startDate && !eventData.fullDate) return { data: null, error: "Data do evento é obrigatória" }
  if (!startTime) return { data: null, error: "Horário de início é obrigatório" }
  if (eventData.endTime && startTime && eventData.endTime <= startTime) {
    return { data: null, error: "O horário de término precisa ser depois do início" }
  }
  if ((eventData.eventMode || "presential") !== "online" && !location) return { data: null, error: "Local é obrigatório" }
  if ((eventData.eventMode || "presential") !== "presential" && !eventData.meetingUrl) {
    return { data: null, error: "Link da reunião é obrigatório para eventos online ou híbridos" }
  }
  if (capacity !== null && capacity < 0) return { data: null, error: "A capacidade não pode ser negativa" }
  if (maxCompanions < 0) return { data: null, error: "O máximo de acompanhantes não pode ser negativo" }
  if (eventData.rsvpDeadline && startDate && eventData.rsvpDeadline > startDate) {
    return { data: null, error: "A data limite de confirmação não pode ser depois da data do evento" }
  }
  if (budgetEstimated !== null && budgetEstimated < 0) return { data: null, error: "O orçamento não pode ser negativo" }
  if (initialEstimatedCost !== null && initialEstimatedCost < 0) {
    return { data: null, error: "O custo estimado inicial não pode ser negativo" }
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      title,
      type: eventData.type || "Outro",
      category: eventData.category || null,
      status: eventData.status || "active",
      visibility: eventData.visibility || "private",
      date: eventData.date,
      time: startTime,
      full_date: eventData.fullDate,
      start_date: startDate,
      start_time: startTime,
      end_date: eventData.endDate || startDate,
      end_time: eventData.endTime || null,
      location,
      address: eventData.address || null,
      maps_url: eventData.mapsUrl || null,
      event_mode: eventData.eventMode || "presential",
      meeting_url: eventData.meetingUrl || null,
      description: eventData.description || "",
      capacity,
      allow_guests: eventData.allowGuests ?? true,
      allow_companions: eventData.allowCompanions ?? false,
      max_companions: maxCompanions,
      companions_require_approval: eventData.companionsRequireApproval ?? false,
      public_invite_enabled: eventData.publicInviteEnabled ?? false,
      public_invite_token: eventData.publicInviteToken || null,
      auto_approve_public_guests: eventData.autoApprovePublicGuests ?? false,
      rsvp_enabled: eventData.rsvpEnabled ?? true,
      rsvp_deadline: eventData.rsvpDeadline || null,
      allow_response_edit: eventData.allowResponseEdit ?? true,
      invitation_message: eventData.invitationMessage || null,
      budget_estimated: budgetEstimated,
      initial_estimated_cost: initialEstimatedCost,
      currency: eventData.currency || "BRL",
      financial_notes: eventData.financialNotes || null,
      metadata: {
        financial_mode: eventData.financialMode || (eventData.type === "Colaborativo" ? "collaborative_split" : "corporate_budget"),
      },
    })
    .eq("id", eventId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/event/${eventId}`)
  return { data: toDisplayEvent(data), error: null }
}

export async function createEvent(eventData: any) {
  if (!isSupabaseConfigured()) {
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

  const selectedGuests: GuestInput[] = Array.isArray(eventData.guests) ? eventData.guests : []
  const publicInviteEnabled = Boolean(eventData.publicInviteEnabled)
  const publicInviteToken = publicInviteEnabled ? crypto.randomUUID() : null
  const status = eventData.status || "active"
  const title = String(eventData.title || "").trim()
  const startDate = eventData.startDate || eventData.fullDate || eventData.date
  const startTime = eventData.startTime || eventData.time
  const location = String(eventData.location || "").trim()
  const capacity = eventData.capacity ?? null
  const maxCompanions = eventData.maxCompanionsPerGuest ?? 0
  const budgetEstimated = eventData.budgetEstimated ?? null
  const initialEstimatedCost = eventData.initialEstimatedCost ?? null

  if (!title) return { data: null, error: "Nome do evento é obrigatório" }
  if (!startDate) return { data: null, error: "Data do evento é obrigatória" }
  if (!startTime) return { data: null, error: "Horário de início é obrigatório" }
  if (eventData.endTime && startTime && eventData.endTime <= startTime) {
    return { data: null, error: "O horário de término precisa ser depois do início" }
  }
  if (eventData.eventMode !== "online" && !location) {
    return { data: null, error: "Local é obrigatório para eventos presenciais ou híbridos" }
  }
  if (eventData.eventMode !== "presential" && !eventData.meetingUrl) {
    return { data: null, error: "Link da reunião é obrigatório para eventos online ou híbridos" }
  }
  if (capacity !== null && capacity < 0) return { data: null, error: "A capacidade não pode ser negativa" }
  if (maxCompanions < 0) return { data: null, error: "O máximo de acompanhantes não pode ser negativo" }
  if (eventData.rsvpDeadline && eventData.startDate && eventData.rsvpDeadline > eventData.startDate) {
    return { data: null, error: "A data limite de confirmação não pode ser depois da data do evento" }
  }
  if (budgetEstimated !== null && budgetEstimated < 0) return { data: null, error: "O orçamento não pode ser negativo" }
  if (initialEstimatedCost !== null && initialEstimatedCost < 0) {
    return { data: null, error: "O custo estimado inicial não pode ser negativo" }
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      type: eventData.type || "Outro",
      category: eventData.category || null,
      date: eventData.date,
      time: startTime,
      full_date: eventData.fullDate,
      location,
      description: eventData.description || "",
      status,
      start_date: eventData.startDate || null,
      start_time: startTime || null,
      end_date: eventData.endDate || eventData.startDate || null,
      end_time: eventData.endTime || null,
      address: eventData.address || null,
      maps_url: eventData.mapsUrl || null,
      event_mode: eventData.eventMode || "presential",
      meeting_url: eventData.meetingUrl || null,
      capacity,
      allow_guests: eventData.allowGuests ?? true,
      allow_companions: eventData.allowCompanions ?? false,
      max_companions: maxCompanions,
      companions_require_approval: eventData.companionsRequireApproval ?? false,
      public_invite_enabled: publicInviteEnabled,
      public_invite_token: publicInviteToken,
      auto_approve_public_guests: eventData.autoApprovePublicGuests ?? false,
      rsvp_enabled: eventData.rsvpEnabled ?? true,
      rsvp_deadline: eventData.rsvpDeadline || null,
      allow_response_edit: eventData.allowResponseEdit ?? true,
      invitation_message: eventData.invitationMessage || null,
      budget_estimated: budgetEstimated,
      initial_estimated_cost: initialEstimatedCost,
      currency: eventData.currency || "BRL",
      financial_notes: eventData.financialNotes || null,
      visibility: eventData.visibility || "private",
      confirmed_guests: eventData.confirmedGuests || 0,
      total_guests: selectedGuests.length || eventData.totalGuests || 0,
      metadata: {
        financial_mode: eventData.financialMode || (eventData.type === "Colaborativo" ? "collaborative_split" : "corporate_budget"),
      },
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  let insertedGuests: any[] = []
  if (selectedGuests.length > 0) {
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .insert(
        selectedGuests.map((guest) => ({
          event_id: data.id,
          name: guest.name,
          email: guest.email || "",
          phone: guest.phone || "",
          status: "pending",
          contact_id: guest.contactId || null,
        })),
      )
      .select()

    if (guestsError) {
      return { data: toDisplayEvent(data), error: "Evento criado, mas não foi possível adicionar convidados." }
    }

    insertedGuests = guests || []
  }

  revalidatePath("/dashboard")
  revalidatePath(`/event/${data.id}`)
  return { data: toDisplayEvent(data, insertedGuests), error: null }
}

export async function deleteEventAction(id: string) {
  if (!isSupabaseConfigured()) {
    return { success: true, localOnly: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Usuário não autenticado." }
  }

  const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

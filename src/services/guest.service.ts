/**
 * Serviço de convidados - lógica de negócio para gerenciamento de convidados
 */

import { createClient } from "@/lib/supabase/client"
import type {
  Guest,
  GuestStatus,
  Companion,
  CompanionStatus,
  PublicRequestInput,
  GuestWithCompanions,
} from "@/src/types/guest.types"

const supabase = createClient()

export interface AddGuestInput {
  eventId: string
  name: string
  email?: string
  phone?: string
}

export interface UpdateGuestInput {
  id: string
  name?: string
  email?: string
  phone?: string
  status?: GuestStatus
}

function generateToken(): string {
  return crypto.randomUUID()
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export const GuestService = {
  /**
   * Busca todos os convidados de um evento
   */
  async getByEventId(eventId: string): Promise<Guest[]> {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("event_id", eventId)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Busca convidados com acompanhantes
   */
  async getByEventIdWithCompanions(eventId: string): Promise<GuestWithCompanions[]> {
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })

    if (guestsError) throw guestsError

    const guestIds = guests?.map((g) => g.id) || []

    if (guestIds.length === 0) return []

    const { data: companions, error: companionsError } = await supabase
      .from("guest_companions")
      .select("*")
      .in("guest_id", guestIds)

    if (companionsError) throw companionsError

    const companionsByGuestId = (companions || []).reduce(
      (acc, companion) => {
        if (!acc[companion.guest_id]) {
          acc[companion.guest_id] = []
        }
        acc[companion.guest_id].push({
          id: companion.id,
          guestId: companion.guest_id,
          name: companion.name,
          email: companion.email,
          phone: companion.phone,
          notes: companion.notes,
          status: companion.status as CompanionStatus,
          approvedBy: companion.approved_by,
          approvedAt: companion.approved_at,
          rejectedAt: companion.rejected_at,
          rejectionReason: companion.rejection_reason,
          createdAt: companion.created_at,
          updatedAt: companion.updated_at,
        })
        return acc
      },
      {} as Record<string, Companion[]>
    )

    return (guests || []).map((guest) => ({
      id: guest.id,
      eventId: guest.event_id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      status: guest.status as GuestStatus,
      token: guest.token,
      confirmationDeadline: guest.confirmation_deadline,
      sentAt: guest.sent_at,
      respondedAt: guest.responded_at,
      notes: guest.notes,
      dietaryRestrictions: guest.dietary_restrictions,
      accessibilityNeeds: guest.accessibility_needs,
      source: guest.source || "manual",
      requestedCompanionsCount: guest.requested_companions_count || 0,
      companions: companionsByGuestId[guest.id] || [],
      createdAt: guest.created_at,
      updatedAt: guest.updated_at,
    }))
  },

  /**
   * Busca solicitações pendentes de aprovação
   */
  async getPendingRequests(eventId: string): Promise<GuestWithCompanions[]> {
    const guests = await this.getByEventIdWithCompanions(eventId)
    return guests.filter((g) => g.status === "awaiting_approval")
  },

  /**
   * Adiciona um convidado a um evento
   */
  async add(input: AddGuestInput): Promise<Guest> {
    const { data, error } = await supabase
      .from("guests")
      .insert({
        event_id: input.eventId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        status: "pending",
        source: "manual",
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Cria uma solicitação pública de participação
   */
  async createPublicRequest(input: PublicRequestInput): Promise<GuestWithCompanions> {
    // Verificar se o email já existe no evento
    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("event_id", input.eventId)
      .eq("email", input.email)
      .single()

    if (existingGuest) {
      throw new Error("Este email já está cadastrado para este evento")
    }

    // Criar o convidado principal
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        event_id: input.eventId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        status: "awaiting_approval",
        source: "public_request",
        notes: input.notes,
        dietary_restrictions: input.dietaryRestrictions,
        accessibility_needs: input.accessibilityNeeds,
        requested_companions_count: input.companions?.length || 0,
      })
      .select()
      .single()

    if (guestError) throw guestError

    // Criar acompanhantes
    let companions: Companion[] = []
    if (input.companions && input.companions.length > 0) {
      const companionsToInsert = input.companions.map((c) => ({
        guest_id: guest.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        notes: c.notes,
        status: "awaiting_approval",
      }))

      const { data: companionsData, error: companionsError } = await supabase
        .from("guest_companions")
        .insert(companionsToInsert)
        .select()

      if (companionsError) throw companionsError

      companions = (companionsData || []).map((c) => ({
        id: c.id,
        guestId: c.guest_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        notes: c.notes,
        status: c.status as CompanionStatus,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    }

    return {
      id: guest.id,
      eventId: guest.event_id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      status: guest.status as GuestStatus,
      source: guest.source || "public_request",
      requestedCompanionsCount: guest.requested_companions_count || 0,
      companions,
      createdAt: guest.created_at,
      updatedAt: guest.updated_at,
    }
  },

  /**
   * Aprova um convidado e seus acompanhantes selecionados
   */
  async approveGuest(
    guestId: string,
    approvedCompanionIds: string[] = [],
    rejectedCompanionIds: string[] = [],
    confirmationDeadlineDays: number = 7
  ): Promise<{ guest: Guest; token: string }> {
    const token = generateToken()
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + confirmationDeadlineDays)

    // Atualizar o convidado principal
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .update({
        status: "pending",
        token,
        confirmation_deadline: deadline.toISOString(),
        sent_at: new Date().toISOString(),
      })
      .eq("id", guestId)
      .select()
      .single()

    if (guestError) throw guestError

    // Aprovar acompanhantes selecionados
    if (approvedCompanionIds.length > 0) {
      await supabase
        .from("guest_companions")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .in("id", approvedCompanionIds)
    }

    // Rejeitar acompanhantes não selecionados
    if (rejectedCompanionIds.length > 0) {
      await supabase
        .from("guest_companions")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
        })
        .in("id", rejectedCompanionIds)
    }

    return {
      guest: {
        ...guest,
        eventId: guest.event_id,
        status: guest.status as GuestStatus,
        source: guest.source || "manual",
        requestedCompanionsCount: guest.requested_companions_count || 0,
      },
      token,
    }
  },

  /**
   * Rejeita um convidado e todos seus acompanhantes
   */
  async rejectGuest(guestId: string, reason?: string): Promise<Guest> {
    // Atualizar o convidado principal
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .update({
        status: "declined",
      })
      .eq("id", guestId)
      .select()
      .single()

    if (guestError) throw guestError

    // Cancelar todos os acompanhantes
    await supabase
      .from("guest_companions")
      .update({
        status: "cancelled",
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId)

    return {
      ...guest,
      eventId: guest.event_id,
      status: guest.status as GuestStatus,
      source: guest.source || "manual",
      requestedCompanionsCount: guest.requested_companions_count || 0,
    }
  },

  /**
   * Aprova um acompanhante individual
   */
  async approveCompanion(companionId: string): Promise<Companion> {
    const { data, error } = await supabase
      .from("guest_companions")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", companionId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      guestId: data.guest_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      status: data.status as CompanionStatus,
      approvedAt: data.approved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Rejeita um acompanhante individual
   */
  async rejectCompanion(companionId: string, reason?: string): Promise<Companion> {
    const { data, error } = await supabase
      .from("guest_companions")
      .update({
        status: "rejected",
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", companionId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      guestId: data.guest_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      status: data.status as CompanionStatus,
      rejectedAt: data.rejected_at,
      rejectionReason: data.rejection_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Busca convidado pelo token
   */
  async getByToken(token: string): Promise<GuestWithCompanions | null> {
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select(
        `
        *,
        events (
          id,
          title,
          date,
          time,
          location
        )
      `
      )
      .eq("token", token)
      .single()

    if (guestError) {
      if (guestError.code === "PGRST116") return null
      throw guestError
    }

    const { data: companions, error: companionsError } = await supabase
      .from("guest_companions")
      .select("*")
      .eq("guest_id", guest.id)
      .eq("status", "approved")

    if (companionsError) throw companionsError

    return {
      id: guest.id,
      eventId: guest.event_id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      status: guest.status as GuestStatus,
      token: guest.token,
      confirmationDeadline: guest.confirmation_deadline,
      sentAt: guest.sent_at,
      respondedAt: guest.responded_at,
      notes: guest.notes,
      dietaryRestrictions: guest.dietary_restrictions,
      accessibilityNeeds: guest.accessibility_needs,
      source: guest.source || "manual",
      requestedCompanionsCount: guest.requested_companions_count || 0,
      companions: (companions || []).map((c) => ({
        id: c.id,
        guestId: c.guest_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        notes: c.notes,
        status: c.status as CompanionStatus,
        approvedAt: c.approved_at,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      event: guest.events
        ? {
            id: guest.events.id,
            title: guest.events.title,
            date: guest.events.date,
            time: guest.events.time,
            location: guest.events.location,
          }
        : undefined,
      createdAt: guest.created_at,
      updatedAt: guest.updated_at,
    }
  },

  /**
   * Confirma presença de um convidado via token
   */
  async confirmPresenceByToken(token: string): Promise<Guest> {
    const { data, error } = await supabase
      .from("guests")
      .update({
        status: "confirmed",
        responded_at: new Date().toISOString(),
      })
      .eq("token", token)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Recusa presença de um convidado via token
   */
  async declinePresenceByToken(token: string): Promise<Guest> {
    // Primeiro buscar o convidado para obter o ID
    const { data: guest, error: fetchError } = await supabase
      .from("guests")
      .select("id")
      .eq("token", token)
      .single()

    if (fetchError) throw fetchError

    // Atualizar o status do convidado
    const { data, error } = await supabase
      .from("guests")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("token", token)
      .select()
      .single()

    if (error) throw error

    // Cancelar todos os acompanhantes aprovados
    await supabase
      .from("guest_companions")
      .update({
        status: "cancelled",
      })
      .eq("guest_id", guest.id)
      .eq("status", "approved")

    return data
  },

  /**
   * Atualiza um convidado
   */
  async update(input: UpdateGuestInput): Promise<Guest> {
    const { id, ...updateData } = input
    const { data, error } = await supabase
      .from("guests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove um convidado
   */
  async delete(guestId: string): Promise<void> {
    const { error } = await supabase.from("guests").delete().eq("id", guestId)

    if (error) throw error
  },

  /**
   * Confirma presença de um convidado (método legado)
   */
  async confirmPresence(guestId: string): Promise<Guest> {
    const { data, error } = await supabase
      .from("guests")
      .update({
        status: "confirmed",
        responded_at: new Date().toISOString(),
      })
      .eq("id", guestId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Recusa presença de um convidado (método legado)
   */
  async declinePresence(guestId: string): Promise<Guest> {
    const { data, error } = await supabase
      .from("guests")
      .update({ status: "declined" })
      .eq("id", guestId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Conta estatísticas de convidados
   */
  async getStats(eventId: string): Promise<{
    total: number
    confirmed: number
    pending: number
    declined: number
    awaitingApproval: number
  }> {
    const guests = await this.getByEventId(eventId)

    return {
      total: guests.length,
      confirmed: guests.filter((g) => g.status === "confirmed").length,
      pending: guests.filter((g) => g.status === "pending").length,
      declined: guests.filter((g) => g.status === "declined").length,
      awaitingApproval: guests.filter((g) => g.status === "awaiting_approval").length,
    }
  },
}

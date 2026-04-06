/**
 * Serviço de convidados - lógica de negócio para gerenciamento de convidados
 */

import { createClient } from "@/lib/supabase/client"
import type { Guest, GuestStatus } from "@/src/types"

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
      })
      .select()
      .single()

    if (error) throw error
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
   * Confirma presença de um convidado
   */
  async confirmPresence(guestId: string): Promise<Guest> {
    const { data, error } = await supabase
      .from("guests")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", guestId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Recusa presença de um convidado
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
  }> {
    const guests = await this.getByEventId(eventId)

    return {
      total: guests.length,
      confirmed: guests.filter((g) => g.status === "confirmed").length,
      pending: guests.filter((g) => g.status === "pending").length,
      declined: guests.filter((g) => g.status === "declined").length,
    }
  },
}

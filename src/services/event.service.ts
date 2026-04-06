/**
 * Serviço de eventos - lógica de negócio para gerenciamento de eventos
 */

import { createClient } from "@/lib/supabase/client"
import type { Event, CreateEventInput, UpdateEventInput, CalendarEvent } from "@/src/types"
import { addHours } from "date-fns"

const supabase = createClient()

export const EventService = {
  /**
   * Busca todos os eventos do usuário
   */
  async getAll(userId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Busca um evento por ID
   */
  async getById(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .select("*, guests(*), items(*)")
      .eq("id", eventId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Cria um novo evento
   */
  async create(input: CreateEventInput, userId: string): Promise<Event> {
    const { data, error } = await supabase
      .from("events")
      .insert({
        ...input,
        user_id: userId,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Atualiza um evento existente
   */
  async update(input: UpdateEventInput): Promise<Event> {
    const { id, ...updateData } = input
    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove um evento
   */
  async delete(eventId: string): Promise<void> {
    const { error } = await supabase.from("events").delete().eq("id", eventId)

    if (error) throw error
  },

  /**
   * Converte eventos do banco para formato do calendário
   */
  convertToCalendarEvents(events: Event[]): CalendarEvent[] {
    return events.map((event) => {
      const [day, month, year] = event.date.split("/")
      const [hours, minutes] = event.time.split(":")

      const startDate = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day),
        Number.parseInt(hours),
        Number.parseInt(minutes)
      )

      const endDate = addHours(startDate, 2)

      return {
        id: event.id,
        title: event.title,
        start: startDate,
        end: endDate,
        resource: {
          location: event.location,
          description: event.description,
          type: event.type,
          status: event.status,
          originalDate: event.date,
          originalTime: event.time,
        },
      }
    })
  },
}

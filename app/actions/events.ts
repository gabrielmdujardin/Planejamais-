"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getEvents() {
  console.log("[v0] Fetching events from Supabase...")
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log("[v0] No authenticated user found:", userError?.message)
    return { data: [], error: "Not authenticated" }
  }

  console.log("[v0] User authenticated:", user.id)

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
    console.error("[v0] Error fetching events:", error)
    return { data: [], error: error.message }
  }

  console.log("[v0] Events fetched successfully:", events?.length || 0)

  const transformedEvents = events?.map((event) => ({
    id: event.id,
    title: event.title,
    type: event.type,
    category: event.category || undefined,
    date: event.date,
    time: event.time,
    fullDate: event.full_date || undefined,
    location: event.location,
    description: event.description,
    confirmedGuests: event.confirmed_guests,
    totalGuests: event.total_guests,
    items: event.items || [],
    guests: event.guests || [],
    photos: event.event_photos || [],
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  }))

  return { data: transformedEvents || [], error: null }
}

export async function createEvent(eventData: any) {
  console.log("[v0] Creating event in Supabase...")
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log("[v0] No authenticated user found:", userError?.message)
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: eventData.title,
      type: eventData.type,
      category: eventData.category,
      date: eventData.date,
      time: eventData.time,
      full_date: eventData.fullDate,
      location: eventData.location,
      description: eventData.description,
      confirmed_guests: eventData.confirmedGuests || 0,
      total_guests: eventData.totalGuests || 0,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating event:", error)
    return { data: null, error: error.message }
  }

  console.log("[v0] Event created successfully:", data.id)
  revalidatePath("/dashboard")
  return { data, error: null }
}

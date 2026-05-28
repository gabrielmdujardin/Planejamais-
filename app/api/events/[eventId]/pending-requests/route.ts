import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()
    const eventQuery = admin.from("events").select("id").eq("user_id", user.id)
    const { data: event, error: eventError } = isUuid(eventId)
      ? await eventQuery.eq("id", eventId).maybeSingle()
      : await eventQuery.eq("metadata->>local_event_id", eventId).maybeSingle()

    if (eventError || !event) {
      return NextResponse.json({ guests: [] })
    }

    const { data: guests, error: guestsError } = await admin
      .from("guests")
      .select("*")
      .eq("event_id", event.id)
      .eq("status", "awaiting_approval")
      .order("created_at", { ascending: false })

    if (guestsError) throw guestsError

    if (!guests || guests.length === 0) {
      return NextResponse.json({ guests: [] })
    }

    const guestIds = guests.map((guest) => guest.id)
    const { data: companions, error: companionsError } = await admin
      .from("guest_companions")
      .select("*")
      .in("guest_id", guestIds)

    if (companionsError) throw companionsError

    const companionsByGuestId = (companions || []).reduce(
      (acc, companion) => {
        if (!acc[companion.guest_id]) acc[companion.guest_id] = []
        acc[companion.guest_id].push({
          id: companion.id,
          guestId: companion.guest_id,
          name: companion.name,
          email: companion.email,
          phone: companion.phone,
          notes: companion.notes,
          status: companion.status,
          createdAt: companion.created_at,
          updatedAt: companion.updated_at,
        })
        return acc
      },
      {} as Record<string, Array<Record<string, unknown>>>
    )

    const formattedGuests = guests.map((guest) => ({
      id: guest.id,
      eventId: guest.event_id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      status: guest.status,
      notes: guest.notes,
      dietaryRestrictions: guest.dietary_restrictions,
      accessibilityNeeds: guest.accessibility_needs,
      source: guest.source,
      requestedCompanionsCount: guest.requested_companions_count || 0,
      companions: companionsByGuestId[guest.id] || [],
      createdAt: guest.created_at,
      updatedAt: guest.updated_at,
    }))

    return NextResponse.json({ guests: formattedGuests })
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

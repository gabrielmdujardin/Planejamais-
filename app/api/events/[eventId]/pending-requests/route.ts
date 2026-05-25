import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se o evento pertence ao usuário
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("user_id", user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    // Buscar solicitações pendentes
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "awaiting_approval")
      .order("created_at", { ascending: false })

    if (guestsError) throw guestsError

    if (!guests || guests.length === 0) {
      return NextResponse.json({ guests: [] })
    }

    // Buscar acompanhantes
    const guestIds = guests.map((g) => g.id)
    const { data: companions, error: companionsError } = await supabase
      .from("guest_companions")
      .select("*")
      .in("guest_id", guestIds)

    if (companionsError) throw companionsError

    // Agrupar acompanhantes por guest_id
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
          status: companion.status,
          createdAt: companion.created_at,
          updatedAt: companion.updated_at,
        })
        return acc
      },
      {} as Record<string, typeof companions>
    )

    // Formatar resposta
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
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

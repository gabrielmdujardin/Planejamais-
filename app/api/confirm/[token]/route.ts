import { buildPublicEventPayload, isSafeToken } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isSafeToken(token)) {
      return NextResponse.json(
        { error: "Este convite não é mais válido" },
        { status: 404 }
      )
    }

    const cleanToken = token.trim()
    const supabaseAdmin = createAdminClient()

    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select(
        `
        *,
        events (
          id,
          title,
          type,
          date,
          time,
          start_date,
          start_time,
          end_date,
          end_time,
          location,
          address,
          maps_url,
          event_mode,
          meeting_url,
          description,
          allow_companions,
          max_companions,
          rsvp_enabled,
          rsvp_deadline
        )
      `
      )
      .or(`token.eq.${cleanToken},confirmation_token.eq.${cleanToken}`)
      .maybeSingle()

    // RN-006: Token inexistente ou de evento excluído não aceita respostas
    const rawEvent = Array.isArray(guest?.events) ? guest?.events[0] : guest?.events
    if (guestError || !guest || !rawEvent) {
      return NextResponse.json(
        { error: "Este convite não é mais válido" },
        { status: 404 }
      )
    }

    const publicEvent = {
      ...buildPublicEventPayload(rawEvent),
      // RN-007: meeting_url só é exibida ao convidado já confirmado
      ...(guest.status === "confirmed" && rawEvent.meeting_url ? { meetingUrl: rawEvent.meeting_url } : {}),
    }

    if (guest.responded_at && (guest.status === "confirmed" || guest.status === "declined")) {
      return NextResponse.json({
        guest: {
          id: guest.id,
          name: guest.name,
          status: guest.status,
          respondedAt: guest.responded_at,
        },
        event: publicEvent,
        alreadyResponded: true,
      })
    }

    const deadlineStr = guest.confirmation_deadline || guest.token_expires_at || rawEvent.rsvp_deadline
    if (deadlineStr && new Date(deadlineStr) < new Date()) {
      await supabaseAdmin
        .from("guests")
        .update({ status: "expired" })
        .eq("id", guest.id)

      return NextResponse.json({
        guest: {
          id: guest.id,
          name: guest.name,
          status: "expired",
        },
        event: publicEvent,
        expired: true,
      })
    }

    const { data: companions } = await supabaseAdmin
      .from("guest_companions")
      .select("id, name, status")
      .eq("guest_id", guest.id)

    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        status: guest.status,
        confirmationDeadline: guest.confirmation_deadline || rawEvent.rsvp_deadline,
        dietaryRestrictions: guest.dietary_restrictions,
        accessibilityNeeds: guest.accessibility_needs,
      },
      event: publicEvent,
      companions: (companions || []).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      })),
      alreadyResponded: false,
      expired: false,
    })
  } catch (error) {
    console.error("Erro ao buscar convite:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

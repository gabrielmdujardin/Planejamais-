import { buildPublicEventPayload, isUuid } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    if (!isUuid(eventId)) {
      return NextResponse.json({ error: "Identificador de evento inválido" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // RN-007 & RN-008: Apenas eventos com link público ativo (ou visibilidade pública) expõem dados externos,
    // e jamais expõem convidados, gastos, análises ou URL de reunião privada antes da confirmação.
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select(
        "id, title, type, date, time, start_date, start_time, end_date, end_time, location, address, maps_url, event_mode, description, invitation_message, public_invite_enabled, visibility, allow_companions, max_companions, rsvp_enabled, rsvp_deadline"
      )
      .eq("id", eventId)
      .maybeSingle()

    if (error || !event || (!event.public_invite_enabled && event.visibility !== "public")) {
      return NextResponse.json(
        { error: "Convite público não encontrado ou desativado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      event: buildPublicEventPayload(event),
    })
  } catch (error) {
    console.error("Erro ao buscar evento público:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

import { buildIcsCalendar, isSafeToken } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isSafeToken(token)) {
      return NextResponse.json({ error: "Calendário indisponível" }, { status: 400 })
    }

    const cleanToken = token.trim()
    const supabase = createAdminClient()

    const { data: guest, error } = await supabase
      .from("guests")
      .select(
        `
        id,
        status,
        events (
          id,
          title,
          date,
          time,
          start_date,
          start_time,
          end_date,
          end_time,
          location,
          description
        )
      `
      )
      .or(`token.eq.${cleanToken},confirmation_token.eq.${cleanToken}`)
      .maybeSingle()

    const event = Array.isArray(guest?.events) ? guest?.events[0] : guest?.events
    if (error || !guest || !event || guest.status !== "confirmed") {
      return NextResponse.json({ error: "Calendário indisponível" }, { status: 404 })
    }

    const ics = buildIcsCalendar([event], event.title || "Convite Planeja+")

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="planeja-${event.id}.ics"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar ICS do convite:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

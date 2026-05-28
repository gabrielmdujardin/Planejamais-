import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

function escapeICS(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function parseEventDate(date: string, time?: string | null) {
  const parsed = new Date(`${date}T${time || "00:00"}:00`)
  if (!Number.isNaN(parsed.getTime())) return parsed

  const fallback = new Date(date)
  if (!Number.isNaN(fallback.getTime())) return fallback

  return new Date()
}

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
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
          location,
          description
        )
      `
      )
      .or(`token.eq.${token},confirmation_token.eq.${token}`)
      .single()

    if (error || !guest || !guest.events || guest.status !== "confirmed") {
      return NextResponse.json({ error: "Calendário indisponível" }, { status: 404 })
    }

    const event = Array.isArray(guest.events) ? guest.events[0] : guest.events
    if (!event) {
      return NextResponse.json({ error: "Calendário indisponível" }, { status: 404 })
    }
    const start = parseEventDate(event.date, event.time)
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Planeja+//Invite//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.id}-${guest.id}@planeja.plus`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description || "")}`,
      `LOCATION:${escapeICS(event.location || "")}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")

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

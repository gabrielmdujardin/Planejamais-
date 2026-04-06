import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    // Verify user exists
    const { data: user } = await supabase.from("users").select("email").eq("id", userId).single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user events
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .gte("date", new Date().toISOString().split("T")[0])

    if (!events || events.length === 0) {
      return new NextResponse(generateEmptyICS(user.email), {
        headers: {
          "Content-Type": "text/calendar",
          "Content-Disposition": 'attachment; filename="planeja-calendar.ics"',
        },
      })
    }

    const icsContent = generateICSContent(events, user.email)

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": 'attachment; filename="planeja-calendar.ics"',
      },
    })
  } catch (error) {
    console.error("ICS generation failed:", error)

    return NextResponse.json(
      {
        error: "Failed to generate calendar",
      },
      { status: 500 }
    )
  }
}

function generateEmptyICS(userEmail: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Planeja+//Calendar//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "END:VCALENDAR",
  ].join("\r\n")
}

function generateICSContent(events: any[], userEmail: string): string {
  const icsHeader = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Planeja+//Calendar//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n")

  const icsFooter = "END:VCALENDAR"

  const icsEvents = events
    .map((event) => {
      const startDate = new Date(`${event.date}T${event.time}:00`)
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration

      return [
        "BEGIN:VEVENT",
        `UID:${event.id}@planeja.app`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ""}`,
        `LOCATION:${event.location || ""}`,
        `ORGANIZER:mailto:${userEmail}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ].join("\r\n")
    })
    .join("\r\n")

  return [icsHeader, icsEvents, icsFooter].join("\r\n")
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

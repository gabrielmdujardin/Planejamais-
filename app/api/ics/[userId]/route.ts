import { buildIcsCalendar, isSafeToken, isUuid } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    if (!isUuid(userId)) {
      return NextResponse.json({ error: "Identificador de usuário inválido" }, { status: 400 })
    }

    const feedToken = request.nextUrl.searchParams.get("token")
    const eventIdFilter = request.nextUrl.searchParams.get("eventId")

    // RN-007 & RNF-005: Exige sessão autenticada do próprio titular OU token privado do feed de calendário
    const sessionClient = await createClient()
    const {
      data: { user: authUser },
    } = await sessionClient.auth.getUser()

    const admin = createAdminClient()
    const { data: userRecord } = await admin
      .from("users")
      .select("id, email, calendar_feed_token")
      .eq("id", userId)
      .maybeSingle()

    if (!userRecord) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const isOwnerSession = Boolean(authUser && authUser.id === userId)
    const isValidFeedToken = Boolean(
      feedToken &&
        isSafeToken(feedToken) &&
        (userRecord as any).calendar_feed_token &&
        feedToken === (userRecord as any).calendar_feed_token
    )

    if (!isOwnerSession && !isValidFeedToken) {
      return NextResponse.json({ error: "Acesso não autorizado ao calendário" }, { status: 401 })
    }

    let eventsQuery = admin.from("events").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    if (eventIdFilter && isUuid(eventIdFilter)) {
      eventsQuery = eventsQuery.eq("id", eventIdFilter)
    }

    const { data: events } = await eventsQuery
    const icsContent = buildIcsCalendar(events || [], `Planeja+ (${userRecord.email})`)

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="planeja-calendar.ics"',
      },
    })
  } catch (error) {
    console.error("ICS generation failed:", error)
    return NextResponse.json({ error: "Falha ao gerar arquivo ICS" }, { status: 500 })
  }
}

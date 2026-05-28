import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EmailService } from "@/src/services/email.service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { eventId } = await request.json()
    const { guestId } = await params

    if (!eventId) {
      return NextResponse.json({ error: "Evento obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("user_id", user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guestId)
      .eq("event_id", eventId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    let confirmationToken = guest.token || guest.confirmation_token
    if (!confirmationToken) {
      confirmationToken = crypto.randomUUID()
    }

    const deadline = event.rsvp_deadline
      ? new Date(event.rsvp_deadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { error: updateError } = await supabase
      .from("guests")
      .update({
        token: confirmationToken,
        confirmation_token: confirmationToken,
        confirmation_deadline: deadline.toISOString(),
        status: "pending",
      })
      .eq("id", guestId)
      .eq("event_id", eventId)

    if (updateError) throw updateError

    const eventDate = new Date(event.date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const confirmationDeadlineFormatted = deadline.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const result = await EmailService.sendApprovalEmail({
      to: guest.email,
      guestName: guest.name,
      eventTitle: event.title,
      eventDate,
      eventTime: event.time || "A definir",
      eventLocation: event.location || "A definir",
      confirmationToken,
      confirmationDeadline: confirmationDeadlineFormatted,
      approvedCompanions: [],
      rejectedCompanions: [],
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Erro ao enviar email" }, { status: 500 })
    }

    await supabase
      .from("guests")
      .update({ invite_sent_at: new Date().toISOString(), sent_at: new Date().toISOString() })
      .eq("id", guestId)
      .eq("event_id", eventId)

    return NextResponse.json({ success: true, token: confirmationToken })
  } catch (error) {
    console.error("Erro ao enviar convite:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

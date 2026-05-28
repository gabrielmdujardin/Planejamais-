import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EmailService } from "@/src/services/email.service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { guestIds } = await request.json()
    const { eventId } = await params

    if (!Array.isArray(guestIds) || guestIds.length === 0) {
      return NextResponse.json({ error: "Informe ao menos um convidado" }, { status: 400 })
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

    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .in("id", guestIds)
      .eq("event_id", eventId)

    if (guestsError || !guests || guests.length === 0) {
      return NextResponse.json({ error: "Convidados não encontrados" }, { status: 404 })
    }

    const eventDate = new Date(event.date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const confirmationDeadline = event.rsvp_deadline ? new Date(event.rsvp_deadline) : new Date()
    if (!event.rsvp_deadline) {
      confirmationDeadline.setDate(confirmationDeadline.getDate() + 7)
    }

    const confirmationDeadlineFormatted = confirmationDeadline.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const guest of guests) {
      try {
        let confirmationToken = guest.token || guest.confirmation_token

        if (!confirmationToken) {
          confirmationToken = crypto.randomUUID()
        }

        const { error: tokenError } = await supabase
          .from("guests")
          .update({
            token: confirmationToken,
            confirmation_token: confirmationToken,
            confirmation_deadline: confirmationDeadline.toISOString(),
            status: "pending",
          })
          .eq("id", guest.id)
          .eq("event_id", eventId)

        if (tokenError) throw tokenError

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

        if (result.success) {
          results.success++
          await supabase
            .from("guests")
            .update({ invite_sent_at: new Date().toISOString(), sent_at: new Date().toISOString() })
            .eq("id", guest.id)
            .eq("event_id", eventId)
        } else {
          results.failed++
          results.errors.push(`${guest.name}: ${result.error}`)
        }
      } catch {
        results.failed++
        results.errors.push(`${guest.name}: Erro ao processar`)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Erro ao enviar convites:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

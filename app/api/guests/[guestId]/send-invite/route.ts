import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EmailService } from "@/src/services/email.service"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: NextRequest,
  { params }: { params: { guestId: string } }
) {
  try {
    const { eventId } = await request.json()
    const guestId = params.guestId

    const supabase = await createClient()

    // Buscar informações do convidado
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        { error: "Convidado não encontrado" },
        { status: 404 }
      )
    }

    // Buscar informações do evento
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      )
    }

    // Gerar token de confirmação se não existir
    let confirmationToken = guest.confirmation_token
    if (!confirmationToken) {
      confirmationToken = uuidv4()
      
      // Calcular prazo de confirmação (7 dias)
      const confirmationDeadline = new Date()
      confirmationDeadline.setDate(confirmationDeadline.getDate() + 7)

      await supabase
        .from("guests")
        .update({
          confirmation_token: confirmationToken,
          confirmation_deadline: confirmationDeadline.toISOString(),
          status: "pending",
        })
        .eq("id", guestId)
    }

    // Formatar data do evento
    const eventDate = new Date(event.date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    // Calcular prazo formatado
    const deadline = guest.confirmation_deadline 
      ? new Date(guest.confirmation_deadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    const confirmationDeadlineFormatted = deadline.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    // Enviar email
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
      return NextResponse.json(
        { error: result.error || "Erro ao enviar email" },
        { status: 500 }
      )
    }

    // Atualizar data do último envio
    await supabase
      .from("guests")
      .update({ invite_sent_at: new Date().toISOString() })
      .eq("id", guestId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar convite:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

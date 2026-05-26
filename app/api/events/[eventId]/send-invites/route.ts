import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EmailService } from "@/src/services/email.service"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { guestIds } = await request.json()
    const eventId = params.eventId

    const supabase = await createClient()

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

    // Buscar convidados
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .in("id", guestIds)

    if (guestsError || !guests || guests.length === 0) {
      return NextResponse.json(
        { error: "Convidados não encontrados" },
        { status: 404 }
      )
    }

    // Formatar data do evento
    const eventDate = new Date(event.date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    // Calcular prazo de confirmação (7 dias)
    const confirmationDeadline = new Date()
    confirmationDeadline.setDate(confirmationDeadline.getDate() + 7)
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

    // Enviar emails para cada convidado
    for (const guest of guests) {
      try {
        // Gerar token de confirmação se não existir
        let confirmationToken = guest.confirmation_token
        if (!confirmationToken) {
          confirmationToken = uuidv4()

          await supabase
            .from("guests")
            .update({
              confirmation_token: confirmationToken,
              confirmation_deadline: confirmationDeadline.toISOString(),
              status: "pending",
            })
            .eq("id", guest.id)
        }

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

        if (result.success) {
          results.success++
          
          // Atualizar data do último envio
          await supabase
            .from("guests")
            .update({ invite_sent_at: new Date().toISOString() })
            .eq("id", guest.id)
        } else {
          results.failed++
          results.errors.push(`${guest.name}: ${result.error}`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`${guest.name}: Erro ao processar`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Erro ao enviar convites:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EmailService } from "@/src/services/email.service"

interface GuestInput {
  name: string
  email: string
  phone?: string
  contactId?: string
}

function formatEventDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { guests, sendEmail = true } = await request.json()

    if (!Array.isArray(guests) || guests.length === 0) {
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
      return NextResponse.json(
        { error: "Evento não encontrado no Supabase para este usuário" },
        { status: 404 }
      )
    }

    const deadline = event.rsvp_deadline
      ? new Date(event.rsvp_deadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const rows = (guests as GuestInput[]).map((guest) => {
      const token = crypto.randomUUID()

      return {
        event_id: eventId,
        name: guest.name.trim(),
        email: guest.email.trim().toLowerCase(),
        phone: guest.phone?.trim() || "",
        contact_id: guest.contactId || null,
        status: "pending",
        source: "manual",
        token,
        confirmation_token: token,
        confirmation_deadline: deadline.toISOString(),
      }
    })

    const { data: insertedGuests, error: insertError } = await supabase
      .from("guests")
      .insert(rows)
      .select()

    if (insertError || !insertedGuests) {
      return NextResponse.json(
        { error: insertError?.message || "Erro ao cadastrar convidados" },
        { status: 500 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    if (sendEmail) {
      for (const guest of insertedGuests) {
        const result = await EmailService.sendApprovalEmail({
          to: guest.email,
          guestName: guest.name,
          eventTitle: event.title,
          eventDate: formatEventDate(event.date),
          eventTime: event.time || "A definir",
          eventLocation: event.location || "A definir",
          confirmationToken: guest.token || guest.confirmation_token,
          confirmationDeadline: deadline.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          approvedCompanions: [],
          rejectedCompanions: [],
        })

        if (result.success) {
          results.success++
          await supabase
            .from("guests")
            .update({ invite_sent_at: new Date().toISOString(), sent_at: new Date().toISOString() })
            .eq("id", guest.id)
        } else {
          results.failed++
          results.errors.push(`${guest.name}: ${result.error}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      guests: insertedGuests,
      email: results,
      sms: {
        sent: 0,
        message: "SMS ainda não possui provedor configurado neste projeto.",
      },
    })
  } catch (error) {
    console.error("Erro ao adicionar convidados:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

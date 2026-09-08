import { createAdminClient } from "@/lib/supabase/admin"
import { publicRsvpSchema } from "@/lib/validation"
import { NextRequest, NextResponse } from "next/server"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json({ error: "Token de convite inválido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Seleção estrita apenas de colunas públicas do evento
    const { data: event, error } = await supabase
      .from("events")
      .select(
        "id, title, date, time, start_date, start_time, end_date, end_time, location, address, maps_url, event_mode, meeting_url, description, public_invite_enabled, rsvp_deadline, allow_companions, max_companions, auto_approve_public_guests, rsvp_enabled, invitation_message"
      )
      .eq("public_invite_token", token.trim())
      .single()

    if (error || !event || !event.public_invite_enabled) {
      return NextResponse.json({ error: "Convite público não encontrado ou desativado" }, { status: 404 })
    }

    const expired = event.rsvp_deadline ? new Date(event.rsvp_deadline) < new Date() : false

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        startDate: event.start_date,
        startTime: event.start_time,
        endDate: event.end_date,
        endTime: event.end_time,
        location: event.location,
        address: event.address,
        mapsUrl: event.maps_url,
        eventMode: event.event_mode,
        meetingUrl: event.meeting_url,
        description: event.description,
        rsvpDeadline: event.rsvp_deadline,
        rsvpEnabled: event.rsvp_enabled,
        invitationMessage: event.invitation_message,
        allowCompanions: event.allow_companions,
        maxCompanions: event.max_companions,
        autoApprovePublicGuests: event.auto_approve_public_guests,
      },
      expired,
    })
  } catch (error) {
    console.error("[Security Error] Erro ao buscar convite público:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json({ error: "Token de convite inválido" }, { status: 400 })
    }

    // 1. Validação estrita do payload usando Zod
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 })
    }

    const validation = publicRsvpSchema.safeParse(rawBody)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Dados enviados inválidos"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const {
      name,
      email,
      phone,
      notes,
      dietaryRestrictions,
      accessibilityNeeds,
      companions,
      attendanceStatus,
    } = validation.data

    const supabase = createAdminClient()

    // 2. Consulta do evento associado ao token público
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, public_invite_enabled, rsvp_deadline, allow_companions, max_companions, auto_approve_public_guests, rsvp_enabled"
      )
      .eq("public_invite_token", token.trim())
      .single()

    if (eventError || !event || !event.public_invite_enabled) {
      return NextResponse.json({ error: "Convite público não encontrado ou desativado" }, { status: 404 })
    }

    // Check se confirmações RSVP estão ativas para este evento
    if (event.rsvp_enabled === false) {
      return NextResponse.json({ error: "As confirmações de presença para este evento estão desativadas" }, { status: 400 })
    }

    // 3. Validação de prazo expirado
    if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
      return NextResponse.json({ error: "O prazo para confirmação de presença expirou" }, { status: 400 })
    }

    // 4. Validação de acompanhantes e remoção de duplicados na mesma submissão
    const willAttend = attendanceStatus !== "declined"
    const uniqueCompanionsMap = new Map<string, typeof companions[0]>()
    if (willAttend && Array.isArray(companions)) {
      companions.forEach((c) => {
        const key = c.name.trim().toLowerCase()
        if (!uniqueCompanionsMap.has(key)) {
          uniqueCompanionsMap.set(key, c)
        }
      })
    }
    const requestedCompanions = Array.from(uniqueCompanionsMap.values())

    if (!event.allow_companions && requestedCompanions.length > 0) {
      return NextResponse.json({ error: "Este evento não permite acompanhantes" }, { status: 400 })
    }

    if (requestedCompanions.length > (event.max_companions || 0)) {
      return NextResponse.json(
        { error: `Este evento permite no máximo ${event.max_companions || 0} acompanhante(s)` },
        { status: 400 }
      )
    }

    // 5. Prevenção de duplicidade por e-mail no mesmo evento
    const normalizedEmail = normalizeEmail(email)
    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("event_id", event.id)
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existingGuest) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado para este evento" },
        { status: 409 }
      )
    }

    // 6. Inserção controlada do convidado com atribuição estrita de colunas
    const now = new Date().toISOString()
    const autoApproved = Boolean(event.auto_approve_public_guests)
    const guestStatus = willAttend ? (autoApproved ? "confirmed" : "awaiting_approval") : "declined"
    const guestToken = guestStatus === "confirmed" ? crypto.randomUUID() : null

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        event_id: event.id,
        name,
        email: normalizedEmail,
        phone,
        status: guestStatus,
        source: "public_invite",
        notes: notes || null,
        dietary_restrictions: dietaryRestrictions || null,
        accessibility_needs: accessibilityNeeds || null,
        requested_companions_count: requestedCompanions.length,
        requested_at: now,
        responded_at: now,
        confirmed_at: guestStatus === "confirmed" ? now : null,
        declined_at: guestStatus === "declined" ? now : null,
        token: guestToken,
        confirmation_token: guestToken,
      })
      .select("id, status")
      .single()

    if (guestError || !guest) {
      console.error("[Security Error] Erro ao criar convidado público:", guestError)
      return NextResponse.json({ error: "Erro ao registrar confirmação" }, { status: 500 })
    }

    // 7. Inserção controlada dos acompanhantes (se aplicável)
    if (requestedCompanions.length > 0) {
      const companionStatus = autoApproved ? "approved" : "awaiting_approval"
      const companionsToInsert = requestedCompanions.map((companion) => ({
        guest_id: guest.id,
        name: companion.name,
        email: companion.email ? normalizeEmail(companion.email) : null,
        phone: companion.phone || null,
        notes: companion.notes || null,
        status: companionStatus,
        approved_at: autoApproved ? now : null,
      }))

      const { error: companionsError } = await supabase
        .from("guest_companions")
        .insert(companionsToInsert)

      if (companionsError) {
        console.error("[Security Error] Erro ao criar acompanhantes:", companionsError)
      }
    }

    return NextResponse.json({
      success: true,
      status: guest.status,
      guestId: guest.id,
      message:
        guest.status === "declined"
          ? "Resposta registrada. Obrigado por avisar."
          : autoApproved
            ? "Presença confirmada com sucesso."
            : "Solicitação enviada com sucesso. Aguarde aprovação do organizador.",
    })
  } catch (error) {
    console.error("[Security Error] Erro na solicitação pública:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

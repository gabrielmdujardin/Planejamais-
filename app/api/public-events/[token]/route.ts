import { buildPublicEventPayload, generateSecureToken, isSafeToken } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { publicRsvpSchema } from "@/lib/validation"
import { NextRequest, NextResponse } from "next/server"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!isSafeToken(token)) {
      return NextResponse.json({ error: "Token de convite inválido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // RN-007: Seleção estrita apenas de colunas públicas do evento (sem meeting_url privado, sem convidados e sem custos)
    const { data: event, error } = await supabase
      .from("events")
      .select(
        "id, title, type, date, time, start_date, start_time, end_date, end_time, location, address, maps_url, event_mode, description, public_invite_enabled, rsvp_deadline, allow_companions, max_companions, auto_approve_public_guests, rsvp_enabled, invitation_message"
      )
      .eq("public_invite_token", token.trim())
      .maybeSingle()

    if (error || !event || !event.public_invite_enabled) {
      return NextResponse.json(
        { error: "Este convite não é mais válido ou foi desativado" },
        { status: 404 }
      )
    }

    const expired = event.rsvp_deadline ? new Date(event.rsvp_deadline) < new Date() : false
    const publicPayload = buildPublicEventPayload(event)

    return NextResponse.json({
      event: {
        ...publicPayload,
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

    if (!isSafeToken(token)) {
      return NextResponse.json({ error: "Token de convite inválido" }, { status: 400 })
    }

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

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, public_invite_enabled, rsvp_deadline, allow_companions, max_companions, auto_approve_public_guests, companions_require_approval, rsvp_enabled"
      )
      .eq("public_invite_token", token.trim())
      .maybeSingle()

    if (eventError || !event || !event.public_invite_enabled) {
      return NextResponse.json(
        { error: "Este convite não é mais válido ou foi desativado" },
        { status: 404 }
      )
    }

    if (event.rsvp_enabled === false) {
      return NextResponse.json(
        { error: "As confirmações de presença para este evento estão desativadas" },
        { status: 400 }
      )
    }

    if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
      return NextResponse.json({ error: "O prazo para confirmação de presença expirou" }, { status: 400 })
    }

    const willAttend = attendanceStatus !== "declined"
    const uniqueCompanionsMap = new Map<string, (typeof companions)[0]>()
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

    const now = new Date().toISOString()
    const autoApproved = Boolean(event.auto_approve_public_guests)
    const guestStatus = willAttend ? (autoApproved ? "confirmed" : "awaiting_approval") : "declined"
    const guestToken = guestStatus === "confirmed" ? generateSecureToken(16) : null

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

    // RN-009: Acompanhantes permanecem pendentes de aprovação do organizador quando exigido
    if (requestedCompanions.length > 0) {
      const companionAutoApproved = autoApproved && !event.companions_require_approval
      const companionStatus = companionAutoApproved ? "approved" : "awaiting_approval"
      const companionsToInsert = requestedCompanions.map((companion) => ({
        guest_id: guest.id,
        name: companion.name,
        email: companion.email ? normalizeEmail(companion.email) : null,
        phone: companion.phone || null,
        notes: companion.notes || null,
        status: companionStatus,
        approved_at: companionAutoApproved ? now : null,
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

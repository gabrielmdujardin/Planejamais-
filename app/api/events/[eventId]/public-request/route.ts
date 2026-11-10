import { generateSecureToken, isUuid } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { publicRsvpSchema } from "@/lib/validation"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    if (!isUuid(eventId)) {
      return NextResponse.json({ error: "Identificador de evento inválido" }, { status: 400 })
    }

    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 })
    }

    // RNF-006: Validação estrita Zod no servidor
    const parsed = publicRsvpSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados da solicitação inválidos" },
        { status: 400 }
      )
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
    } = parsed.data

    const supabaseAdmin = createAdminClient()

    // RN-008: Somente eventos com link público ativo aceitam solicitações de participação
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select(
        "id, title, public_invite_enabled, visibility, rsvp_enabled, rsvp_deadline, allow_companions, max_companions, auto_approve_public_guests, companions_require_approval"
      )
      .eq("id", eventId)
      .maybeSingle()

    if (eventError || !event || (!event.public_invite_enabled && event.visibility !== "public")) {
      return NextResponse.json(
        { error: "Este evento não aceita solicitações públicas no momento" },
        { status: 403 }
      )
    }

    if (event.rsvp_enabled === false) {
      return NextResponse.json(
        { error: "As confirmações e solicitações para este evento estão encerradas" },
        { status: 400 }
      )
    }

    if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
      return NextResponse.json(
        { error: "O prazo para envio de solicitações expirou" },
        { status: 400 }
      )
    }

    const willAttend = attendanceStatus !== "declined"
    const requestedCompanions = willAttend && Array.isArray(companions) ? companions : []

    if (!event.allow_companions && requestedCompanions.length > 0) {
      return NextResponse.json(
        { error: "Este evento não permite acompanhantes" },
        { status: 400 }
      )
    }

    if (requestedCompanions.length > (event.max_companions ?? 0)) {
      return NextResponse.json(
        { error: `Este evento permite no máximo ${event.max_companions ?? 0} acompanhante(s)` },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const { data: existingGuest } = await supabaseAdmin
      .from("guests")
      .select("id")
      .eq("event_id", eventId)
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

    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .insert({
        event_id: eventId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        status: guestStatus,
        source: "public_request",
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
      .select()
      .single()

    if (guestError || !guest) {
      console.error("Erro ao criar convidado:", guestError)
      return NextResponse.json(
        { error: "Erro ao criar solicitação" },
        { status: 500 }
      )
    }

    // RN-009: Acompanhantes ficam aguardando aprovação do organizador (exceto se auto-aprovação integral sem moderação de acompanhantes)
    if (requestedCompanions.length > 0) {
      const companionAutoApprove = autoApproved && !event.companions_require_approval
      const companionsToInsert = requestedCompanions.map((c) => ({
        guest_id: guest.id,
        name: c.name.trim(),
        email: c.email ? c.email.trim().toLowerCase() : null,
        phone: c.phone ? c.phone.trim() : null,
        notes: c.notes || null,
        status: companionAutoApprove ? "approved" : "awaiting_approval",
        approved_at: companionAutoApprove ? now : null,
      }))

      await supabaseAdmin.from("guest_companions").insert(companionsToInsert)
    }

    return NextResponse.json({
      success: true,
      status: guest.status,
      message: !willAttend
        ? "Resposta registrada. Obrigado por avisar."
        : autoApproved
          ? "Participação confirmada automaticamente!"
          : "Solicitação enviada com sucesso! Aguarde a aprovação do organizador.",
      guestId: guest.id,
    })
  } catch (error) {
    console.error("Erro na solicitação pública:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

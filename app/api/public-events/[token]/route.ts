import { createAdminClient } from "@/lib/supabase/admin"
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
    const supabase = createAdminClient()

    const { data: event, error } = await supabase
      .from("events")
      .select(
        "id, title, date, time, location, description, public_invite_enabled, rsvp_deadline, allow_companions, max_companions, auto_approve_public_guests"
      )
      .eq("public_invite_token", token)
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
        location: event.location,
        description: event.description,
        rsvpDeadline: event.rsvp_deadline,
        allowCompanions: event.allow_companions,
        maxCompanions: event.max_companions,
        autoApprovePublicGuests: event.auto_approve_public_guests,
      },
      expired,
    })
  } catch (error) {
    console.error("Erro ao buscar convite público:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    const {
      name,
      email,
      phone,
      notes,
      dietaryRestrictions,
      accessibilityNeeds,
      companions = [],
      attendanceStatus = "confirmed",
    } = body

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Nome, email e telefone são obrigatórios" }, { status: 400 })
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, public_invite_enabled, rsvp_deadline, allow_companions, max_companions, auto_approve_public_guests"
      )
      .eq("public_invite_token", token)
      .single()

    if (eventError || !event || !event.public_invite_enabled) {
      return NextResponse.json({ error: "Convite público não encontrado ou desativado" }, { status: 404 })
    }

    if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
      return NextResponse.json({ error: "O prazo para confirmação expirou" }, { status: 400 })
    }

    const willAttend = attendanceStatus !== "declined"
    const requestedCompanions = willAttend && Array.isArray(companions)
      ? companions.filter((companion) => companion?.name?.trim())
      : []

    if (!event.allow_companions && requestedCompanions.length > 0) {
      return NextResponse.json({ error: "Este evento não permite acompanhantes" }, { status: 400 })
    }

    if (requestedCompanions.length > event.max_companions) {
      return NextResponse.json(
        { error: `Este evento permite no máximo ${event.max_companions} acompanhante(s)` },
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
        { error: "Este email já está cadastrado para este evento" },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const autoApproved = Boolean(event.auto_approve_public_guests)
    const guestStatus = willAttend ? (autoApproved ? "confirmed" : "awaiting_approval") : "declined"
    const guestToken = guestStatus === "confirmed" ? crypto.randomUUID() : null

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        event_id: event.id,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        status: guestStatus,
        source: "public_invite",
        notes,
        dietary_restrictions: dietaryRestrictions,
        accessibility_needs: accessibilityNeeds,
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
      console.error("Erro ao criar convidado público:", guestError)
      return NextResponse.json({ error: "Erro ao criar solicitação" }, { status: 500 })
    }

    if (requestedCompanions.length > 0) {
      const companionStatus = autoApproved ? "approved" : "awaiting_approval"
      const companionsToInsert = requestedCompanions.map(
        (companion: { name: string; email?: string; phone?: string; notes?: string }) => ({
          guest_id: guest.id,
          name: companion.name.trim(),
          email: companion.email?.trim() || null,
          phone: companion.phone?.trim() || null,
          notes: companion.notes?.trim() || null,
          status: companionStatus,
          approved_at: autoApproved ? now : null,
        })
      )

      const { error: companionsError } = await supabase
        .from("guest_companions")
        .insert(companionsToInsert)

      if (companionsError) {
        console.error("Erro ao criar acompanhantes:", companionsError)
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
    console.error("Erro na solicitação pública:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

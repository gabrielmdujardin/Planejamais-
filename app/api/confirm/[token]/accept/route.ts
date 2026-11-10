import { isSafeToken } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { confirmInviteAcceptSchema } from "@/lib/validation"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isSafeToken(token)) {
      return NextResponse.json({ error: "Convite inválido" }, { status: 400 })
    }

    const rawBody = await request.json().catch(() => ({}))
    const parsed = confirmInviteAcceptSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados de confirmação inválidos" },
        { status: 400 }
      )
    }

    const { notes, dietaryRestrictions, accessibilityNeeds, companions } = parsed.data
    const cleanToken = token.trim()
    const supabaseAdmin = createAdminClient()

    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select(
        `
        id,
        status,
        responded_at,
        confirmation_deadline,
        token_expires_at,
        events (
          id,
          allow_companions,
          max_companions,
          rsvp_enabled,
          rsvp_deadline
        )
      `
      )
      .or(`token.eq.${cleanToken},confirmation_token.eq.${cleanToken}`)
      .maybeSingle()

    const event = Array.isArray(guest?.events) ? guest?.events[0] : guest?.events
    if (guestError || !guest || !event) {
      return NextResponse.json(
        { error: "Este convite não é mais válido" },
        { status: 404 }
      )
    }

    if (event.rsvp_enabled === false) {
      return NextResponse.json(
        { error: "As confirmações de presença para este evento foram encerradas" },
        { status: 400 }
      )
    }

    if (guest.responded_at && (guest.status === "confirmed" || guest.status === "declined")) {
      return NextResponse.json(
        { error: "Você já respondeu a este convite" },
        { status: 400 }
      )
    }

    const deadlineStr = guest.confirmation_deadline || guest.token_expires_at || event.rsvp_deadline
    if (deadlineStr && new Date(deadlineStr) < new Date()) {
      await supabaseAdmin
        .from("guests")
        .update({ status: "expired" })
        .eq("id", guest.id)

      return NextResponse.json(
        { error: "O prazo para confirmação expirou" },
        { status: 400 }
      )
    }

    if (!event.allow_companions && companions.length > 0) {
      return NextResponse.json(
        { error: "Este evento não permite acompanhantes" },
        { status: 400 }
      )
    }

    if (companions.length > (event.max_companions ?? 0)) {
      return NextResponse.json(
        { error: `Este evento permite no máximo ${event.max_companions ?? 0} acompanhante(s)` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const updatePayload: Record<string, any> = {
      status: "confirmed",
      responded_at: now,
      confirmed_at: now,
    }
    if (notes !== undefined && notes !== "") updatePayload.notes = notes
    if (dietaryRestrictions !== undefined && dietaryRestrictions !== "") {
      updatePayload.dietary_restrictions = dietaryRestrictions
    }
    if (accessibilityNeeds !== undefined && accessibilityNeeds !== "") {
      updatePayload.accessibility_needs = accessibilityNeeds
    }
    if (companions.length > 0) {
      updatePayload.requested_companions_count = companions.length
    }

    const { error: updateError } = await supabaseAdmin
      .from("guests")
      .update(updatePayload)
      .eq("id", guest.id)

    if (updateError) throw updateError

    // RN-009: Acompanhantes indicados pelo convidado ao confirmar presença ficam pendentes até aprovação do organizador
    if (companions.length > 0) {
      await supabaseAdmin.from("guest_companions").insert(
        companions.map((comp) => ({
          guest_id: guest.id,
          name: comp.name.trim(),
          email: comp.email ? comp.email.trim().toLowerCase() : null,
          phone: comp.phone ? comp.phone.trim() : null,
          notes: comp.notes || null,
          status: "awaiting_approval" as const,
        }))
      )
    }

    return NextResponse.json({
      success: true,
      message:
        companions.length > 0
          ? "Presença confirmada! Seus acompanhantes foram enviados para aprovação do organizador."
          : "Presença confirmada com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao confirmar presença:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

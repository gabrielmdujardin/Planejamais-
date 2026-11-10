import { isSafeToken } from "@/lib/domain/business-rules"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!isSafeToken(token)) {
      return NextResponse.json({ error: "Convite inválido" }, { status: 400 })
    }

    const cleanToken = token.trim()
    const supabaseAdmin = createAdminClient()

    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select("id, status, responded_at, confirmation_deadline, token_expires_at, events(id, rsvp_deadline)")
      .or(`token.eq.${cleanToken},confirmation_token.eq.${cleanToken}`)
      .maybeSingle()

    const event = Array.isArray(guest?.events) ? guest?.events[0] : guest?.events
    if (guestError || !guest || !event) {
      return NextResponse.json({ error: "Este convite não é mais válido" }, { status: 404 })
    }

    if (guest.responded_at && (guest.status === "confirmed" || guest.status === "declined")) {
      return NextResponse.json({ error: "Você já respondeu a este convite" }, { status: 400 })
    }

    const deadlineStr = guest.confirmation_deadline || guest.token_expires_at || event.rsvp_deadline
    if (deadlineStr && new Date(deadlineStr) < new Date()) {
      await supabaseAdmin.from("guests").update({ status: "expired" }).eq("id", guest.id)
      return NextResponse.json({ error: "O prazo para confirmação expirou" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from("guests")
      .update({
        status: "declined",
        responded_at: now,
        declined_at: now,
      })
      .eq("id", guest.id)

    if (updateError) throw updateError

    await supabaseAdmin
      .from("guest_companions")
      .update({ status: "cancelled" })
      .eq("guest_id", guest.id)

    return NextResponse.json({
      success: true,
      message: "Resposta registrada. Sentiremos sua falta!",
    })
  } catch (error) {
    console.error("Erro ao recusar presença:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

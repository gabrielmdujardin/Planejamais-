import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabaseAdmin = createAdminClient()
    const { token } = await params

    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select("id, status, responded_at, confirmation_deadline")
      .or(`token.eq.${token},confirmation_token.eq.${token}`)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convite não encontrado ou inválido" }, { status: 404 })
    }

    if (guest.responded_at) {
      return NextResponse.json({ error: "Você já respondeu a este convite" }, { status: 400 })
    }

    if (guest.confirmation_deadline && new Date(guest.confirmation_deadline) < new Date()) {
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
      .eq("status", "approved")

    return NextResponse.json({
      success: true,
      message: "Resposta registrada. Sentiremos sua falta!",
    })
  } catch (error) {
    console.error("Erro ao recusar presença:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

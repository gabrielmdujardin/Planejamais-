import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params
    const body = await request.json()
    const { approvedCompanionIds = [], rejectedCompanionIds = [] } = body

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select(
        `
        *,
        events (
          id,
          user_id
        )
      `
      )
      .eq("id", guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    if (guest.events?.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const now = new Date().toISOString()
    const token = guest.token || guest.confirmation_token || crypto.randomUUID()

    const { error: updateError } = await supabase
      .from("guests")
      .update({
        status: "confirmed",
        token,
        confirmation_token: token,
        responded_at: guest.responded_at || now,
        confirmed_at: guest.confirmed_at || now,
        approved_at: now,
        approved_by: user.id,
      })
      .eq("id", guestId)

    if (updateError) throw updateError

    if (approvedCompanionIds.length > 0) {
      await supabase
        .from("guest_companions")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: now,
        })
        .in("id", approvedCompanionIds)
    }

    if (rejectedCompanionIds.length > 0) {
      await supabase
        .from("guest_companions")
        .update({
          status: "rejected",
          rejected_at: now,
        })
        .in("id", rejectedCompanionIds)
    }

    return NextResponse.json({
      success: true,
      message: "Convidado aprovado e confirmado com sucesso",
      token,
    })
  } catch (error) {
    console.error("Erro ao aprovar convidado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  try {
    const { companionId } = await params
    const body = await request.json()
    const { reason } = body

    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se o acompanhante pertence a um evento do usuário
    const { data: companion, error: companionError } = await supabase
      .from("guest_companions")
      .select(
        `
        *,
        guests!inner (
          id,
          events!inner (
            user_id
          )
        )
      `
      )
      .eq("id", companionId)
      .single()

    if (companionError || !companion) {
      return NextResponse.json({ error: "Acompanhante não encontrado" }, { status: 404 })
    }

    if (companion.guests?.events?.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Rejeitar o acompanhante
    const { error: updateError } = await supabase
      .from("guest_companions")
      .update({
        status: "rejected",
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", companionId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: "Acompanhante rejeitado",
    })
  } catch (error) {
    console.error("Erro ao rejeitar acompanhante:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  try {
    const { companionId } = await params
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

    // Aprovar o acompanhante
    const { error: updateError } = await supabase
      .from("guest_companions")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", companionId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: "Acompanhante aprovado",
    })
  } catch (error) {
    console.error("Erro ao aprovar acompanhante:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

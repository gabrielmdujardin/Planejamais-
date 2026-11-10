import { createClient } from "@/lib/supabase/server"
import { rejectionDecisionSchema } from "@/lib/validation"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  try {
    const { companionId } = await params
    const rawBody = await request.json().catch(() => ({}))
    const parsed = rejectionDecisionSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados de rejeição inválidos" },
        { status: 400 }
      )
    }

    const { reason } = parsed.data
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

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

    if ((companion as any).guests?.events?.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from("guest_companions")
      .update({
        status: "rejected",
        rejection_reason: reason || null,
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

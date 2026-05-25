import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Usar service role para acesso público
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Buscar o convidado pelo token
    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select("id, status, responded_at")
      .eq("token", token)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        { error: "Convite não encontrado ou inválido" },
        { status: 404 }
      )
    }

    // Verificar se já respondeu
    if (guest.responded_at) {
      return NextResponse.json(
        { error: "Você já respondeu a este convite" },
        { status: 400 }
      )
    }

    // Recusar presença
    const { error: updateError } = await supabaseAdmin
      .from("guests")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", guest.id)

    if (updateError) throw updateError

    // Cancelar todos os acompanhantes aprovados
    await supabaseAdmin
      .from("guest_companions")
      .update({
        status: "cancelled",
      })
      .eq("guest_id", guest.id)
      .eq("status", "approved")

    return NextResponse.json({
      success: true,
      message: "Resposta registrada. Sentiremos sua falta!",
    })
  } catch (error) {
    console.error("Erro ao recusar presença:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

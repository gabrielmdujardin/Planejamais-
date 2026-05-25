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
      .select("id, status, responded_at, confirmation_deadline")
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

    // Verificar prazo
    if (guest.confirmation_deadline && new Date(guest.confirmation_deadline) < new Date()) {
      await supabaseAdmin
        .from("guests")
        .update({ status: "expired" })
        .eq("id", guest.id)

      return NextResponse.json(
        { error: "O prazo para confirmação expirou" },
        { status: 400 }
      )
    }

    // Confirmar presença
    const { error: updateError } = await supabaseAdmin
      .from("guests")
      .update({
        status: "confirmed",
        responded_at: new Date().toISOString(),
      })
      .eq("id", guest.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: "Presença confirmada com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao confirmar presença:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

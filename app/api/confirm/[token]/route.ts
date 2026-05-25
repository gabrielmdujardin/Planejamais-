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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Buscar o convidado pelo token
    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select(
        `
        *,
        events (
          id,
          title,
          date,
          time,
          location,
          description
        )
      `
      )
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
      return NextResponse.json({
        guest: {
          id: guest.id,
          name: guest.name,
          status: guest.status,
          respondedAt: guest.responded_at,
        },
        event: guest.events,
        alreadyResponded: true,
      })
    }

    // Verificar prazo
    if (guest.confirmation_deadline && new Date(guest.confirmation_deadline) < new Date()) {
      // Atualizar status para expirado
      await supabaseAdmin
        .from("guests")
        .update({ status: "expired" })
        .eq("id", guest.id)

      return NextResponse.json({
        guest: {
          id: guest.id,
          name: guest.name,
          status: "expired",
        },
        event: guest.events,
        expired: true,
      })
    }

    // Buscar acompanhantes aprovados
    const { data: companions, error: companionsError } = await supabaseAdmin
      .from("guest_companions")
      .select("*")
      .eq("guest_id", guest.id)
      .eq("status", "approved")

    if (companionsError) throw companionsError

    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        status: guest.status,
        confirmationDeadline: guest.confirmation_deadline,
        dietaryRestrictions: guest.dietary_restrictions,
        accessibilityNeeds: guest.accessibility_needs,
      },
      event: guest.events,
      companions: (companions || []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
      alreadyResponded: false,
      expired: false,
    })
  } catch (error) {
    console.error("Erro ao buscar convite:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

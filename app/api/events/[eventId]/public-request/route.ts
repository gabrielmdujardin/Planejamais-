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
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()

    const { name, email, phone, notes, dietaryRestrictions, accessibilityNeeds, companions } = body

    // Validar campos obrigatórios
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Nome, email e telefone são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o evento existe
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    // Verificar se o email já existe no evento
    const { data: existingGuest } = await supabaseAdmin
      .from("guests")
      .select("id")
      .eq("event_id", eventId)
      .eq("email", email)
      .single()

    if (existingGuest) {
      return NextResponse.json(
        { error: "Este email já está cadastrado para este evento" },
        { status: 409 }
      )
    }

    // Criar o convidado principal
    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .insert({
        event_id: eventId,
        name,
        email,
        phone,
        status: "awaiting_approval",
        source: "public_request",
        notes,
        dietary_restrictions: dietaryRestrictions,
        accessibility_needs: accessibilityNeeds,
        requested_companions_count: companions?.length || 0,
      })
      .select()
      .single()

    if (guestError) {
      console.error("Erro ao criar convidado:", guestError)
      return NextResponse.json(
        { error: "Erro ao criar solicitação" },
        { status: 500 }
      )
    }

    // Criar acompanhantes se houver
    if (companions && companions.length > 0) {
      const companionsToInsert = companions.map((c: { name: string; email?: string; phone?: string; notes?: string }) => ({
        guest_id: guest.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        notes: c.notes,
        status: "awaiting_approval",
      }))

      const { error: companionsError } = await supabaseAdmin
        .from("guest_companions")
        .insert(companionsToInsert)

      if (companionsError) {
        console.error("Erro ao criar acompanhantes:", companionsError)
        // Não falhar a requisição, apenas logar
      }
    }

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso! Aguarde a aprovação do organizador.",
      guestId: guest.id,
    })
  } catch (error) {
    console.error("Erro na solicitação pública:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

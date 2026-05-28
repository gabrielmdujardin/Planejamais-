import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Evento obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("user_id", user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id, token, confirmation_token")
      .eq("id", guestId)
      .eq("event_id", eventId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    const token = guest.token || guest.confirmation_token || crypto.randomUUID()
    const { error: updateError } = await supabase
      .from("guests")
      .update({ token, confirmation_token: token })
      .eq("id", guestId)
      .eq("event_id", eventId)

    if (updateError) throw updateError

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    return NextResponse.json({ token, url: `${appUrl}/confirm/${token}` })
  } catch (error) {
    console.error("Erro ao gerar link de confirmação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

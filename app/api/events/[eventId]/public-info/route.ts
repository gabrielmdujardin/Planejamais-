import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabaseAdmin = createAdminClient()
    const { eventId } = await params

    // Buscar informações públicas do evento
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select("id, title, date, time, location, description")
      .eq("id", eventId)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar evento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

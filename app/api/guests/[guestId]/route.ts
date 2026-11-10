import { createClient } from "@/lib/supabase/server"
import { guestUpdateSchema } from "@/lib/validation"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 })
    }

    const parsed = guestUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados de atualização inválidos" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("*, events!inner(id, user_id)")
      .eq("id", guestId)
      .maybeSingle()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    if ((guest as any).events?.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const updates = parsed.data
    const prevMetadata =
      typeof guest.metadata === "object" && guest.metadata !== null
        ? (guest.metadata as Record<string, any>)
        : {}

    const now = new Date().toISOString()
    const dbUpdates: Record<string, any> = {}

    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.dietaryRestrictions !== undefined) dbUpdates.dietary_restrictions = updates.dietaryRestrictions
    if (updates.accessibilityNeeds !== undefined) dbUpdates.accessibility_needs = updates.accessibilityNeeds
    if (updates.department !== undefined) {
      dbUpdates.metadata = {
        ...prevMetadata,
        department: updates.department || null,
      }
    }

    if (updates.status !== undefined) {
      dbUpdates.status = updates.status
      if (updates.status === "confirmed") {
        dbUpdates.confirmed_at = now
        dbUpdates.responded_at = guest.responded_at || now
      } else if (updates.status === "declined") {
        dbUpdates.declined_at = now
        dbUpdates.responded_at = guest.responded_at || now
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("guests")
      .update(dbUpdates)
      .eq("id", guestId)
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message || "Erro ao atualizar convidado" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      guest: updated,
    })
  } catch (error) {
    console.error("Erro ao editar convidado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id, event_id, events!inner(id, user_id)")
      .eq("id", guestId)
      .maybeSingle()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    if ((guest as any).events?.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { error: deleteError } = await supabase.from("guests").delete().eq("id", guestId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Convidado removido com sucesso",
    })
  } catch (error) {
    console.error("Erro ao remover convidado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}


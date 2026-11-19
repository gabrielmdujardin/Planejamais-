import { checkBackendEventPermission } from "@/lib/auth/rbac-guard"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/src/services/email.service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params
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

    // Buscar o convidado e verificar se o evento pertence ao usuário
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select(
        `
        *,
        events (
          id,
          title,
          user_id
        )
      `
      )
      .eq("id", guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    const perm = await checkBackendEventPermission({
      db: supabase,
      eventId: guest.event_id,
      userId: user.id,
      module: "requests",
      action: "approve",
    })

    if (!perm.allowed) {
      return NextResponse.json({ error: perm.reason || "Acesso negado" }, { status: 403 })
    }

    // RN-008 & RF-017: Solicitações públicas rejeitadas recebem status 'cancelled' para não compor a lista efetiva
    const nextStatus = guest.source && guest.source !== "manual" ? "cancelled" : "declined"
    const nowIso = new Date().toISOString()

    const { error: updateError } = await supabase
      .from("guests")
      .update({
        status: nextStatus,
        rejected_at: nowIso,
        rejection_reason: reason || null,
      })
      .eq("id", guestId)

    if (updateError) throw updateError

    // Cancelar todos os acompanhantes
    await supabase
      .from("guest_companions")
      .update({
        status: "cancelled",
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId)

    // Enviar email de rejeição
    const emailResult = await EmailService.sendRejectionEmail({
      to: guest.email,
      guestName: guest.name,
      eventTitle: guest.events?.title || "Evento",
      reason,
    })

    return NextResponse.json({
      success: true,
      message: "Convidado recusado",
      emailSent: emailResult.success,
      emailError: emailResult.error,
    })
  } catch (error) {
    console.error("Erro ao rejeitar convidado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

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
    const { approvedCompanionIds = [], rejectedCompanionIds = [], confirmationDeadlineDays = 7 } = body

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
          date,
          time,
          location,
          user_id
        )
      `
      )
      .eq("id", guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 })
    }

    if (guest.events?.user_id !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Gerar token e calcular deadline
    const token = crypto.randomUUID()
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + confirmationDeadlineDays)

    // Atualizar o convidado principal
    const { error: updateError } = await supabase
      .from("guests")
      .update({
        status: "pending",
        token,
        confirmation_deadline: deadline.toISOString(),
        sent_at: new Date().toISOString(),
      })
      .eq("id", guestId)

    if (updateError) throw updateError

    // Aprovar acompanhantes selecionados
    if (approvedCompanionIds.length > 0) {
      await supabase
        .from("guest_companions")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .in("id", approvedCompanionIds)
    }

    // Rejeitar acompanhantes não selecionados
    if (rejectedCompanionIds.length > 0) {
      await supabase
        .from("guest_companions")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
        })
        .in("id", rejectedCompanionIds)
    }

    // Buscar nomes dos acompanhantes para o email
    let approvedNames: string[] = []
    let rejectedNames: string[] = []

    if (approvedCompanionIds.length > 0) {
      const { data: approved } = await supabase
        .from("guest_companions")
        .select("name")
        .in("id", approvedCompanionIds)
      approvedNames = (approved || []).map((c) => c.name)
    }

    if (rejectedCompanionIds.length > 0) {
      const { data: rejected } = await supabase
        .from("guest_companions")
        .select("name")
        .in("id", rejectedCompanionIds)
      rejectedNames = (rejected || []).map((c) => c.name)
    }

    // Enviar email de aprovação
    const emailResult = await EmailService.sendApprovalEmail({
      to: guest.email,
      guestName: guest.name,
      eventTitle: guest.events?.title || "Evento",
      eventDate: guest.events?.date || "",
      eventTime: guest.events?.time || "",
      eventLocation: guest.events?.location || "",
      confirmationToken: token,
      confirmationDeadline: deadline.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      approvedCompanions: approvedNames,
      rejectedCompanions: rejectedNames,
    })

    return NextResponse.json({
      success: true,
      message: "Convidado aprovado com sucesso",
      token,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    })
  } catch (error) {
    console.error("Erro ao aprovar convidado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

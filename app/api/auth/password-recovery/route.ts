import {
  requestPasswordRecoveryLocal,
  resetPasswordWithTokenLocal,
} from "@/lib/auth/auth-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.resetToken && body.newPassword) {
      const res = await resetPasswordWithTokenLocal({
        resetToken: String(body.resetToken),
        newPassword: String(body.newPassword),
      })
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 })
      }
      return NextResponse.json({
        success: true,
        message: "Senha redefinida com sucesso. Todas as sessões anteriores foram revogadas.",
      })
    }

    if (body.email) {
      const res = await requestPasswordRecoveryLocal(String(body.email))
      return NextResponse.json({
        success: true,
        resetToken: process.env.NODE_ENV !== "production" ? res.resetToken : undefined,
        message: "Se o e-mail estiver cadastrado, as instruções de recuperação foram enviadas.",
      })
    }

    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar recuperação de senha."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

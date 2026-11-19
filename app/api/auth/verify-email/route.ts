import { confirmEmailWithToken } from "@/lib/auth/auth-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = String(body.token || "").trim()
    if (!token) {
      return NextResponse.json({ error: "Token de confirmação obrigatório." }, { status: 400 })
    }

    const res = await confirmEmailWithToken(token)
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      email: res.email,
      message: "E-mail confirmado com sucesso.",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao confirmar e-mail."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

import {
  loginUserLocal,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1"
    const userAgent = request.headers.get("user-agent") || "Planeja+ Browser"

    const { user, sessionToken } = await loginUserLocal({
      email: body.email,
      password: body.password,
      ipAddress,
      userAgent,
    })

    const response = NextResponse.json({
      user,
      message: "Autenticação realizada com sucesso.",
    })

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && process.env.APP_URL?.startsWith("https"),
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Credenciais inválidas."
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

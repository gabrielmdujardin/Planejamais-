import {
  registerUserLocal,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1"
    const userAgent = request.headers.get("user-agent") || "Planeja+ Browser"

    const { user, sessionToken, verificationToken } = await registerUserLocal({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
      location: body.location,
      ipAddress,
      userAgent,
    })

    const response = NextResponse.json(
      {
        user,
        verificationToken: process.env.NODE_ENV !== "production" ? verificationToken : undefined,
        message: "Conta criada com sucesso no PostgreSQL local.",
      },
      { status: 201 }
    )

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && process.env.APP_URL?.startsWith("https"),
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao cadastrar usuário."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

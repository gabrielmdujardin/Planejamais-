import {
  revokeSessionByToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (token) {
    await revokeSessionByToken(token).catch(() => {})
  }

  const response = NextResponse.json({
    success: true,
    message: "Sessão encerrada e revogada com sucesso.",
  })

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  response.cookies.set("planeja_demo_user", "", {
    path: "/",
    maxAge: 0,
  })

  return response
}

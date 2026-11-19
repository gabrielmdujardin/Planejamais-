import { verifySessionJwt } from "@/lib/auth/password"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  evaluateRouteAccess,
  isPublicAppOrInvitePath,
  isPublicRateLimitedEndpoint,
} from "@/lib/security/route-guard"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE_NAME = "planeja_session_token"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Permitir acesso imediato a assets estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|css|js|webp)$/)
  ) {
    return NextResponse.next()
  }

  // 2. Aplicar Rate Limiting em rotas públicas de API/formulário (RNF-004: 10 req/min/IP <= 20 req/min/IP)
  if (isPublicRateLimitedEndpoint(pathname, request.method)) {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1"

    const rateLimit = checkRateLimit(`${ip}:${pathname.split("/").slice(0, 3).join("/")}`, 10, 60 * 1000)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Muitas requisições enviadas. Por favor, aguarde um minuto antes de tentar novamente." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetTime),
          },
        }
      )
    }
  }

  // 3. Verificação de sessão própria (JWT HMAC-SHA256 emitido pelo backend PostgreSQL local)
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const verifiedJwt = verifySessionJwt(sessionToken)
  const hasDemoCookie = Boolean(request.cookies.get("planeja_demo_user")?.value)
  const strictAuthOnly = process.env.STRICT_AUTH_ONLY === "true"

  // 4. Avaliar regra de acesso (RF-004, RNF-004)
  const decision = evaluateRouteAccess({
    pathname,
    hasSupabaseSession: verifiedJwt.valid,
    hasDemoCookie,
    supabaseConfigured: strictAuthOnly,
  })

  if (decision.action === "redirect_login") {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (decision.action === "redirect_dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isPublicAppOrInvitePath(pathname)) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

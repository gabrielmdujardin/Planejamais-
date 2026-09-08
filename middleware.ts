import { checkRateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/login", "/register", "/about", "/pricing", "/help", "/contact", "/terms", "/privacy"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Aplicar Rate Limiting em chamadas POST para endpoints públicos
  const isPublicApiRoute =
    pathname.startsWith("/api/public-events") ||
    pathname.includes("/solicitar") ||
    pathname.startsWith("/api/guests")

  if (isPublicApiRoute && request.method === "POST") {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1"

    const rateLimit = checkRateLimit(ip, 10, 60 * 1000) // 10 requisições por minuto por IP

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

  // 2. Permitir acesso a assets estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|css)$/)
  ) {
    return NextResponse.next()
  }

  // 3. Rotas públicas de página
  if (publicPaths.some((path) => pathname === path || pathname.startsWith("/confirm-invitation"))) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

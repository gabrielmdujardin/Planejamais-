import { checkRateLimit } from "@/lib/rate-limit"
import {
  evaluateRouteAccess,
  isPublicAppOrInvitePath,
  isPublicRateLimitedEndpoint,
  isSupabaseEnvConfigured,
} from "@/lib/security/route-guard"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

  // 3. Verificação de sessão
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseConfigured = isSupabaseEnvConfigured()
  let user = null
  const hasDemoCookie = Boolean(request.cookies.get("planeja_demo_user")?.value)

  if (supabaseConfigured) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      user = null
    }
  }

  // 4. Avaliar regra de acesso (RF-004, RNF-004)
  const decision = evaluateRouteAccess({
    pathname,
    hasSupabaseSession: Boolean(user),
    hasDemoCookie,
    supabaseConfigured,
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
    return response
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

import { checkRateLimit } from "@/lib/rate-limit"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/login", "/register", "/about", "/pricing", "/help", "/contact", "/terms", "/privacy"]

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Boolean(
    url &&
      key &&
      !url.includes("example.supabase.co") &&
      !url.includes("your-project.supabase.co") &&
      !key.includes("dummy") &&
      !key.includes("your-supabase"),
  )
}

export async function middleware(request: NextRequest) {
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
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|css|js|webp)$/)
  ) {
    return NextResponse.next()
  }

  // 3. Identificar categorias de rota
  const isPublicPath =
    publicPaths.some((path) => pathname === path) ||
    pathname.startsWith("/confirm-invitation") ||
    pathname.startsWith("/convite") ||
    pathname.startsWith("/rsvp") ||
    pathname.startsWith("/solicitar") ||
    pathname.includes("/host-view") ||
    pathname.startsWith("/api/public-events")

  const isAuthPath = pathname === "/login" || pathname === "/register"
  const isProtectedPath =
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/create-event") ||
      pathname.startsWith("/event")) &&
    !pathname.includes("/host-view")

  // 4. Verificação de sessão
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  let user = null
  const hasDemoCookie = Boolean(request.cookies.get("planeja_demo_user")?.value)

  if (isSupabaseConfigured()) {
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

  const isAuthenticated = Boolean(user || hasDemoCookie)

  // 5. Redirecionar para login caso tente acessar rota protegida sem sessão
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 6. Redirecionar usuário autenticado para dashboard se tentar acessar login ou registro
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // 7. Liberar rotas públicas
  if (isPublicPath) {
    return response
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

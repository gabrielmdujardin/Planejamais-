import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/login", "/register", "/about", "/pricing", "/help", "/contact", "/terms", "/privacy"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acesso a assets estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|css)$/)
  ) {
    return NextResponse.next()
  }

  // Rotas públicas
  if (publicPaths.some((path) => pathname === path || pathname.startsWith("/confirm-invitation"))) {
    return NextResponse.next()
  }

  // Para rotas protegidas, apenas permitir (auth é client-side)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

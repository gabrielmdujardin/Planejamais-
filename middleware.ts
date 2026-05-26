import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/login", "/register", "/about", "/pricing", "/help", "/contact", "/terms", "/privacy"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acesso a assets estáticos do Next.js
  if (pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  // Permitir acesso a arquivos estáticos e API
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Rotas públicas
  if (publicPaths.some((path) => pathname === path || pathname.startsWith("/confirm-invitation") || pathname.startsWith("/evento"))) {
    return NextResponse.next()
  }

  // Para rotas protegidas, apenas permitir (auth é client-side)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}

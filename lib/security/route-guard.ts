/**
 * Regras puras de proteção de rotas privadas, públicas e Rate Limiting (RF-004, RNF-004).
 */

export const PUBLIC_EXACT_PATHS = [
  "/",
  "/login",
  "/register",
  "/about",
  "/pricing",
  "/help",
  "/contact",
  "/terms",
  "/privacy",
  "/validation",
  "/simulator",
]

export function isSupabaseEnvConfigured(env: Record<string, string | undefined> = process.env): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Boolean(
    url &&
      key &&
      !url.includes("example.supabase.co") &&
      !url.includes("your-project.supabase.co") &&
      !key.includes("dummy") &&
      !key.includes("your-supabase")
  )
}

/**
 * RF-004 & RNF-004: Identifica todas as rotas privadas da interface do organizador.
 * Importante: '/evento/[token]' é rota pública de convite (não confundir com '/event/[id]').
 * '/event/[id]/host-view' é portal público somente-leitura protegido por token próprio (RF-038).
 */
export function isProtectedAppPath(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true
  if (pathname === "/create-event" || pathname.startsWith("/create-event/")) return true
  if (pathname === "/contacts" || pathname.startsWith("/contacts/")) return true
  if (pathname === "/calendar" || pathname.startsWith("/calendar/")) return true
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true

  const isOrganizerEventRoute = pathname === "/event" || pathname.startsWith("/event/")
  if (isOrganizerEventRoute && !pathname.endsWith("/host-view") && !pathname.includes("/host-view/")) {
    return true
  }

  return false
}

export function isAuthEntryPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register"
}

export function isPublicAppOrInvitePath(pathname: string): boolean {
  return (
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    pathname.startsWith("/confirm/") ||
    pathname.startsWith("/confirm-invitation") ||
    pathname.startsWith("/convite") ||
    pathname.startsWith("/evento/") ||
    pathname.startsWith("/rsvp") ||
    pathname.startsWith("/solicitar") ||
    pathname.endsWith("/host-view") ||
    pathname.startsWith("/api/public-events") ||
    pathname.startsWith("/validation") ||
    pathname.startsWith("/api/validation") ||
    pathname.startsWith("/simulator")
  )
}

/**
 * RNF-004: Identifica endpoints públicos sujeitos a Rate Limiting por IP (<= 20 req/min/IP; configurado em 10 req/min/IP).
 */
export function isPublicRateLimitedEndpoint(pathname: string, method: string): boolean {
  const upperMethod = (method || "GET").toUpperCase()

  if (pathname.startsWith("/api/public-events")) return true
  if (pathname.startsWith("/api/confirm/")) return true
  if (/^\/api\/events\/[^/]+\/public-(request|info)$/.test(pathname)) return true
  if (/^\/api\/events\/[^/]+\/host-view$/.test(pathname)) return true
  if (pathname.startsWith("/api/ics/")) return true
  if (pathname.includes("/solicitar") && upperMethod === "POST") return true

  return false
}

/**
 * Determina a decisão de controle de acesso da rota.
 * O cookie `planeja_demo_user` só é aceito quando o Supabase NÃO está configurado (modo demonstração offline).
 */
export function evaluateRouteAccess(params: {
  pathname: string
  hasSupabaseSession: boolean
  hasDemoCookie: boolean
  supabaseConfigured: boolean
}): {
  isAuthenticated: boolean
  action: "allow" | "redirect_login" | "redirect_dashboard"
} {
  const { pathname, hasSupabaseSession, hasDemoCookie, supabaseConfigured } = params
  const isAuthenticated = Boolean(hasSupabaseSession || (!supabaseConfigured && hasDemoCookie))

  if (isProtectedAppPath(pathname) && !isAuthenticated) {
    return { isAuthenticated, action: "redirect_login" }
  }

  if (isAuthEntryPath(pathname) && isAuthenticated) {
    return { isAuthenticated, action: "redirect_dashboard" }
  }

  return { isAuthenticated, action: "allow" }
}


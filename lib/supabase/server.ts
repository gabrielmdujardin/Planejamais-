import { SESSION_COOKIE_NAME } from "@/lib/auth/auth-service"
import { createLocalPgClient } from "@/lib/db/pg-client"
import { cookies } from "next/headers"

/**
 * Cliente de banco de dados do servidor conectado diretamente ao PostgreSQL local (planeja_plus).
 * Independente do Supabase (Seções 5, 6, 7 e 16).
 */
export async function createClient() {
  let sessionToken: string | null = null
  let demoUserCookie = false

  try {
    const cookieStore = await cookies()
    sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || null
    demoUserCookie = Boolean(cookieStore.get("planeja_demo_user")?.value)
  } catch {
    // Execução fora de contexto HTTP do Next.js (ex: testes ou jobs diretos)
  }

  return createLocalPgClient({
    sessionToken,
    demoUserCookie,
    role: "authenticated",
  })
}

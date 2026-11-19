/**
 * Cliente de autenticação e sessão para o navegador conectado à API própria (/api/auth/*)
 * e ao PostgreSQL local (planeja_plus), sem dependência do Supabase.
 */

type AuthChangeCallback = (event: string, session: { user: any } | null) => void
const listeners = new Set<AuthChangeCallback>()

function notifyListeners(event: string, user: any | null) {
  const session = user ? { user } : null
  Array.from(listeners).forEach((cb) => {
    try {
      cb(event, session)
    } catch {
      // Ignore listener errors
    }
  })
}

export function createClient() {
  return {
    auth: {
      async getUser() {
        try {
          const res = await fetch("/api/auth/session", {
            method: "GET",
            credentials: "include",
          })
          if (!res.ok) {
            return { data: { user: null }, error: null }
          }
          const data = await res.json()
          return { data: { user: data.user || null }, error: null }
        } catch {
          return { data: { user: null }, error: null }
        }
      },

      async signInWithPassword(credentials: { email: string; password: string }) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(credentials),
        })
        const data = await res.json()
        if (!res.ok) {
          return { data: { user: null, session: null }, error: new Error(data.error || "Falha no login") }
        }
        notifyListeners("SIGNED_IN", data.user)
        return { data: { user: data.user, session: { user: data.user } }, error: null }
      },

      async signUp(params: {
        email: string
        password: string
        options?: { data?: Record<string, any> }
      }) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: params.email,
            password: params.password,
            name: params.options?.data?.name,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          return {
            data: { user: null, session: null },
            error: new Error(data.error || "Falha no cadastro"),
          }
        }
        notifyListeners("SIGNED_IN", data.user)
        return { data: { user: data.user, session: { user: data.user } }, error: null }
      },

      async signOut() {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        }).catch(() => {})
        notifyListeners("SIGNED_OUT", null)
        return { error: null }
      },

      onAuthStateChange(callback: AuthChangeCallback) {
        listeners.add(callback)
        return {
          data: {
            subscription: {
              unsubscribe() {
                listeners.delete(callback)
              },
            },
          },
        }
      },
    },
  }
}

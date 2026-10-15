"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

function supabaseConfigError() {
  return new Error(
    "Supabase nao esta configurado. Use demo@planeja.app / demo123 para entrar no modo demo local ou configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY reais no .env.local.",
  )
}

function normalizeAuthError(error: unknown) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return new Error(
      "Nao foi possivel conectar ao Supabase. Verifique NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e reinicie o servidor.",
    )
  }

  return error
}

function toUser(authUser: any): User {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuario",
  }
}

function demoUser(email = "demo@planeja.app"): User {
  return {
    id: "demo",
    email,
    name: email.split("@")[0] || "demo",
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const isDemoMode = user?.id === "demo"

  useEffect(() => {
    const loadSession = async () => {
      if (!isSupabaseConfigured()) {
        const storedUser = localStorage.getItem("user")
        setUser(storedUser ? JSON.parse(storedUser) : null)
        setIsLoading(false)
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        setUser(user ? toUser(user) : null)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()

    if (!isSupabaseConfigured()) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user
      setUser(authUser ? toUser(authUser) : null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      if (email.trim().toLowerCase() === "demo@planeja.app" && password === "demo123") {
        const user = demoUser(email.trim().toLowerCase())
        setUser(user)
        localStorage.setItem("user", JSON.stringify(user))
        if (typeof document !== "undefined") {
          document.cookie = "planeja_demo_user=true; path=/; max-age=604800; SameSite=Lax"
        }
        return
      }

      throw supabaseConfigError()
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured()) {
      const user = { ...demoUser(email.trim().toLowerCase()), name: name.trim() || email.split("@")[0] || "demo" }
      setUser(user)
      localStorage.setItem("user", JSON.stringify(user))
      if (typeof document !== "undefined") {
        document.cookie = "planeja_demo_user=true; path=/; max-age=604800; SameSite=Lax"
      }
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })
      if (error) throw error
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }

    setUser(null)
    localStorage.removeItem("user")
    if (typeof document !== "undefined") {
      document.cookie = "planeja_demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

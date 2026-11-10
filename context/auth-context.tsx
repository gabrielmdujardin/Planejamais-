"use client"

import { updateUserProfileAction } from "@/app/actions/profile"
import { createClient } from "@/lib/supabase/client"
import { useContactStore } from "@/stores/contact-store"
import { useEventStore } from "@/stores/event-store"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  location?: string
  avatar?: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  updateUser: (updates: Partial<Omit<User, "id">>) => Promise<void>
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
      !key.includes("your-supabase")
  )
}

function supabaseConfigError() {
  return new Error(
    "Supabase não está configurado. Use demo@planeja.app / demo123 para entrar no modo demo local ou configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY reais no .env.local."
  )
}

function normalizeAuthError(error: unknown) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return new Error(
      "Não foi possível conectar ao Supabase. Verifique NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e reinicie o servidor."
    )
  }

  return error
}

function toUser(authUser: any): User {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name:
      authUser.user_metadata?.name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "Usuário",
    phone: authUser.user_metadata?.phone || "",
    location: authUser.user_metadata?.location || "",
    avatar: authUser.user_metadata?.avatar_url || undefined,
  }
}

function demoUser(email = "demo@planeja.app"): User {
  return {
    id: "demo",
    email,
    name: email.split("@")[0] || "demo",
    phone: "",
    location: "",
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
          data: { user: authUser },
        } = await supabase.auth.getUser()

        setUser(authUser ? toUser(authUser) : null)
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
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const authUser = session?.user
      setUser(authUser ? toUser(authUser) : null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!isSupabaseConfigured()) {
      if (normalizedEmail === "demo@planeja.app" && password === "demo123") {
        const u = demoUser(normalizedEmail)
        setUser(u)
        localStorage.setItem("user", JSON.stringify(u))
        if (typeof document !== "undefined") {
          document.cookie = "planeja_demo_user=true; path=/; max-age=604800; SameSite=Lax"
        }
        return
      }

      throw supabaseConfigError()
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) throw error
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (password.length < 6) {
      throw new Error("A senha deve ter no mínimo 6 caracteres")
    }

    if (!isSupabaseConfigured()) {
      const u = { ...demoUser(normalizedEmail), name: name.trim() || normalizedEmail.split("@")[0] || "demo" }
      setUser(u)
      localStorage.setItem("user", JSON.stringify(u))
      if (typeof document !== "undefined") {
        document.cookie = "planeja_demo_user=true; path=/; max-age=604800; SameSite=Lax"
      }
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name: name.trim() },
        },
      })
      if (error) throw error
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  const updateUser = async (updates: Partial<Omit<User, "id">>) => {
    if (!user) return

    if (!isSupabaseConfigured() || user.id === "demo") {
      const updatedUser: User = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      return
    }

    const result = await updateUserProfileAction(updates)
    if (result.error) {
      throw new Error(result.error)
    }

    setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }

    // RF-003 & RNF-005: Limpa integralmente estado e caches locais ao encerrar a sessão
    setUser(null)
    useEventStore.getState().setEvents([])
    useContactStore.getState().clearAll()

    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      localStorage.removeItem("event-storage")
      localStorage.removeItem("contact-storage")
    }

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
        updateUser,
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

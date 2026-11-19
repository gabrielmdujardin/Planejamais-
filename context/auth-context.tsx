"use client"

import { updateUserProfileAction } from "@/app/actions/profile"
import { createClient } from "@/lib/supabase/client"
import { useContactStore } from "@/stores/contact-store"
import { useEventStore } from "@/stores/event-store"
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

function toUser(authUser: any): User {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name:
      authUser.name ||
      authUser.user_metadata?.name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "Usuário",
    phone: authUser.phone || authUser.user_metadata?.phone || "",
    location: authUser.location || authUser.user_metadata?.location || "",
    avatar: authUser.avatar || authUser.user_metadata?.avatar_url || undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const authClient = useMemo(() => createClient(), [])
  const isDemoMode = user?.id === "demo"

  useEffect(() => {
    const loadSession = async () => {
      try {
        const {
          data: { user: authUser },
        } = await authClient.auth.getUser()

        if (authUser) {
          const u = toUser(authUser)
          setUser(u)
          localStorage.setItem("user", JSON.stringify(u))
          setIsLoading(false)
          return
        }

        const storedUser = localStorage.getItem("user")
        setUser(storedUser ? JSON.parse(storedUser) : null)
      } catch {
        const storedUser = localStorage.getItem("user")
        setUser(storedUser ? JSON.parse(storedUser) : null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event: string, session: { user: any } | null) => {
      const authUser = session?.user
      setUser(authUser ? toUser(authUser) : null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [authClient])

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error || !data.user) {
      throw error || new Error("Credenciais inválidas.")
    }

    const u = toUser(data.user)
    setUser(u)
    localStorage.setItem("user", JSON.stringify(u))
  }

  const register = async (email: string, password: string, name: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (password.length < 6) {
      throw new Error("A senha deve ter no mínimo 6 caracteres")
    }

    const { data, error } = await authClient.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: name.trim() },
      },
    })

    if (error || !data.user) {
      throw error || new Error("Não foi possível criar a conta.")
    }

    const u = toUser(data.user)
    setUser(u)
    localStorage.setItem("user", JSON.stringify(u))
  }

  const updateUser = async (updates: Partial<Omit<User, "id">>) => {
    if (!user) return

    const result = await updateUserProfileAction(updates)
    if (result.error) {
      throw new Error(result.error)
    }

    const nextUser = { ...user, ...updates }
    setUser(nextUser)
    localStorage.setItem("user", JSON.stringify(nextUser))
  }

  const logout = async () => {
    await authClient.auth.signOut()

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

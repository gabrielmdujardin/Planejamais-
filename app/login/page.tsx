"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { Logo } from "@/components/logo"
import { AuthShell, authInputClass, authLabelClass } from "@/components/auth-shell"
import { Mail, Lock, ArrowUpRight, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDemoFill = () => {
    setEmail("demo@planeja.app")
    setPassword("demo123")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email ou senha inválidos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background">
      <AuthShell
        brand={<Logo size="md" />}
        eyebrow="Entrar"
        title={
          <>
            Que bom te ver <em className="text-primary">de novo</em>.
          </>
        }
        subtitle="Entre para continuar organizando seus eventos."
        aside={{
          quote: (
            <>
              “Pela primeira vez, ninguém perguntou <em className="text-lime">quanto eu devo?</em> no grupo.”
            </>
          ),
          caption: "Mariana · viagem com 14 amigos",
        }}
      >
        {/* Atalho de demonstração */}
        <button
          type="button"
          onClick={handleDemoFill}
          className="group mb-7 flex w-full items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-left transition-colors duration-300 hover:bg-secondary/70"
        >
          <span>
            <span className="block text-sm">Só quer conhecer?</span>
            <span className="block font-mono text-[11px] text-muted-foreground">demo@planeja.app · demo123</span>
          </span>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs transition-transform duration-500 ease-fluid group-hover:-translate-x-0.5">
            Preencher
          </span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
          <div className="space-y-2">
            <Label htmlFor="email" className={authLabelClass}>
              E-mail
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={authInputClass}
              />
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className={authLabelClass}>
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={`${authInputClass} pr-12`}
              />
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-pill btn-primary w-full justify-between disabled:opacity-70">
            {loading ? "Entrando…" : "Entrar na minha conta"}
            <span className="btn-orb">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              )}
            </span>
          </button>
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/register" className="link-underline text-foreground">
            Criar gratuitamente
          </Link>
        </p>
      </AuthShell>
    </div>
  )
}

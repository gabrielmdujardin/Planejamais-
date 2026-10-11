"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { Logo } from "@/components/logo"
import { Mail, Lock, Sparkles, KeyRound, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Luzes de fundo decorativas sutis com paleta Esmeralda institucional */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl opacity-60"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Identidade visual no topo */}
        <div className="text-center space-y-2">
          <div className="inline-block transition-transform hover:scale-105">
            <Link href="/" aria-label="Ir para a página inicial">
              <Logo size="lg" animated={false} />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Gestão inteligente e colaborativa de eventos</p>
        </div>

        <Card className="border-border bg-card shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl font-bold text-center tracking-tight text-foreground">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-center text-sm text-muted-foreground">
              Entre com suas credenciais para acessar seus eventos
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Bloco Refinado de Modo Demo */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground/90">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary">Acesso Rápido de Demonstração</span>
                    <button
                      type="button"
                      onClick={handleDemoFill}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
                      title="Preencher com credenciais de teste"
                    >
                      <KeyRound className="h-3 w-3" /> Preencher
                    </button>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Use <strong className="text-foreground">demo@planeja.app</strong> /{" "}
                    <strong className="text-foreground">demo123</strong> para testar sem cadastro prévio.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-10 bg-background border-input focus-visible:ring-ring"
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Senha
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-10 bg-background border-input focus-visible:ring-ring"
                  />
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold shadow-md gap-2"
                isLoading={loading}
                loadingText="Entrando..."
              >
                Entrar na minha conta <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-2 text-center text-sm border-t border-border/60">
              <span className="text-muted-foreground text-xs">Não tem uma conta? </span>
              <Link href="/register" className="text-xs text-primary font-semibold hover:underline">
                Criar conta gratuitamente
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Link de retorno */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}

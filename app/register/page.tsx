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
import { User, Mail, Lock, Sparkles, KeyRound, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDemoFill = () => {
    setName("Usuário Demo")
    setEmail("demo@planeja.app")
    setPassword("demo123")
    setConfirmPassword("demo123")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.")
      return
    }

    if (password.length < 6) {
      setError("A senha deve possuir pelo menos 6 caracteres.")
      return
    }

    setLoading(true)

    try {
      await register(email, password, name)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Luzes decorativas sutis com paleta esmeralda institucional */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl opacity-60"
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
          <p className="text-xs text-muted-foreground">Comece a planejar seus eventos agora mesmo</p>
        </div>

        <Card className="border-border bg-card shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl font-bold text-center tracking-tight text-foreground">
              Criar sua conta
            </CardTitle>
            <CardDescription className="text-center text-sm text-muted-foreground">
              Cadastre-se gratuitamente para gerenciar eventos e convidados
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Bloco Refinado de Modo Demo */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground/90">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary">Preenchimento Automático Demo</span>
                    <button
                      type="button"
                      onClick={handleDemoFill}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
                      title="Preencher automaticamente para teste"
                    >
                      <KeyRound className="h-3 w-3" /> Preencher
                    </button>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Clique para preencher os campos com dados de demonstração sem digitação manual.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome completo
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome ou apelido"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-10 bg-background border-input focus-visible:ring-ring"
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

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
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Senha (mínimo 6 caracteres)
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="pl-10 h-10 bg-background border-input focus-visible:ring-ring"
                  />
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="pl-10 h-10 bg-background border-input focus-visible:ring-ring"
                  />
                  <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                loadingText="Criando conta..."
              >
                Criar minha conta <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-2 text-center text-sm border-t border-border/60">
              <span className="text-muted-foreground text-xs">Já possui uma conta? </span>
              <Link href="/login" className="text-xs text-primary font-semibold hover:underline">
                Fazer login
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

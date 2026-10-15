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
import { User, Mail, Lock, ArrowUpRight, AlertCircle, Check, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const passwordOk = password.length >= 6
  const matchOk = confirmPassword.length > 0 && password === confirmPassword

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

  const fields = [
    { id: "name", label: "Nome", type: "text", value: name, set: setName, icon: User, placeholder: "Como te chamam", auto: "name" },
    { id: "email", label: "E-mail", type: "email", value: email, set: setEmail, icon: Mail, placeholder: "voce@email.com", auto: "email" },
    { id: "password", label: "Senha", type: "password", value: password, set: setPassword, icon: Lock, placeholder: "Mínimo 6 caracteres", auto: "new-password" },
    { id: "confirmPassword", label: "Confirmar senha", type: "password", value: confirmPassword, set: setConfirmPassword, icon: Lock, placeholder: "Repita a senha", auto: "new-password" },
  ] as const

  return (
    <div className="bg-background">
      <AuthShell
        brand={<Logo size="md" />}
        eyebrow="Criar conta"
        title={
          <>
            Seu próximo evento <em className="text-primary">começa aqui</em>.
          </>
        }
        subtitle="Grátis para começar. Seus convidados não precisam criar conta."
        aside={{
          quote: (
            <>
              “O link de confirmação evitou <em className="text-lime">surpresas</em> no almoço de 60 anos da minha mãe.”
            </>
          ),
          caption: "Rafael · 45 convidados",
        }}
      >
        <button
          type="button"
          onClick={handleDemoFill}
          className="group mb-7 flex w-full items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-left transition-colors duration-300 hover:bg-secondary/70"
        >
          <span className="text-sm">Testar com dados de demonstração</span>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs transition-transform duration-500 ease-fluid group-hover:-translate-x-0.5">
            Preencher
          </span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={f.id} className={authLabelClass}>
                  {f.label}
                </Label>
                <div className="relative">
                  <Input
                    id={f.id}
                    type={f.type}
                    autoComplete={f.auto}
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    required
                    disabled={loading}
                    minLength={f.type === "password" ? 6 : undefined}
                    className={authInputClass}
                  />
                  <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                </div>
              </div>
            )
          })}

          {/* Feedback ao vivo da senha */}
          <ul className="flex flex-wrap gap-x-5 gap-y-1 pt-1 font-mono text-[11px] text-muted-foreground" aria-live="polite">
            <li className={`flex items-center gap-1.5 transition-colors ${passwordOk ? "text-primary" : ""}`}>
              <Check className="h-3 w-3" strokeWidth={2} /> 6+ caracteres
            </li>
            <li className={`flex items-center gap-1.5 transition-colors ${matchOk ? "text-primary" : ""}`}>
              <Check className="h-3 w-3" strokeWidth={2} /> senhas iguais
            </li>
          </ul>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-pill btn-primary !mt-6 w-full justify-between disabled:opacity-70">
            {loading ? "Criando conta…" : "Criar minha conta"}
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
          Já tem conta?{" "}
          <Link href="/login" className="link-underline text-foreground">
            Entrar
          </Link>
        </p>
      </AuthShell>
    </div>
  )
}

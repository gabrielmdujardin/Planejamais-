"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, UserPlus, Users } from "lucide-react"
import { isValidEmail, isValidPhone, formatPhone } from "@/lib/validation"

interface Companion {
  id: string
  name: string
  email: string
  phone: string
  notes: string
}

interface PublicRequestFormProps {
  eventId: string
  eventTitle: string
  publicToken?: string
  localMode?: boolean
  allowCompanions?: boolean
  maxCompanions?: number
  onSuccess?: () => void
}

export default function PublicRequestForm({
  eventId,
  eventTitle,
  publicToken,
  localMode = false,
  allowCompanions = true,
  maxCompanions = 1,
  onSuccess,
}: PublicRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    attendanceStatus: "confirmed",
    name: "",
    email: "",
    phone: "",
    notes: "",
    dietaryRestrictions: "",
    accessibilityNeeds: "",
  })
  const [companions, setCompanions] = useState<Companion[]>([])
  const { toast } = useToast()

  const addCompanion = () => {
    if (!allowCompanions || companions.length >= maxCompanions) {
      toast({
        title: "Limite de acompanhantes",
        description: `Este evento permite no máximo ${maxCompanions} acompanhante(s).`,
        variant: "destructive",
      })
      return
    }

    setCompanions([
      ...companions,
      { id: `companion-${Date.now()}`, name: "", email: "", phone: "", notes: "" },
    ])
  }

  const removeCompanion = (id: string) => {
    setCompanions(companions.filter((companion) => companion.id !== id))
  }

  const updateCompanion = (id: string, field: keyof Companion, value: string) => {
    setCompanions(
      companions.map((companion) =>
        companion.id === id ? { ...companion, [field]: value } : companion
      )
    )
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe seu nome completo.", variant: "destructive" })
      return false
    }

    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      toast({ title: "Email inválido", description: "Informe um email válido.", variant: "destructive" })
      return false
    }

    if (!formData.phone.trim() || !isValidPhone(formData.phone)) {
      toast({ title: "Telefone inválido", description: "Informe um telefone válido.", variant: "destructive" })
      return false
    }

    for (const companion of companions) {
      if (!companion.name.trim()) {
        toast({
          title: "Nome do acompanhante obrigatório",
          description: "Informe o nome de todos os acompanhantes.",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (localMode) {
        const response = {
          eventId,
          eventTitle,
          status: formData.attendanceStatus,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formatPhone(formData.phone.trim()),
          notes: formData.notes.trim(),
          dietaryRestrictions: formData.dietaryRestrictions.trim(),
          accessibilityNeeds: formData.accessibilityNeeds.trim(),
          companions: companions
            .filter((companion) => companion.name.trim())
            .map((companion) => ({
              name: companion.name.trim(),
              email: companion.email.trim(),
              phone: companion.phone.trim(),
              notes: companion.notes.trim(),
            })),
          createdAt: new Date().toISOString(),
        }
        const stored = JSON.parse(localStorage.getItem("public-invite-responses") || "[]")
        localStorage.setItem("public-invite-responses", JSON.stringify([...stored, response]))

        toast({
          title: formData.attendanceStatus === "confirmed" ? "Presença confirmada!" : "Resposta registrada",
          description:
            "Resposta salva neste navegador. Para registrar no painel do organizador, configure o Supabase.",
        })
        onSuccess?.()
        return
      }

      const endpoint = publicToken
        ? `/api/public-events/${publicToken}`
        : `/api/events/${eventId}/public-request`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          attendanceStatus: formData.attendanceStatus,
          email: formData.email.trim(),
          phone: formatPhone(formData.phone.trim()),
          notes: formData.notes.trim() || undefined,
          dietaryRestrictions: formData.dietaryRestrictions.trim() || undefined,
          accessibilityNeeds: formData.accessibilityNeeds.trim() || undefined,
          companions: companions
            .filter((companion) => companion.name.trim())
            .map((companion) => ({
              name: companion.name.trim(),
              email: companion.email.trim() || undefined,
              phone: companion.phone.trim() ? formatPhone(companion.phone.trim()) : undefined,
              notes: companion.notes.trim() || undefined,
            })),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro ao enviar solicitação")

      toast({
        title: data.status === "confirmed" ? "Presença confirmada!" : "Solicitação enviada!",
        description:
          data.message || "Você receberá uma atualização quando sua participação for analisada.",
      })

      setFormData({
        attendanceStatus: "confirmed",
        name: "",
        email: "",
        phone: "",
        notes: "",
        dietaryRestrictions: "",
        accessibilityNeeds: "",
      })
      setCompanions([])
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Seus dados
          </CardTitle>
          <CardDescription>Confirme sua presença em {eventTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Você vai participar? *</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-md border px-4 py-3 text-left text-sm transition hover:border-primary ${
                  formData.attendanceStatus === "confirmed" ? "border-primary bg-primary/10 font-medium" : "bg-background"
                }`}
                onClick={() => setFormData({ ...formData, attendanceStatus: "confirmed" })}
              >
                Sim, vou participar
              </button>
              <button
                type="button"
                className={`rounded-md border px-4 py-3 text-left text-sm transition hover:border-primary ${
                  formData.attendanceStatus === "declined" ? "border-primary bg-primary/10 font-medium" : "bg-background"
                }`}
                onClick={() => setFormData({ ...formData, attendanceStatus: "declined" })}
              >
                Não vou participar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">Restrições alimentares</Label>
            <Input
              id="dietaryRestrictions"
              value={formData.dietaryRestrictions}
              onChange={(event) => setFormData({ ...formData, dietaryRestrictions: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessibilityNeeds">Necessidades de acessibilidade</Label>
            <Input
              id="accessibilityNeeds"
              value={formData.accessibilityNeeds}
              onChange={(event) => setFormData({ ...formData, accessibilityNeeds: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {formData.attendanceStatus === "confirmed" && allowCompanions && maxCompanions > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Acompanhantes
                </CardTitle>
                <CardDescription>Até {maxCompanions} acompanhante(s)</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompanion}
                disabled={companions.length >= maxCompanions}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          {companions.length > 0 && (
            <CardContent className="space-y-4">
              {companions.map((companion, index) => (
                <div key={companion.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Acompanhante {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompanion(companion.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`companion-name-${companion.id}`}>Nome *</Label>
                      <Input
                        id={`companion-name-${companion.id}`}
                        value={companion.name}
                        onChange={(event) => updateCompanion(companion.id, "name", event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`companion-email-${companion.id}`}>Email</Label>
                        <Input
                          id={`companion-email-${companion.id}`}
                          type="email"
                          value={companion.email}
                          onChange={(event) => updateCompanion(companion.id, "email", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`companion-phone-${companion.id}`}>Telefone</Label>
                        <Input
                          id={`companion-phone-${companion.id}`}
                          value={companion.phone}
                          onChange={(event) => updateCompanion(companion.id, "phone", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`companion-notes-${companion.id}`}>Observações</Label>
                      <Input
                        id={`companion-notes-${companion.id}`}
                        value={companion.notes}
                        onChange={(event) => updateCompanion(companion.id, "notes", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
            formData.attendanceStatus === "confirmed" ? "Enviar confirmação" : "Enviar resposta"
        )}
      </Button>
    </form>
  )
}

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
  onSuccess?: () => void
}

export default function PublicRequestForm({ eventId, eventTitle, onSuccess }: PublicRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
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
    setCompanions([
      ...companions,
      {
        id: `companion-${Date.now()}`,
        name: "",
        email: "",
        phone: "",
        notes: "",
      },
    ])
  }

  const removeCompanion = (id: string) => {
    setCompanions(companions.filter((c) => c.id !== id))
  }

  const updateCompanion = (id: string, field: keyof Companion, value: string) => {
    setCompanions(
      companions.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    )
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email válido.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.phone.trim() || !isValidPhone(formData.phone)) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, informe um telefone válido.",
        variant: "destructive",
      })
      return false
    }

    // Validar acompanhantes
    for (const companion of companions) {
      if (!companion.name.trim()) {
        toast({
          title: "Nome do acompanhante obrigatório",
          description: "Por favor, informe o nome de todos os acompanhantes.",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/events/${eventId}/public-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formatPhone(formData.phone.trim()),
          notes: formData.notes.trim() || undefined,
          dietaryRestrictions: formData.dietaryRestrictions.trim() || undefined,
          accessibilityNeeds: formData.accessibilityNeeds.trim() || undefined,
          companions: companions
            .filter((c) => c.name.trim())
            .map((c) => ({
              name: c.name.trim(),
              email: c.email.trim() || undefined,
              phone: c.phone.trim() ? formatPhone(c.phone.trim()) : undefined,
              notes: c.notes.trim() || undefined,
            })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar solicitação")
      }

      toast({
        title: "Solicitação enviada!",
        description: "Você receberá um email quando sua participação for aprovada.",
      })

      // Limpar formulário
      setFormData({
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
          <CardDescription>
            Preencha seus dados para solicitar participação no evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">Restrições alimentares</Label>
            <Input
              id="dietaryRestrictions"
              placeholder="Ex: vegetariano, sem glúten, alergia a amendoim..."
              value={formData.dietaryRestrictions}
              onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessibilityNeeds">Necessidades de acessibilidade</Label>
            <Input
              id="accessibilityNeeds"
              placeholder="Ex: cadeira de rodas, intérprete de libras..."
              value={formData.accessibilityNeeds}
              onChange={(e) => setFormData({ ...formData, accessibilityNeeds: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Alguma informação adicional que deseja compartilhar..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Acompanhantes
              </CardTitle>
              <CardDescription>
                Adicione as pessoas que irão com você (opcional)
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCompanion}
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
              <div
                key={companion.id}
                className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Acompanhante {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompanion(companion.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`companion-name-${companion.id}`}>Nome *</Label>
                    <Input
                      id={`companion-name-${companion.id}`}
                      placeholder="Nome do acompanhante"
                      value={companion.name}
                      onChange={(e) => updateCompanion(companion.id, "name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`companion-email-${companion.id}`}>Email</Label>
                      <Input
                        id={`companion-email-${companion.id}`}
                        type="email"
                        placeholder="email@exemplo.com"
                        value={companion.email}
                        onChange={(e) => updateCompanion(companion.id, "email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`companion-phone-${companion.id}`}>Telefone</Label>
                      <Input
                        id={`companion-phone-${companion.id}`}
                        placeholder="(00) 00000-0000"
                        value={companion.phone}
                        onChange={(e) => updateCompanion(companion.id, "phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`companion-notes-${companion.id}`}>Observações</Label>
                    <Input
                      id={`companion-notes-${companion.id}`}
                      placeholder="Restrições alimentares, acessibilidade..."
                      value={companion.notes}
                      onChange={(e) => updateCompanion(companion.id, "notes", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando solicitação...
            </>
          ) : (
            "Solicitar participação"
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Ao enviar, você receberá um email informando se sua solicitação foi aprovada.
        </p>
      </div>
    </form>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Check, Clock, Loader2, MapPin, Utensils, Accessibility, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"

export default function ConfirmInvitationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dietaryRestrictions, setDietaryRestrictions] = useState("")
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("")
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { getEventById, getGuestById, updateGuest, updateGuestStatus } = useEventStore()
  const eventId = params.eventId as string
  const guestId = params.guestId as string

  const event = getEventById(eventId)
  const guest = event ? getGuestById(eventId, guestId) : null
  const autoResponse = searchParams.get("response")

  useEffect(() => {
    if (guest) {
      if (guest.dietaryRestrictions) setDietaryRestrictions(guest.dietaryRestrictions)
      if (guest.accessibilityNeeds) setAccessibilityNeeds(guest.accessibilityNeeds)
    }
  }, [guest])

  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setIsLoading(false)

      if (!event || !guest) {
        toast({
          title: "Convite não encontrado",
          description: "O convite que você está procurando não existe ou expirou.",
          variant: "destructive",
        })
        router.push("/")
      }

      if (guest && (guest.status === "confirmed" || guest.status === "declined")) {
        toast({
          title: "Resposta já registrada",
          description: `Você já ${guest.status === "confirmed" ? "confirmou" : "recusou"} este convite anteriormente.`,
        })
      }

      if (autoResponse && guest && guest.status === "pending") {
        handleResponse(autoResponse === "confirm" ? "confirmed" : "declined")
      }
    }

    loadData()
  }, [event, guest, router, toast, autoResponse])

  const handleResponse = async (status: "confirmed" | "declined") => {
    if (!event || !guest) return

    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 600))

      if (status === "confirmed") {
        updateGuest(eventId, guestId, {
          status: "confirmed",
          dietaryRestrictions: dietaryRestrictions.trim() || undefined,
          accessibilityNeeds: accessibilityNeeds.trim() || undefined,
        })
      } else {
        updateGuestStatus(eventId, guestId, "declined")
      }

      router.push(`/confirm-invitation/thank-you?status=${status}`)
    } catch {
      toast({
        title: "Erro ao processar resposta",
        description: "Ocorreu um erro ao processar sua resposta. Tente novamente.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  if (isLoading || !event || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-medium text-foreground">Carregando convite...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-8">
      <Card className="w-full max-w-md shadow-md border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Convite para {event.title}</CardTitle>
          <CardDescription className="text-base text-muted-foreground">Olá, <strong className="text-foreground">{guest.name}</strong>!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Você foi convidado para participar deste evento. Por favor, confirme sua presença abaixo:
          </p>

          <div className="bg-muted/50 p-4 rounded-lg border border-border/60 space-y-3 text-sm">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Data</p>
                <p className="text-muted-foreground">{event.date}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Horário</p>
                <p className="text-muted-foreground">{event.time || event.startTime || "A definir"}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Local</p>
                <p className="text-muted-foreground">{event.location || event.address || "Local a confirmar"}</p>
              </div>
            </div>
          </div>

          {guest.status === "pending" ? (
            <div className="space-y-4 pt-2">
              {/* Campos de Restrição e Acessibilidade para o Buffet */}
              <div className="space-y-3 rounded-lg border border-border/80 bg-background p-3.5 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="dietary" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Utensils className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Restrição alimentar para o buffet (opcional)
                  </Label>
                  <Input
                    id="dietary"
                    placeholder="Ex: Vegetariano, Vegano, Celíaco/Sem glúten, Alergia"
                    value={dietaryRestrictions}
                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accessibility" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Accessibility className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Necessidade de acessibilidade (opcional)
                  </Label>
                  <Input
                    id="accessibility"
                    placeholder="Ex: Cadeirante, mobilidade reduzida, intérprete"
                    value={accessibilityNeeds}
                    onChange={(e) => setAccessibilityNeeds(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <p className="text-center font-medium text-sm text-foreground">Você poderá comparecer?</p>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleResponse("confirmed")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Sim, confirmar presença
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-muted"
                    onClick={() => handleResponse("declined")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2 text-red-500" />}
                    Não poderei ir
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/40 p-4 rounded-lg border border-border text-center space-y-1">
              <p className="font-semibold text-foreground">
                Você já {guest.status === "confirmed" ? "confirmou" : "recusou"} este convite.
              </p>
              <p className="text-xs text-muted-foreground">
                {guest.status === "confirmed"
                  ? "Obrigado pela confirmação! Suas preferências foram salvas para a recepção."
                  : "Agradecemos por nos avisar. Sentiremos sua falta!"}
              </p>
              {guest.dietaryRestrictions ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                  🥗 Restrição informada: {guest.dietaryRestrictions}
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-muted-foreground pt-2">
          <p>Planeja+ · Gestão Inteligente de Eventos</p>
        </CardFooter>
      </Card>
    </div>
  )
}

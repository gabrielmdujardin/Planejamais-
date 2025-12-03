"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Check, Clock, Loader2, MapPin, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"

export default function ConfirmInvitationPage({
  params,
}: {
  params: { eventId: string; guestId: string }
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { getEventById, getGuestById, updateGuestStatus } = useEventStore()

  const event = getEventById(params.eventId)
  const guest = event ? getGuestById(params.eventId, params.guestId) : null
  const autoResponse = searchParams.get("response")

  useEffect(() => {
    const loadData = async () => {
      // Simular carregamento de dados
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsLoading(false)

      // Se não encontrar o evento ou convidado, redirecionar
      if (!event || !guest) {
        toast({
          title: "Convite não encontrado",
          description: "O convite que você está procurando não existe ou expirou.",
          variant: "destructive",
        })
        router.push("/")
      }

      // Se o convidado já confirmou ou recusou, mostrar mensagem
      if (guest && (guest.status === "confirmed" || guest.status === "declined")) {
        toast({
          title: "Resposta já registrada",
          description: `Você já ${guest.status === "confirmed" ? "confirmou" : "recusou"} este convite anteriormente.`,
        })
      }

      // Se veio com resposta automática, processar
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
      // Simular chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Atualizar status do convidado
      updateGuestStatus(params.eventId, params.guestId, status)

      // Redirecionar para página de agradecimento
      router.push(`/confirm-invitation/thank-you?status=${status}`)
    } catch (error) {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <h2 className="text-xl font-medium">Carregando convite...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Convite para {event.title}</CardTitle>
          <CardDescription>Olá, {guest.name}!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">
            Você foi convidado para participar deste evento. Por favor, confirme sua presença.
          </p>

          <div className="bg-gray-50 p-4 rounded-md space-y-3">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-3 text-emerald-600" />
              <div>
                <p className="font-medium">Data</p>
                <p className="text-gray-600">{event.date}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-emerald-600" />
              <div>
                <p className="font-medium">Horário</p>
                <p className="text-gray-600">{event.time}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-3 text-emerald-600" />
              <div>
                <p className="font-medium">Local</p>
                <p className="text-gray-600">{event.location}</p>
              </div>
            </div>
          </div>

          {guest.status === "pending" ? (
            <div className="flex flex-col gap-3 pt-2">
              <p className="text-center font-medium">Você poderá comparecer?</p>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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
                  className="flex-1"
                  onClick={() => handleResponse("declined")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                  Não poderei ir
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <p className="font-medium">
                Você já {guest.status === "confirmed" ? "confirmou" : "recusou"} este convite.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {guest.status === "confirmed"
                  ? "Obrigado pela confirmação! Esperamos você no evento."
                  : "Sentimos sua falta. Talvez na próxima!"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <p>Convite enviado através do Planeja+ App</p>
        </CardFooter>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ChevronRight, Clock, MapPin, X } from "lucide-react"
import Link from "next/link"

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isConfirmed = status === "confirmed"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4">
            {isConfirmed ? (
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
            ) : (
              <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">{isConfirmed ? "Presença confirmada!" : "Resposta registrada"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>
            {isConfirmed
              ? "Obrigado por confirmar sua presença. Estamos ansiosos para vê-lo no evento!"
              : "Agradecemos por nos informar que não poderá comparecer. Sentiremos sua falta!"}
          </p>

          {isConfirmed && (
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <h3 className="font-medium">Dicas para o evento:</h3>
              <ul className="space-y-2 text-sm text-left">
                <li className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-0.5 text-emerald-600" />
                  <span>Chegue com 15 minutos de antecedência para evitar atrasos.</span>
                </li>
                <li className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-emerald-600" />
                  <span>Verifique a localização do evento com antecedência para planejar sua rota.</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-4 w-4 mr-2 mt-0.5 text-emerald-600" />
                  <span>Se precisar alterar sua resposta, entre em contato com o organizador do evento.</span>
                </li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" passHref>
            <Button variant="outline">Voltar para a página inicial</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

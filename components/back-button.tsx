"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.back()}
      className="gap-2 border-border bg-card hover:bg-muted text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Button>
  )
}

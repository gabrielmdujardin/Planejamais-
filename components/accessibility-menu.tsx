"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Accessibility, ZoomIn, Eye, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AccessibilityMenu() {
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const { toast } = useToast()

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0])
    document.documentElement.style.fontSize = `${value[0]}%`
    toast({
      title: "Tamanho da fonte alterado",
      description: `O tamanho da fonte foi ajustado para ${value[0]}%`,
    })
  }

  const toggleHighContrast = () => {
    setHighContrast(!highContrast)
    document.documentElement.classList.toggle("high-contrast")
    toast({
      title: `Modo de alto contraste ${!highContrast ? "ativado" : "desativado"}`,
      description: "As cores foram ajustadas para melhor visibilidade",
    })
  }

  const toggleReducedMotion = () => {
    setReducedMotion(!reducedMotion)
    document.documentElement.classList.toggle("reduced-motion")
    toast({
      title: `Animações ${!reducedMotion ? "reduzidas" : "normais"}`,
      description: `As animações foram ${!reducedMotion ? "reduzidas" : "restauradas"}`,
    })
  }

  const resetAccessibility = () => {
    setFontSize(100)
    setHighContrast(false)
    setReducedMotion(false)
    document.documentElement.style.fontSize = "100%"
    document.documentElement.classList.remove("high-contrast", "reduced-motion")
    toast({
      title: "Configurações restauradas",
      description: "Todas as configurações de acessibilidade foram restauradas",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Menu de acessibilidade">
          <Accessibility className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Acessibilidade</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-2">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" /> Tamanho da fonte
              </Label>
              <span className="text-sm">{fontSize}%</span>
            </div>
            <Slider
              value={[fontSize]}
              min={75}
              max={150}
              step={5}
              onValueChange={handleFontSizeChange}
              aria-label="Ajustar tamanho da fonte"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <Label htmlFor="high-contrast" className="flex items-center gap-2 cursor-pointer">
              <Palette className="h-4 w-4" /> Modo de alto contraste
            </Label>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={toggleHighContrast}
              aria-label="Ativar modo de alto contraste"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <Label htmlFor="reduced-motion" className="flex items-center gap-2 cursor-pointer">
              <Eye className="h-4 w-4" /> Reduzir animações
            </Label>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={toggleReducedMotion}
              aria-label="Reduzir animações"
            />
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={resetAccessibility} className="justify-center text-center cursor-pointer">
          Restaurar configurações padrão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

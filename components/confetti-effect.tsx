"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"

interface ConfettiEffectProps {
  trigger?: boolean
  duration?: number
  particleCount?: number
  spread?: number
  origin?: {
    x?: number
    y?: number
  }
}

export function ConfettiEffect({
  trigger = true,
  duration = 3000,
  particleCount = 100,
  spread = 70,
  origin = { y: 0.5 },
}: ConfettiEffectProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true)

      // Configuração do confete
      const defaults = {
        startVelocity: 30,
        spread,
        ticks: 60,
        zIndex: 0,
        particleCount,
        origin: {
          x: origin.x ?? Math.random(),
          y: origin.y ?? 0.5,
        },
      }

      // Lançar confete
      confetti({
        ...defaults,
        particleCount: particleCount * 0.25,
        scalar: 2,
      })

      confetti({
        ...defaults,
        particleCount: particleCount * 0.2,
        scalar: 2.5,
      })

      confetti({
        ...defaults,
        particleCount: particleCount * 0.35,
        scalar: 1.8,
      })

      confetti({
        ...defaults,
        particleCount: particleCount * 0.1,
        scalar: 2.8,
      })

      confetti({
        ...defaults,
        particleCount: particleCount * 0.1,
        scalar: 1.5,
      })

      // Resetar após a duração
      const timer = setTimeout(() => {
        setIsActive(false)
      }, duration)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [trigger, isActive, duration, particleCount, spread, origin])

  return null
}

"use client"

import { useEffect, useRef } from "react"

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Configuração dos círculos
    const circles = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 300 + 100,
      vx: Math.random() * 0.2 - 0.1,
      vy: Math.random() * 0.2 - 0.1,
      color: Math.floor(Math.random() * 360),
    }))

    const drawCircle = (x: number, y: number, radius: number, color: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `hsla(${color}, 100%, 60%, 0.3)`)
      gradient.addColorStop(1, `hsla(${color}, 100%, 60%, 0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    const animate = () => {
      // Limpar o canvas com um fundo semi-transparente para criar um efeito de rastro
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
      ctx.fillRect(0, 0, width, height)

      // Desenhar e mover os círculos
      circles.forEach((circle) => {
        // Atualizar posição
        circle.x += circle.vx
        circle.y += circle.vy

        // Mudar direção ao tocar nas bordas
        if (circle.x < -circle.radius) circle.x = width + circle.radius
        if (circle.x > width + circle.radius) circle.x = -circle.radius
        if (circle.y < -circle.radius) circle.y = height + circle.radius
        if (circle.y > height + circle.radius) circle.y = -circle.radius

        // Mudar cor gradualmente
        circle.color = (circle.color + 0.1) % 360

        // Desenhar círculo
        drawCircle(circle.x, circle.y, circle.radius, circle.color)
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 opacity-30 dark:opacity-10"
      aria-hidden="true"
    />
  )
}

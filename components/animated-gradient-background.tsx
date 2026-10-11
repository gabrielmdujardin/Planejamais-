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

    // Configuração sutil dos círculos com tons esmeralda e neutros
    const circles = Array.from({ length: 4 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 250 + 150,
      vx: Math.random() * 0.1 - 0.05,
      vy: Math.random() * 0.1 - 0.05,
      color: 158, // Matiz esmeralda da marca
    }))

    const drawCircle = (x: number, y: number, radius: number, hue: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `hsla(${hue}, 50%, 50%, 0.08)`)
      gradient.addColorStop(1, `hsla(${hue}, 50%, 50%, 0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    const animate = () => {
      // Limpeza suave
      ctx.clearRect(0, 0, width, height)

      // Desenhar e mover os círculos
      circles.forEach((circle) => {
        circle.x += circle.vx
        circle.y += circle.vy

        if (circle.x < -circle.radius) circle.x = width + circle.radius
        if (circle.x > width + circle.radius) circle.x = -circle.radius
        if (circle.y < -circle.radius) circle.y = height + circle.radius
        if (circle.y > height + circle.radius) circle.y = -circle.radius

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

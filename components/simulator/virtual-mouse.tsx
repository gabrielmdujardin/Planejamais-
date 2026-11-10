"use client"

import { useEffect, useState } from "react"

export interface MousePosition {
  x: number // porcentagem de 0 a 100
  y: number // porcentagem de 0 a 100
}

interface VirtualMouseProps {
  position: MousePosition
  isClicking: boolean
  actionText?: string
  visible?: boolean
}

export function VirtualMouse({
  position,
  isClicking,
  actionText,
  visible = true,
}: VirtualMouseProps) {
  const [ripple, setRipple] = useState(false)

  useEffect(() => {
    if (isClicking) {
      setRipple(true)
      const t = setTimeout(() => setRipple(false), 500)
      return () => clearTimeout(t)
    }
  }, [isClicking])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-700 ease-out flex flex-col items-start select-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-2px, -2px)",
      }}
    >
      {/* Onda de Clique (Ripple Wave Effect) */}
      {ripple && (
        <span
          className="absolute -left-3 -top-3 w-8 h-8 rounded-full border-2 border-primary bg-primary/30 animate-ping pointer-events-none"
          style={{ animationDuration: "500ms" }}
        />
      )}

      {/* Ícone de Cursor do Sistema Operacional (SVG Preciso com Drop Shadow) */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] transition-transform duration-150 ${
          isClicking ? "scale-90" : "scale-100"
        }`}
      >
        <path
          d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
          fill="#111827"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Tooltip Dinâmico do Cursor Indicando a Ação */}
      {actionText && (
        <div
          className={`ml-5 -mt-1 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide whitespace-nowrap shadow-md border transition-all duration-200 ${
            isClicking
              ? "bg-primary text-primary-foreground border-primary scale-105"
              : "bg-card/95 text-foreground border-border/80 backdrop-blur-sm"
          }`}
        >
          <span className="flex items-center gap-1.5 font-mono">
            {isClicking && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
            {actionText}
          </span>
        </div>
      )}
    </div>
  )
}


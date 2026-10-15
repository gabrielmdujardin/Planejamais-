import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  /** Mantido por compatibilidade com usos antigos; o logo agora é estático. */
  animated?: boolean
  /** Quando false, renderiza sem link (útil dentro de outro elemento clicável). */
  asLink?: boolean
  className?: string
}

const sizes = {
  sm: { text: "text-[22px]", mark: "h-5 w-5", gap: "gap-1.5" },
  md: { text: "text-[28px]", mark: "h-6 w-6", gap: "gap-2" },
  lg: { text: "text-[44px]", mark: "h-9 w-9", gap: "gap-2.5" },
}

/** Marca: um "+" desenhado como dois traços de agenda sobre um selo verde. */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="10" className="fill-primary" />
      <path d="M16 8.5v15M8.5 16h15" className="stroke-primary-foreground" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23.5" cy="8.5" r="2.6" className="fill-lime" />
    </svg>
  )
}

export function Logo({ size = "md", asLink = true, className }: LogoProps) {
  const s = sizes[size]
  const content = (
    <span className={cn("inline-flex items-center leading-none text-foreground", s.gap, className)}>
      <Mark className={cn(s.mark, "shrink-0 transition-transform duration-700 ease-fluid group-hover:rotate-90")} />
      <span className={cn("font-serif tracking-[-0.02em]", s.text)}>
        Planeja<span className="italic text-primary">+</span>
      </span>
    </span>
  )

  if (!asLink) return content

  return (
    <Link href="/" aria-label="Planeja+ — página inicial" className="group inline-flex rounded-lg">
      {content}
    </Link>
  )
}

import type { ReactNode } from "react"

/**
 * Moldura das telas de autenticação: painel editorial à esquerda
 * (some no mobile) e formulário à direita.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  aside,
  brand,
  children,
}: {
  eyebrow: string
  title: ReactNode
  subtitle: string
  aside: { quote: ReactNode; caption: string }
  brand: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative z-[2] -mt-[68px] grid min-h-[100dvh] bg-background md:-mt-[76px] lg:grid-cols-2">
      {/* Painel editorial */}
      <aside className="relative hidden p-3 lg:block">
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-espresso p-12 pt-28 text-[#F2EDE3]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/40 blur-3xl"
          />
          <span className="relative w-max rounded-full bg-white/[0.07] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#F2EDE3]/70">
            Planeja+
          </span>
          <blockquote className="relative">
            <p className="display text-[clamp(2.25rem,3.6vw,3.5rem)] leading-[1.02]">{aside.quote}</p>
            <footer className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[#F2EDE3]/50">
              {aside.caption}
            </footer>
          </blockquote>
        </div>
      </aside>

      {/* Formulário */}
      <div className="flex items-center justify-center px-5 pb-12 pt-28 md:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">{brand}</div>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display mt-5 text-[clamp(2.5rem,5vw,3.5rem)]">{title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
          <div className="mt-9">{children}</div>
        </div>
      </div>
    </div>
  )
}

export const authInputClass =
  "h-12 rounded-2xl border-0 bg-card pl-11 text-[15px] shadow-[inset_0_0_0_1px_hsl(var(--border))] transition-shadow duration-300 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_1.5px_hsl(var(--primary))]"

export const authLabelClass = "font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground"

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, ArrowUpRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AccessibilityMenu } from "@/components/accessibility-menu"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

const appLinks = [
  { href: "/dashboard", label: "Painel" },
  { href: "/calendar", label: "Calendário" },
  { href: "/contacts", label: "Contatos" },
  { href: "/dashboard/analytics", label: "Análise" },
]

const publicLinks = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/pricing", label: "Preços" },
]

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const links = user ? appLinks : publicLinks

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Fecha o menu ao navegar e trava o scroll enquanto aberto
  useEffect(() => setIsMenuOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  const isActive = (href: string) => !href.includes("#") && pathname === href

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-5">
        <nav
          aria-label="Navegação principal"
          className={cn(
            "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-5 pr-2 transition-[background-color,box-shadow] duration-500 ease-fluid",
            scrolled || isMenuOpen
              ? "bg-card/80 shadow-[0_12px_32px_-18px_rgba(28,26,23,0.35)] ring-1 ring-foreground/[0.06] backdrop-blur-xl"
              : "bg-transparent",
          )}
        >
          <Logo size="sm" />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[13.5px] transition-colors duration-300 ease-fluid",
                  isActive(link.href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-0.5 sm:flex">
              <ThemeToggle />
              <AccessibilityMenu />
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden items-center gap-2 rounded-full bg-secondary py-1.5 pl-1.5 pr-4 text-[13.5px] md:inline-flex"
                    aria-label="Menu da conta"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-[11px] text-primary-foreground">
                      {(user.name || "U").slice(0, 1).toUpperCase()}
                    </span>
                    {user.name?.split(" ")[0] || "Conta"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5">
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link href="/profile" className="flex cursor-pointer items-center gap-2">
                      <User className="h-4 w-4" strokeWidth={1.5} /> Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="flex cursor-pointer items-center gap-2 rounded-xl text-clay">
                    <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-[13.5px] text-foreground transition-colors hover:bg-secondary"
                >
                  Entrar
                </Link>
                <Link href="/register" className="btn-pill btn-primary py-1.5 pl-4 pr-1.5 text-[13.5px]">
                  Começar grátis
                  <span className="btn-orb h-7 w-7">
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                </Link>
              </div>
            )}

            {/* Hambúrguer que se transforma em X */}
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary md:hidden"
            >
              <span
                className={cn(
                  "absolute h-[1.5px] w-4 bg-foreground transition-transform duration-500 ease-fluid",
                  isMenuOpen ? "rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                className={cn(
                  "absolute h-[1.5px] w-4 bg-foreground transition-transform duration-500 ease-fluid",
                  isMenuOpen ? "-rotate-45" : "translate-y-[4px]",
                )}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Menu móvel em tela cheia */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-30 bg-background/90 backdrop-blur-2xl transition-opacity duration-500 ease-fluid md:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex h-full flex-col justify-between px-6 pb-10 pt-28">
          <ul className="space-y-1">
            {[...links, ...(user ? [{ href: "/profile", label: "Perfil" }] : [])].map((link, i) => (
              <li
                key={link.href}
                className={cn(
                  "transition-all duration-700 ease-fluid",
                  isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
                )}
                style={{ transitionDelay: isMenuOpen ? `${80 + i * 60}ms` : "0ms" }}
              >
                <Link
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  tabIndex={isMenuOpen ? 0 : -1}
                  className="display block py-2 text-5xl text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "space-y-4 transition-all delay-300 duration-700 ease-fluid",
              isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AccessibilityMenu />
            </div>
            {user ? (
              <button
                onClick={() => {
                  logout()
                  setIsMenuOpen(false)
                }}
                tabIndex={isMenuOpen ? 0 : -1}
                className="btn-pill btn-ghost btn-plain w-full justify-center"
              >
                Sair da conta
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" tabIndex={isMenuOpen ? 0 : -1} className="btn-pill btn-ghost btn-plain justify-center">
                  Entrar
                </Link>
                <Link href="/register" tabIndex={isMenuOpen ? 0 : -1} className="btn-pill btn-primary justify-center pr-6">
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Logo } from "@/components/logo"
import {
  CalendarDays,
  Users,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Clock,
  LayoutDashboard,
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Hero Section Editorial */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Texto de Proposta de Valor */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gestão inteligente para seus momentos</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Planeje encontros e viagens sem o estresse da{" "}
                <span className="text-primary underline decoration-primary/30 underline-offset-8">
                  desorganização.
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Centralize convidados, controle presenças por RSVP com limite de segurança,
                atribua tarefas e divida custos colaborativos com total transparência.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/register">
                  <Button size="lg" className="shadow-md text-base px-7 gap-2 w-full sm:w-auto">
                    Cadastre-se grátis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-base px-7 w-full sm:w-auto">
                    Fazer login
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground border-t border-border/60">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Confirmação segura por token</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Sem custos ocultos</span>
                </div>
              </div>
            </div>

            {/* Demonstração Real do Produto (Product Showcase) */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                {/* Efeito de profundidade e card de demonstração */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-teal-500/20 blur-xl opacity-50" />
                
                <Card className="relative bg-card border-border/80 shadow-xl rounded-2xl overflow-hidden">
                  {/* Barra de simulação do app */}
                  <div className="bg-muted/60 px-4 py-3 border-b border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                      <span className="text-[11px] font-medium text-muted-foreground ml-2">app.planejamais.com</span>
                    </div>
                    <Badge variant="success" size="sm">Ao vivo</Badge>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-primary">Churrasco da Turma 2026</span>
                        <span>24 Outubro</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">Sítio Recanto Verde</div>
                    </div>

                    {/* Mini progresso de convidados */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Confirmações RSVP</span>
                        <span className="text-foreground">18 / 24 confirmados (75%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full w-[75%]" />
                      </div>
                    </div>

                    {/* Lista resumida de divisão de despesas */}
                    <div className="space-y-2 pt-1 text-xs">
                      <span className="font-semibold text-foreground">Divisão Colaborativa</span>
                      <div className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-background">
                        <span className="text-muted-foreground">Carnes & Bebidas</span>
                        <span className="font-semibold text-foreground">R$ 540,00</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-background">
                        <span className="text-muted-foreground">Locação do Espaço</span>
                        <span className="font-semibold text-foreground">R$ 360,00</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-md bg-primary/10 text-primary font-bold">
                        <span>Valor por pessoa:</span>
                        <span>R$ 50,00</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Pilares de Valor (Editorial Grid) */}
      <section id="features" className="py-20 bg-muted/20 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Arquitetura de Recursos</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Tudo o que seu evento precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Projetado para eliminar planilhas confusas e mensagens soltas de confirmação.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-card border-border/80 shadow-sm space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Planejamento Ágil</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure data, local, capacidade e cronograma com visualização integrada por calendário ou lista.
              </p>
            </Card>

            <Card className="p-6 bg-card border-border/80 shadow-sm space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">RSVP Automatizado</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Envie links individuais ou públicos com controle de taxa de requisições e validação em tempo real.
              </p>
            </Card>

            <Card className="p-6 bg-card border-border/80 shadow-sm space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Divisão Justa de Custos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cadastre itens, acompanhe compras e descubra o valor exato por pessoa sem cálculos manuais.
              </p>
            </Card>

            <Card className="p-6 bg-card border-border/80 shadow-sm space-y-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Controle de Tarefas</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Distribua responsabilidades e visualize o que já foi providenciado antes do início do evento.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Pronto para transformar sua próxima celebração?</h2>
          <p className="text-primary-foreground/80 text-sm md:text-base max-w-xl mx-auto">
            Crie sua conta agora e experimente como organizar eventos pode ser simples e gratificante.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-emerald-950 hover:bg-white/90 font-semibold px-8 shadow-md active:scale-[0.98]"
              >
                Começar gratuitamente
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white font-semibold px-8"
              >
                Acessar minha conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h2 className="text-2xl font-bold text-white mb-4">Planeja+</h2>
              <p className="max-w-xs">Simplifique a organização dos seus eventos e aproveite mais os momentos.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Produto</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/features" className="hover:text-white transition-colors">
                      Funcionalidades
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-white transition-colors">
                      Preços
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-white transition-colors">
                      Sobre nós
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Suporte</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/help" className="hover:text-white transition-colors">
                      Central de ajuda
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white transition-colors">
                      Contato
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/terms" className="hover:text-white transition-colors">
                      Termos de uso
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-white transition-colors">
                      Privacidade
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Planeja+. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

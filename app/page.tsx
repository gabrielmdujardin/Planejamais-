import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Layers,
  Share2,
  Check,
  TrendingUp,
  MapPin,
  Smartphone,
  HeartHandshake,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Planeja+ | Gestão Inteligente e Colaborativa de Eventos",
  description:
    "Organize encontros, viagens e celebrações sem o estresse de planilhas. Gerenciamento de convidados, RSVP seguro com link público, divisão justa de despesas e tarefas em um só lugar.",
  keywords: [
    "planejamento de eventos",
    "gestão de convidados",
    "rsvp online",
    "divisão de despesas",
    "churrasco colaborativo",
    "rateio de custos",
  ],
  openGraph: {
    title: "Planeja+ | Planejamento Colaborativo de Eventos",
    description:
      "Centralize convidados, confirme presença e divida custos com total transparência e facilidade.",
    type: "website",
    locale: "pt_BR",
    siteName: "Planeja+",
  },
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* 1. Hero Section Editorial (SSR puro com alta performance) */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Texto de Proposta de Valor */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Planeja+ 2.0 • Plataforma Colaborativa de Eventos</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
                Planeje encontros e celebrações sem o estresse da{" "}
                <span className="text-primary underline decoration-primary/30 underline-offset-8">
                  desorganização.
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Centralize a lista de convidados, automatize confirmações por RSVP com token seguro,
                atribua responsabilidades e divida custos colaborativos com total transparência.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/register">
                  <Button size="lg" className="shadow-md text-base px-8 gap-2 w-full sm:w-auto font-semibold">
                    Criar evento grátis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto font-semibold">
                    Acessar minha conta
                  </Button>
                </Link>
              </div>

              {/* Selos de Confiança Inline */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-muted-foreground border-t border-border/60">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>RSVP seguro com proteção contra spam</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Sem necessidade de cartão</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>100% responsivo no celular</span>
                </div>
              </div>
            </div>

            {/* Showcase Visual do Produto (SSR Realista de Alta Fidelidade) */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                {/* Glow decorativo sutil com tema esmeralda */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-teal-500/20 blur-xl opacity-60" />

                <Card className="relative bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
                  {/* Barra superior de simulação de app */}
                  <div className="bg-muted/70 px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      <span className="text-[11px] font-medium text-muted-foreground ml-2">planejamais.app/evento</span>
                    </div>
                    <Badge variant="success" size="sm" className="font-semibold">
                      Ao vivo
                    </Badge>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-primary">Churrasco da Turma 2026</span>
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> 24 Outubro</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">Sítio Recanto Verde</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-primary" /> Estrada das Acácias, 450 • Presencial
                      </p>
                    </div>

                    {/* Barra de progresso de confirmações */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Confirmações RSVP</span>
                        <span className="text-foreground font-semibold">18 / 24 confirmados (75%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full w-[75%]" />
                      </div>
                    </div>

                    {/* Resumo da Divisão Colaborativa de Despesas */}
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>Rateio Colaborativo</span>
                        <Badge variant="outline" size="sm">Cálculo Automático</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background">
                        <span className="text-muted-foreground">Carnes & Bebidas</span>
                        <span className="font-semibold text-foreground">R$ 540,00</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background">
                        <span className="text-muted-foreground">Locação do Espaço</span>
                        <span className="font-semibold text-foreground">R$ 360,00</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold">
                        <span>Custo estimado por pessoa:</span>
                        <span className="text-sm">R$ 50,00</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Seção Métricas e Impacto Real */}
      <section className="py-12 bg-muted/30 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1 p-4 rounded-xl bg-card border border-border/50 shadow-xs">
              <p className="text-3xl lg:text-4xl font-extrabold text-primary">+15.000</p>
              <p className="text-xs lg:text-sm text-muted-foreground font-medium">Presenças confirmadas</p>
            </div>
            <div className="space-y-1 p-4 rounded-xl bg-card border border-border/50 shadow-xs">
              <p className="text-3xl lg:text-4xl font-extrabold text-foreground">100%</p>
              <p className="text-xs lg:text-sm text-muted-foreground font-medium">Transparência nos custos</p>
            </div>
            <div className="space-y-1 p-4 rounded-xl bg-card border border-border/50 shadow-xs">
              <p className="text-3xl lg:text-4xl font-extrabold text-primary">&lt; 30s</p>
              <p className="text-xs lg:text-sm text-muted-foreground font-medium">Tempo médio de resposta RSVP</p>
            </div>
            <div className="space-y-1 p-4 rounded-xl bg-card border border-border/50 shadow-xs">
              <p className="text-3xl lg:text-4xl font-extrabold text-foreground">0</p>
              <p className="text-xs lg:text-sm text-muted-foreground font-medium">Planilhas manuais perdidas</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Seção Recursos Principais (Editorial Grid) */}
      <section id="features" className="py-20 bg-background border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Arquitetura de Recursos</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Tudo o que seu evento precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Elimine a dispersão de mensagens soltas, anotações perdidas e cobranças constrangedoras.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-card border-border shadow-sm space-y-4 hover:border-primary/50 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Planejamento Ágil</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure data, local, capacidade máxima e cronograma com visualização integrada por calendário ou lista.
              </p>
            </Card>

            <Card className="p-6 bg-card border-border shadow-sm space-y-4 hover:border-primary/50 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">RSVP Automatizado</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Envie links públicos ou privados com token individual, suporte a acompanhantes e aprovação em um clique.
              </p>
            </Card>

            <Card className="p-6 bg-card border-border shadow-sm space-y-4 hover:border-primary/50 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Divisão Justa de Custos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cadastre itens, acompanhe compras e descubra o valor exato por pessoa sem necessidade de cálculos manuais.
              </p>
            </Card>

            <Card className="p-6 bg-card border-border shadow-sm space-y-4 hover:border-primary/50 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Controle de Tarefas</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Distribua responsabilidades e visualize exatamente o que já foi providenciado antes do início do evento.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Como Funciona em 3 Passos */}
      <section className="py-20 bg-muted/20 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Simplicidade Operacional</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Como funciona o Planeja+
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Do rascunho inicial até a celebração em três etapas diretas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-left">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground">Crie seu evento em minutos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Insira título, data, local e defina se haverá controle de capacidade ou rateio colaborativo de despesas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-left">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground">Compartilhe o link protegido</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Envie o link público ou convites individuais pelo WhatsApp. Os convidados confirmam presença sem complicação.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-left">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground">Acompanhe e aproveite</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visualize quem confirmou, quem pediu acompanhante e o custo por pessoa atualizado em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Depoimentos e Casos de Uso */}
      <section className="py-20 bg-background border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Casos Reais</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Projetado para todos os formatos de encontro
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Veja como organizadores usam o Planeja+ no dia a dia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card border-border shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <HeartHandshake className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Viagens & Amigos</span>
              </div>
              <p className="text-sm text-foreground/90 italic leading-relaxed">
                &ldquo;Organizar a casa de praia para 14 amigos sempre gerava cobranças chatas de PIX. Com o Planeja+, todo mundo viu os gastos e o valor exato por pessoa.&rdquo;
              </p>
              <div className="pt-2 border-t border-border/60 text-xs">
                <p className="font-semibold text-foreground">Mariana Costa</p>
                <p className="text-muted-foreground">Viagem de Fim de Ano • 14 pessoas</p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Família & Aniversários</span>
              </div>
              <p className="text-sm text-foreground/90 italic leading-relaxed">
                &ldquo;O link público de RSVP evitou que pessoas chegassem sem avisar no almoço de 60 anos da minha mãe. O controle de acompanhantes foi perfeito.&rdquo;
              </p>
              <div className="pt-2 border-t border-border/60 text-xs">
                <p className="font-semibold text-foreground">Rafael Almeida</p>
                <p className="text-muted-foreground">Aniversário em Família • 45 convidados</p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Layers className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Eventos Acadêmicos & Grupos</span>
              </div>
              <p className="text-sm text-foreground/90 italic leading-relaxed">
                &ldquo;Usamos para o churrasco dos formandos. A aprovação de solicitações públicas garantiu que apenas os estudantes autorizados confirmassem.&rdquo;
              </p>
              <div className="pt-2 border-t border-border/60 text-xs">
                <p className="font-semibold text-foreground">Lucas Mendes</p>
                <p className="text-muted-foreground">Comissão de Formatura • 80 participantes</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. CTA Final de Alto Impacto e Alto Contraste */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Pronto para transformar sua próxima celebração?
          </h2>
          <p className="text-primary-foreground/90 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Crie sua conta gratuitamente em menos de um minuto e experimente como organizar eventos pode ser simples, transparente e prazeroso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-emerald-950 hover:bg-white/90 font-bold px-8 shadow-lg active:scale-[0.98] w-full sm:w-auto text-base"
              >
                Começar gratuitamente
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white font-semibold px-8 w-full sm:w-auto text-base"
              >
                Acessar minha conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer Institucional Semântico */}
      <footer className="bg-muted/40 text-muted-foreground py-14 border-t border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-1">
              <Logo size="md" animated={false} />
              <p className="text-xs leading-relaxed max-w-xs">
                Simplifique o planejamento, organize convidados e divida custos com total transparência.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/#features" className="hover:text-foreground transition-colors">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/analytics" className="hover:text-foreground transition-colors">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Suporte</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    Sobre nós
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-xs">
            <p>&copy; {new Date().getFullYear()} Planeja+. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

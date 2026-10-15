import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Reveal } from "@/components/reveal"
import { ArrowUpRight, Building2, Check, MapPin, Plus, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Planeja+ | Gestão de Eventos Corporativos, Casamentos e Festas",
  description:
    "Plataforma para empresas e cerimoniais organizarem confraternizações, eventos corporativos, casamentos e festas: lista de convidados, confirmação por link seguro, aprovação de acompanhantes, orçamento e relatórios em um só lugar.",
  keywords: [
    "eventos corporativos",
    "confraternização de empresa",
    "gestão de convidados",
    "rsvp online",
    "software para cerimonial",
    "planejamento de casamento",
    "controle de orçamento de evento",
  ],
  openGraph: {
    title: "Planeja+ | Eventos corporativos e celebrações sem improviso",
    description:
      "Convidados, confirmações, acompanhantes, fornecedores e orçamento — com relatórios prontos para quem precisa prestar contas.",
    type: "website",
    locale: "pt_BR",
    siteName: "Planeja+",
  },
}

const occasions = [
  "confraternizações",
  "convenções",
  "lançamentos",
  "casamentos",
  "formaturas",
  "festas de fim de ano",
  "aniversários",
]

const guests = [
  { name: "Ana Beatriz", note: "Marketing · +1 acompanhante", status: "Confirmado" },
  { name: "Caio Moreira", note: "Financeiro · via link", status: "Confirmado" },
  { name: "Júlia Tavares", note: "Comercial · acompanhante em análise", status: "Pendente" },
  { name: "Otávio Lins", note: "Diretoria · convite individual", status: "Confirmado" },
]

const audiences = [
  {
    icon: Building2,
    tag: "Para empresas",
    title: "RH, endomarketing e eventos internos",
    body: "Confraternizações, convenções e celebrações com centenas de colaboradores — sem planilha paralela nem lista no grupo.",
    points: [
      "Convite por link único, sem o colaborador criar conta",
      "Controle e aprovação de acompanhantes por pessoa",
      "Orçamento previsto × realizado e custo por convidado",
      "Indicadores prontos para apresentar à diretoria",
    ],
  },
  {
    icon: Sparkles,
    tag: "Para cerimoniais e produtoras",
    title: "Casamentos, festas e eventos sociais",
    body: "Vários clientes e eventos em paralelo, cada um com sua lista, seus fornecedores e seu painel — tudo na mesma conta.",
    points: [
      "Todos os eventos da agenda em calendário ou lista",
      "Lista de presença atualizada em tempo real",
      "Fornecedores e itens com responsável e valor",
      "Link público com moderação para evitar penetras",
    ],
  },
]

const steps = [
  {
    n: "01",
    title: "Cadastre o evento",
    body: "Nome, data, local, capacidade e orçamento estimado. Defina se acompanhantes são permitidos e quantos por convidado.",
  },
  {
    n: "02",
    title: "Convide do jeito certo",
    body: "Convites individuais com token ou link público com aprovação. O convidado confirma pelo celular em segundos, sem cadastro.",
  },
  {
    n: "03",
    title: "Acompanhe e preste contas",
    body: "Confirmações, presença provável, pendências e custos em um painel único — pronto para a reunião de alinhamento com o cliente ou a diretoria.",
  },
]

function PillLink({
  href,
  children,
  variant = "primary",
}: {
  href: string
  children: React.ReactNode
  variant?: "primary" | "ghost"
}) {
  return (
    <Link href={href} className={`btn-pill ${variant === "primary" ? "btn-primary" : "btn-ghost"}`}>
      {children}
      <span className="btn-orb">
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </Link>
  )
}

export default function Home() {
  return (
    <div className="relative z-[2] -mt-[68px] md:-mt-[76px]">
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden px-4 pb-24 pt-36 md:px-6 md:pb-32 md:pt-44">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Para empresas, cerimoniais e produtoras
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="display mt-7 text-[clamp(3.25rem,8vw,6.25rem)] text-foreground">
                Eventos que acontecem <em className="text-primary">sem improviso</em>.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
                Da confraternização da empresa ao casamento do seu cliente: convidados, confirmações, acompanhantes,
                fornecedores e orçamento em um único painel — com números prontos para prestar contas.
              </p>
            </Reveal>

            <Reveal delay={240} className="mt-10 flex flex-wrap items-center gap-3">
              <PillLink href="/register">Criar evento grátis</PillLink>
              <Link href="/contact" className="btn-pill btn-ghost btn-plain">
                Falar com a equipe
              </Link>
            </Reveal>

            <Reveal delay={320}>
              <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} /> Convidado não precisa de conta
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} /> Dados isolados por organizador
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} /> Relatórios em tempo real
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Artefatos: convite corporativo, chip de confirmações e orçamento */}
          <div className="relative lg:col-span-5">
            <Reveal delay={200} className="relative mx-auto max-w-[420px]">
              <div className="bezel md:rotate-[-2.5deg]">
                <div className="bezel-core overflow-hidden">
                  <div className="flex items-center justify-between border-b border-dashed border-border px-6 py-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Convite nº 0186</span>
                    <span>Sex · 12 dez</span>
                  </div>
                  <div className="px-6 pb-7 pt-6">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-primary">
                      Acme Tecnologia convida
                    </p>
                    <p className="display mt-3 text-[2.4rem]">
                      Confraternização de <em>Fim de Ano</em>
                    </p>
                    <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> Espaço Villa Jardim · 19h30
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <span className="rounded-full bg-primary py-2.5 text-center text-sm text-primary-foreground">
                        Confirmar presença
                      </span>
                      <span className="rounded-full bg-secondary py-2.5 text-center text-sm text-foreground">
                        Não poderei
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-6 top-[58%] hidden rounded-2xl bg-espresso px-4 py-3 text-[#F2EDE3] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] sm:block md:-left-14 md:rotate-[3deg]">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F2EDE3]/60">Confirmados</p>
                <p className="num mt-1 text-2xl">
                  186<span className="text-[#F2EDE3]/40">/240</span>
                </p>
                <div className="mt-2 h-1 w-28 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-lime" />
                </div>
              </div>

              <div className="relative -mt-6 ml-auto w-[80%] md:-mr-6 md:rotate-[2deg]">
                <div className="bezel">
                  <div className="bezel-core px-5 py-4">
                    <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Orçamento</span>
                      <span>R$ 50 mil</span>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Buffet</dt>
                        <dd className="num">28.400,00</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Espaço</dt>
                        <dd className="num">12.000,00</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Open bar</dt>
                        <dd className="num">9.600,00</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex items-end justify-between border-t border-dashed border-border pt-3">
                      <span className="text-sm">Por convidado</span>
                      <span className="num rounded-full bg-lime px-3 py-1 text-base text-[#1C1A17]">R$ 208,33</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── Faixa de ocasiões ───────────── */}
      <section aria-label="Tipos de evento" className="border-y border-border/70 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-center gap-x-6 gap-y-2 px-4 text-center">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">Feito para</span>
          {occasions.map((o, i) => (
            <span key={o} className="font-serif text-2xl italic text-foreground/80 md:text-[1.7rem]">
              {o}
              {i < occasions.length - 1 && <span className="ml-6 not-italic text-primary/40">·</span>}
            </span>
          ))}
        </div>
      </section>

      {/* ───────────── PÚBLICOS ───────────── */}
      <section id="para-quem" className="scroll-mt-28 px-4 py-24 md:px-6 md:py-36">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <span className="eyebrow">Para quem é</span>
            <h2 className="display mt-6 max-w-3xl text-[clamp(2.5rem,5.5vw,4.25rem)]">
              Um painel para quem <em className="text-primary">responde</em> pelo evento.
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-4 md:grid-cols-12">
            {audiences.map((a, i) => {
              const Icon = a.icon
              return (
                <Reveal key={a.tag} delay={i * 100} className={i === 0 ? "md:col-span-7" : "md:col-span-5"}>
                  <article className="bezel h-full">
                    <div className="bezel-core flex h-full flex-col p-7 md:p-9">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" strokeWidth={1.5} />
                        </span>
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary">{a.tag}</p>
                      </div>
                      <h3 className="mt-6 text-2xl font-medium tracking-[-0.015em]">{a.title}</h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{a.body}</p>
                      <ul className="mt-7 space-y-3 text-sm">
                        {a.points.map((p) => (
                          <li key={p} className="flex items-start gap-3">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────────── RECURSOS: bento ───────────── */}
      <section id="recursos" className="scroll-mt-28 border-t border-border/70 px-4 py-24 md:px-6 md:py-36">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-7">
              <span className="eyebrow">Recursos</span>
              <h2 className="display mt-6 text-[clamp(2.5rem,5.5vw,4.25rem)]">
                Menos planilha. <em className="text-primary">Mais controle.</em>
              </h2>
            </Reveal>
            <Reveal delay={100} className="md:col-span-5">
              <p className="text-base leading-relaxed text-muted-foreground md:pb-2">
                O que antes ficava espalhado entre e-mails, planilhas e grupos de mensagens passa a ter um lugar só —
                visível para a equipe organizadora e simples para o convidado.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-12">
            {/* Lista de presença */}
            <Reveal className="md:col-span-7 md:row-span-2">
              <article className="bezel h-full">
                <div className="bezel-core flex h-full flex-col p-7 md:p-9">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary">Lista de presença</p>
                  <h3 className="mt-3 max-w-md text-2xl font-medium tracking-[-0.015em]">
                    Confirmações, acompanhantes e aprovações em uma lista viva.
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                    Aprove o convidado e decida acompanhante por acompanhante. Nada de gente a mais na porta — nem no
                    buffet.
                  </p>
                  <ul className="mt-8 divide-y divide-border/80 rounded-2xl bg-secondary/60 px-4">
                    {guests.map((g) => (
                      <li key={g.name} className="flex items-center justify-between py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card font-mono text-[11px]">
                            {g.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")}
                          </span>
                          <div>
                            <p className="text-sm">{g.name}</p>
                            <p className="text-xs text-muted-foreground">{g.note}</p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                            g.status === "Confirmado"
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-muted-foreground"
                          }`}
                        >
                          {g.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>

            {/* Orçamento */}
            <Reveal delay={80} className="md:col-span-5">
              <article className="bezel h-full">
                <div className="bezel-core h-full p-7">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary">Orçamento</p>
                  <h3 className="mt-3 text-xl font-medium tracking-[-0.015em]">Previsto × realizado, sem surpresa.</h3>
                  <div className="mt-6 flex items-end gap-3">
                    <span className="num text-5xl tracking-tight">87%</span>
                    <span className="pb-1.5 text-sm text-muted-foreground">do orçamento comprometido</span>
                  </div>
                  <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="w-[57%] bg-primary" />
                    <div className="w-[24%] bg-primary/50" />
                    <div className="w-[6%] bg-lime" />
                  </div>
                  <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    Buffet · Espaço · Bebidas
                  </p>
                </div>
              </article>
            </Reveal>

            {/* Fornecedores */}
            <Reveal delay={160} className="md:col-span-5">
              <article className="bezel h-full">
                <div className="bezel-core h-full p-7">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary">Fornecedores</p>
                  <h3 className="mt-3 text-xl font-medium tracking-[-0.015em]">Cada entrega com responsável.</h3>
                  <ul className="mt-5 space-y-2.5 text-sm">
                    {[
                      ["Buffet contratado", "Carla", true],
                      ["Som e iluminação", "Pedro", true],
                      ["Brindes personalizados", "RH", false],
                    ].map(([t, who, done]) => (
                      <li key={t as string} className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md ${
                            done ? "bg-primary text-primary-foreground" : "ring-1 ring-border"
                          }`}
                        >
                          {done && <Check className="h-3 w-3" strokeWidth={2.5} />}
                        </span>
                        <span className={done ? "text-muted-foreground line-through" : ""}>{t}</span>
                        <span className="ml-auto font-mono text-[11px] text-muted-foreground">{who}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>

            {/* Análises — faixa escura */}
            <Reveal className="md:col-span-12">
              <article className="overflow-hidden rounded-[2rem] bg-espresso p-1.5">
                <div className="grid items-center gap-8 rounded-[calc(2rem-0.375rem)] px-7 py-9 text-[#F2EDE3] md:grid-cols-12 md:px-10">
                  <div className="md:col-span-5">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-lime">Análises</p>
                    <h3 className="display mt-3 text-4xl md:text-5xl">
                      Números para a <em>reunião de segunda</em>.
                    </h3>
                    <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#F2EDE3]/65">
                      Taxa de confirmação, presença provável, pendências e custo por convidado — por evento ou da
                      carteira inteira.
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 md:col-span-7">
                    {[
                      ["Taxa de confirmação", "78%", true],
                      ["Presença provável", "212", false],
                      ["Pendências", "31", false],
                      ["Custo por convidado", "R$ 208", false],
                    ].map(([label, value, highlight]) => (
                      <div key={label as string} className="rounded-2xl bg-white/[0.06] p-5">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F2EDE3]/55">{label}</dt>
                        <dd className={`num mt-2 text-3xl ${highlight ? "text-lime" : ""}`}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── COMO FUNCIONA ───────────── */}
      <section id="como-funciona" className="scroll-mt-28 border-t border-border/70 px-4 py-24 md:px-6 md:py-36">
        <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <div className="md:sticky md:top-32">
              <span className="eyebrow">Como funciona</span>
              <h2 className="display mt-6 text-[clamp(2.5rem,5vw,3.75rem)]">
                Três passos. <em className="text-primary">Nenhum improviso.</em>
              </h2>
            </div>
          </Reveal>

          <ol className="md:col-span-8">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="group border-t border-border py-10 first:border-t-0 first:pt-0 md:py-12">
                <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                  <span className="num text-sm text-muted-foreground transition-colors duration-500 ease-fluid group-hover:text-primary">
                    {s.n} / 03
                  </span>
                  <div>
                    <h3 className="display text-4xl md:text-[2.75rem]">{s.title}</h3>
                    <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── DEPOIMENTOS ───────────── */}
      <section className="px-3 md:px-6">
        <div className="mx-auto max-w-[88rem] overflow-hidden rounded-[2.5rem] bg-espresso px-6 py-24 text-[#F2EDE3] md:px-16 md:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <span className="inline-flex items-center rounded-full bg-white/[0.07] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#F2EDE3]/70">
                Quem organiza
              </span>
            </Reveal>
            <Reveal delay={80}>
              <blockquote className="mt-10">
                <p className="display max-w-4xl text-[clamp(2rem,4.6vw,3.75rem)] leading-[1.05]">
                  “Nossa confraternização tinha 240 colaboradores e três planilhas diferentes. Este ano o buffet recebeu
                  o <em className="text-lime">número exato</em> uma semana antes.”
                </p>
                <footer className="mt-8 flex items-center gap-3 text-sm text-[#F2EDE3]/60">
                  <span className="h-px w-8 bg-[#F2EDE3]/30" />
                  Coordenação de RH · empresa de tecnologia, 240 convidados
                </footer>
              </blockquote>
            </Reveal>

            <div className="mt-20 grid gap-10 border-t border-white/10 pt-12 md:grid-cols-2 md:gap-16">
              <Reveal as="blockquote">
                <p className="text-lg leading-relaxed text-[#F2EDE3]/85">
                  “Acompanho vários casamentos ao mesmo tempo. Ter a lista de cada noivo atualizada sozinha, com
                  acompanhantes aprovados, mudou minha rotina.”
                </p>
                <footer className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#F2EDE3]/50">
                  Cerimonialista · casamentos e eventos sociais
                </footer>
              </Reveal>
              <Reveal as="blockquote" delay={100}>
                <p className="text-lg leading-relaxed text-[#F2EDE3]/85">
                  “No lançamento do produto, o link público com aprovação garantiu que só clientes convidados
                  entrassem na lista.”
                </p>
                <footer className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#F2EDE3]/50">
                  Produtora de eventos · lançamento corporativo, 150 pessoas
                </footer>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── CTA FINAL ───────────── */}
      <section className="px-4 py-28 md:px-6 md:py-40">
        <Reveal className="mx-auto max-w-4xl text-center">
          <h2 className="display text-[clamp(2.75rem,7vw,5.5rem)]">
            Qual é o <em className="text-primary">próximo</em> evento?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
            Cadastre o primeiro evento em poucos minutos ou fale com a equipe para organizar a sua carteira.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <PillLink href="/register">Começar agora</PillLink>
            <Link href="/pricing" className="btn-pill btn-ghost btn-plain">
              Ver planos
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ───────────── RODAPÉ ───────────── */}
      <footer className="border-t border-border/70 px-4 pb-10 pt-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Logo size="md" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Gestão de eventos corporativos e sociais — convidados, confirmações, fornecedores e orçamento em um só
                lugar.
              </p>
            </div>
            {[
              {
                title: "Produto",
                links: [
                  ["Para quem é", "/#para-quem"],
                  ["Recursos", "/#recursos"],
                  ["Como funciona", "/#como-funciona"],
                  ["Preços", "/pricing"],
                ],
              },
              {
                title: "Empresa",
                links: [
                  ["Sobre", "/about"],
                  ["Contato", "/contact"],
                ],
              },
              {
                title: "Legal",
                links: [
                  ["Termos de uso", "/terms"],
                  ["Privacidade", "/privacy"],
                ],
              },
            ].map((col) => (
              <nav key={col.title} aria-label={col.title} className="md:col-span-2">
                <h3 className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">{col.title}</h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="link-underline text-foreground/85 hover:text-foreground">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <p
            aria-hidden="true"
            className="display mt-20 select-none text-center text-[clamp(4.5rem,19vw,15rem)] leading-[0.8] text-foreground/[0.06]"
          >
            Planeja<em>+</em>
          </p>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} Planeja+</p>
            <a href="#main-content" className="inline-flex items-center gap-1.5 hover:text-foreground">
              Voltar ao topo <Plus className="h-3 w-3 rotate-45" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

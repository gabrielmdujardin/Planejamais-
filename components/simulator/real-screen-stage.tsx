"use client"

import { useState, useEffect } from "react"
import { SimulatorStage } from "@/lib/simulator/stages"
import { VirtualMouse, MousePosition } from "./virtual-mouse"
import {
  Lock,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Download,
  Plus,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  Send,
  Share2,
} from "lucide-react"

interface RealScreenStageProps {
  stage: SimulatorStage
  isPlaying: boolean
  speed: "normal" | "fast" | "manual"
}

export function RealScreenStage({ stage, isPlaying, speed }: RealScreenStageProps) {
  // Micro-passo dentro da etapa atual (0 a 4)
  const [subStep, setSubStep] = useState(0)
  const [isClicking, setIsClicking] = useState(false)
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 50, y: 50 })
  const [mouseActionText, setMouseActionText] = useState<string | undefined>()

  // Reseta o micro-passo ao mudar de etapa
  useEffect(() => {
    setSubStep(0)
    setIsClicking(false)
  }, [stage.id])

  // Sequenciador de Micro-Ações com o Mouse Simulado
  useEffect(() => {
    if (!isPlaying || speed === "manual") return

    const subStepDuration = speed === "fast" ? 350 : 700

    const timer = setInterval(() => {
      setSubStep((prev) => (prev < 4 ? prev + 1 : prev))
    }, subStepDuration)

    return () => clearInterval(timer)
  }, [isPlaying, speed, stage.id])

  // Mapeamento dinâmico de coordenadas e cliques do mouse para cada etapa e micro-passo
  useEffect(() => {
    switch (stage.id) {
      // Etapa 1: Cadastro
      case 1:
        if (subStep === 0) {
          setMousePos({ x: 50, y: 32 })
          setMouseActionText("Preenchendo: Mariana Costa")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep === 1) {
          setMousePos({ x: 50, y: 46 })
          setMouseActionText("Digitando: mariana.costa@eventosprime.com.br")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep === 2) {
          setMousePos({ x: 50, y: 60 })
          setMouseActionText("Digitando Senha: Planeja@2026")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep >= 3) {
          setMousePos({ x: 50, y: 76 })
          setMouseActionText("Clicando em: Começar grátis")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 250)
        }
        break

      // Etapa 2: Dashboard
      case 2:
        if (subStep === 0) {
          setMousePos({ x: 25, y: 28 })
          setMouseActionText("Inspecionando: 0 Eventos Ativos")
        } else if (subStep === 1) {
          setMousePos({ x: 50, y: 28 })
          setMouseActionText("Inspecionando: 0 Confirmados")
        } else if (subStep >= 2) {
          setMousePos({ x: 50, y: 72 })
          setMouseActionText("Clicando em: + Criar Primeiro Evento")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 250)
        }
        break

      // Etapa 3: Criar Evento
      case 3:
        if (subStep === 0) {
          setMousePos({ x: 40, y: 28 })
          setMouseActionText("Digitando: Churrasco de Formatura 2026")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep === 1) {
          setMousePos({ x: 30, y: 45 })
          setMouseActionText("Definindo Horário: 12:00 às 19:00")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep === 2) {
          setMousePos({ x: 75, y: 45 })
          setMouseActionText("Selecionando: Rateio Colaborativo")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep >= 3) {
          setMousePos({ x: 82, y: 86 })
          setMouseActionText("Clicando em: Salvar Evento")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 250)
        }
        break

      // Etapa 4: Convidados e Buffet
      case 4:
        if (subStep === 0) {
          setMousePos({ x: 80, y: 22 })
          setMouseActionText("Clicando em: Importar Planilha CSV")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep === 1) {
          setMousePos({ x: 45, y: 55 })
          setMouseActionText("Conferindo Convidado: Lucas Rocha (+1 acomp)")
        } else if (subStep === 2) {
          setMousePos({ x: 75, y: 55 })
          setMouseActionText("Clicando em: Aprovar Acompanhantes")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep >= 3) {
          setMousePos({ x: 50, y: 38 })
          setMouseActionText("Consolidando: 2 Vegetarianos, 1 Sem Glúten")
        }
        break

      // Etapa 5: Link Público & RSVP
      case 5:
        if (subStep === 0) {
          setMousePos({ x: 50, y: 25 })
          setMouseActionText("Token CSPRNG 128 bits validado")
        } else if (subStep === 1) {
          setMousePos({ x: 50, y: 62 })
          setMouseActionText("Convidado preenche: Rafael Souza")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep >= 2) {
          setMousePos({ x: 50, y: 78 })
          setMouseActionText("Clicando em: Confirmar Presença!")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 250)
        }
        break

      // Etapa 6: Custos & Rateio
      case 6:
        if (subStep === 0) {
          setMousePos({ x: 30, y: 22 })
          setMouseActionText("Acessando Aba: Itens e Financeiro")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep === 1) {
          setMousePos({ x: 35, y: 60 })
          setMouseActionText("Cadastrando Item: Carnes Nobres R$ 1.200")
        } else if (subStep >= 2) {
          setMousePos({ x: 82, y: 30 })
          setMouseActionText("Cálculo Rateio: R$ 3.000 / 20 = R$ 150,00/pessoa!")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        }
        break

      // Etapa 7: Galeria & Calendário
      case 7:
        if (subStep === 0) {
          setMousePos({ x: 80, y: 22 })
          setMouseActionText("Clicando em: Exportar Arquivo .ICS")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 250)
        } else if (subStep >= 1) {
          setMousePos({ x: 50, y: 45 })
          setMouseActionText("Conferindo Evento no Calendário Mensal")
        }
        break

      // Etapa 8: Host View
      case 8:
        if (subStep === 0) {
          setMousePos({ x: 50, y: 22 })
          setMouseActionText("Validando: Modo Leitura do Anfitrião")
        } else if (subStep >= 1) {
          setMousePos({ x: 75, y: 48 })
          setMouseActionText("Conferindo Rateio Transparente: R$ 150,00")
        }
        break

      // Etapa 9: Analytics & Relatório
      case 9:
        if (subStep === 0) {
          setMousePos({ x: 40, y: 58 })
          setMouseActionText("Analisando Pareto 80/20 de Despesas")
        } else if (subStep >= 1) {
          setMousePos({ x: 85, y: 78 })
          setMouseActionText("Clicando em: Exportar Relatório PDF A4")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 250)
        }
        break

      // Etapa 10: Exclusão Nominal
      case 10:
        if (subStep === 0) {
          setMousePos({ x: 50, y: 35 })
          setMouseActionText("Abrindo modal de exclusão")
        } else if (subStep === 1) {
          setMousePos({ x: 50, y: 52 })
          setMouseActionText("Digitando nome exato do evento...")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 200)
        } else if (subStep >= 2) {
          setMousePos({ x: 50, y: 84 })
          setMouseActionText("Clicando em: Confirmar Exclusão em Cascata")
          setIsClicking(true)
          setTimeout(() => setIsClicking(false), 250)
        }
        break
    }
  }, [stage.id, subStep])

  return (
    <div className="relative rounded-2xl border border-border/80 bg-card shadow-xl overflow-hidden flex flex-col h-full min-h-[540px]">
      {/* Mouse Virtual Animado Renderizado Sobre a Tela Real */}
      <VirtualMouse
        position={mousePos}
        isClicking={isClicking}
        actionText={mouseActionText}
        visible={true}
      />

      {/* Barra de Navegador do Sistema Real */}
      <div className="px-4 py-2.5 bg-muted/80 border-b border-border flex items-center justify-between gap-3 text-xs select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>

        <div className="flex-1 max-w-lg mx-auto px-3.5 py-1 rounded-full bg-background border border-border/70 flex items-center gap-2 text-muted-foreground font-mono text-[11px] truncate shadow-inner">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate">
            https://planejamais.com.br<strong className="text-foreground">{stage.route}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            Tela Real
          </span>
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
            {stage.actor.split(" ")[0]}
          </span>
        </div>
      </div>

      {/* Conteúdo Renderizado da Tela Real */}
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-background/60 flex flex-col justify-center">
        {/* ========================================================== */}
        {/* 1. TELA REAL: CADASTRO DO ORGANIZADOR (/register) */}
        {/* ========================================================== */}
        {stage.id === 1 && (
          <div className="max-w-md w-full mx-auto space-y-5 p-6 rounded-2xl border border-border bg-card shadow-md">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Crie sua conta
              </span>
              <h2 className="text-2xl font-bold text-foreground">Planeja+</h2>
              <p className="text-xs text-muted-foreground">
                Cadastre-se para planejar e gerenciar seus eventos
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-muted-foreground font-semibold block mb-1">Nome Completo</label>
                <div
                  className={`p-2.5 rounded-xl border transition-all text-sm font-medium ${
                    subStep >= 0
                      ? "border-primary bg-primary/[0.03] text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {subStep >= 0 ? "Mariana Costa" : "Digite seu nome"}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-semibold block mb-1">E-mail Profissional</label>
                <div
                  className={`p-2.5 rounded-xl border transition-all text-sm font-mono ${
                    subStep >= 1
                      ? "border-primary bg-primary/[0.03] text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {subStep >= 1 ? "mariana.costa@eventosprime.com.br" : "seu.email@exemplo.com"}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-muted-foreground font-semibold">Senha</label>
                  {subStep >= 2 && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mínimo 6 caracteres atendido (10 chars)
                    </span>
                  )}
                </div>
                <div
                  className={`p-2.5 rounded-xl border transition-all text-sm font-mono tracking-widest ${
                    subStep >= 2
                      ? "border-primary bg-primary/[0.03] text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {subStep >= 2 ? "••••••••••" : "••••••"}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                    subStep >= 3
                      ? "bg-emerald-600 text-white scale-98"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {subStep >= 3 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Conta Criada • Sessão JWT Estabelecida</span>
                    </>
                  ) : (
                    <>
                      <span>Começar grátis</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* 2. TELA REAL: DASHBOARD DO ORGANIZADOR (/dashboard) */}
        {/* ========================================================== */}
        {stage.id === 2 && (
          <div className="max-w-2xl w-full mx-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Painel do Organizador
                </span>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                  Bem-vinda, Mariana Costa!
                </h2>
                <p className="text-xs text-muted-foreground">
                  Área privada protegida por guardião de rotas (RF-004)
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Sessão Ativa
              </span>
            </div>

            {/* Metric Cards Reais */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className={`p-4 rounded-2xl border transition-all text-center ${
                  subStep === 0
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Eventos Ativos
                </span>
                <span className="text-2xl font-black font-mono text-foreground mt-1 block">
                  0
                </span>
                <span className="text-[10px] text-muted-foreground">Titular Mariana</span>
              </div>

              <div
                className={`p-4 rounded-2xl border transition-all text-center ${
                  subStep === 1
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Confirmados
                </span>
                <span className="text-2xl font-black font-mono text-foreground mt-1 block">
                  0
                </span>
                <span className="text-[10px] text-muted-foreground">Headcount</span>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Total Gasto
                </span>
                <span className="text-2xl font-black font-mono text-foreground mt-1 block">
                  R$ 0,00
                </span>
                <span className="text-[10px] text-muted-foreground">Consistência 0.00</span>
              </div>
            </div>

            {/* Empty State com Botão de Criação */}
            <div className="p-8 rounded-2xl border border-dashed border-border bg-card/60 text-center space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <div>
                <h3 className="font-bold text-sm text-foreground">Nenhum evento registrado ainda</h3>
                <p className="text-xs text-muted-foreground">
                  Clique no botão abaixo para criar seu primeiro evento com orçamento e lista.
                </p>
              </div>

              <button
                type="button"
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 ${
                  subStep >= 2
                    ? "bg-primary text-primary-foreground scale-95 ring-2 ring-primary/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar Primeiro Evento</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* 3. TELA REAL: CRIAR EVENTO (/create-event) */}
        {/* ========================================================== */}
        {stage.id === 3 && (
          <div className="max-w-xl w-full mx-auto p-6 rounded-2xl border border-border bg-card shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary">Novo Evento</span>
                <h3 className="font-bold text-lg text-foreground">Informações Básicas & Regime</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Rateio Colaborativo (split)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-muted-foreground font-semibold block mb-1">Título do Evento</label>
                <div
                  className={`p-2.5 rounded-xl border text-sm font-bold text-foreground transition-all ${
                    subStep >= 0 ? "border-primary bg-primary/[0.02]" : "border-border bg-muted/20"
                  }`}
                >
                  Churrasco de Formatura Engenharia 2026
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-semibold block mb-1">Data</label>
                <div className="p-2.5 rounded-xl border border-border bg-muted/20 font-mono text-foreground">
                  12/12/2026 (Sábado)
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-muted-foreground font-semibold">Horários</label>
                  {subStep >= 1 && (
                    <span className="text-[10px] text-emerald-600 font-bold">{"19:00 > 12:00 ✓"}</span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl border border-primary bg-primary/[0.02] font-mono font-semibold text-foreground">
                  12:00 às 19:00
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-muted-foreground font-semibold block mb-1">Local Físico</label>
                <div className="p-2.5 rounded-xl border border-border bg-muted/20 text-foreground">
                  Espaço Gourmet Jardim, Salão 2
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-muted-foreground font-semibold block mb-1">
                  Orçamento Previsto (Teto de Referência)
                </label>
                <div className="p-2.5 rounded-xl border border-border bg-muted/20 font-mono font-bold text-primary text-sm">
                  R$ 3.000,00
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                  subStep >= 3
                    ? "bg-emerald-600 text-white scale-95"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {subStep >= 3 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Evento Salvo (ID: evt-formatura-2026)</span>
                  </>
                ) : (
                  <>
                    <span>Salvar Evento</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* 4. TELA REAL: LISTA DE CONVIDADOS E BUFFET (/event/[id]) */}
        {/* ========================================================== */}
        {stage.id === 4 && (
          <div className="max-w-2xl w-full mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">
                  Churrasco de Formatura — Convidados
                </h3>
                <p className="text-xs text-muted-foreground">
                  15 convidados cadastrados via CSV (status inicial Pendente)
                </p>
              </div>

              {/* Headcount Badge Dinâmico */}
              <div
                className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 transition-all ${
                  subStep >= 2
                    ? "bg-emerald-600 text-white shadow-md scale-105"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{subStep >= 2 ? "5 Confirmados (2 Titulares + 3 Acomp.)" : "2 Confirmados"}</span>
              </div>
            </div>

            {/* Painel do Buffet */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Mapeamento para o Buffet:</span>
              <div className="flex items-center gap-2 font-medium">
                <span className="px-2 py-0.5 rounded bg-card border border-border text-foreground">
                  2 Vegetarianos
                </span>
                <span className="px-2 py-0.5 rounded bg-card border border-border text-foreground">
                  1 Sem Glúten
                </span>
              </div>
            </div>

            {/* Tabela Real de Convidados */}
            <div className="rounded-xl border border-border overflow-hidden bg-card text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="p-2.5">Convidado</th>
                    <th className="p-2.5">Status Presença</th>
                    <th className="p-2.5">Acompanhantes</th>
                    <th className="p-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="bg-primary/[0.02]">
                    <td className="p-2.5 font-medium text-foreground">Lucas Rocha</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        Confirmado
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      {subStep >= 2 ? (
                        <span className="text-emerald-600 font-semibold">1 Aprovado (Beatriz Lima)</span>
                      ) : (
                        "1 Pendente de Aprovação"
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                        {subStep >= 2 ? "Aprovado ✓" : "Aprovar"}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-medium text-foreground">Juliana Mendes</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        Confirmado
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      {subStep >= 2 ? (
                        <span className="text-emerald-600 font-semibold">2 Aprovados (Filhos)</span>
                      ) : (
                        "2 Pendentes de Aprovação"
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                        {subStep >= 2 ? "Aprovado ✓" : "Aprovar"}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-medium text-foreground">Carlos Eduardo</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold text-[10px]">
                        Pendente
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">0</td>
                    <td className="p-2.5 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* 5. TELA REAL: RSVP PÚBLICO EXTERNO (/convite/[token]) */}
        {/* ========================================================== */}
        {stage.id === 5 && (
          <div className="max-w-md w-full mx-auto space-y-4 p-6 rounded-2xl border border-border bg-card shadow-md">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 border-b border-border">
              <span className="flex items-center gap-1 font-mono text-emerald-600 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Token CSPRNG 128b
              </span>
              <span className="font-mono">token: a8f192b0...</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-primary">Você foi convidado!</span>
              <h3 className="font-extrabold text-xl text-foreground">
                Churrasco de Formatura Engenharia 2026
              </h3>
              <p className="text-xs text-muted-foreground">
                12/12/2026 • 12:00 às 19:00 • Espaço Gourmet Jardim
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Convidado:</span>
                <strong className="text-foreground">Rafael Souza</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-mono text-foreground">rafael.souza@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acompanhante:</span>
                <span className="font-semibold text-foreground">1 pessoa (Camila)</span>
              </div>
            </div>

            <button
              type="button"
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                subStep >= 2
                  ? "bg-emerald-600 text-white scale-98"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {subStep >= 2 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Presença Confirmada com Sucesso!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirmar Presença (RSVP)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================== */}
        {/* 6. TELA REAL: CUSTOS E RATEIO COLABORATIVO */}
        {/* ========================================================== */}
        {stage.id === 6 && (
          <div className="max-w-2xl w-full mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">
                  Planilha de Despesas & Rateio
                </h3>
                <p className="text-xs text-muted-foreground">
                  Regime: Rateio Colaborativo • 20 Participantes Confirmados
                </p>
              </div>

              {/* Rateio por Pessoa em Destaque */}
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-right">
                <span className="text-[10px] uppercase font-bold block">Rateio por Pessoa:</span>
                <span className="text-2xl font-black font-mono">R$ 150,00</span>
                <span className="text-[10px] block opacity-80">R$ 3.000 / 20 confirmados</span>
              </div>
            </div>

            {/* Sumário */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Custo Total
                </span>
                <span className="text-lg font-black font-mono text-foreground">R$ 3.000,00</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Confirmados
                </span>
                <span className="text-lg font-black font-mono text-foreground">20 pessoas</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Teto Referência
                </span>
                <span className="text-lg font-black font-mono text-primary">R$ 3.000,00</span>
              </div>
            </div>

            {/* Lista Real de Despesas */}
            <div className="rounded-xl border border-border overflow-hidden bg-card text-xs">
              <div className="divide-y divide-border/60">
                <div className="p-2.5 flex justify-between items-center bg-muted/20">
                  <div>
                    <span className="font-semibold text-foreground block">Carnes Nobres e Carvão</span>
                    <span className="text-[11px] text-muted-foreground">Pago por: Lucas Rocha</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">R$ 1.200,00</span>
                </div>
                <div className="p-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-foreground block">Bebidas e Gelo</span>
                    <span className="text-[11px] text-muted-foreground">Pago por: Mariana Costa</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">R$ 800,00</span>
                </div>
                <div className="p-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-foreground block">Aluguel do Salão e Som</span>
                    <span className="text-[11px] text-muted-foreground">Pago por: Mariana Costa</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">R$ 600,00</span>
                </div>
                <div className="p-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-foreground block">Sobremesas e Descartáveis</span>
                    <span className="text-[11px] text-muted-foreground">Pendente a liquidar</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">R$ 400,00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* 7. TELA REAL: GALERIA E CALENDÁRIO ICS */}
        {/* ========================================================== */}
        {stage.id === 7 && (
          <div className="max-w-2xl w-full mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">Calendário Mensal & Mídias</h3>
                <p className="text-xs text-muted-foreground">Dezembro de 2026</p>
              </div>

              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  subStep >= 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar .ICS (RFC 5545)</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                12 de Dezembro: Churrasco de Formatura (12:00 às 19:00)
              </span>
              <p className="text-xs text-muted-foreground">
                Sincronizado automaticamente com Google Calendar, Apple e Outlook.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Galeria de Fotos (Controle do Titular)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/80">
                  <span className="font-medium text-foreground block">Foto 1: Fachada do Espaço</span>
                  <span className="text-[10px] text-muted-foreground">Autor: Mariana Costa</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/80">
                  <span className="font-medium text-foreground block">Foto 2: Área Gourmet</span>
                  <span className="text-[10px] text-muted-foreground">Autor: Mariana Costa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* 8. TELA REAL: PORTAL DO ANFITRIÃO (HOST VIEW) */}
        {/* ========================================================== */}
        {stage.id === 8 && (
          <div className="max-w-xl w-full mx-auto space-y-4 p-5 rounded-2xl border border-border bg-card shadow-md">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Portal do Anfitrião — Modo Somente-Leitura Protegido por Token</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Acompanhamento Externo
              </span>
              <h3 className="text-xl font-extrabold text-foreground">
                Churrasco de Formatura Engenharia 2026
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-background">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Participantes
                </span>
                <span className="text-lg font-black font-mono text-foreground">
                  20 Confirmados
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-background">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Rateio Previsto
                </span>
                <span className="text-lg font-black font-mono text-emerald-600">
                  R$ 150,00 / pessoa
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center pt-1 italic">
              ✓ Nenhuma permissão de exclusão, edição de custos ou alteração cadastral disponível.
            </p>
          </div>
        )}

        {/* ========================================================== */}
        {/* 9. TELA REAL: DASHBOARD ANALÍTICO & RELATÓRIO PDF */}
        {/* ========================================================== */}
        {stage.id === 9 && (
          <div className="max-w-xl w-full mx-auto space-y-4 p-5 rounded-2xl border border-border bg-card shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Análises & Exportação</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Auditado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-background">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                  Taxa de Confirmação
                </span>
                <span className="text-xl font-black font-mono text-foreground">66.7%</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-background">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                  Total Financeiro
                </span>
                <span className="text-xl font-black font-mono text-foreground">R$ 3.000,00</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs">
              <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-1">
                Pareto 80/20 de Gastos
              </span>
              <span className="font-semibold text-foreground">
                Carnes Nobres e Bebidas compõem 66.7% das despesas totais.
              </span>
            </div>

            <button
              type="button"
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                subStep >= 1
                  ? "bg-emerald-600 text-white scale-98"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Exportar Dossiê Executivo em PDF (Padrão A4)</span>
            </button>
          </div>
        )}

        {/* ========================================================== */}
        {/* 10. TELA REAL: EXCLUSÃO NOMINAL SEGURA */}
        {/* ========================================================== */}
        {stage.id === 10 && (
          <div className="max-w-md w-full mx-auto space-y-4 p-6 rounded-2xl border-2 border-red-500/40 bg-card shadow-md">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base">Excluir Evento Definitivamente</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Para confirmar a exclusão em cascata, digite o nome exato do evento:
            </p>

            <div className="p-2.5 rounded-lg border border-border bg-muted/50 text-xs font-mono font-bold text-foreground">
              Churrasco de Formatura Engenharia 2026
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Confirmação Nominal:
                </label>
                {subStep >= 1 && (
                  <span className="text-[10px] text-emerald-600 font-bold">Nome Idêntico ✓</span>
                )}
              </div>
              <div
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                  subStep >= 1
                    ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                {subStep >= 1
                  ? "Churrasco de Formatura Engenharia 2026"
                  : "Digite o nome para confirmar"}
              </div>
            </div>

            <button
              type="button"
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                subStep >= 2
                  ? "bg-red-700 text-white scale-98"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirmar Exclusão em Cascata</span>
            </button>

            {subStep >= 2 && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs text-center font-bold">
                ✓ Ciclo do evento concluído com sucesso. Todos os 66 requisitos demonstrados!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rodapé da Tela Simulada */}
      <div className="px-5 py-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground select-none">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Etapa {stage.id}/10 • {stage.title}</span>
        </span>
        <span className="font-mono text-[11px]">
          Simulando cursor do mouse • Micro-passo {subStep + 1}/5
        </span>
      </div>
    </div>
  )
}

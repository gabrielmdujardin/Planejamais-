"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { SIMULATOR_STAGES } from "@/lib/simulator/stages"
import { RealE2ESessionViewer, E2EStageResult } from "@/components/simulator/real-e2e-session-viewer"
import { RequirementsInspector } from "@/components/simulator/requirements-inspector"
import { TimelineNav } from "@/components/simulator/timeline-nav"
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Tv,
  ArrowRight,
  RotateCcw,
  Cpu,
  Layers,
  FileCheck,
  Monitor,
  Play,
  Loader2,
} from "lucide-react"

export default function SimulatorPage() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isHeaded, setIsHeaded] = useState(false)
  const [activeScreenshot, setActiveScreenshot] = useState<string | undefined>()
  const [activeUrl, setActiveUrl] = useState<string>("http://127.0.0.1:3000/register")
  const [activeAction, setActiveAction] = useState<string>("Pronto para iniciar execução E2E real.")
  const [stagesResults, setStagesResults] = useState<E2EStageResult[]>([])
  const [speed, setSpeed] = useState<"normal" | "fast" | "manual">("normal")

  const currentStage = SIMULATOR_STAGES[currentStageIndex] || SIMULATOR_STAGES[0]
  const abortControllerRef = useRef<AbortController | null>(null)

  // Execução Real com Playwright via SSE Stream
  const handleRunJourney = useCallback(async () => {
    setIsRunning(true)
    setActiveAction("Iniciando instância real do Chromium com Playwright...")
    setStagesResults([])
    setCurrentStageIndex(0)

    try {
      abortControllerRef.current = new AbortController()
      const response = await fetch("/api/validation/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          journey: true,
          stream: true,
          headed: isHeaded,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Falha na conexão SSE: status HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const evtText of events) {
          if (!evtText.trim().startsWith("data: ")) continue
          const jsonStr = evtText.replace(/^data:\s*/, "").trim()
          if (!jsonStr) continue

          try {
            const data = JSON.parse(jsonStr)

            if (data.type === "stage_start") {
              const stageNum = Number(data.stage)
              const mappedIdx = Math.max(0, Math.min(SIMULATOR_STAGES.length - 1, stageNum - 1))
              setCurrentStageIndex(mappedIdx)
              setActiveAction(`Estágio ${data.stage}: ${data.title}`)
            } else if (data.type === "step_start") {
              setActiveAction(`[Passo ${data.step}] ${data.description}`)
            } else if (data.type === "test_complete" && data.result) {
              const res = data.result
              setStagesResults((prev) => {
                const updated = [...prev]
                const stepScreenshots = res.steps?.map((s: any) => s.screenshot).filter(Boolean) || []
                if (stepScreenshots.length > 0) {
                  setActiveScreenshot(stepScreenshots[stepScreenshots.length - 1])
                }
                if (res.steps?.[0]?.url) {
                  setActiveUrl(res.steps[0].url)
                }

                updated.push({
                  stage: updated.length + 1,
                  title: res.title || "Etapa E2E",
                  result: res,
                })
                return updated
              })
            } else if (data.type === "journey_complete") {
              if (data.result?.stages) {
                setStagesResults(data.result.stages)
              }
              setActiveAction("Jornada E2E real concluída com sucesso no Chromium!")
            }
          } catch (e) {
            console.error("Erro ao processar evento SSE:", e)
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setActiveAction("Execução cancelada pelo usuário.")
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        setActiveAction(`Erro na automação real: ${msg}`)
      }
    } finally {
      setIsRunning(false)
    }
  }, [isHeaded])

  const handleNext = useCallback(() => {
    setCurrentStageIndex((prev) => (prev < SIMULATOR_STAGES.length - 1 ? prev + 1 : prev))
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentStageIndex((prev) => (prev > 0 ? prev - 1 : 0))
  }, [])

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setCurrentStageIndex(0)
    setIsRunning(false)
    setActiveAction("Pronto para reiniciar.")
  }, [])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === " " && !isRunning) {
        e.preventDefault()
        handleRunJourney()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault()
        handleReset()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleRunJourney, handleNext, handlePrev, handleReset, isRunning])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header do Simulador E2E */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Monitor className="w-3.5 h-3.5" />
                Executor E2E Real Playwright
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Sem Telas Simuladas · Aplicação Verdadeira (Chromium v156)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Central de Execução E2E & Auditoria de Requisitos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Executa a jornada ponta a ponta real nas telas originais do Planeja+ através do Playwright,
              preenchendo formulários verdadeiros, acionando botões, validando requisições HTTP e verificando
              a persistência no banco e armazenamento.
            </p>
          </div>

          {/* Links Rápidos */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <Link
              href="/validation"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors shadow-sm"
            >
              <FileCheck className="w-4 h-4 text-primary" />
              <span>Central de Requisitos (66)</span>
            </Link>
          </div>
        </div>

        {/* Timeline e Controles de Navegação */}
        <TimelineNav
          stages={SIMULATOR_STAGES}
          currentStageIndex={currentStageIndex}
          isPlaying={isRunning}
          speed={speed}
          onSelectStage={(idx) => {
            setCurrentStageIndex(idx)
          }}
          onTogglePlay={handleRunJourney}
          onNext={handleNext}
          onPrev={handlePrev}
          onReset={handleReset}
          onChangeSpeed={setSpeed}
        />

        {/* Grade Dividida em 2 Painéis (Visualizador Real + Auditoria de Regras) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Painel Esquerdo: Visualizador da Sessão Real do Playwright (7 colunas) */}
          <div className="lg:col-span-7 flex flex-col">
            <RealE2ESessionViewer
              currentStageIndex={currentStageIndex}
              stagesResults={stagesResults}
              activeScreenshot={activeScreenshot}
              activeUrl={activeUrl}
              activeAction={activeAction}
              isRunning={isRunning}
              isHeaded={isHeaded}
              onToggleHeaded={setIsHeaded}
              onRunJourney={handleRunJourney}
              onSelectStage={setCurrentStageIndex}
            />
          </div>

          {/* Painel Direito: Inspeção Técnica dos Requisitos (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col">
            <RequirementsInspector stage={currentStage} />
          </div>
        </div>

        {/* Banner Informativo Inferior */}
        <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>
              Para abrir a janela do navegador na sua tela durante a apresentação para o professor, marque a caixa{" "}
              <strong className="text-foreground">"Janela Visível (Headed)"</strong> e clique em Executar.
            </span>
          </div>

          <Link
            href="/validation"
            className="text-primary hover:underline font-semibold flex items-center gap-1 self-end sm:self-auto"
          >
            Ver todos os 66 requisitos na Central de Validação →
          </Link>
        </div>
      </main>
    </div>
  )
}

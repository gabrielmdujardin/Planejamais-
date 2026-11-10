"use client"

import { useState } from "react"
import {
  Monitor,
  ExternalLink,
  Layers,
  Database,
  Globe,
  Camera,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react"

export interface E2EStepInfo {
  step: number
  action: string
  url?: string
  screenshot?: string
  description?: string
  errorObserved?: string
}

export interface E2EStageResult {
  stage: number
  title: string
  result: {
    id: string
    title: string
    category: string
    passed: boolean
    durationMs: number
    steps: E2EStepInfo[]
    scenarios?: Array<{ name: string; expected: string; actual: string; passed: boolean }>
    evidence?: {
      screenshots: string[]
      requests?: any[]
      dbVerified?: boolean
      details?: string
    }
  }
}

interface RealE2ESessionViewerProps {
  currentStageIndex: number
  stagesResults: E2EStageResult[]
  activeScreenshot?: string
  activeUrl?: string
  activeAction?: string
  isRunning: boolean
  isHeaded: boolean
  onToggleHeaded: (headed: boolean) => void
  onRunJourney: () => void
  onSelectStage: (stageIndex: number) => void
}

export function RealE2ESessionViewer({
  currentStageIndex,
  stagesResults,
  activeScreenshot,
  activeUrl = "http://127.0.0.1:3000",
  activeAction = "Aguardando início da execução real...",
  isRunning,
  isHeaded,
  onToggleHeaded,
  onRunJourney,
  onSelectStage,
}: RealE2ESessionViewerProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  // Obtém o resultado do estágio atual se já tiver sido executado
  const currentResult = stagesResults[currentStageIndex]
  const currentScreenshots = currentResult?.result.evidence?.screenshots || []
  const displayScreenshot =
    selectedPhotoIndex !== null && currentScreenshots[selectedPhotoIndex]
      ? currentScreenshots[selectedPhotoIndex]
      : activeScreenshot || (currentScreenshots.length > 0 ? currentScreenshots[currentScreenshots.length - 1] : undefined)

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden h-full">
      {/* Barra de Título / Janela do Navegador Real */}
      <div className="p-3 bg-muted/60 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Controles de Janela do Navegador */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            Playwright Chromium Headed/Automated View
          </span>
        </div>

        {/* Barra de Endereço URL Real */}
        <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border font-mono text-[11px] text-foreground truncate shadow-inner">
          <Globe className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">{activeUrl}</span>
        </div>

        {/* Toggle Headed e Botão de Execução */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isHeaded}
              onChange={(e) => onToggleHeaded(e.target.checked)}
              disabled={isRunning}
              className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
            />
            <span className={isHeaded ? "text-primary font-bold" : ""}>
              Janela Visível (Headed)
            </span>
          </label>

          <button
            type="button"
            onClick={onRunJourney}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Executando...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Executar Automação Real</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Área Central: Visualizador da Captura Real ou Estado Inicial */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col bg-background/50 overflow-y-auto">
        {displayScreenshot ? (
          <div className="space-y-4">
            {/* Tag de Prova Real */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  Captura Real de Tela do Playwright
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {displayScreenshot.split("/").pop()}
                </span>
              </div>

              <a
                href={displayScreenshot}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Abrir imagem original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Imagem Real Renderizada */}
            <div className="rounded-xl border border-border overflow-hidden shadow-lg bg-black/5 relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayScreenshot}
                alt="Captura real da tela executada no Playwright"
                className="w-full h-auto object-contain max-h-[480px] mx-auto"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-lg bg-black/70 text-white font-medium text-xs backdrop-blur-sm">
                  Renderização fiel gerada pelo Chromium durante o teste
                </span>
              </div>
            </div>

            {/* Miniaturas de Passos Executados nesta Etapa */}
            {currentScreenshots.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Sequência de Capturas da Etapa ({currentScreenshots.length} passos):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {currentScreenshots.map((shot, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(sIdx)}
                      className={`relative rounded-lg border overflow-hidden shrink-0 w-24 h-16 transition-all ${
                        displayScreenshot === shot
                          ? "border-primary ring-2 ring-primary/40 shadow-sm"
                          : "border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot} alt={`Passo ${sIdx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] font-mono px-1 rounded-tl">
                        P{sIdx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Estado Inicial Antes de Executar */
          <div className="my-auto py-12 px-4 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
              <Camera className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-foreground text-base sm:text-lg">
                Automação E2E com Playwright & Chromium Real
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Este visualizador executa testes reais diretamente nas rotas, formulários, botões e
                armazenamento do Planeja+, sem nenhuma tela simulada ou dados pré-fabricados.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-left text-xs space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>O que acontece ao clicar em Executar:</span>
              </div>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside text-[11px]">
                <li>O Playwright abre uma instância real do Chromium.</li>
                <li>Navega pelas páginas originais (<code className="font-mono">/register</code>, <code className="font-mono">/create-event</code>, etc.).</li>
                <li>Preenche os campos originais com dados de teste controlados.</li>
                <li>Dispara validações reais de front-end, chamadas de rede e persistência.</li>
                <li>Tira capturas reais de cada passo e as exibe aqui em tempo real.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onRunJourney}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Automação Completa no Navegador</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra Inferior com Status da Ação e Validação em Três Camadas */}
      <div className="p-3.5 bg-muted/40 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
          ) : currentResult?.result.passed ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0" />
          )}
          <span className="font-mono text-foreground font-semibold truncate max-w-md">
            {activeAction}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono self-end sm:self-auto">
          {currentResult && (
            <>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Check className="w-3.5 h-3.5" />
                {currentResult.result.durationMs}ms
              </span>
              <span>•</span>
              <span className="text-foreground">
                {currentResult.result.scenarios?.length || 1} cenários atendidos
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

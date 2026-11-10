"use client"

import { SimulatorStage } from "@/lib/simulator/stages"
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react"

interface TimelineNavProps {
  stages: SimulatorStage[]
  currentStageIndex: number
  isPlaying: boolean
  speed: "normal" | "fast" | "manual"
  onSelectStage: (index: number) => void
  onTogglePlay: () => void
  onNext: () => void
  onPrev: () => void
  onReset: () => void
  onChangeSpeed: (speed: "normal" | "fast" | "manual") => void
}

export function TimelineNav({
  stages,
  currentStageIndex,
  isPlaying,
  speed,
  onSelectStage,
  onTogglePlay,
  onNext,
  onPrev,
  onReset,
  onChangeSpeed,
}: TimelineNavProps) {
  const currentStage = stages[currentStageIndex]
  const progressPercent = Math.round(((currentStageIndex + 1) / stages.length) * 100)

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm p-4 sm:p-5 space-y-4">
      {/* Linha Superior: Controles de Reprodução e Velocidade */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Controles Play/Pause/Prev/Next/Reset */}
        <div className="flex items-center gap-2">
          {/* Botão Play / Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar Simulação</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reproduzir Jornada E2E</span>
              </>
            )}
          </button>

          {/* Anterior */}
          <button
            type="button"
            onClick={onPrev}
            disabled={currentStageIndex === 0}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Passo Anterior (Seta Esquerda)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Próximo */}
          <button
            type="button"
            onClick={onNext}
            disabled={currentStageIndex === stages.length - 1}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Próximo Passo (Seta Direita)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reiniciar */}
          <button
            type="button"
            onClick={onReset}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Reiniciar Jornada (Início)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Velocidade e Progresso Numérico */}
        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground px-1.5 font-medium">Velocidade:</span>
            <button
              type="button"
              onClick={() => onChangeSpeed("normal")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                speed === "normal"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              1x (3s)
            </button>
            <button
              type="button"
              onClick={() => onChangeSpeed("fast")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                speed === "fast"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              2x (1.5s)
            </button>
            <button
              type="button"
              onClick={() => onChangeSpeed("manual")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                speed === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Manual
            </button>
          </div>

          <span className="font-mono text-muted-foreground text-xs hidden md:inline">
            Etapa <strong>{currentStageIndex + 1}</strong> de <strong>{stages.length}</strong> (
            {progressPercent}%)
          </span>
        </div>
      </div>

      {/* Barra de Progresso Animada */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border/50">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Pílulas das 10 Etapas (Clique Direto para Saltar) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 pt-1">
        {stages.map((stg, idx) => {
          const isActive = idx === currentStageIndex
          const isCompleted = idx < currentStageIndex

          return (
            <button
              key={stg.id}
              type="button"
              onClick={() => onSelectStage(idx)}
              className={`p-2 rounded-xl text-left border transition-all select-none ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20"
                  : isCompleted
                  ? "bg-muted/40 border-emerald-500/30 text-foreground hover:bg-muted"
                  : "bg-card border-border/70 text-muted-foreground hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span>0{stg.id}</span>
                {isCompleted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
              </div>
              <div className="text-[11px] font-semibold truncate mt-0.5 leading-tight">
                {stg.title.split(". ")[1] || stg.title}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}


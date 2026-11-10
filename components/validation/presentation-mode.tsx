"use client"

import { useState, useEffect, useCallback } from "react"
import { RequirementItem } from "@/lib/validation-center/types"
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  X,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ClipboardCheck,
} from "lucide-react"

interface PresentationModeProps {
  items: RequirementItem[]
  currentIndex: number
  onNavigate: (index: number) => void
  onRunTest: (id: string) => Promise<void>
  onClose: () => void
  onSaveAssessment: (id: string, notes: string, approved: boolean, score?: number) => void
}

export function PresentationMode({
  items,
  currentIndex,
  onNavigate,
  onRunTest,
  onClose,
  onSaveAssessment,
}: PresentationModeProps) {
  const currentItem = items[currentIndex]
  const [isRunning, setIsRunning] = useState(false)
  const [teacherNotes, setTeacherNotes] = useState(currentItem?.manualAssessment?.notes || "")
  const [teacherScore, setTeacherScore] = useState<number | undefined>(
    currentItem?.manualAssessment?.score
  )
  const [showTeacherPanel, setShowTeacherPanel] = useState(false)

  // Sincroniza notas ao trocar de item
  useEffect(() => {
    setTeacherNotes(currentItem?.manualAssessment?.notes || "")
    setTeacherScore(currentItem?.manualAssessment?.score)
  }, [currentItem])

  const handleRun = useCallback(async () => {
    if (!currentItem || isRunning) return
    setIsRunning(true)
    try {
      await onRunTest(currentItem.id)
    } finally {
      setIsRunning(false)
    }
  }, [currentItem, isRunning, onRunTest])

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === "ArrowRight") {
        if (currentIndex < items.length - 1) onNavigate(currentIndex + 1)
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) onNavigate(currentIndex - 1)
      } else if (e.key === "Escape") {
        onClose()
      } else if (e.key === " ") {
        e.preventDefault()
        handleRun()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, items.length, onNavigate, onClose, handleRun])

  if (!currentItem) return null

  const handleSaveNotes = (approved: boolean) => {
    onSaveAssessment(currentItem.id, teacherNotes, approved, teacherScore)
    setShowTeacherPanel(false)
  }

  const categoryLabel = {
    RN: "Regra de Negócio",
    RF: "Requisito Funcional",
    RNF: "Requisito Não Funcional",
  }[currentItem.category]

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col overflow-hidden text-foreground">
      {/* Top Bar da Apresentação */}
      <div className="h-16 px-6 border-b border-border/80 flex items-center justify-between bg-card/60 shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-md bg-primary text-primary-foreground font-mono font-bold text-sm tracking-wide">
            {currentItem.id}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {categoryLabel} • Requisito {currentIndex + 1} de {items.length}
          </span>
        </div>

        {/* Atalhos rápidos + Fechar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTeacherPanel(!showTeacherPanel)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
            <span>Avaliação do Professor</span>
          </button>

          <span className="text-xs text-muted-foreground hidden md:inline">
            Use <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono">←</kbd>{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono">→</kbd> para
            navegar e{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono">Espaço</kbd>{" "}
            para testar
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Sair do Modo Apresentação (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Conteúdo Central em Destaque para Projetor */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-6xl w-full mx-auto flex flex-col justify-between gap-6">
        <div className="space-y-6">
          {/* Título Principal em Tipografia Grande */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Apresentação Prática — TCC 2026
              </span>
              {currentItem.status === "passed" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> APROVADO
                </span>
              )}
              {currentItem.status === "failed" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300">
                  <XCircle className="w-3 h-3" /> REPROVADO
                </span>
              )}
              {currentItem.status === "manual" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3" /> AFERIÇÃO EXTERNA PENDENTE
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {currentItem.title}
            </h1>
          </div>

          {/* Card Descritivo Oficial */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Definição Formal do Requisito
            </h2>
            <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-normal">
              {currentItem.description}
            </p>
          </div>

          {/* O que isso significa na prática / Relevância */}
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Relevância Operacional no Planeja+
            </h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              {currentItem.explanation}
            </p>
          </div>

          {/* Painel de Execução do Teste Real */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Validação Técnica em Tempo Real
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Executa o código real do repositório comparando entradas, saídas esperadas e resultados.
                </p>
              </div>

              {/* Botão de Disparo Grande */}
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm sm:text-base font-bold shadow-md transition-all ${
                  currentItem.status === "passed"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {currentItem.status === "passed" ? (
                  <>
                    <RotateCcw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
                    <span>Reexecutar Teste (Espaço)</span>
                  </>
                ) : (
                  <>
                    <Play className={`w-4 h-4 fill-current ${isRunning ? "animate-spin" : ""}`} />
                    <span>Executar Teste Real (Espaço)</span>
                  </>
                )}
              </button>
            </div>

            {/* Resultados dos Cenários */}
            {currentItem.lastRun && currentItem.lastRun.scenarios.length > 0 ? (
              <div className="space-y-3 pt-2">
                {currentItem.lastRun.scenarios.map((sc, sIdx) => (
                  <div
                    key={sc.id || sIdx}
                    className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {sc.passed ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-bold text-sm sm:text-base text-foreground">
                          {sc.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-muted">
                        {sc.durationMs}ms
                      </span>
                    </div>

                    {/* Comparação Lado a Lado (Projetor Friendly) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <span className="text-muted-foreground block text-xs uppercase font-sans font-semibold mb-1">
                          Resultado Esperado pela Regra:
                        </span>
                        <span className="text-foreground">{sc.expected}</span>
                      </div>
                      <div
                        className={`p-3 rounded-lg border ${
                          sc.passed
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                            : "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200"
                        }`}
                      >
                        <span className="text-muted-foreground block text-xs uppercase font-sans font-semibold mb-1">
                          Resultado Obtido no Sistema Real:
                        </span>
                        <span className="font-bold">{sc.actual}</span>
                      </div>
                    </div>

                    {sc.details && (
                      <p className="text-xs text-muted-foreground italic">
                        Evidência: {sc.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  Nenhum teste executado nesta sessão. Pressione{" "}
                  <strong className="text-foreground">Espaço</strong> ou clique em{" "}
                  <strong className="text-foreground">Executar Teste</strong>.
                </p>
              </div>
            )}

            {/* Test File info */}
            <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 font-mono">
              <span className="flex items-center gap-1.5 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                {currentItem.testFiles.join(", ")}
              </span>
              {currentItem.lastRun && (
                <span>
                  Tempo total: {currentItem.lastRun.durationMs}ms
                </span>
              )}
            </div>
          </div>

          {/* Painel do Professor (quando expandido) */}
          {showTeacherPanel && (
            <div className="p-6 rounded-2xl bg-card border-2 border-primary/40 shadow-lg space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Registro de Avaliação Presencial da Banca / Professor
              </h3>
              <p className="text-xs text-muted-foreground">
                Registre anotações, notas e parecer de conformidade para constar no Relatório Final do TCC.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Parecer / Observações do Avaliador:
                  </label>
                  <textarea
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    placeholder="Ex: Funcionalidade demonstrada com sucesso. Cenário com 20 confirmados validado..."
                    className="w-full h-24 p-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveNotes(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    Homologar como Aprovado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveNotes(false)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                  >
                    Registrar com Ressalva
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTeacherPanel(false)}
                    className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Navegação Inferior (Fixa na tela) */}
        <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior (←)</span>
          </button>

          {/* Seletor rápido de requisitos */}
          <select
            value={currentIndex}
            onChange={(e) => onNavigate(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs sm:text-sm font-mono font-semibold outline-none max-w-[200px] sm:max-w-md truncate"
          >
            {items.map((it, idx) => (
              <option key={it.id} value={idx}>
                {it.id} — {it.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => currentIndex < items.length - 1 && onNavigate(currentIndex + 1)}
            disabled={currentIndex === items.length - 1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <span>Próximo (→)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { RequirementItem } from "@/lib/validation-center/types"
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCode,
  Info,
  Check,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react"

interface RequirementCardProps {
  item: RequirementItem
  onRunTest: (id: string) => Promise<void>
  onViewEvidence: (item: RequirementItem) => void
  onManualAssess?: (item: RequirementItem) => void
  isSelected?: boolean
}

export function RequirementCard({
  item,
  onRunTest,
  onViewEvidence,
  onManualAssess,
  isSelected = false,
}: RequirementCardProps) {
  const [expanded, setExpanded] = useState(isSelected)
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRunning(true)
    try {
      await onRunTest(item.id)
      setExpanded(true)
    } finally {
      setIsRunning(false)
    }
  }

  // Cores por categoria
  const categoryConfig = {
    RN: {
      label: "Regra de Negócio",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    },
    RF: {
      label: "Requisito Funcional",
      badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    },
    RNF: {
      label: "Requisito Não Funcional",
      badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    },
  }[item.category]

  // Cores por status
  const statusConfig = {
    not_tested: {
      label: "Não Testado",
      icon: Clock,
      pillClass: "bg-muted text-muted-foreground border-border",
    },
    running: {
      label: "Executando...",
      icon: RotateCcw,
      pillClass: "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse",
    },
    passed: {
      label: "Aprovado",
      icon: CheckCircle2,
      pillClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
    failed: {
      label: "Reprovado",
      icon: XCircle,
      pillClass: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    },
    manual: {
      label: "Aferição Externa",
      icon: AlertTriangle,
      pillClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
  }[item.status]

  const StatusIcon = statusConfig.icon

  return (
    <div
      id={`req-${item.id}`}
      className={`rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]"
          : "border-border/80 hover:border-primary/40 bg-card"
      } shadow-sm overflow-hidden`}
    >
      {/* Header do Card */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
      >
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          {/* Badge ID */}
          <div className="flex flex-col items-start gap-1">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${categoryConfig.badgeClass}`}
            >
              {item.id}
            </span>
          </div>

          {/* Título & Categoria */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base sm:text-lg text-foreground tracking-tight leading-snug">
                {item.title}
              </h3>
              <span className="text-xs text-muted-foreground hidden md:inline">
                • {categoryConfig.label}
              </span>
            </div>

            {/* Requisitos Relacionados */}
            {item.relatedReqs.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Relacionados:</span>
                {item.relatedReqs.slice(0, 5).map((rel) => (
                  <span
                    key={rel}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground border border-border/50"
                  >
                    {rel}
                  </span>
                ))}
                {item.relatedReqs.length > 5 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{item.relatedReqs.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status + Ações */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.pillClass}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
            <span>{statusConfig.label}</span>
          </div>

          {/* Duração se executado */}
          {item.lastRun && (
            <span className="text-xs font-mono text-muted-foreground hidden lg:inline">
              {item.lastRun.durationMs}ms
            </span>
          )}

          {/* Botão de Executar Teste */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              item.status === "passed"
                ? "bg-muted hover:bg-muted/80 text-foreground border border-border"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {item.status === "passed" ? (
              <>
                <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                <span>Reexecutar</span>
              </>
            ) : (
              <>
                <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
                <span>Executar Teste</span>
              </>
            )}
          </button>

          {/* Toggle Expandir */}
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            aria-label="Detalhes"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {expanded && (
        <div className="px-4 pb-5 pt-1 border-t border-border/60 bg-muted/20 space-y-4 text-sm">
          {/* Descrição Oficial */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Descrição Oficial da Documentação (TCC 2026)
            </h4>
            <p className="text-foreground/90 leading-relaxed text-sm bg-card p-3 rounded-lg border border-border/60">
              {item.description}
            </p>
          </div>

          {/* Explicação Prática */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Comportamento Esperado & Relevância no Domínio
            </h4>
            <p className="text-foreground/80 leading-relaxed text-sm bg-card p-3 rounded-lg border border-border/60">
              {item.explanation}
            </p>
          </div>

          {/* Cenários de Teste Reais */}
          {item.lastRun && item.lastRun.scenarios.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Cenários Executados ({item.lastRun.scenarios.length})
              </h4>
              <div className="space-y-2">
                {item.lastRun.scenarios.map((sc, idx) => (
                  <div
                    key={sc.id || idx}
                    className="p-3 rounded-lg border border-border/80 bg-card text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {sc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span className="font-semibold text-foreground">{sc.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">{sc.durationMs}ms</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 rounded bg-muted/60 border border-border/40">
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans">
                          Valor Esperado:
                        </span>
                        <span className="text-foreground">{sc.expected}</span>
                      </div>
                      <div
                        className={`p-2 rounded border ${
                          sc.passed
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                            : "bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-200"
                        }`}
                      >
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans">
                          Valor Obtido (Execução Real):
                        </span>
                        <span>{sc.actual}</span>
                      </div>
                    </div>

                    {sc.details && (
                      <p className="text-[11px] text-muted-foreground italic pt-1">
                        Evidência: {sc.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Se for RNF externo sem execução de código */}
          {!item.automated && item.status === "manual" && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Requisito de Aferição Externa / Protocolo Empírico</span>
              </div>
              <p className="leading-relaxed">
                Este requisito exige medição externa (como questionário SUS com 5 usuários,
                teste de carga k6 ou telemetria contínua de 30 dias na Vercel).
              </p>
              {onManualAssess && (
                <button
                  type="button"
                  onClick={() => onManualAssess(item)}
                  className="mt-1 px-3 py-1.5 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Registrar Avaliação do Professor
                </button>
              )}
            </div>
          )}

          {/* Rodapé do Card com Arquivo de Teste e Botão de Evidência */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.testFiles.join(", ")}</span>
            </div>

            <button
              type="button"
              onClick={() => onViewEvidence(item)}
              className="text-primary hover:underline font-medium text-xs self-end sm:self-auto"
            >
              Ver Evidência Técnica Completa →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


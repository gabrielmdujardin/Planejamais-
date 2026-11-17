"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { RequirementItem, ValidationSummary } from "@/lib/validation-center/types"
import { REQUIREMENTS_CATALOG } from "@/lib/validation-center/catalog"
import { RequirementCard } from "@/components/validation/requirement-card"
import { PresentationMode } from "@/components/validation/presentation-mode"
import { EvidenceModal } from "@/components/validation/evidence-modal"
import { PrintableReport } from "@/components/validation/printable-report"
import Navbar from "@/components/navbar"
import {
  Search,
  Play,
  RotateCcw,
  Tv,
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Cpu,
} from "lucide-react"

export default function ValidationCenterPage() {
  // Estado principal dos 71 requisitos (18 RN + 43 RF + 10 RNF)
  const [items, setItems] = useState<RequirementItem[]>(() =>
    REQUIREMENTS_CATALOG.map((r) => ({ ...r }))
  )

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "RN" | "RF" | "RNF">("all")
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "passed"
    | "failed"
    | "partial"
    | "not_implemented"
    | "not_tested"
    | "blocked"
    | "needs_refinement"
    | "manual"
  >("all")
  const [problemFilter, setProblemFilter] = useState<string>("all")

  // Modos e Modais
  const [presentationOpen, setPresentationOpen] = useState(false)
  const [presentationIndex, setPresentationIndex] = useState(0)
  const [evidenceItem, setEvidenceItem] = useState<RequirementItem | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [isHeaded, setIsHeaded] = useState(false)

  // Estado de execução em lote
  const [isBatchRunning, setIsBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{
    current: number
    total: number
    currentReqId?: string
  }>({ current: 0, total: REQUIREMENTS_CATALOG.length })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Atalhos de teclado globais
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInputRef.current &&
        !presentationOpen &&
        !reportOpen &&
        !evidenceItem
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === "Escape") {
        if (evidenceItem) setEvidenceItem(null)
        else if (reportOpen) setReportOpen(false)
        else if (searchQuery) setSearchQuery("")
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [presentationOpen, reportOpen, evidenceItem, searchQuery])

  // Recálculo do resumo de métricas em tempo real
  const summary: ValidationSummary = useMemo(() => {
    const total = items.length
    const passed = items.filter((i) => i.status === "passed").length
    const failed = items.filter((i) => i.status === "failed").length
    const manualPending = items.filter((i) => i.status === "manual").length
    const notTested = items.filter(
      (i) =>
        i.status === "not_tested" ||
        i.status === "running" ||
        i.status === "partial" ||
        i.status === "not_implemented" ||
        i.status === "blocked" ||
        i.status === "needs_refinement"
    ).length
    const tested = passed + failed
    const progressPercent = total > 0 ? Math.round(((tested + manualPending) / total) * 100) : 0
    const totalDurationMs = items.reduce(
      (acc, i) => acc + (i.lastRun ? i.lastRun.durationMs : 0),
      0
    )

    return {
      total,
      tested,
      passed,
      failed,
      notTested,
      manualPending,
      progressPercent,
      totalDurationMs: Math.round(totalDurationMs * 100) / 100,
    }
  }, [items])

  // Execução de teste individual chamando API real com suporte a Playwright E2E
  const handleRunSingleTest = useCallback(
    async (id: string, customHeaded?: boolean) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "running" as const } : it))
      )

      try {
        const response = await fetch("/api/validation/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            headed: customHeaded ?? isHeaded,
            e2e: false,
          }),
        })

        if (!response.ok) {
          throw new Error(`Falha ao executar teste ${id}: status HTTP ${response.status}`)
        }

        const data = await response.json()
        const res = data.result

        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it
            return {
              ...it,
              status: res.status,
              lastRun: {
                timestamp: res.timestamp,
                passed: res.status === "passed",
                durationMs: res.durationMs,
                scenarios: res.scenarios,
                logs: res.logs,
                screenshots: res.screenshots,
                isRealBrowser: res.isRealBrowser,
                realBrowserEvidence: res.realBrowserEvidence,
              },
            }
          })
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it
            return {
              ...it,
              status: "failed" as const,
              lastRun: {
                timestamp: new Date().toISOString(),
                passed: false,
                durationMs: 0,
                scenarios: [],
                logs: [`Erro na requisição: ${msg}`],
              },
            }
          })
        )
      }
    },
    [isHeaded]
  )

  // Execução completa sequencial com streaming SSE em tempo real
  const handleRunAll = async () => {
    if (isBatchRunning) return
    setIsBatchRunning(true)
    setBatchProgress({ current: 0, total: items.length })

    try {
      const response = await fetch("/api/validation/run?stream=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ all: true, stream: true }),
      })

      if (!response.ok || !response.body) {
        const postRes = await fetch("/api/validation/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        })
        const data = await postRes.json()
        if (data.results && Array.isArray(data.results)) {
          const resultsMap = new Map(data.results.map((r: any) => [r.id, r]))
          setItems((prev) =>
            prev.map((it) => {
              const r: any = resultsMap.get(it.id)
              if (!r) return it
              return {
                ...it,
                status: r.status,
                lastRun: {
                  timestamp: r.timestamp,
                  passed: r.status === "passed",
                  durationMs: r.durationMs,
                  scenarios: r.scenarios,
                  logs: r.logs,
                },
              }
            })
          )
        }
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data: ")) continue
          const jsonStr = trimmed.slice(6)
          try {
            const event = JSON.parse(jsonStr)

            if (event.type === "progress" && event.result) {
              const r = event.result
              setBatchProgress({
                current: event.index,
                total: event.total,
                currentReqId: r.id,
              })

              setItems((prev) =>
                prev.map((it) => {
                  if (it.id !== r.id) return it
                  return {
                    ...it,
                    status: r.status,
                    lastRun: {
                      timestamp: r.timestamp,
                      passed: r.status === "passed",
                      durationMs: r.durationMs,
                      scenarios: r.scenarios,
                      logs: r.logs,
                    },
                  }
                })
              )
            }
          } catch {
            // Linha com formato inválido ignorada
          }
        }
      }
    } catch (error) {
      console.error("Erro na validação completa:", error)
    } finally {
      setIsBatchRunning(false)
      setBatchProgress((prev) => ({ ...prev, currentReqId: undefined }))
    }
  }

  // Limpeza de resultados para reexecução limpa
  const handleResetAll = () => {
    setItems(
      REQUIREMENTS_CATALOG.map((r) => ({
        ...r,
        status: r.automated ? "not_tested" : "manual",
        lastRun: undefined,
      }))
    )
  }

  // Salvar avaliação presencial do professor
  const handleSaveAssessment = (
    id: string,
    notes: string,
    approved: boolean,
    score?: number
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        return {
          ...it,
          status: approved ? "passed" : "failed",
          manualAssessment: {
            evaluator: "Professor / Banca TCC",
            notes,
            approved,
            score,
            timestamp: new Date().toISOString(),
          },
        }
      })
    )
  }

  // Filtragem instantânea dos 71 requisitos
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return items.filter((it) => {
      // Filtro de Categoria
      if (categoryFilter !== "all" && it.category !== categoryFilter) {
        return false
      }

      // Filtro de Status
      if (statusFilter !== "all") {
        if (it.status !== statusFilter) return false
      }

      // Filtro por Tipo de Problema / Evolução da Auditoria
      if (problemFilter !== "all") {
        if (problemFilter === "reproved_fixed" && it.previousStatus !== "failed") return false
        if (problemFilter === "refined" && it.previousStatus !== "needs_refinement") return false
        if (problemFilter === "new_req" && it.previousStatus !== "new") return false
        if (
          problemFilter !== "reproved_fixed" &&
          problemFilter !== "refined" &&
          problemFilter !== "new_req" &&
          it.problemClassification !== problemFilter
        )
          return false
      }

      // Busca por código, título, descrição ou palavras-chave
      if (q) {
        const matchesId = it.id.toLowerCase().includes(q)
        const matchesTitle = it.title.toLowerCase().includes(q)
        const matchesDesc = it.description.toLowerCase().includes(q)
        const matchesExp = it.explanation.toLowerCase().includes(q)
        const matchesRel = it.relatedReqs.some((r) => r.toLowerCase().includes(q))
        const matchesRoot = (it.rootCauseAnalysis || "").toLowerCase().includes(q)
        return matchesId || matchesTitle || matchesDesc || matchesExp || matchesRel || matchesRoot
      }

      return true
    })
  }, [items, searchQuery, categoryFilter, statusFilter, problemFilter])

  // Abrir apresentação a partir de um requisito específico
  const openPresentationAt = (reqId: string) => {
    const idx = items.findIndex((i) => i.id === reqId)
    setPresentationIndex(idx >= 0 ? idx : 0)
    setPresentationOpen(true)
  }

  const rnCount = useMemo(() => items.filter((i) => i.category === "RN").length, [items])
  const rfCount = useMemo(() => items.filter((i) => i.category === "RF").length, [items])
  const rnfCount = useMemo(() => items.filter((i) => i.category === "RNF").length, [items])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Principal da Central */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Cpu className="w-3.5 h-3.5" />
                  Planeja+ • TCC 2026
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Auditoria Completa • RBAC Colaborativo RN-002
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Central Interativa de Validação de Requisitos
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                Painel interativo para apresentação à banca avaliadora. Executa os testes reais
                do sistema para todas as <strong>{rnCount} Regras de Negócio</strong> (incluindo o
                modelo RBAC colaborativo da RN-002 com 20 cenários),{" "}
                <strong>{rfCount} Requisitos Funcionais</strong> (RF-001 a RF-043) e{" "}
                <strong>{rnfCount} Requisitos Não Funcionais</strong> ({items.length} requisitos oficiais).
              </p>
            </div>

            {/* Ações Primárias */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Checkbox Navegador Visível (Headed) */}
              <label
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 text-xs text-muted-foreground cursor-pointer select-none shadow-sm transition-colors"
                title="Abre a janela do Chromium na tela do computador para demonstração ao vivo ao professor"
              >
                <input
                  type="checkbox"
                  checked={isHeaded}
                  onChange={(e) => setIsHeaded(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <span className={isHeaded ? "text-primary font-bold" : "font-medium text-foreground"}>
                  Navegador Visível (Headed)
                </span>
              </label>

              {/* Botão de Validação Completa em Destaque */}
              <button
                type="button"
                onClick={handleRunAll}
                disabled={isBatchRunning}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {isBatchRunning ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>
                      Validando ({batchProgress.current}/{batchProgress.total})...
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>INICIAR VALIDAÇÃO COMPLETA</span>
                  </>
                )}
              </button>

              {/* Botão Simulador E2E */}
              <Link
                href="/simulator"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Simulador E2E</span>
              </Link>

              {/* Botão Modo Apresentação */}
              <button
                type="button"
                onClick={() => {
                  setPresentationIndex(0)
                  setPresentationOpen(true)
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition-colors shadow-sm"
              >
                <Tv className="w-4 h-4 text-primary" />
                <span>Modo Apresentação</span>
              </button>

              {/* Botão Relatório A4 */}
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition-colors shadow-sm"
                title="Emitir Relatório Oficial A4"
              >
                <Printer className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline">Relatório PDF</span>
              </button>
            </div>
          </div>

          {/* Barra de Progresso Durante Execução */}
          {isBatchRunning && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>
                  Executando requisito:{" "}
                  <strong className="text-foreground">{batchProgress.currentReqId || "..."}</strong>
                </span>
                <span>
                  {batchProgress.current} de {batchProgress.total} (
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden border border-border/40">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Métricas Principais (Dashboard de Conformidade) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {/* Total */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Requisitos
                </span>
                <Layers className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 font-mono">
                {summary.total}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {rnCount} RN • {rfCount} RF • {rnfCount} RNF
              </div>
            </div>

            {/* Aprovados */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Aprovados
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {summary.passed}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {summary.progressPercent}% de conformidade
              </div>
            </div>

            {/* Reprovados */}
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
                  Reprovados
                </span>
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1 font-mono">
                {summary.failed}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                {summary.failed === 0 ? "Zero inconsistências" : "Necessita ajuste"}
              </div>
            </div>

            {/* Pendentes / Aferição Externa */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Aferição Externa
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                {summary.manualPending}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                SUS, LCP 4G, Uptime, k6
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca Rápida Instantânea & Filtros */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o código (ex: RN-002, RF-039, RNF-002) ou palavra-chave (RBAC, equipe, orçamento, convites, rateio)..."
              className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono px-2 py-0.5 rounded border border-border bg-muted/60 pointer-events-none">
                /
              </div>
            )}
          </div>

          {/* Abas e Filtros de Categoria, Status e Tipo de Problema */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Categorias */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted text-foreground"
                }`}
              >
                Todos ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("RN")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === "RN"
                    ? "bg-emerald-600 text-white"
                    : "bg-card border border-border hover:bg-muted text-foreground"
                }`}
              >
                Regras de Negócio ({rnCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("RF")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === "RF"
                    ? "bg-blue-600 text-white"
                    : "bg-card border border-border hover:bg-muted text-foreground"
                }`}
              >
                Requisitos Funcionais ({rfCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("RNF")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === "RNF"
                    ? "bg-purple-600 text-white"
                    : "bg-card border border-border hover:bg-muted text-foreground"
                }`}
              >
                Não Funcionais ({rnfCount})
              </button>
            </div>

            {/* Filtros de Status e Tipo de Problema */}
            <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto text-xs text-muted-foreground">
              <span>Diagnóstico:</span>
              <select
                value={problemFilter}
                onChange={(e) => setProblemFilter(e.target.value)}
                className="px-2.5 py-1 rounded-md border border-border bg-card text-foreground font-medium text-xs outline-none"
              >
                <option value="all">Todos os diagnósticos</option>
                <option value="reproved_fixed">12 Reprovados Corrigidos</option>
                <option value="refined">Regras Refinadas & Falsos Positivos</option>
                <option value="new_req">Novos Requisitos RBAC (RF-039 a RF-043)</option>
                <option value="implementation_error">Erro de implementação</option>
                <option value="incomplete_rule">Regra de negócio incompleta</option>
                <option value="inconsistent_requirement">Requisito funcional inconsistente</option>
                <option value="test_error">Erro no teste automatizado</option>
                <option value="doc_divergence">Divergência na documentação</option>
                <option value="security_flaw">Falha de segurança</option>
              </select>

              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 rounded-md border border-border bg-card text-foreground font-medium text-xs outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="passed">Aprovado</option>
                <option value="failed">Reprovado</option>
                <option value="partial">Parcialmente atendido</option>
                <option value="not_implemented">Não implementado</option>
                <option value="not_tested">Não executado</option>
                <option value="blocked">Bloqueado por dependência</option>
                <option value="needs_refinement">Necessita refinamento</option>
                <option value="manual">Aferição Externa</option>
              </select>

              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                title="Redefinir status dos testes"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Requisitos Filtrados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Exibindo <strong>{filteredItems.length}</strong> de{" "}
              <strong>{items.length}</strong> requisitos
            </span>
            {(searchQuery || problemFilter !== "all" || statusFilter !== "all") && (
              <span>
                Filtros ativos •{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setProblemFilter("all")
                    setStatusFilter("all")
                  }}
                  className="text-primary hover:underline"
                >
                  Limpar filtros
                </button>
              </span>
            )}
          </div>

          {filteredItems.length > 0 ? (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <RequirementCard
                  key={item.id}
                  item={item}
                  onRunTest={handleRunSingleTest}
                  onViewEvidence={(it) => setEvidenceItem(it)}
                  onManualAssess={(it) => openPresentationAt(it.id)}
                  isSelected={
                    Boolean(searchQuery) &&
                    item.id.toLowerCase() === searchQuery.trim().toLowerCase()
                  }
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card p-6 space-y-3">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-bold text-foreground text-base">
                Nenhum requisito encontrado para os filtros aplicados
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tente buscar pelo código exato (ex: <code>RN-002</code>, <code>RF-039</code>,{" "}
                <code>RNF-002</code>) ou palavras como <em>equipe</em>, <em>orçamento</em>,{" "}
                <em>convite</em>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("all")
                  setStatusFilter("all")
                  setProblemFilter("all")
                }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modo Apresentação em Tela Cheia (Projetor) */}
      {presentationOpen && (
        <PresentationMode
          items={filteredItems.length > 0 ? filteredItems : items}
          currentIndex={presentationIndex}
          onNavigate={(newIdx) => setPresentationIndex(newIdx)}
          onRunTest={handleRunSingleTest}
          onClose={() => setPresentationOpen(false)}
          onSaveAssessment={handleSaveAssessment}
        />
      )}

      {/* Modal de Evidência Técnica */}
      {evidenceItem && (
        <EvidenceModal item={evidenceItem} onClose={() => setEvidenceItem(null)} />
      )}

      {/* Modal de Relatório Formatado A4 */}
      {reportOpen && (
        <PrintableReport
          items={items}
          summary={summary}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}

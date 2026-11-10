import { REQUIREMENTS_CATALOG } from "./catalog"
import { REQUIREMENT_EVALUATORS } from "./evaluators"
import { RequirementItem, ScenarioResult, ValidationSummary } from "./types"

export interface RequirementRunResult {
  id: string
  category: "RN" | "RF" | "RNF"
  title: string
  status: "passed" | "failed" | "manual" | "not_tested"
  durationMs: number
  timestamp: string
  scenarios: ScenarioResult[]
  logs: string[]
  screenshots?: string[]
  isRealBrowser?: boolean
  realBrowserEvidence?: {
    url?: string
    actions?: string[]
    requests?: Array<{ method: string; url: string; status?: number }>
    screenshots: string[]
    dbVerified?: boolean
    details?: string
  }
}

/**
 * Retorna todos os 66 requisitos do catálogo oficial com status atualizado.
 */
export function getAllRequirements(): RequirementItem[] {
  return REQUIREMENTS_CATALOG.map((req) => ({ ...req }))
}

/**
 * Busca um requisito específico pelo identificador (ex: "RN-005", "RF-014", "RNF-002").
 */
export function getRequirementById(id: string): RequirementItem | undefined {
  const normalizedId = id.trim().toUpperCase()
  const item = REQUIREMENTS_CATALOG.find((r) => r.id.toUpperCase() === normalizedId)
  return item ? { ...item } : undefined
}

/**
 * Executa os cenários reais de teste associados a um requisito específico.
 * Mede com precisão o tempo de execução e compara os valores esperados vs obtidos.
 */
export async function runRequirementTest(id: string): Promise<RequirementRunResult> {
  const req = getRequirementById(id)
  if (!req) {
    throw new Error(`Requisito com ID "${id}" não encontrado no catálogo.`)
  }

  const startTime = performance.now()
  const scenarios = REQUIREMENT_EVALUATORS[req.id] || []
  const logs: string[] = []
  const scenarioResults: ScenarioResult[] = []

  logs.push(`[${new Date().toLocaleTimeString("pt-BR")}] Iniciando validação para ${req.id} — ${req.title}`)
  logs.push(`Categoria: ${req.category} | Automatizado: ${req.automated ? "Sim" : "Aferição Externa / Manual"}`)

  // Se for um RNF externo sem código executável direto (ex: SUS, Lighthouse 4G, Uptime 30d, k6)
  if (!req.automated && scenarios.length === 0) {
    logs.push(`Requisito depende de aferição externa / protocolo empírico.`)
    const durationMs = Math.round(performance.now() - startTime)
    return {
      id: req.id,
      category: req.category,
      title: req.title,
      status: "manual",
      durationMs,
      timestamp: new Date().toISOString(),
      scenarios: [],
      logs,
    }
  }

  let allPassed = true

  for (const sc of scenarios) {
    const scStart = performance.now()
    try {
      const execResult = await sc.run()
      const scDuration = Math.round((performance.now() - scStart) * 100) / 100

      if (!execResult.passed) {
        allPassed = false
      }

      scenarioResults.push({
        id: sc.id,
        name: sc.name,
        description: sc.description,
        input: sc.input,
        expected: sc.expected,
        actual: execResult.actual,
        passed: execResult.passed,
        durationMs: scDuration,
        details: execResult.details,
      })

      logs.push(`✓ Cenário "${sc.name}" executado em ${scDuration}ms: ${execResult.passed ? "APROVADO" : "REPROVADO"}`)
      if (execResult.details) {
        logs.push(`   Detalhe: ${execResult.details}`)
      }
    } catch (err: unknown) {
      allPassed = false
      const scDuration = Math.round((performance.now() - scStart) * 100) / 100
      const errorMessage = err instanceof Error ? err.message : String(err)

      scenarioResults.push({
        id: sc.id,
        name: sc.name,
        description: sc.description,
        input: sc.input,
        expected: sc.expected,
        actual: `Exceção: ${errorMessage}`,
        passed: false,
        durationMs: scDuration,
        details: `Erro durante a execução do teste: ${errorMessage}`,
      })

      logs.push(`✗ Exceção no cenário "${sc.name}": ${errorMessage}`)
    }
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100
  const status: "passed" | "failed" | "manual" = !req.automated
    ? "manual"
    : allPassed
    ? "passed"
    : "failed"

  logs.push(`Resultado final para ${req.id}: ${status.toUpperCase()} (${durationMs}ms total)`)

  return {
    id: req.id,
    category: req.category,
    title: req.title,
    status,
    durationMs,
    timestamp: new Date().toISOString(),
    scenarios: scenarioResults,
    logs,
  }
}

/**
 * Executa todos os 66 requisitos sequencialmente na ordem padrão:
 * Regras de Negócio (RN-001 a RN-018) -> Requisitos Funcionais (RF-001 a RF-038) -> Não Funcionais (RNF-001 a RNF-010).
 * Suporta callback de progresso para streaming SSE em tempo real.
 */
export async function runAllRequirements(
  onProgress?: (result: RequirementRunResult, index: number, total: number) => void
): Promise<{
  results: RequirementRunResult[]
  summary: ValidationSummary
}> {
  const results: RequirementRunResult[] = []
  const catalog = getAllRequirements()
  const total = catalog.length
  const overallStart = performance.now()

  let passedCount = 0
  let failedCount = 0
  let manualCount = 0

  for (let i = 0; i < catalog.length; i++) {
    const req = catalog[i]
    const result = await runRequirementTest(req.id)
    results.push(result)

    if (result.status === "passed") passedCount++
    else if (result.status === "failed") failedCount++
    else if (result.status === "manual") manualCount++

    if (onProgress) {
      onProgress(result, i + 1, total)
    }
  }

  const totalDurationMs = Math.round((performance.now() - overallStart) * 100) / 100
  const testedCount = passedCount + failedCount

  const summary: ValidationSummary = {
    total,
    tested: testedCount,
    passed: passedCount,
    failed: failedCount,
    notTested: total - (testedCount + manualCount),
    manualPending: manualCount,
    progressPercent: Math.round(((testedCount + manualCount) / total) * 100),
    totalDurationMs,
    lastRunTimestamp: new Date().toISOString(),
  }

  return { results, summary }
}


export type RequirementCategory = "RN" | "RF" | "RNF"

export type RequirementStatus =
  | "not_tested"
  | "running"
  | "passed"
  | "failed"
  | "partial"
  | "not_implemented"
  | "blocked"
  | "needs_refinement"
  | "manual"

export type ProblemClassification =
  | "none"
  | "implementation_error"
  | "test_error"
  | "incomplete_rule"
  | "inconsistent_requirement"
  | "not_implemented"
  | "config_issue"
  | "security_flaw"
  | "doc_divergence"

export const PROBLEM_CLASSIFICATION_LABELS: Record<ProblemClassification, string> = {
  none: "Conforme (Sem divergência)",
  implementation_error: "Erro de implementação",
  test_error: "Erro no teste automatizado",
  incomplete_rule: "Regra de negócio incompleta",
  inconsistent_requirement: "Requisito funcional inconsistente",
  not_implemented: "Funcionalidade não implementada",
  config_issue: "Problema de configuração ou infraestrutura",
  security_flaw: "Falha de segurança",
  doc_divergence: "Divergência na documentação",
}

export interface ScenarioResult {
  id: string
  name: string
  description?: string
  input: string
  expected: string
  actual: string
  passed: boolean
  durationMs: number
  details?: string
}

export interface ScenarioDefinition {
  id: string
  name: string
  description?: string
  input: string
  expected: string
  run: () => Promise<{ passed: boolean; actual: string; details?: string }> | { passed: boolean; actual: string; details?: string }
}

export interface RequirementItem {
  id: string
  category: RequirementCategory
  number: number
  title: string
  description: string
  explanation: string
  relatedReqs: string[]
  expectedBehavior: string
  testFiles: string[]
  automated: boolean
  status: RequirementStatus
  previousStatus?: "passed" | "failed" | "needs_refinement" | "new"
  problemClassification?: ProblemClassification
  rootCauseAnalysis?: string
  correctionApplied?: string
  previousWording?: string
  testedEndpoint?: string
  databaseValidationInfo?: string
  lastRun?: {
    timestamp: string
    passed: boolean
    durationMs: number
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
  manualAssessment?: {
    evaluator: string
    notes: string
    timestamp: string
    approved: boolean
    score?: number
  }
}

export interface ValidationSummary {
  total: number
  tested: number
  passed: number
  failed: number
  partial?: number
  notTested: number
  manualPending: number
  progressPercent: number
  totalDurationMs: number
  lastRunTimestamp?: string
}

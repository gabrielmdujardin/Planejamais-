export type RequirementCategory = "RN" | "RF" | "RNF"

export type RequirementStatus = "not_tested" | "running" | "passed" | "failed" | "manual"

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
  notTested: number
  manualPending: number
  progressPercent: number
  totalDurationMs: number
  lastRunTimestamp?: string
}


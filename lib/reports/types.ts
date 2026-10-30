/**
 * Tipos e contratos do Sistema de Relatórios Documentais PDF — Planeja+
 */

export type ReportType = "executive-summary" | "full-event" | "financial" | "comparative"

export interface ReportSectionConfig {
  generalInfo: boolean
  kpiSummary: boolean
  guestList: boolean
  financialDetails: boolean
  paretoAnalysis: boolean
  attendanceProjection: boolean
  riskAlerts: boolean
  notesAndSignatures: boolean
}

export interface ReportFilterOptions {
  reportType: ReportType
  selectedEventId: string // "all" ou id do evento
  includedSections: ReportSectionConfig
  guestStatusFilter: "all" | "confirmed" | "pending" | "declined"
  density: "compact" | "normal"
  generatedBy?: string
}

export interface NormalizedItem {
  id: string
  name: string
  price: number
  estimatedCost?: number
  category?: string
  paymentStatus: "paid" | "pending" | "estimated" | string
  supplier?: string
  dueDate?: string
  notes?: string
}

export interface NormalizedGuest {
  id: string
  name: string
  email?: string
  phone?: string
  status: "confirmed" | "pending" | "declined" | "awaiting_approval" | "pending_approval" | "rejected" | string
  companionsCount: number
  companionsNames: string[]
  tableNumber?: string
  dietaryRestrictions?: string
}

export interface NormalizedEvent {
  id: string
  title: string
  type: string
  category?: string
  status: string
  date: string
  time?: string
  location?: string
  address?: string
  description?: string
  financialMode: "corporate_budget" | "collaborative_split"
  budgetEstimated: number | null
  totalGuests: number
  confirmedGuests: number
  pendingGuests: number
  declinedGuests: number
  confirmationRate: number
  responseRate: number
  totalCost: number
  paidCost: number
  pendingCost: number
  costPerGuest: number
  costPerConfirmed: number
  riskLevel: "Baixo" | "Médio" | "Alto"
  riskReason?: string
  items: NormalizedItem[]
  guests: NormalizedGuest[]
}

export interface ParetoItem {
  name: string
  value: number
  percentage: number
  cumulative: number
  isTop80: boolean
}

export interface AttendanceScenario {
  name: "Mínima" | "Provável" | "Máxima"
  people: number
  cost: number
  description: string
}

export interface NormalizedReportData {
  reportId: string
  reportType: ReportType
  reportTitle: string
  generatedAt: string
  generatedDateFormatted: string
  generatedBy: string
  isSingleEvent: boolean
  event?: NormalizedEvent
  events: NormalizedEvent[]
  metrics: {
    totalEvents: number
    totalGuests: number
    confirmedGuests: number
    pendingGuests: number
    declinedGuests: number
    confirmationRate: number
    responseRate: number
    totalBudget: number
    totalExpenses: number
    paidExpenses: number
    pendingExpenses: number
    availableBalance: number
    deficit: number
    budgetExecutionRate: number
    averageCostPerGuest: number
    collaborativeEventsCount: number
    corporateEventsCount: number
    highRiskEventsCount: number
  }
  paretoItems: ParetoItem[]
  attendanceScenarios: AttendanceScenario[]
  topSuppliers: Array<{ name: string; total: number; itemCount: number; paidPercentage: number }>
  divergences: Array<{ title: string; detail: string; severity: "critical" | "warning" | "info" }>
}

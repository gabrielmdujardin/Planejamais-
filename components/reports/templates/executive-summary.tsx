"use client"

import React from "react"
import type { NormalizedReportData, ReportSectionConfig } from "@/lib/reports/types"
import { DocumentHeader, DocumentFooter } from "../document-header"
import { DocumentKpiGrid } from "../document-kpi-grid"
import { RsvpDistributionBar, BudgetAllocationBar, AttendanceScenariosSvg } from "../document-charts"
import { DocumentItemTable } from "../document-table"
import { AlertCircle, CheckCircle2, AlertTriangle, FileText } from "lucide-react"

interface TemplateProps {
  data: NormalizedReportData
  sections: ReportSectionConfig
}

export function ExecutiveSummaryTemplate({ data, sections }: TemplateProps) {
  const m = data.metrics
  const event = data.event

  return (
    <div className="report-a4-sheet bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between max-w-[210mm] min-h-[297mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0">
      <div>
        {/* Cabeçalho Oficial */}
        <DocumentHeader data={data} pageNumber={1} totalPages={1} isFirstPage={true} />

        {/* 1. Indicadores Principais */}
        {sections.kpiSummary && <DocumentKpiGrid data={data} />}

        {/* 2. Visualizações Proporcionais de RSVP e Orçamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 avoid-break">
          <div className="p-3.5 border border-slate-200 rounded bg-white">
            <RsvpDistributionBar
              confirmed={m.confirmedGuests}
              pending={m.pendingGuests}
              declined={m.declinedGuests}
              total={m.totalGuests}
            />
          </div>

          <div className="p-3.5 border border-slate-200 rounded bg-white">
            <BudgetAllocationBar
              budget={m.totalBudget}
              totalExpenses={m.totalExpenses}
              paid={m.paidExpenses}
              pending={m.pendingExpenses}
            />
          </div>
        </div>

        {/* 3. Cenários de Presença e Alertas Operacionais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 avoid-break">
          {sections.attendanceProjection && (
            <div className="p-3.5 border border-slate-200 rounded bg-white">
              <AttendanceScenariosSvg scenarios={data.attendanceScenarios} />
            </div>
          )}

          {/* Destaques e Divergências Inteligentes */}
          {sections.riskAlerts && (
            <div className="p-3.5 border border-slate-200 rounded bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    Parecer e Alertas Operacionais
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Diagnóstico
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  {data.divergences.map((div, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-xs border ${
                        div.severity === "critical"
                          ? "bg-red-50 text-red-900 border-red-200"
                          : div.severity === "warning"
                          ? "bg-amber-50 text-amber-900 border-amber-200"
                          : "bg-slate-50 text-slate-800 border-slate-200"
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1 mb-0.5">
                        {div.severity === "critical" ? (
                          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                        ) : div.severity === "warning" ? (
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                        <span>{div.title}</span>
                      </div>
                      <p className="text-[11px] leading-tight opacity-90">{div.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {event && event.riskReason && (
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                  <strong>Classificação de Risco Operacional:</strong> {event.riskLevel} — {event.riskReason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Maiores Despesas (Resumo de Itens) */}
        {sections.financialDetails && data.paretoItems.length > 0 && (
          <div className="mb-5 avoid-break">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Principais Itens de Custo (Top Despesas)
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                {data.paretoItems.length} itens registrados
              </span>
            </div>
            <DocumentItemTable items={event?.items || []} maxItems={4} />
          </div>
        )}

        {/* 5. Bloco de Assinatura e Conferência */}
        {sections.notesAndSignatures && (
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs avoid-break">
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-900">{data.generatedBy}</p>
              <p className="text-[10px] text-slate-500">Responsável pela Emissão</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-900">Coordenação / Aprovador</p>
              <p className="text-[10px] text-slate-500">Conferência & Visto</p>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé Oficial */}
      <DocumentFooter data={data} pageNumber={1} totalPages={1} />
    </div>
  )
}

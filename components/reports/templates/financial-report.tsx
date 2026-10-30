"use client"

import React from "react"
import type { NormalizedReportData, ReportSectionConfig } from "@/lib/reports/types"
import { DocumentHeader, DocumentFooter } from "../document-header"
import { DocumentKpiGrid } from "../document-kpi-grid"
import { BudgetAllocationBar, ParetoSvgChart } from "../document-charts"
import { DocumentItemTable } from "../document-table"
import { formatBRL, formatPercent } from "@/lib/reports/data-collector"
import { Landmark, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react"

interface TemplateProps {
  data: NormalizedReportData
  sections: ReportSectionConfig
}

export function FinancialReportTemplate({ data, sections }: TemplateProps) {
  const m = data.metrics
  const event = data.event

  return (
    <div className="report-a4-sheet bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between max-w-[210mm] min-h-[297mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0">
      <div>
        <DocumentHeader data={data} pageNumber={1} totalPages={1} isFirstPage={true} />

        {/* 1. Indicadores Financeiros */}
        {sections.kpiSummary && <DocumentKpiGrid data={data} />}

        {/* 2. Barra de Execução Orçamentária */}
        <div className="p-4 border border-slate-200 rounded bg-white mb-5 avoid-break">
          <BudgetAllocationBar
            budget={m.totalBudget}
            totalExpenses={m.totalExpenses}
            paid={m.paidExpenses}
            pending={m.pendingExpenses}
          />
        </div>

        {/* 3. Gráfico Vetorial de Pareto */}
        {sections.paretoAnalysis && data.paretoItems.length > 0 && (
          <div className="mb-5 p-4 border border-slate-200 rounded bg-white avoid-break">
            <ParetoSvgChart items={data.paretoItems} maxItems={7} />
          </div>
        )}

        {/* 4. Quadro de Fornecedores e Contas */}
        {data.topSuppliers.length > 0 && (
          <div className="mb-5 avoid-break">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-500" />
                Resumo por Fornecedor & Grau de Liquidação
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                {data.topSuppliers.length} fornecedores identificados
              </span>
            </div>

            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-600">
                    <th className="py-1.5 px-3">Fornecedor / Prestador</th>
                    <th className="py-1.5 px-3 text-center">Contratos / Itens</th>
                    <th className="py-1.5 px-3 text-right">Valor Total</th>
                    <th className="py-1.5 px-3 text-center">Liquidação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {data.topSuppliers.map((supp, i) => (
                    <tr key={i} className={i % 2 === 1 ? "bg-slate-50/50" : ""}>
                      <td className="py-1.5 px-3 font-medium text-slate-900">{supp.name}</td>
                      <td className="py-1.5 px-3 text-center font-mono">{supp.itemCount}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium">{formatBRL(supp.total)}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            supp.paidPercentage >= 100
                              ? "bg-emerald-100 text-emerald-800 font-semibold"
                              : supp.paidPercentage > 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {formatPercent(supp.paidPercentage)} pago
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Tabela Detalhada de Contas a Liquidar */}
        {sections.financialDetails && event?.items && event.items.length > 0 && (
          <div className="mb-5 avoid-break">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Relação Analítica de Itens Orçados
            </h2>
            <DocumentItemTable items={event.items} maxItems={5} />
          </div>
        )}

        {/* 6. Parecer Conclusivo & Assinatura */}
        {sections.notesAndSignatures && (
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs avoid-break">
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-900">{data.generatedBy}</p>
              <p className="text-[10px] text-slate-500">Gestor Orçamentário</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-900">Auditoria / Tesouraria</p>
              <p className="text-[10px] text-slate-500">Atestado de Conformidade</p>
            </div>
          </div>
        )}
      </div>

      <DocumentFooter data={data} pageNumber={1} totalPages={1} />
    </div>
  )
}

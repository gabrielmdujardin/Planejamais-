"use client"

import React from "react"
import type { NormalizedReportData, ReportSectionConfig } from "@/lib/reports/types"
import { DocumentHeader, DocumentFooter } from "../document-header"
import { DocumentKpiGrid } from "../document-kpi-grid"
import { DocumentComparativeTable } from "../document-table"
import { formatBRL, formatPercent } from "@/lib/reports/data-collector"
import { Layers, AlertTriangle, ShieldCheck } from "lucide-react"

interface TemplateProps {
  data: NormalizedReportData
  sections: ReportSectionConfig
}

export function ComparativeReportTemplate({ data, sections }: TemplateProps) {
  const m = data.metrics
  const events = data.events

  if (events.length < 2) {
    return (
      <div className="report-a4-sheet bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between max-w-[210mm] min-h-[297mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0">
        <div>
          <DocumentHeader data={data} pageNumber={1} totalPages={1} isFirstPage={true} />
          <div className="p-8 text-center border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-lg my-12">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <h2 className="text-sm font-bold text-amber-900">Relatório Comparativo Exige Múltiplos Eventos</h2>
            <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
              Para gerar uma comparação cruzada de desempenho, orçamentos e presença, selecione "Todos os eventos" ou um recorte com pelo menos 2 eventos cadastrados.
            </p>
          </div>
        </div>
        <DocumentFooter data={data} pageNumber={1} totalPages={1} />
      </div>
    )
  }

  return (
    <div className="report-a4-sheet bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between max-w-[210mm] min-h-[297mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0">
      <div>
        <DocumentHeader data={data} pageNumber={1} totalPages={1} isFirstPage={true} />

        {/* 1. Indicadores Globais do Portfólio */}
        {sections.kpiSummary && <DocumentKpiGrid data={data} />}

        {/* 2. Tabela Comparativa Cruzada */}
        <div className="mb-6 avoid-break">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              Comparativo de Desempenho e Eficiência por Evento
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              {events.length} eventos sob gestão
            </span>
          </div>

          <DocumentComparativeTable events={events} />
        </div>

        {/* 3. Matriz de Priorização e Eventos que Exigem Atenção */}
        {sections.riskAlerts && (
          <div className="mb-6 p-4 border border-slate-200 rounded bg-slate-50/50 avoid-break">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800 mb-2">
              Diagnóstico Comparativo de Risco
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-2.5 rounded border bg-white ${
                    ev.riskLevel === "Alto"
                      ? "border-red-300"
                      : ev.riskLevel === "Médio"
                      ? "border-amber-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 truncate max-w-[180px]">{ev.title}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                        ev.riskLevel === "Alto"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : ev.riskLevel === "Médio"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {ev.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">{ev.riskReason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Parecer e Assinatura */}
        {sections.notesAndSignatures && (
          <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs avoid-break">
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-900">{data.generatedBy}</p>
              <p className="text-[10px] text-slate-500">Gestão Geral de Eventos</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-900">Diretoria Executiva</p>
              <p className="text-[10px] text-slate-500">Aprovação de Portfólio</p>
            </div>
          </div>
        )}
      </div>

      <DocumentFooter data={data} pageNumber={1} totalPages={1} />
    </div>
  )
}

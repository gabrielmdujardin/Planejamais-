"use client"

import React from "react"
import type { NormalizedReportData, ReportSectionConfig } from "@/lib/reports/types"
import { DocumentHeader, DocumentFooter } from "../document-header"
import { DocumentKpiGrid } from "../document-kpi-grid"
import { RsvpDistributionBar, BudgetAllocationBar } from "../document-charts"
import { DocumentGuestTable, DocumentItemTable } from "../document-table"

interface TemplateProps {
  data: NormalizedReportData
  sections: ReportSectionConfig
}

export function FullEventReportTemplate({ data, sections }: TemplateProps) {
  const m = data.metrics
  const event = data.event
  const guests = event?.guests || []
  const items = event?.items || []

  // Calcular número total de páginas estimado
  const hasGuests = sections.guestList && guests.length > 0
  const hasItems = sections.financialDetails && items.length > 0
  const totalPages = 1 + (hasGuests ? 1 : 0) + (hasItems ? 1 : 0)

  let currentPage = 1

  return (
    <div className="space-y-6">
      {/* ---------------- PÁGINA 1: VISÃO GERAL & STATUS ---------------- */}
      <div className="report-a4-sheet bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between max-w-[210mm] min-h-[297mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0">
        <div>
          <DocumentHeader data={data} pageNumber={1} totalPages={totalPages} isFirstPage={true} />

          {sections.kpiSummary && <DocumentKpiGrid data={data} />}

          {/* Seção de Visão Geral do Evento */}
          {sections.generalInfo && (
            <div className="mb-5 p-3.5 border border-slate-200 rounded bg-slate-50/50 avoid-break">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800 mb-2">
                Especificações do Evento
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Modalidade:</span>
                  <span className="font-medium text-slate-900">{event?.type || "Geral"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Regime Financeiro:</span>
                  <span className="font-medium text-slate-900">
                    {event?.financialMode === "corporate_budget" ? "Orçamento Corporativo Fechado" : "Rateio Colaborativo"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Localização / Endereço:</span>
                  <span className="font-medium text-slate-900">{event?.location || "A definir"} {event?.address ? `(${event.address})` : ""}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Capacidade / Lotação:</span>
                  <span className="font-medium text-slate-900">{event?.totalGuests || 0} pessoas previstas</span>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de Proporção */}
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

          {/* Destaques e Divergências */}
          {sections.riskAlerts && (
            <div className="p-3.5 border border-slate-200 rounded bg-white mb-5 avoid-break">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800 mb-2">
                Conclusões e Alertas da Coordenação
              </h2>
              <div className="space-y-2">
                {data.divergences.map((div, i) => (
                  <div key={i} className="text-xs p-2 bg-slate-50 border border-slate-200 rounded flex items-start gap-2">
                    <span className="font-semibold text-slate-900">{div.title}:</span>
                    <span className="text-slate-700">{div.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DocumentFooter data={data} pageNumber={1} totalPages={totalPages} />
      </div>

      {/* ---------------- PÁGINA 2: LISTA DE CONVIDADOS & CREDENCIAMENTO ---------------- */}
      {hasGuests && (
        <div className="report-a4-sheet bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between max-w-[210mm] min-h-[297mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0">
          <div>
            <DocumentHeader data={data} pageNumber={++currentPage} totalPages={totalPages} isFirstPage={false} />

            <div className="mb-3 flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h2 className="text-sm font-bold text-slate-950 font-serif">Lista Nominal de Convidados & Presença</h2>
                <p className="text-[11px] text-slate-500">Registro oficial para conferência e credenciamento na recepção</p>
              </div>
              <div className="text-right text-xs">
                <span className="font-mono font-medium text-emerald-800">{m.confirmedGuests} confirmados</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="font-mono text-slate-600">{m.totalGuests} total</span>
              </div>
            </div>

            <DocumentGuestTable guests={guests} showSignatureColumn={true} />
          </div>

          <DocumentFooter data={data} pageNumber={currentPage} totalPages={totalPages} />
        </div>
      )}

      {/* ---------------- PÁGINA 3: DESPESAS & FORNECEDORES ---------------- */}
      {hasItems && (
        <div className="report-a4-sheet bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between max-w-[210mm] min-h-[297mm] mx-auto shadow-sm print:shadow-none print:m-0 print:p-0">
          <div>
            <DocumentHeader data={data} pageNumber={++currentPage} totalPages={totalPages} isFirstPage={false} />

            <div className="mb-3 flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h2 className="text-sm font-bold text-slate-950 font-serif">Detalhamento Financeiro & Fornecedores</h2>
                <p className="text-[11px] text-slate-500">Discriminação analítica de todas as contas e serviços contratados</p>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="text-slate-600">Total: </span>
                <strong className="text-slate-950 text-sm">{m.totalExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
              </div>
            </div>

            <DocumentItemTable items={items} />

            {/* Quadro de Assinaturas no Final */}
            {sections.notesAndSignatures && (
              <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs avoid-break">
                <div>
                  <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-900">{data.generatedBy}</p>
                  <p className="text-[10px] text-slate-500">Gestor do Evento</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-900">Controladoria / Financeiro</p>
                  <p className="text-[10px] text-slate-500">Auditoria & Liquidação</p>
                </div>
              </div>
            )}
          </div>

          <DocumentFooter data={data} pageNumber={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}

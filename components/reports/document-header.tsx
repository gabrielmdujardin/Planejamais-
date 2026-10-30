"use client"

import React from "react"
import type { NormalizedReportData } from "@/lib/reports/types"
import { Calendar, MapPin, Users, Building, ShieldCheck } from "lucide-react"

interface DocumentHeaderProps {
  data: NormalizedReportData
  pageNumber?: number
  totalPages?: number
  isFirstPage?: boolean
}

export function DocumentHeader({ data, pageNumber = 1, isFirstPage = true }: DocumentHeaderProps) {
  const event = data.event

  return (
    <header className="border-b border-slate-300 pb-4 mb-5 avoid-break">
      {/* Topo institucional com ID do documento */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-700 text-white font-bold text-[10px]">
            P+
          </span>
          <span className="font-semibold tracking-wide text-slate-900 text-sm">PLANEJA+</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Relatório Oficial de Gestão</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Doc ID: <strong>{data.reportId}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Emissão: {data.generatedDateFormatted}</span>
        </div>
      </div>

      {/* Título principal do relatório */}
      <div className="mt-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-950 font-serif">
          {data.reportTitle}
        </h1>
        {isFirstPage && (
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {data.isSingleEvent && event?.description
              ? event.description
              : "Documento analítico gerado para fins de prestação de contas, auditoria orçamentária e planejamento de decisões operacionais."}
          </p>
        )}
      </div>

      {/* Metadados do evento (apenas na 1ª página se houver evento único) */}
      {isFirstPage && data.isSingleEvent && event && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-medium text-slate-900">{event.date}</span>
            {event.time && <span className="text-slate-500">às {event.time}</span>}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate" title={event.location || "Local não informado"}>
              {event.location || "Local a definir"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              {event.financialMode === "corporate_budget"
                ? "Teto Corporativo"
                : "Rateio Colaborativo"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="capitalize">Status: <strong>{event.status}</strong></span>
          </div>
        </div>
      )}
    </header>
  )
}

interface DocumentFooterProps {
  data: NormalizedReportData
  pageNumber: number
  totalPages: number
}

export function DocumentFooter({ data, pageNumber, totalPages }: DocumentFooterProps) {
  return (
    <footer className="mt-auto pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between avoid-break">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-700">Planeja+</span>
        <span>•</span>
        <span>Relatório emitido pelo usuário {data.generatedBy}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="uppercase tracking-widest text-[9px] font-semibold text-slate-400">
          Uso Oficial & Interno
        </span>
        <span className="font-mono text-slate-800 font-medium">
          Página {pageNumber} de {totalPages}
        </span>
      </div>
    </footer>
  )
}

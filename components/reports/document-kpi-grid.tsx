"use client"

import React from "react"
import type { NormalizedReportData } from "@/lib/reports/types"
import { formatBRL, formatPercent } from "@/lib/reports/data-collector"

interface DocumentKpiGridProps {
  data: NormalizedReportData
}

export function DocumentKpiGrid({ data }: DocumentKpiGridProps) {
  const m = data.metrics

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 avoid-break">
      {/* 1. Presença e RSVP */}
      <div className="p-3 rounded bg-slate-50 border border-slate-200">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Taxa de Confirmação
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900">
            {formatPercent(m.confirmationRate)}
          </span>
          <span className="text-[11px] text-slate-500">
            ({m.confirmedGuests}/{m.totalGuests})
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-600 leading-tight">
          {m.pendingGuests > 0 ? `${m.pendingGuests} convidados aguardando resposta.` : "100% de adesão total."}
        </p>
      </div>

      {/* 2. Orçamento Aprovado */}
      <div className="p-3 rounded bg-slate-50 border border-slate-200">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Total Comprometido
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900">
            {formatBRL(m.totalExpenses)}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-600 leading-tight">
          {m.totalBudget > 0
            ? `Teto: ${formatBRL(m.totalBudget)} (${formatPercent(m.budgetExecutionRate)} exec.)`
            : "Orçamento sem teto formal."}
        </p>
      </div>

      {/* 3. Saldo Livre / Situação */}
      <div className={`p-3 rounded border ${
        m.deficit > 0 ? "bg-red-50/70 border-red-200" : "bg-emerald-50/50 border-emerald-200"
      }`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${
          m.deficit > 0 ? "text-red-700" : "text-emerald-800"
        }`}>
          {m.deficit > 0 ? "Excesso Orçamentário" : "Saldo Disponível"}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={`text-xl font-bold ${
            m.deficit > 0 ? "text-red-700" : "text-emerald-900"
          }`}>
            {m.deficit > 0 ? formatBRL(m.deficit) : formatBRL(m.availableBalance)}
          </span>
        </div>
        <p className={`mt-1 text-[10px] leading-tight ${
          m.deficit > 0 ? "text-red-600" : "text-emerald-700"
        }`}>
          {m.deficit > 0
            ? "Atenção: despesas ultrapassam a verba aprovada."
            : `Faturas liquidadas: ${formatBRL(m.paidExpenses)}.`}
        </p>
      </div>

      {/* 4. Custo Médio por Convidado */}
      <div className="p-3 rounded bg-slate-50 border border-slate-200">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Custo / Participante
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900">
            {formatBRL(m.averageCostPerGuest)}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-600 leading-tight">
          {m.confirmedGuests > 0
            ? `Por confirmado: ${formatBRL(m.totalExpenses / m.confirmedGuests)}.`
            : "Baseado no total estimado."}
        </p>
      </div>
    </div>
  )
}

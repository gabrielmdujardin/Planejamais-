"use client"

import React from "react"
import type { ParetoItem, AttendanceScenario } from "@/lib/reports/types"
import { formatBRL, formatPercent, formatBRLCompact } from "@/lib/reports/data-collector"

interface RsvpBarProps {
  confirmed: number
  pending: number
  declined: number
  total: number
}

export function RsvpDistributionBar({ confirmed, pending, declined, total }: RsvpBarProps) {
  if (total <= 0) {
    return <p className="text-xs text-slate-500 italic">Sem convidados cadastrados para gerar gráfico.</p>
  }

  const confPct = (confirmed / total) * 100
  const pendPct = (pending / total) * 100
  const declPct = (declined / total) * 100

  return (
    <div className="space-y-2 avoid-break">
      <div className="flex justify-between items-center text-xs text-slate-700">
        <span className="font-semibold text-slate-900">Distribuição de RSVP</span>
        <span className="text-slate-500 font-mono text-[11px]">{total} convidados totais</span>
      </div>

      {/* Barra segmentada de alta precisão vetorial */}
      <div className="w-full h-4 bg-slate-100 rounded flex overflow-hidden border border-slate-300">
        {confPct > 0 && (
          <div
            style={{ width: `${confPct}%` }}
            className="bg-emerald-600 h-full transition-all"
            title={`Confirmados: ${confirmed}`}
          />
        )}
        {pendPct > 0 && (
          <div
            style={{ width: `${pendPct}%` }}
            className="bg-amber-500 h-full transition-all"
            title={`Pendentes: ${pending}`}
          />
        )}
        {declPct > 0 && (
          <div
            style={{ width: `${declPct}%` }}
            className="bg-red-500 h-full transition-all"
            title={`Recusados: ${declined}`}
          />
        )}
      </div>

      {/* Legenda compacta com números */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 shrink-0" />
          <span>Confirmados: <strong>{confirmed}</strong> ({formatPercent(confPct)})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
          <span>Pendentes: <strong>{pending}</strong> ({formatPercent(pendPct)})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" />
          <span>Recusados: <strong>{declined}</strong> ({formatPercent(declPct)})</span>
        </div>
      </div>
    </div>
  )
}

interface BudgetBarProps {
  budget: number
  totalExpenses: number
  paid: number
  pending: number
}

export function BudgetAllocationBar({ budget, totalExpenses, paid, pending }: BudgetBarProps) {
  if (totalExpenses <= 0 && budget <= 0) {
    return <p className="text-xs text-slate-500 italic">Sem dados financeiros cadastrados.</p>
  }

  const base = Math.max(budget, totalExpenses)
  const paidPct = (paid / base) * 100
  const pendPct = (pending / base) * 100
  const freePct = budget > totalExpenses ? ((budget - totalExpenses) / base) * 100 : 0
  const isOver = totalExpenses > budget && budget > 0

  return (
    <div className="space-y-2 avoid-break">
      <div className="flex justify-between items-center text-xs text-slate-700">
        <span className="font-semibold text-slate-900">Alocação Orçamentária</span>
        <span className="text-slate-500 font-mono text-[11px]">
          {budget > 0 ? `Teto: ${formatBRL(budget)}` : "Sem teto formal"}
        </span>
      </div>

      <div className="w-full h-4 bg-slate-100 rounded flex overflow-hidden border border-slate-300">
        {paidPct > 0 && (
          <div
            style={{ width: `${paidPct}%` }}
            className="bg-teal-700 h-full"
            title={`Pago: ${formatBRL(paid)}`}
          />
        )}
        {pendPct > 0 && (
          <div
            style={{ width: `${pendPct}%` }}
            className="bg-amber-500 h-full"
            title={`A Pagar: ${formatBRL(pending)}`}
          />
        )}
        {freePct > 0 && (
          <div
            style={{ width: `${freePct}%` }}
            className="bg-slate-300 h-full"
            title={`Saldo Livre: ${formatBRL(budget - totalExpenses)}`}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-700 shrink-0" />
          <span>Pago: <strong>{formatBRL(paid)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
          <span>A Pagar: <strong>{formatBRL(pending)}</strong></span>
        </div>
        {budget > 0 && (
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${isOver ? "bg-red-600" : "bg-slate-300"}`} />
            <span>
              {isOver
                ? <strong className="text-red-700">Estouro: {formatBRL(totalExpenses - budget)}</strong>
                : <>Saldo: <strong>{formatBRL(budget - totalExpenses)}</strong></>}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface ParetoSvgChartProps {
  items: ParetoItem[]
  maxItems?: number
}

export function ParetoSvgChart({ items, maxItems = 6 }: ParetoSvgChartProps) {
  const displayItems = items.slice(0, maxItems)
  if (displayItems.length === 0) {
    return <p className="text-xs text-slate-500 italic">Sem itens para compor curva de Pareto.</p>
  }

  const maxVal = Math.max(...displayItems.map((it) => it.value), 1)
  const chartHeight = 120
  const chartWidth = 440
  const barWidth = 32
  const paddingX = 40
  const stepX = (chartWidth - paddingX * 2) / (displayItems.length || 1)

  // Coordenadas da linha de acumulado
  const points = displayItems.map((item, idx) => {
    const x = paddingX + idx * stepX + barWidth / 2
    const y = chartHeight - (item.cumulative / 100) * (chartHeight - 20) - 10
    return { x, y, cumulative: item.cumulative }
  })

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "")

  return (
    <div className="space-y-2 avoid-break">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-900">Análise de Pareto de Despesas (Regra 80/20)</span>
        <span className="text-[11px] text-slate-500">Linha vermelha = % acumulado</span>
      </div>

      <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`} className="w-full h-auto text-xs">
          {/* Linha de referência 80% */}
          {(() => {
            const y80 = chartHeight - (80 / 100) * (chartHeight - 20) - 10
            return (
              <g>
                <line
                  x1={paddingX - 10}
                  y1={y80}
                  x2={chartWidth - 10}
                  y2={y80}
                  stroke="#d97706"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text x={chartWidth - 8} y={y80 + 3} fill="#d97706" fontSize="8" fontWeight="bold">
                  80%
                </text>
              </g>
            )
          })()}

          {/* Barras dos itens */}
          {displayItems.map((item, idx) => {
            const x = paddingX + idx * stepX
            const barH = (item.value / maxVal) * (chartHeight - 25)
            const y = chartHeight - barH

            return (
              <g key={item.name}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill="#0f766e"
                  rx="2"
                />
                {/* Valor no topo da barra */}
                <text
                  x={x + barWidth / 2}
                  y={y - 3}
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="8"
                  fontWeight="600"
                >
                  {formatBRLCompact(item.value)}
                </text>
                {/* Nome do item abaixo */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="8"
                  width={stepX}
                >
                  {item.name.length > 9 ? `${item.name.slice(0, 8)}…` : item.name}
                </text>
              </g>
            )
          })}

          {/* Linha de % acumulado */}
          <path d={pathD} fill="none" stroke="#dc2626" strokeWidth="2" />

          {/* Pontos da linha */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

interface ScenariosProps {
  scenarios: AttendanceScenario[]
}

export function AttendanceScenariosSvg({ scenarios }: ScenariosProps) {
  if (scenarios.length === 0) return null

  const maxPeople = Math.max(...scenarios.map((s) => s.people), 1)

  return (
    <div className="space-y-2.5 avoid-break">
      <div className="flex justify-between items-center text-xs text-slate-700">
        <span className="font-semibold text-slate-900">Cenários Projetados de Presença</span>
        <span className="text-[11px] text-slate-500">Mínima • Provável • Máxima</span>
      </div>

      <div className="space-y-2">
        {scenarios.map((sc) => {
          const pct = (sc.people / maxPeople) * 100
          const colorClass =
            sc.name === "Mínima"
              ? "bg-emerald-600"
              : sc.name === "Provável"
              ? "bg-blue-600"
              : "bg-amber-600"

          return (
            <div key={sc.name} className="p-2 border border-slate-200 rounded bg-slate-50/50 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                  Cenário {sc.name}: <strong>{sc.people} pessoas</strong>
                </span>
                <span className="font-mono text-slate-700 font-medium">
                  {formatBRL(sc.cost)} estimado
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div style={{ width: `${Math.max(pct, 5)}%` }} className={`h-full ${colorClass}`} />
              </div>
              <p className="mt-1 text-[10px] text-slate-500 leading-tight">{sc.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

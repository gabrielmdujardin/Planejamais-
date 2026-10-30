"use client"

import React from "react"
import type { NormalizedGuest, NormalizedItem, NormalizedEvent } from "@/lib/reports/types"
import { formatBRL, formatPercent } from "@/lib/reports/data-collector"

interface GuestTableProps {
  guests: NormalizedGuest[]
  maxGuests?: number
  showSignatureColumn?: boolean
}

export function DocumentGuestTable({ guests, maxGuests, showSignatureColumn = true }: GuestTableProps) {
  const displayGuests = maxGuests ? guests.slice(0, maxGuests) : guests

  if (displayGuests.length === 0) {
    return (
      <div className="p-3 border border-slate-200 rounded text-xs text-slate-500 italic">
        Nenhum convidado listado para os filtros selecionados.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto avoid-break">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-300 text-[10px] uppercase font-semibold text-slate-600 bg-slate-50">
            <th className="py-2 px-2.5">#</th>
            <th className="py-2 px-2.5">Nome do Convidado</th>
            <th className="py-2 px-2.5">Status RSVP</th>
            <th className="py-2 px-2.5">Acompanhantes</th>
            <th className="py-2 px-2.5">Contato</th>
            {showSignatureColumn && (
              <th className="py-2 px-2.5 text-center w-36">Check-in / Assinatura</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-800">
          {displayGuests.map((guest, idx) => {
            const statusBadgeColor =
              guest.status === "confirmed"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : guest.status === "declined"
                ? "bg-red-100 text-red-800 border-red-300"
                : "bg-amber-100 text-amber-800 border-amber-300"

            const statusLabel =
              guest.status === "confirmed"
                ? "Confirmado"
                : guest.status === "declined"
                ? "Recusado"
                : "Pendente"

            return (
              <tr key={guest.id} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                <td className="py-1.5 px-2.5 font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                <td className="py-1.5 px-2.5 font-medium text-slate-900">{guest.name}</td>
                <td className="py-1.5 px-2.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusBadgeColor}`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="py-1.5 px-2.5 text-slate-600">
                  {guest.companionsCount > 0
                    ? `+${guest.companionsCount} (${guest.companionsNames.slice(0, 2).join(", ")})`
                    : "—"}
                </td>
                <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[10px] truncate max-w-[140px]">
                  {guest.email || guest.phone || "—"}
                </td>
                {showSignatureColumn && (
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="border-b border-dashed border-slate-300 h-4 w-28 mx-auto" />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {maxGuests && guests.length > maxGuests && (
        <p className="mt-1.5 text-[10px] text-slate-500 text-right">
          Exibindo {maxGuests} de {guests.length} convidados totais.
        </p>
      )}
    </div>
  )
}

interface ItemTableProps {
  items: NormalizedItem[]
  maxItems?: number
}

export function DocumentItemTable({ items, maxItems }: ItemTableProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items

  if (displayItems.length === 0) {
    return (
      <div className="p-3 border border-slate-200 rounded text-xs text-slate-500 italic">
        Nenhum item ou custo cadastrado.
      </div>
    )
  }

  const total = items.reduce((acc, it) => acc + it.price, 0)

  return (
    <div className="overflow-x-auto avoid-break">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-300 text-[10px] uppercase font-semibold text-slate-600 bg-slate-50">
            <th className="py-2 px-2.5">#</th>
            <th className="py-2 px-2.5">Descrição do Item / Serviço</th>
            <th className="py-2 px-2.5">Categoria</th>
            <th className="py-2 px-2.5">Fornecedor</th>
            <th className="py-2 px-2.5 text-center">Situação</th>
            <th className="py-2 px-2.5 text-right">Valor (R$)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-800">
          {displayItems.map((item, idx) => {
            const isPaid = item.paymentStatus === "paid"

            return (
              <tr key={item.id} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                <td className="py-1.5 px-2.5 font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                <td className="py-1.5 px-2.5 font-medium text-slate-900">{item.name}</td>
                <td className="py-1.5 px-2.5 text-slate-600">{item.category || "Geral"}</td>
                <td className="py-1.5 px-2.5 text-slate-600">{item.supplier || "—"}</td>
                <td className="py-1.5 px-2.5 text-center">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {isPaid ? "Liquidado" : "A Liquidar"}
                  </span>
                </td>
                <td className="py-1.5 px-2.5 text-right font-mono font-medium text-slate-900">
                  {formatBRL(item.price)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold text-slate-900">
            <td colSpan={5} className="py-2 px-2.5 text-right uppercase tracking-wider text-[11px]">
              Total Geral Consolidado:
            </td>
            <td className="py-2 px-2.5 text-right font-mono text-sm text-emerald-900">
              {formatBRL(total)}
            </td>
          </tr>
        </tfoot>
      </table>
      {maxItems && items.length > maxItems && (
        <p className="mt-1.5 text-[10px] text-slate-500 text-right">
          Exibindo {maxItems} de {items.length} itens totais.
        </p>
      )}
    </div>
  )
}

interface ComparativeTableProps {
  events: NormalizedEvent[]
}

export function DocumentComparativeTable({ events }: ComparativeTableProps) {
  if (events.length === 0) return null

  return (
    <div className="overflow-x-auto avoid-break">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-300 text-[10px] uppercase font-semibold text-slate-600 bg-slate-50">
            <th className="py-2 px-2.5">Evento</th>
            <th className="py-2 px-2.5">Data</th>
            <th className="py-2 px-2.5 text-center">Convidados</th>
            <th className="py-2 px-2.5 text-center">Confirmados</th>
            <th className="py-2 px-2.5 text-center">Taxa (%)</th>
            <th className="py-2 px-2.5 text-right">Custo Total</th>
            <th className="py-2 px-2.5 text-right">Custo / Convidado</th>
            <th className="py-2 px-2.5 text-center">Risco</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-800">
          {events.map((ev, idx) => {
            const riskBadge =
              ev.riskLevel === "Alto"
                ? "bg-red-100 text-red-800 border-red-300"
                : ev.riskLevel === "Médio"
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-emerald-100 text-emerald-800 border-emerald-300"

            return (
              <tr key={ev.id} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                <td className="py-2 px-2.5 font-medium text-slate-900">{ev.title}</td>
                <td className="py-2 px-2.5 text-slate-600 font-mono text-[11px]">{ev.date}</td>
                <td className="py-2 px-2.5 text-center font-mono">{ev.totalGuests}</td>
                <td className="py-2 px-2.5 text-center font-mono font-medium text-emerald-700">
                  {ev.confirmedGuests}
                </td>
                <td className="py-2 px-2.5 text-center font-mono">
                  {formatPercent(ev.confirmationRate)}
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-medium text-slate-900">
                  {formatBRL(ev.totalCost)}
                </td>
                <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                  {formatBRL(ev.costPerGuest)}
                </td>
                <td className="py-2 px-2.5 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${riskBadge}`}>
                    {ev.riskLevel}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

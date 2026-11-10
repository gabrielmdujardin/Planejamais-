"use client"

import { SimulatorStage } from "@/lib/simulator/stages"
import {
  Globe,
  Lock,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  FileText,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Download,
} from "lucide-react"

interface ScreenMockProps {
  stage: SimulatorStage
}

export function ScreenMock({ stage }: ScreenMockProps) {
  const { screenState, route, actor } = stage

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-lg overflow-hidden flex flex-col h-full">
      {/* Barra de Navegador Simulado (Browser Chrome) */}
      <div className="px-4 py-2.5 bg-muted/70 border-b border-border/80 flex items-center justify-between gap-3 text-xs">
        {/* Controles de Janela */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
        </div>

        {/* Barra de Endereço URL Simulado */}
        <div className="flex-1 max-w-md mx-auto px-3 py-1 rounded-full bg-background border border-border/60 flex items-center gap-2 text-muted-foreground font-mono text-[11px] truncate">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate">
            https://planejamais.com.br<strong className="text-foreground">{route}</strong>
          </span>
        </div>

        {/* Indicador do Usuário Ativo */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate max-w-[140px]">{actor.split(" ")[0]} (Ativo)</span>
        </div>
      </div>

      {/* Conteúdo Renderizado da Tela Atual */}
      <div className="p-5 sm:p-6 flex-1 overflow-y-auto bg-background/50 flex flex-col justify-center min-h-[380px]">
        {/* ==================================================== */}
        {/* 1. Formulário de Cadastro */}
        {/* ==================================================== */}
        {screenState.visualType === "register_form" && (
          <div className="max-w-md w-full mx-auto p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Nova Conta de Organizador
              </span>
              <h3 className="text-xl font-bold text-foreground">Planeja+</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground font-medium block mb-1">Nome Completo</label>
                <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-semibold text-foreground">
                  {screenState.data.name}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-medium block mb-1">E-mail Profissional</label>
                <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-mono text-foreground">
                  {screenState.data.email}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-medium block mb-1">Senha (mínimo 6 caracteres)</label>
                <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-mono text-foreground tracking-widest">
                  {screenState.data.passwordMasked}
                </div>
              </div>

              <div className="pt-2">
                <div className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-center text-xs flex items-center justify-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cadastrando e Gerando Sessão...</span>
                </div>
              </div>

              {screenState.data.successMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{screenState.data.successMessage}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. Dashboard View */}
        {/* ==================================================== */}
        {screenState.visualType === "dashboard_view" && (
          <div className="space-y-4 w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">
                  Olá, {screenState.data.userName}!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sessão autenticada ativa • Visão exclusiva do titular
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Sessão Segura
              </span>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Eventos Ativos
                </span>
                <span className="text-2xl font-black font-mono text-foreground">
                  {screenState.data.activeEventsCount}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Confirmados
                </span>
                <span className="text-2xl font-black font-mono text-foreground">
                  {screenState.data.confirmedGuestsCount}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Despesas
                </span>
                <span className="text-2xl font-black font-mono text-foreground">
                  {screenState.data.totalExpenses}
                </span>
              </div>
            </div>

            {/* Empty State com convite à ação */}
            <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-2 bg-card/60">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <h4 className="font-bold text-sm text-foreground">Nenhum evento registrado ainda</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Seus eventos futuros aparecerão aqui. Clique no botão abaixo para planejar o primeiro.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm">
                  + Criar Primeiro Evento
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. Formulário de Criação de Evento */}
        {/* ==================================================== */}
        {screenState.visualType === "create_event_form" && (
          <div className="max-w-xl w-full mx-auto p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Criar Novo Evento</h3>
              <span className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary font-semibold">
                {screenState.data.financialMode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-muted-foreground block mb-0.5">Título do Evento</label>
                <div className="p-2 rounded border border-border bg-muted/40 font-bold text-foreground">
                  {screenState.data.title}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-0.5">Data</label>
                <div className="p-2 rounded border border-border bg-muted/40 font-mono text-foreground">
                  {screenState.data.date}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-0.5">Horário (Início - Término)</label>
                <div className="p-2 rounded border border-border bg-muted/40 font-mono text-foreground">
                  {screenState.data.startTime} às {screenState.data.endTime}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-muted-foreground block mb-0.5">Local</label>
                <div className="p-2 rounded border border-border bg-muted/40 text-foreground">
                  {screenState.data.location}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-muted-foreground block mb-0.5">Orçamento Previsto (Referência)</label>
                <div className="p-2 rounded border border-border bg-muted/40 font-mono font-bold text-primary">
                  {screenState.data.budget}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Evento criado com ID: <code>{screenState.data.createdId}</code></span>
              </span>
              <span className="font-bold">Salvo</span>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. Tabela de Convidados e Buffet */}
        {/* ==================================================== */}
        {screenState.visualType === "guests_table" && (
          <div className="max-w-2xl w-full mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">Lista de Convidados</h3>
                <p className="text-xs text-muted-foreground">
                  Importação CSV • 15 convidados cadastrados
                </p>
              </div>

              {/* Headcount Badge */}
              <div className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto">
                <Users className="w-3.5 h-3.5" />
                <span>{screenState.data.totalParticipantsConfirmed} Participantes Confirmados</span>
              </div>
            </div>

            {/* Resumo de Buffet */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Buffet & Restrições:</span>
              <div className="flex items-center gap-2">
                {screenState.data.dietarySummary.map((d: string) => (
                  <span
                    key={d}
                    className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-medium text-[11px]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabela de Amostra */}
            <div className="rounded-xl border border-border overflow-hidden bg-card text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="p-2.5 font-semibold">Nome</th>
                    <th className="p-2.5 font-semibold">Status</th>
                    <th className="p-2.5 font-semibold">Acompanhantes</th>
                    <th className="p-2.5 font-semibold">Buffet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {screenState.data.guests.map((g: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="p-2.5 font-medium text-foreground">{g.name}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.status === "Confirmado"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-muted-foreground text-[11px]">{g.companions}</td>
                      <td className="p-2.5 text-muted-foreground text-[11px]">{g.dietary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 5. RSVP Público Externo */}
        {/* ==================================================== */}
        {screenState.visualType === "public_rsvp" && (
          <div className="max-w-md w-full mx-auto p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border pb-2">
              <span className="flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Token CSPRNG Válido
              </span>
              <span className="font-mono">{screenState.data.token.slice(0, 10)}...</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Você foi convidado(a)
              </span>
              <h3 className="font-extrabold text-lg text-foreground">
                {screenState.data.eventTitle}
              </h3>
              <p className="text-xs text-muted-foreground">{screenState.data.eventDate}</p>
              <p className="text-xs text-muted-foreground">{screenState.data.eventLocation}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Convidado:</span>
                <span className="font-semibold text-foreground">{screenState.data.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-mono text-foreground">{screenState.data.guestEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resposta:</span>
                <span className="font-bold text-emerald-600">{screenState.data.response}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{screenState.data.statusAlert}</span>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 6. Planilha de Custos & Rateio */}
        {/* ==================================================== */}
        {screenState.visualType === "financial_split" && (
          <div className="max-w-2xl w-full mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">Painel de Gastos e Rateio</h3>
                <p className="text-xs text-muted-foreground">
                  Modalidade: Rateio Colaborativo (divisão comunitária)
                </p>
              </div>

              {/* Rateio Pill em Destaque */}
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-right self-start sm:self-auto">
                <span className="text-[10px] uppercase font-bold block">Rateio por Pessoa:</span>
                <span className="text-xl font-black font-mono">{screenState.data.splitPerPerson}</span>
              </div>
            </div>

            {/* Sumário */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Custo Total
                </span>
                <span className="text-base font-black font-mono text-foreground">
                  {screenState.data.totalCost}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Confirmados
                </span>
                <span className="text-base font-black font-mono text-foreground">
                  {screenState.data.confirmedParticipants} pessoas
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Teto Previsto
                </span>
                <span className="text-base font-black font-mono text-primary">
                  {screenState.data.budgetEstimated}
                </span>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="rounded-xl border border-border overflow-hidden bg-card text-xs">
              <div className="p-2.5 bg-muted/40 border-b border-border font-semibold text-muted-foreground">
                Despesas Cadastradas
              </div>
              <div className="divide-y divide-border/60">
                {screenState.data.items.map((it: any, i: number) => (
                  <div key={i} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground block">{it.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Responsável: {it.paidBy}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-foreground block">{it.cost}</span>
                      <span className="text-[10px] font-semibold text-emerald-600">{it.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 7. Galeria e Calendário */}
        {/* ==================================================== */}
        {screenState.visualType === "gallery_calendar" && (
          <div className="max-w-2xl w-full mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">Visão Integrada de Calendário</h3>
                <p className="text-xs text-muted-foreground">{screenState.data.activeMonth}</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Exportar .ICS (RFC 5545)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">
                  {screenState.data.scheduledEvent}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Alimentador ICS gerado: {screenState.data.icsExportUrl}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Galeria de Fotos do Evento ({screenState.data.galleryPhotosCount} fotos)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {screenState.data.photos.map((p: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl border border-border bg-card text-xs space-y-1">
                    <span className="font-medium text-foreground block">{p.caption}</span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate block">
                      Storage: /events/photos/photo-{i + 1}.jpg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 8. Portal do Anfitrião (Host View) */}
        {/* ==================================================== */}
        {screenState.visualType === "host_view" && (
          <div className="max-w-xl w-full mx-auto space-y-4 p-5 rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{screenState.data.modeNotice}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Acompanhamento em Tempo Real
              </span>
              <h3 className="font-extrabold text-xl text-foreground mt-0.5">
                {screenState.data.eventTitle}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-background">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Presença
                </span>
                <span className="font-bold text-sm text-foreground">
                  {screenState.data.confirmedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-background">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Rateio Previsto
                </span>
                <span className="font-bold text-sm text-emerald-600 font-mono">
                  {screenState.data.splitPerPerson}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-background text-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">
                Restrições Alimentares do Buffet
              </span>
              <span className="font-semibold text-foreground">
                {screenState.data.dietarySummary}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground italic text-center pt-1">
              ✓ Nenhuma permissão de exclusão, edição ou alteração de despesas disponível.
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* 9. Analytics & Relatório PDF */}
        {/* ==================================================== */}
        {screenState.visualType === "analytics_report" && (
          <div className="max-w-xl w-full mx-auto space-y-4 p-5 rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Consolidação e Prestação de Contas</h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Auditado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                  Taxa de Confirmação
                </span>
                <span className="text-xl font-black font-mono text-foreground">
                  {screenState.data.confirmationRate}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                  Total Financeiro
                </span>
                <span className="text-xl font-black font-mono text-foreground">
                  {screenState.data.totalCost}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                Pareto 80/20 de Custos
              </span>
              <span className="font-semibold text-foreground">
                {screenState.data.paretoTopItem}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-bold text-foreground block">
                    {screenState.data.reportTitle}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Padrão A4 • Pronto para impressão</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-primary text-primary-foreground font-semibold text-[11px]">
                Exportar
              </span>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 10. Exclusão Nominal Segura */}
        {/* ==================================================== */}
        {screenState.visualType === "nominal_deletion" && (
          <div className="max-w-md w-full mx-auto p-6 rounded-2xl border-2 border-red-500/40 bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Confirmar Exclusão do Evento</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta ação excluirá o evento e todos os registros associados em cascata. Para confirmar,
              digite exatamente o nome do evento abaixo:
            </p>

            <div className="p-2.5 rounded-lg border border-border bg-muted/60 text-xs font-mono font-bold text-foreground">
              {screenState.data.eventTitle}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Texto digitado pelo usuário:
              </label>
              <div className="p-2.5 rounded-lg border-2 border-emerald-500 bg-background text-xs font-mono font-bold text-emerald-600">
                {screenState.data.enteredText}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Nome conferido com exatidão! Exclusão autorizada.</span>
            </div>

            <div className="p-3 rounded-lg bg-muted text-muted-foreground text-[11px] space-y-1">
              <span className="font-bold block text-foreground">Cascata Concluída:</span>
              <span>{screenState.data.cascadeNotice}</span>
            </div>

            <div className="p-3 rounded-lg bg-primary text-primary-foreground text-center font-bold text-xs shadow-md">
              {screenState.data.successMessage}
            </div>
          </div>
        )}
      </div>

      {/* Barra Inferior com Status da Ação */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Etapa {stage.id} de 10: {stage.title}</span>
        </span>
        <span className="font-mono text-[11px] hidden sm:inline">
          {stage.coveredRules.length} requisitos validados nesta etapa
        </span>
      </div>
    </div>
  )
}


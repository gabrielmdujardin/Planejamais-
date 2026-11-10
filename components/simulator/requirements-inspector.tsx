"use client"

import { SimulatorStage, CoveredRule } from "@/lib/simulator/stages"
import {
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Activity,
  UserCheck,
  Check,
  Code2,
  Layers,
} from "lucide-react"

interface RequirementsInspectorProps {
  stage: SimulatorStage
}

export function RequirementsInspector({ stage }: RequirementsInspectorProps) {
  const categoryStyles = {
    RN: {
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      label: "Regra de Negócio",
    },
    RF: {
      badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
      label: "Requisito Funcional",
    },
    RNF: {
      badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
      label: "Requisito Não Funcional",
    },
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-lg p-5 sm:p-6 flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        {/* Cabeçalho do Auditor */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                Auditoria de Requisitos em Tempo Real
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Confronto imediato entre a ação do usuário e a regra de negócio
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-mono font-bold text-xs">
            Etapa {stage.id}/10
          </span>
        </div>

        {/* Ator & Rota */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Ator Simulado:</span>
            <strong className="text-foreground">{stage.actor}</strong>
          </div>
          <span className="font-mono text-muted-foreground hidden sm:inline">
            {stage.route}
          </span>
        </div>

        {/* Ações Passo a Passo */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Ações em Execução no Sistema
          </h4>
          <div className="space-y-1.5">
            {stage.actions.map((act, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-background border border-border/70 flex items-start gap-2.5 text-xs"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-foreground/90 leading-snug">{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regras e Requisitos Atendidos */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Requisitos e Regras Comprovados ({stage.coveredRules.length})
          </h4>

          <div className="space-y-2.5">
            {stage.coveredRules.map((rule, idx) => {
              const cat = categoryStyles[rule.category]
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border/90 bg-background/60 space-y-1.5 text-xs shadow-sm hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${cat.badge}`}
                      >
                        {rule.code}
                      </span>
                      <strong className="text-foreground text-xs">{rule.title}</strong>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> APROVADO
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                    <strong className="text-foreground/80 font-semibold font-mono">
                      Evidência:
                    </strong>{" "}
                    {rule.proof}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Terminal de Logs Técnicos do Servidor */}
      <div className="pt-4 border-t border-border space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          Logs de Auditoria do Servidor
        </h4>
        <div className="p-3 rounded-xl bg-black text-emerald-400 font-mono text-[10.5px] space-y-1 max-h-36 overflow-y-auto leading-relaxed shadow-inner">
          {stage.logs.map((log, lIdx) => (
            <div key={lIdx} className="truncate">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { RequirementItem } from "@/lib/validation-center/types"
import {
  X,
  FileCode,
  Terminal,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Code2,
} from "lucide-react"

interface EvidenceModalProps {
  item: RequirementItem
  onClose: () => void
}

export function EvidenceModal({ item, onClose }: EvidenceModalProps) {
  const [copied, setCopied] = useState(false)

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-primary text-primary-foreground font-mono font-bold text-xs">
              {item.id}
            </span>
            <div>
              <h3 className="font-bold text-foreground text-base sm:text-lg">
                Evidência Técnica — {item.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Relatório de execução, logs de console e comparação formal de resultados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Status
              </span>
              <span
                className={`font-semibold text-xs ${
                  item.status === "passed"
                    ? "text-emerald-600"
                    : item.status === "failed"
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {item.status.toUpperCase()}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Duração Total
              </span>
              <span className="font-mono font-semibold text-xs text-foreground">
                {item.lastRun ? `${item.lastRun.durationMs} ms` : "Não executado"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Cenários
              </span>
              <span className="font-semibold text-xs text-foreground">
                {item.lastRun ? `${item.lastRun.scenarios.length} validados` : "0"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Timestamp
              </span>
              <span className="font-mono text-[11px] text-muted-foreground truncate block">
                {item.lastRun ? new Date(item.lastRun.timestamp).toLocaleTimeString("pt-BR") : "—"}
              </span>
            </div>
          </div>

          {/* Evidências do Navegador Real (Screenshots e Auditoria de 3 Camadas) */}
          {item.lastRun?.screenshots && item.lastRun.screenshots.length > 0 && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/[0.03] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Capturas Reais da Aplicação (Playwright Chromium)
                </h4>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {item.lastRun.screenshots.length} capturas registradas
                </span>
              </div>

              {/* Grid de Imagens Reais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.lastRun.screenshots.map((shot, idx) => (
                  <div key={idx} className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
                    <div className="p-2 border-b border-border bg-muted/40 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground font-mono">Passo {idx + 1}</span>
                      <span className="text-muted-foreground truncate max-w-[180px] font-mono text-[10px]">{shot.split("/").pop()}</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shot}
                      alt={`Captura real do passo ${idx + 1}`}
                      className="w-full h-auto object-cover border-b border-border hover:opacity-95 transition-opacity cursor-pointer"
                      onClick={() => window.open(shot, "_blank")}
                    />
                    <div className="p-2 text-[10px] text-muted-foreground bg-background">
                      Clique na imagem para abrir em resolução completa.
                    </div>
                  </div>
                ))}
              </div>

              {/* Detalhes de Verificação das 3 Camadas */}
              {item.lastRun.realBrowserEvidence && (
                <div className="mt-3 p-3 rounded-lg bg-card border border-border text-xs space-y-2 font-mono">
                  <div className="text-foreground font-bold font-sans">Validação Multicamadas:</div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="text-primary font-semibold">1. Front-end:</span> Interações diretas no DOM na URL {item.lastRun.realBrowserEvidence.url}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="text-primary font-semibold">2. Back-end / Rede:</span> {item.lastRun.realBrowserEvidence.requests?.length || 0} requisições HTTP monitoradas
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="text-primary font-semibold">3. Banco de Dados / Store:</span>{" "}
                    {item.lastRun.realBrowserEvidence.dbVerified ? (
                      <span className="text-emerald-600 font-bold">Persistência confirmada com sucesso</span>
                    ) : (
                      <span className="text-muted-foreground">Verificado no ciclo de vida</span>
                    )}
                  </div>
                  {item.lastRun.realBrowserEvidence.details && (
                    <div className="text-[11px] text-foreground bg-muted/40 p-2 rounded">
                      {item.lastRun.realBrowserEvidence.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Test files */}
          <div className="p-3 rounded-lg bg-card border border-border/80">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-primary" />
              Arquivos de Teste Associados
            </h4>
            <div className="font-mono text-xs text-foreground space-y-1">
              {item.testFiles.map((f) => (
                <div key={f} className="text-primary font-medium">
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Scenarios Table */}
          {item.lastRun && item.lastRun.scenarios.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Resultados dos Cenários de Teste
              </h4>
              <div className="space-y-3 font-mono text-xs">
                {item.lastRun.scenarios.map((sc, idx) => (
                  <div
                    key={sc.id || idx}
                    className="p-3.5 rounded-lg border border-border/80 bg-background space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-bold text-foreground font-sans text-xs">
                          {sc.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground">{sc.durationMs}ms</span>
                    </div>

                    <div className="p-2 rounded bg-muted/60 text-[11px] space-y-1">
                      <div>
                        <span className="text-muted-foreground font-sans">Entrada:</span>{" "}
                        <span className="text-foreground">{sc.input}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-sans">Esperado:</span>{" "}
                        <span className="text-foreground">{sc.expected}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-sans">Obtido:</span>{" "}
                        <span className={sc.passed ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                          {sc.actual}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console Logs */}
          {item.lastRun && item.lastRun.logs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Logs da Execução em Tempo Real
              </h4>
              <div className="p-3.5 rounded-lg bg-black text-emerald-400 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
                {item.lastRun.logs.map((log, lIdx) => (
                  <div key={lIdx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Payload Estruturado de Auditoria (JSON)
              </h4>
              <button
                type="button"
                onClick={copyJson}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar JSON"}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-muted text-foreground font-mono text-[10px] overflow-x-auto max-h-40 border border-border">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
          >
            Fechar Evidência
          </button>
        </div>
      </div>
    </div>
  )
}


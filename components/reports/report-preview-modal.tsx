"use client"

import React, { useState, useMemo, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/stores/event-store"
import { normalizeReportData } from "@/lib/reports/data-collector"
import { printIsolatedDocument, generatePdfFileName } from "@/lib/reports/pdf-exporter"
import { ReportDocument } from "./report-document"
import type { ReportType, ReportSectionConfig, ReportFilterOptions } from "@/lib/reports/types"
import {
  FileText,
  Printer,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Settings2,
  Layers,
  Sparkles,
} from "lucide-react"

interface ReportExportModalProps {
  isOpen: boolean
  onClose: () => void
  initialEventId?: string
  initialReportType?: ReportType
  events?: any[]
  event?: any
}

export function ReportExportModal({
  isOpen,
  onClose,
  initialEventId = "all",
  initialReportType = "executive-summary",
  events: propEvents,
  event: propEvent,
}: ReportExportModalProps) {
  const { events: storeEvents } = useEventStore()
  const { toast } = useToast()

  const allAvailableEvents = useMemo(() => {
    if (propEvents && propEvents.length > 0) return propEvents
    if (propEvent) {
      const exists = (storeEvents || []).some((e) => e.id === propEvent.id)
      return exists ? storeEvents : [propEvent, ...(storeEvents || [])]
    }
    return storeEvents || []
  }, [propEvents, propEvent, storeEvents])

  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId)
  const [reportType, setReportType] = useState<ReportType>(initialReportType)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [zoomScale, setZoomScale] = useState<number>(0.85)

  React.useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId)
    }
  }, [initialEventId])

  React.useEffect(() => {
    if (initialReportType) {
      setReportType(initialReportType)
    }
  }, [initialReportType])

  // Configuração padrão das seções
  const [sections, setSections] = useState<ReportSectionConfig>({
    generalInfo: true,
    kpiSummary: true,
    guestList: true,
    financialDetails: true,
    paretoAnalysis: true,
    attendanceProjection: true,
    riskAlerts: true,
    notesAndSignatures: true,
  })

  const documentRef = useRef<HTMLDivElement>(null)

  // Gerar dados normalizados do relatório
  const reportData = useMemo(() => {
    const filterOptions: ReportFilterOptions = {
      reportType,
      selectedEventId,
      includedSections: sections,
      guestStatusFilter: "all",
      density: "normal",
      generatedBy: "Administrador Planeja+",
    }

    return normalizeReportData(allAvailableEvents, filterOptions)
  }, [allAvailableEvents, reportType, selectedEventId, sections])

  // Alternar seção individual
  const toggleSection = (key: keyof ReportSectionConfig) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Acionar impressão/PDF
  const handleExportPdf = async () => {
    if (!documentRef.current) return

    setIsExporting(true)
    const targetEvent = reportData.isSingleEvent ? reportData.event?.title : "Geral"
    const fileName = generatePdfFileName(reportData.reportType, targetEvent)

    try {
      const result = await printIsolatedDocument(documentRef.current, fileName)

      if (result.success) {
        toast({
          title: "Documento pronto para PDF",
          description: "Diálogo de impressão e salvamento em PDF aberto com layout A4 otimizado.",
        })
      } else {
        throw new Error(result.error || "Falha na impressão")
      }
    } catch (err: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: err?.message || "Não foi possível emitir o documento.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[92vh] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-slate-100 text-slate-900 border-slate-300">
        {/* Cabeçalho da Modal */}
        <DialogHeader className="px-6 py-4 bg-white border-b border-slate-200 flex flex-row items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Central de Relatórios Documentais
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Emitir Relatório Oficial em PDF
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gere documentos A4 editoriais, elegantes e diagramados especificamente para auditoria, impressão e compartilhamento.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="gap-2 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Imprimir / Salvar PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Corpo: Painel de Configurações (Esquerda) e Preview A4 (Direita) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Painel Esquerdo: Controles e Seletor */}
          <div className="w-full md:w-80 p-5 bg-white border-r border-slate-200 overflow-y-auto space-y-5 shrink-0 text-xs">
            {/* Seletor de Modelo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Modelo de Relatório</Label>
              <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                <SelectTrigger className="border-slate-300 bg-slate-50 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive-summary">Resumo Executivo (1 a 2 págs)</SelectItem>
                  <SelectItem value="full-event">Relatório Completo do Evento</SelectItem>
                  <SelectItem value="financial">Prestação de Contas & Finanças</SelectItem>
                  <SelectItem value="comparative">Comparativo Multi-Eventos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-500">
                {reportType === "executive-summary"
                  ? "Síntese de alto nível para liderança e clientes com foco em decisões."
                  : reportType === "full-event"
                  ? "Dossiê completo contendo lista nominal de convidados e fornecedores."
                  : reportType === "financial"
                  ? "Auditoria financeira com análise de Pareto e status de liquidação."
                  : "Benchmark cruzado de indicadores entre múltiplos eventos."}
              </p>
            </div>

            {/* Seletor de Evento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Evento Alvo</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="border-slate-300 bg-slate-50 text-xs">
                  <SelectValue placeholder="Selecione o evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos (Consolidado)</SelectItem>
                  {allAvailableEvents.map((ev: any) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seções a Incluir */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Seções do Documento</span>
                <span className="text-[10px] text-slate-400 font-normal">Personalizar</span>
              </Label>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-kpis"
                    checked={sections.kpiSummary}
                    onCheckedChange={() => toggleSection("kpiSummary")}
                  />
                  <label htmlFor="sec-kpis" className="text-xs text-slate-700 cursor-pointer">
                    Indicadores Principais (KPIs)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-general"
                    checked={sections.generalInfo}
                    onCheckedChange={() => toggleSection("generalInfo")}
                  />
                  <label htmlFor="sec-general" className="text-xs text-slate-700 cursor-pointer">
                    Dados Gerais do Evento
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-scenarios"
                    checked={sections.attendanceProjection}
                    onCheckedChange={() => toggleSection("attendanceProjection")}
                  />
                  <label htmlFor="sec-scenarios" className="text-xs text-slate-700 cursor-pointer">
                    Cenários de Presença
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-pareto"
                    checked={sections.paretoAnalysis}
                    onCheckedChange={() => toggleSection("paretoAnalysis")}
                  />
                  <label htmlFor="sec-pareto" className="text-xs text-slate-700 cursor-pointer">
                    Análise de Pareto (Regra 80/20)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-guests"
                    checked={sections.guestList}
                    onCheckedChange={() => toggleSection("guestList")}
                  />
                  <label htmlFor="sec-guests" className="text-xs text-slate-700 cursor-pointer">
                    Tabela de Convidados & Check-in
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-financial"
                    checked={sections.financialDetails}
                    onCheckedChange={() => toggleSection("financialDetails")}
                  />
                  <label htmlFor="sec-financial" className="text-xs text-slate-700 cursor-pointer">
                    Tabela de Despesas & Itens
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-risk"
                    checked={sections.riskAlerts}
                    onCheckedChange={() => toggleSection("riskAlerts")}
                  />
                  <label htmlFor="sec-risk" className="text-xs text-slate-700 cursor-pointer">
                    Parecer & Alertas de Risco
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-signatures"
                    checked={sections.notesAndSignatures}
                    onCheckedChange={() => toggleSection("notesAndSignatures")}
                  />
                  <label htmlFor="sec-signatures" className="text-xs text-slate-700 cursor-pointer">
                    Campo de Visto & Assinaturas
                  </label>
                </div>
              </div>
            </div>

            {/* Informações da Exportação */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
              <p><strong>Padrão:</strong> Folha A4 Retrato (210×297mm)</p>
              <p><strong>Resolução:</strong> 300 DPI Vetorial</p>
              <p><strong>Margem:</strong> 12mm com área segura</p>
            </div>
          </div>

          {/* Painel Direito: Preview Interativo A4 */}
          <div className="flex-1 flex flex-col bg-slate-200/80 overflow-hidden">
            {/* Barra de Zoom e Ferramentas do Preview */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-800">Pré-visualização do Documento A4</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-600 hover:text-slate-900"
                  onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.1))}
                  title="Diminuir zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="font-mono text-[11px] w-12 text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-600 hover:text-slate-900"
                  onClick={() => setZoomScale((z) => Math.min(1.2, z + 0.1))}
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] px-2"
                  onClick={() => setZoomScale(0.85)}
                >
                  Ajustar
                </Button>
              </div>
            </div>

            {/* Área de Visualização com Scroll */}
            <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease-out",
                }}
                className="w-[210mm] shadow-2xl rounded-sm"
              >
                <ReportDocument
                  ref={documentRef}
                  data={reportData}
                  sections={sections}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé da Modal com Ações */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Doc ID: <strong className="font-mono text-slate-800">{reportData.reportId}</strong> • Arquivo: <span className="font-mono">{generatePdfFileName(reportData.reportType, reportData.event?.title)}.pdf</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-xs"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

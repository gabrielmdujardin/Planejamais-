"use client"

import React, { forwardRef } from "react"
import type { NormalizedReportData, ReportSectionConfig } from "@/lib/reports/types"
import { ExecutiveSummaryTemplate } from "./templates/executive-summary"
import { FullEventReportTemplate } from "./templates/full-event-report"
import { FinancialReportTemplate } from "./templates/financial-report"
import { ComparativeReportTemplate } from "./templates/comparative-report"

interface ReportDocumentProps {
  data: NormalizedReportData
  sections: ReportSectionConfig
  className?: string
}

export const ReportDocument = forwardRef<HTMLDivElement, ReportDocumentProps>(function ReportDocument(
  { data, sections, className = "" },
  ref,
) {
  return (
    <div ref={ref} className={`report-page-container ${className}`}>
      {data.reportType === "executive-summary" && (
        <ExecutiveSummaryTemplate data={data} sections={sections} />
      )}
      {data.reportType === "full-event" && (
        <FullEventReportTemplate data={data} sections={sections} />
      )}
      {data.reportType === "financial" && (
        <FinancialReportTemplate data={data} sections={sections} />
      )}
      {data.reportType === "comparative" && (
        <ComparativeReportTemplate data={data} sections={sections} />
      )}
    </div>
  )
})

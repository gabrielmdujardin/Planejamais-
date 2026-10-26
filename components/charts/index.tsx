"use client"

import dynamic from "next/dynamic"

export const BarChartWrapper = dynamic(() => import("./bar-chart-wrapper").then((mod) => mod.BarChartWrapper), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ minHeight: 320 }}>
      <p className="text-muted-foreground">Carregando gráfico...</p>
    </div>
  ),
})

export const PieChartWrapper = dynamic(() => import("./pie-chart-wrapper").then((mod) => mod.PieChartWrapper), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ minHeight: 320 }}>
      <p className="text-muted-foreground">Carregando gráfico...</p>
    </div>
  ),
})

const echartsLoading = () => (
  <div className="flex h-[300px] items-center justify-center">
    <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
  </div>
)

export const EFunnelChart = dynamic(() => import("./echarts-charts").then((mod) => mod.EFunnelChart), {
  ssr: false,
  loading: echartsLoading,
})

export const EDonutChart = dynamic(() => import("./echarts-charts").then((mod) => mod.EDonutChart), {
  ssr: false,
  loading: echartsLoading,
})

export const ETimelineChart = dynamic(() => import("./echarts-charts").then((mod) => mod.ETimelineChart), {
  ssr: false,
  loading: echartsLoading,
})

export const EParetoChart = dynamic(() => import("./echarts-charts").then((mod) => mod.EParetoChart), {
  ssr: false,
  loading: echartsLoading,
})

export const EScenarioBarChart = dynamic(() => import("./echarts-charts").then((mod) => mod.EScenarioBarChart), {
  ssr: false,
  loading: echartsLoading,
})

export const EHorizontalBarChart = dynamic(() => import("./echarts-charts").then((mod) => mod.EHorizontalBarChart), {
  ssr: false,
  loading: echartsLoading,
})

export const EStackedBarChart = dynamic(() => import("./echarts-charts").then((mod) => mod.EStackedBarChart), {
  ssr: false,
  loading: echartsLoading,
})


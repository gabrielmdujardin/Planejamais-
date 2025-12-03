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

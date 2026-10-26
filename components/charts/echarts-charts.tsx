"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"
import * as echarts from "echarts/core"
import { BarChart, FunnelChart, LineChart, PieChart } from "echarts/charts"
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import ReactEChartsCore from "echarts-for-react/lib/core"
import type { EChartsCoreOption } from "echarts/core"

echarts.use([
  BarChart,
  FunnelChart,
  LineChart,
  PieChart,
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

export type ChartDatum = {
  name: string
  value?: number
  cumulative?: number
}

const FONT_FAMILY = "inherit"

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

const currencyCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
})

function usePalette() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return {
    dark,
    text: dark ? "#e5e7eb" : "#1f2937",
    muted: dark ? "#9ca3af" : "#6b7280",
    line: dark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)",
    surface: dark ? "#18181b" : "#ffffff",
    border: dark ? "#3f3f46" : "#e5e7eb",
  }
}

type BaseProps = {
  option: EChartsCoreOption
  height: number
  ariaLabel: string
}

function EChartBase({ option, height, ariaLabel }: BaseProps) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ width: "100%", height }}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        notMerge
        lazyUpdate
        style={{ width: "100%", height }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  )
}

function tooltipBase(p: ReturnType<typeof usePalette>) {
  return {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: p.text, fontSize: 12, fontFamily: FONT_FAMILY },
    extraCssText: "border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.18);",
  }
}

/* ------------------------------------------------------------------ */
/* Funil de confirmação                                               */
/* ------------------------------------------------------------------ */

const FUNNEL_COLORS = ["#0f766e", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"]

export function EFunnelChart({ data, height = 320, valueLabel = "Quantidade" }: { data: ChartDatum[]; height?: number; valueLabel?: string }) {
  const p = usePalette()

  const option = useMemo<EChartsCoreOption>(
    () => ({
      aria: { enabled: true },
      tooltip: {
        ...tooltipBase(p),
        trigger: "item",
        valueFormatter: (v: number) => String(v),
      },
      series: [
        {
          type: "funnel",
          name: valueLabel,
          sort: "none",
          left: "2%",
          right: "42%",
          top: 8,
          bottom: 8,
          gap: 4,
          minSize: "18%",
          maxSize: "100%",
          itemStyle: { borderColor: p.surface, borderWidth: 2, borderRadius: 4 },
          label: {
            show: true,
            position: "right",
            color: p.text,
            fontSize: 12,
            fontFamily: FONT_FAMILY,
            formatter: "{b}\n{c}",
            lineHeight: 16,
          },
          labelLine: { length: 18, lineStyle: { color: p.muted, width: 1 } },
          emphasis: { label: { fontWeight: "bold" } },
          data: data.map((d, i) => ({
            name: d.name,
            value: d.value ?? 0,
            itemStyle: { color: FUNNEL_COLORS[i % FUNNEL_COLORS.length] },
          })),
        },
      ],
    }),
    [data, p, valueLabel],
  )

  return <EChartBase option={option} height={height} ariaLabel={`Funil de confirmação: ${data.map((d) => `${d.name} ${d.value ?? 0}`).join(", ")}`} />
}

/* ------------------------------------------------------------------ */
/* Rosca (status de RSVP)                                             */
/* ------------------------------------------------------------------ */

export function EDonutChart({
  data,
  colors,
  height = 300,
  centerLabel = "Total",
}: {
  data: ChartDatum[]
  colors: string[]
  height?: number
  centerLabel?: string
}) {
  const p = usePalette()
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0)

  const option = useMemo<EChartsCoreOption>(
    () => ({
      aria: { enabled: true },
      title: {
        text: String(total),
        subtext: centerLabel,
        left: "center",
        top: "36%",
        itemGap: 2,
        textStyle: { color: p.text, fontSize: 28, fontWeight: 700, fontFamily: FONT_FAMILY },
        subtextStyle: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY },
      },
      tooltip: {
        ...tooltipBase(p),
        trigger: "item",
        formatter: "{b}: <b>{c}</b> ({d}%)",
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16,
        textStyle: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY },
      },
      series: [
        {
          type: "pie",
          radius: ["52%", "74%"],
          center: ["50%", "44%"],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: { borderRadius: 6, borderColor: p.surface, borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: { scaleSize: 6, label: { show: false } },
          data: data.map((d, i) => ({
            name: d.name,
            value: d.value ?? 0,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    }),
    [data, colors, p, total, centerLabel],
  )

  return <EChartBase option={option} height={height} ariaLabel={`${centerLabel}: ${data.map((d) => `${d.name} ${d.value ?? 0}`).join(", ")}`} />
}

/* ------------------------------------------------------------------ */
/* Linha do tempo (área suave)                                        */
/* ------------------------------------------------------------------ */

export function ETimelineChart({
  data,
  height = 300,
  seriesName = "Confirmações",
  color = "#059669",
}: {
  data: ChartDatum[]
  height?: number
  seriesName?: string
  color?: string
}) {
  const p = usePalette()

  const option = useMemo<EChartsCoreOption>(
    () => ({
      aria: { enabled: true },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase(p),
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: p.muted, type: "dashed" } },
        valueFormatter: (v: number) => String(v),
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.map((d) => d.name),
        axisLine: { lineStyle: { color: p.line } },
        axisTick: { show: false },
        axisLabel: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY, hideOverlap: true },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: p.line, type: "dashed" } },
        axisLabel: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY },
      },
      series: [
        {
          type: "line",
          name: seriesName,
          smooth: 0.35,
          symbol: "circle",
          symbolSize: 8,
          showSymbol: data.length <= 31,
          lineStyle: { width: 3, color },
          itemStyle: { color, borderColor: p.surface, borderWidth: 2 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${color}55` },
                { offset: 1, color: `${color}05` },
              ],
            },
          },
          emphasis: { focus: "series" },
          data: data.map((d) => d.value ?? 0),
        },
      ],
    }),
    [data, p, seriesName, color],
  )

  return <EChartBase option={option} height={height} ariaLabel={`${seriesName} ao longo do tempo: ${data.map((d) => `${d.name} ${d.value ?? 0}`).join(", ")}`} />
}

/* ------------------------------------------------------------------ */
/* Pareto de custos (barras + % acumulado + referência de 80%)        */
/* ------------------------------------------------------------------ */

export function EParetoChart({ data, height = 330 }: { data: ChartDatum[]; height?: number }) {
  const p = usePalette()

  const option = useMemo<EChartsCoreOption>(
    () => ({
      aria: { enabled: true },
      grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
      legend: {
        top: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY },
      },
      tooltip: {
        ...tooltipBase(p),
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: p.line } },
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: p.line } },
        axisLabel: {
          color: p.muted,
          fontSize: 12,
          fontFamily: FONT_FAMILY,
          interval: 0,
          width: 84,
          overflow: "truncate",
          hideOverlap: true,
        },
      },
      yAxis: [
        {
          type: "value",
          axisLabel: {
            color: p.muted,
            fontSize: 12,
            fontFamily: FONT_FAMILY,
            formatter: (v: number) => currencyCompact.format(v),
          },
          splitLine: { lineStyle: { color: p.line, type: "dashed" } },
        },
        {
          type: "value",
          min: 0,
          max: 100,
          splitNumber: 4,
          axisLabel: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY, formatter: "{value}%" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          type: "bar",
          name: "Custo",
          yAxisIndex: 0,
          barMaxWidth: 44,
          itemStyle: { color: "#0f766e", borderRadius: [6, 6, 0, 0] },
          tooltip: { valueFormatter: (v: number) => currency.format(v || 0) },
          data: data.map((d) => d.value ?? 0),
        },
        {
          type: "line",
          name: "% acumulado",
          yAxisIndex: 1,
          smooth: false,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { width: 2, color: "#dc2626" },
          itemStyle: { color: "#dc2626", borderColor: p.surface, borderWidth: 2 },
          tooltip: { valueFormatter: (v: number) => `${Math.round(v || 0)}%` },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: "#d97706", type: "dashed", width: 1.5 },
            label: { formatter: "80%", color: "#d97706", fontSize: 11, position: "insideEndTop" },
            data: [{ yAxis: 80 }],
          },
          data: data.map((d) => d.cumulative ?? 0),
        },
      ],
    }),
    [data, p],
  )

  return (
    <EChartBase
      option={option}
      height={height}
      ariaLabel={`Pareto de custos: ${data.map((d) => `${d.name} ${currency.format(d.value || 0)}, ${Math.round(d.cumulative || 0)}% acumulado`).join("; ")}`}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Barras de cenários (projeção de presença / custo por cenário)       */
/* ------------------------------------------------------------------ */

export function EScenarioBarChart({
  data,
  height = 320,
  colors = ["#059669", "#2563eb", "#d97706"],
  valueType = "number",
  seriesName = "Valor",
}: {
  data: ChartDatum[]
  height?: number
  colors?: string[]
  valueType?: "number" | "currency"
  seriesName?: string
}) {
  const p = usePalette()

  const option = useMemo<EChartsCoreOption>(
    () => ({
      aria: { enabled: true },
      grid: { left: 8, right: 8, top: 24, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase(p),
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: p.line } },
        valueFormatter: (v: number) =>
          valueType === "currency" ? currency.format(v || 0) : String(v ?? 0),
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: p.line } },
        axisLabel: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY },
      },
      yAxis: {
        type: "value",
        minInterval: valueType === "number" ? 1 : undefined,
        axisLabel: {
          color: p.muted,
          fontSize: 12,
          fontFamily: FONT_FAMILY,
          formatter: (v: number) =>
            valueType === "currency" ? currencyCompact.format(v) : String(v),
        },
        splitLine: { lineStyle: { color: p.line, type: "dashed" } },
      },
      series: [
        {
          type: "bar",
          name: seriesName,
          barMaxWidth: 44,
          data: data.map((d, i) => ({
            value: d.value ?? 0,
            itemStyle: {
              color: colors[i % colors.length],
              borderRadius: [6, 6, 0, 0],
            },
          })),
        },
      ],
    }),
    [data, p, colors, valueType, seriesName],
  )

  const summary = data
    .map((d) => `${d.name}: ${valueType === "currency" ? currency.format(d.value || 0) : d.value ?? 0}`)
    .join(", ")

  return <EChartBase option={option} height={height} ariaLabel={`${seriesName}: ${summary}`} />
}

/* ------------------------------------------------------------------ */
/* Barras horizontais (ranking de custo por evento)                   */
/* ------------------------------------------------------------------ */

export function EHorizontalBarChart({
  data,
  height = 330,
  seriesName = "Custo",
  color = "#2563eb",
}: {
  data: ChartDatum[]
  height?: number
  seriesName?: string
  color?: string
}) {
  const p = usePalette()

  // ECharts desenha barras horizontais de baixo para cima; invertemos para exibir o 1º no topo
  const reversedData = useMemo(() => [...data].reverse(), [data])

  const option = useMemo<EChartsCoreOption>(
    () => ({
      aria: { enabled: true },
      grid: { left: 8, right: 16, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase(p),
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: p.line } },
        valueFormatter: (v: number) => currency.format(v || 0),
      },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: p.muted,
          fontSize: 12,
          fontFamily: FONT_FAMILY,
          formatter: (v: number) => currencyCompact.format(v),
        },
        splitLine: { lineStyle: { color: p.line, type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: reversedData.map((d) => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: p.line } },
        axisLabel: {
          color: p.muted,
          fontSize: 12,
          fontFamily: FONT_FAMILY,
          width: 140,
          overflow: "truncate",
        },
      },
      series: [
        {
          type: "bar",
          name: seriesName,
          barMaxWidth: 24,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color },
                { offset: 1, color: "#3b82f6" },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
          data: reversedData.map((d) => d.value ?? 0),
        },
      ],
    }),
    [reversedData, p, seriesName, color],
  )

  const summary = data.map((d) => `${d.name}: ${currency.format(d.value || 0)}`).join("; ")

  return <EChartBase option={option} height={height} ariaLabel={`${seriesName} por evento: ${summary}`} />
}

/* ------------------------------------------------------------------ */
/* Barras empilhadas (comparativo de confirmações por evento)         */
/* ------------------------------------------------------------------ */

export function EStackedBarChart({
  data,
  height = 320,
}: {
  data: Array<{ name: string; confirmed?: number; pending?: number; declined?: number }>
  height?: number
}) {
  const p = usePalette()

  const option = useMemo<EChartsCoreOption>(
    () => ({
      aria: { enabled: true },
      grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
      legend: {
        top: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
        textStyle: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY },
      },
      tooltip: {
        ...tooltipBase(p),
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: p.line } },
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: p.line } },
        axisLabel: {
          color: p.muted,
          fontSize: 12,
          fontFamily: FONT_FAMILY,
          interval: 0,
          width: 90,
          overflow: "truncate",
          hideOverlap: true,
        },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { color: p.muted, fontSize: 12, fontFamily: FONT_FAMILY },
        splitLine: { lineStyle: { color: p.line, type: "dashed" } },
      },
      series: [
        {
          type: "bar",
          name: "Confirmados",
          stack: "total",
          barMaxWidth: 44,
          itemStyle: { color: "#059669" },
          data: data.map((d) => d.confirmed ?? 0),
        },
        {
          type: "bar",
          name: "Pendentes",
          stack: "total",
          barMaxWidth: 44,
          itemStyle: { color: "#d97706" },
          data: data.map((d) => d.pending ?? 0),
        },
        {
          type: "bar",
          name: "Recusados",
          stack: "total",
          barMaxWidth: 44,
          itemStyle: { color: "#dc2626", borderRadius: [6, 6, 0, 0] },
          data: data.map((d) => d.declined ?? 0),
        },
      ],
    }),
    [data, p],
  )

  const summary = data
    .map((d) => `${d.name} (${d.confirmed ?? 0} conf., ${d.pending ?? 0} pend., ${d.declined ?? 0} rec.)`)
    .join("; ")

  return <EChartBase option={option} height={height} ariaLabel={`Comparativo de confirmações: ${summary}`} />
}

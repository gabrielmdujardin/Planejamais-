"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PieChartWrapperProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>
  colors?: string[]
  height?: number
  showLabel?: boolean
}

const DEFAULT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export function PieChartWrapper({
  data,
  colors = DEFAULT_COLORS,
  height = 320,
  showLabel = true,
}: PieChartWrapperProps) {
  const sanitizedData = data.map((item) => ({
    ...item,
    value: Number(item.value) || 0,
  }))

  const hasData = sanitizedData.length > 0 && sanitizedData.some((item) => item.value > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: height }}>
        <p className="text-muted-foreground">Sem dados disponíveis</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={sanitizedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabel ? (entry) => `${entry.name}: ${entry.percentage || entry.value}%` : false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {sanitizedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

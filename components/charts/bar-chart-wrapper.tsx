"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"

interface BarChartWrapperProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>
  dataKeys?: Array<{ key: string; name: string; color: string }>
  colors?: string[]
  height?: number
}

export function BarChartWrapper({ data, dataKeys, colors = ["#10b981"], height = 320 }: BarChartWrapperProps) {
  const sanitizedData = data.map((item) => {
    const newItem: Record<string, string | number> = { ...item }
    Object.keys(newItem).forEach((key) => {
      if (key !== "name" && typeof newItem[key] !== "string") {
        newItem[key] = Number(newItem[key]) || 0
      }
    })
    return newItem
  })

  if (!sanitizedData || sanitizedData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: height }}>
        <p className="text-muted-foreground">Sem dados disponíveis</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={sanitizedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {dataKeys ? (
            dataKeys.map((dk) => <Bar key={dk.key} dataKey={dk.key} fill={dk.color} name={dk.name} />)
          ) : (
            <Bar dataKey="value" name="Quantidade">
              {sanitizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

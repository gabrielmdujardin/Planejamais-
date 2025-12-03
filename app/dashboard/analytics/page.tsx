"use client"

import { useMemo } from "react"
import { useEventStore } from "@/stores/event-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackButton } from "@/components/back-button"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Calendar, Users, DollarSign, TrendingUp } from "lucide-react"

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function AnalyticsPage() {
  const { events } = useEventStore()

  console.log("[v0] Total events loaded:", events.length)
  console.log("[v0] Events data:", events)

  // Calcular métricas gerais
  const metrics = useMemo(() => {
    const totalEvents = events.length
    const totalGuests = events.reduce((sum, event) => sum + (event.guests?.length || 0), 0)
    const totalRevenue = events.reduce((sum, event) => {
      const eventRevenue = (event.guests || []).reduce((guestSum, guest) => guestSum + (guest.ticketPrice || 0), 0)
      return sum + eventRevenue
    }, 0)

    const confirmedGuests = events.reduce(
      (sum, event) => sum + (event.guests?.filter((g) => g.status === "confirmed").length || 0),
      0,
    )
    const confirmationRate = totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0

    console.log("[v0] Metrics calculated:", {
      totalEvents,
      totalGuests,
      totalRevenue,
      confirmationRate,
      confirmedGuests,
    })

    return {
      totalEvents,
      totalGuests,
      totalRevenue,
      confirmationRate,
      confirmedGuests,
    }
  }, [events])

  // Processar dados para gráfico de eventos por mês
  const eventsByMonth = useMemo(() => {
    const monthData: Record<string, { eventos: number; convidados: number }> = {}

    events.forEach((event) => {
      if (!event.date) return

      try {
        const date = new Date(event.date)
        if (isNaN(date.getTime())) return

        const monthYear = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

        if (!monthData[monthYear]) {
          monthData[monthYear] = { eventos: 0, convidados: 0 }
        }

        monthData[monthYear].eventos += 1
        monthData[monthYear].convidados += event.guests?.length || 0
      } catch (error) {
        console.error("Erro ao processar data:", error)
      }
    })

    const result = Object.entries(monthData)
      .map(([month, data]) => ({
        mes: month,
        eventos: data.eventos,
        convidados: data.convidados,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.mes)
        const dateB = new Date(b.mes)
        return dateA.getTime() - dateB.getTime()
      })

    console.log("[v0] Events by month data:", result)

    return result
  }, [events])

  // Processar dados para gráfico de eventos por tipo
  const eventsByType = useMemo(() => {
    const typeData: Record<string, number> = {}

    events.forEach((event) => {
      const type = event.type || "Outros"
      typeData[type] = (typeData[type] || 0) + 1
    })

    const result = Object.entries(typeData).map(([tipo, quantidade]) => ({
      tipo,
      quantidade,
    }))

    console.log("[v0] Events by type data:", result)

    return result
  }, [events])

  // Processar dados para tendência de confirmações
  const confirmationTrend = useMemo(() => {
    const trendData: Record<string, { confirmados: number; pendentes: number; recusados: number }> = {}

    events.forEach((event) => {
      if (!event.date) return

      try {
        const date = new Date(event.date)
        if (isNaN(date.getTime())) return

        const monthYear = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

        if (!trendData[monthYear]) {
          trendData[monthYear] = { confirmados: 0, pendentes: 0, recusados: 0 }
        }

        event.guests?.forEach((guest) => {
          if (guest.status === "confirmed") trendData[monthYear].confirmados += 1
          else if (guest.status === "pending") trendData[monthYear].pendentes += 1
          else if (guest.status === "declined") trendData[monthYear].recusados += 1
        })
      } catch (error) {
        console.error("Erro ao processar tendência:", error)
      }
    })

    return Object.entries(trendData)
      .map(([mes, data]) => ({
        mes,
        confirmados: data.confirmados,
        pendentes: data.pendentes,
        recusados: data.recusados,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.mes)
        const dateB = new Date(b.mes)
        return dateA.getTime() - dateB.getTime()
      })
  }, [events])

  // Processar dados para receita mensal
  const revenueByMonth = useMemo(() => {
    const revenueData: Record<string, number> = {}

    events.forEach((event) => {
      if (!event.date) return

      try {
        const date = new Date(event.date)
        if (isNaN(date.getTime())) return

        const monthYear = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

        if (!revenueData[monthYear]) {
          revenueData[monthYear] = 0
        }

        event.guests?.forEach((guest) => {
          revenueData[monthYear] += guest.ticketPrice || 0
        })
      } catch (error) {
        console.error("Erro ao processar receita:", error)
      }
    })

    return Object.entries(revenueData)
      .map(([mes, receita]) => ({
        mes,
        receita,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.mes)
        const dateB = new Date(b.mes)
        return dateA.getTime() - dateB.getTime()
      })
  }, [events])

  // Processar dados para status de respostas
  const responseStatus = useMemo(() => {
    let confirmed = 0
    let pending = 0
    let declined = 0

    events.forEach((event) => {
      event.guests?.forEach((guest) => {
        if (guest.status === "confirmed") confirmed += 1
        else if (guest.status === "pending") pending += 1
        else if (guest.status === "declined") declined += 1
      })
    })

    return [
      { status: "Confirmados", quantidade: confirmed },
      { status: "Pendentes", quantidade: pending },
      { status: "Recusados", quantidade: declined },
    ]
  }, [events])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-600 mt-1">Visualize suas métricas e tendências de eventos</p>
          </div>
          <BackButton />
        </div>

        {events.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800 text-center">
                Nenhum evento encontrado. Adicione eventos para ver os insights aqui.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="guests">Convidados</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{metrics.totalEvents}</div>
                  <p className="text-xs text-purple-600 mt-1">
                    {events.filter((e) => new Date(e.date) > new Date()).length} Eventos futuros
                  </p>
                </CardContent>
              </Card>

              <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Convidados</CardTitle>
                  <Users className="h-4 w-4 text-pink-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-900">{metrics.totalGuests}</div>
                  <p className="text-xs text-pink-600 mt-1">{metrics.confirmedGuests} Convidados totais</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-900">
                    R$ {(metrics.totalRevenue / 1000).toFixed(1)}K
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">Soma dos itens</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Taxa Confirmação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{metrics.confirmationRate.toFixed(0)}%</div>
                  <p className="text-xs text-blue-600 mt-1">Taxa atual</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos Principais */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Eventos por Mês</CardTitle>
                  <CardDescription>Evolução mensal de eventos e convidados</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={eventsByMonth}>
                      <defs>
                        <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorConvidados" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="eventos"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorEventos)"
                        name="Eventos"
                      />
                      <Area
                        type="monotone"
                        dataKey="convidados"
                        stroke="#ec4899"
                        fillOpacity={1}
                        fill="url(#colorConvidados)"
                        name="Convidados"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Eventos por Tipo</CardTitle>
                  <CardDescription>Distribuição por categoria de evento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={eventsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {eventsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tendência de Confirmações</CardTitle>
                <CardDescription>Evolução de confirmações nos últimos eventos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={confirmationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="confirmados"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Confirmados"
                    />
                    <Line
                      type="monotone"
                      dataKey="pendentes"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Pendentes"
                    />
                    <Line
                      type="monotone"
                      dataKey="recusados"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Recusados"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Mês</CardTitle>
                  <CardDescription>Quantidade de eventos criados por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={eventsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="eventos" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Eventos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo</CardTitle>
                  <CardDescription>Categorias de eventos mais populares</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={eventsByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" fontSize={12} />
                      <YAxis dataKey="tipo" type="category" stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="quantidade" fill="#ec4899" radius={[0, 8, 8, 0]} name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status de Respostas</CardTitle>
                  <CardDescription>Distribuição de status dos convidados</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={responseStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, quantidade }) => `${status}: ${quantidade}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {responseStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.status === "Confirmados"
                                ? "#10b981"
                                : entry.status === "Pendentes"
                                  ? "#f59e0b"
                                  : "#ef4444"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Convidados por Mês</CardTitle>
                  <CardDescription>Total de convidados por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={eventsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="convidados" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Convidados" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita Mensal</CardTitle>
                <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={revenueByMonth}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => `R$ ${value.toFixed(2)}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorReceita)"
                      name="Receita"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

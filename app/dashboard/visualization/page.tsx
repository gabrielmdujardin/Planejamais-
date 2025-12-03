"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, TrendingUp, DollarSign, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEventStore } from "@/stores/event-store"
import { BackButton } from "@/components/back-button"
import { BarChartWrapper, PieChartWrapper } from "@/components/charts"
import { getEvents } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function VisualizationPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Festa", "Colaborativo"])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState("geral")
  const [isLoading, setIsLoading] = useState(true)

  const { events, setEvents } = useEventStore()
  const { toast } = useToast()

  useEffect(() => {
    const loadEvents = async () => {
      console.log("[v0] Loading events from database...")
      setIsLoading(true)
      try {
        const { data, error } = await getEvents()

        if (error) {
          console.error("[v0] Error loading events:", error)
          toast({
            title: "Erro ao carregar eventos",
            description: error,
            variant: "destructive",
          })
        } else {
          console.log("[v0] Events loaded:", data.length)
          setEvents(data)
          toast({
            title: "Eventos carregados",
            description: `${data.length} eventos encontrados`,
          })
        }
      } catch (error) {
        console.error("[v0] Exception loading events:", error)
        toast({
          title: "Erro ao carregar eventos",
          description: "Ocorreu um erro inesperado",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [setEvents, toast])

  // Extrair categorias únicas dos eventos
  const allCategories = useMemo(() => {
    const cats = events.map((e) => e.category || "Sem categoria")
    const uniqueCats = Array.from(new Set(cats))

    // Inicializar categorias selecionadas se vazio
    if (selectedCategories.length === 0 && uniqueCats.length > 0) {
      setSelectedCategories(uniqueCats)
    }

    return uniqueCats
  }, [events])

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const typeMatch = selectedTypes.includes(event.type)
      const categoryMatch = selectedCategories.includes(event.category || "Sem categoria")
      return typeMatch && categoryMatch
    })
  }, [events, selectedTypes, selectedCategories])

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length
    const totalGuests = filteredEvents.reduce((sum, event) => sum + event.totalGuests, 0)
    const avgGuestsPerEvent = totalEvents > 0 ? Math.round(totalGuests / totalEvents) : 0
    const totalConfirmed = filteredEvents.reduce((sum, event) => sum + event.confirmedGuests, 0)
    const confirmationRate = totalGuests > 0 ? Math.round((totalConfirmed / totalGuests) * 100) : 0

    return {
      totalEvents,
      totalGuests,
      avgGuestsPerEvent,
      confirmationRate,
      totalConfirmed,
    }
  }, [filteredEvents])

  // Dados por tipo
  const eventsByType = useMemo(() => {
    const typeCount = filteredEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      value,
    }))
  }, [filteredEvents])

  // Dados por categoria
  const eventsByCategory = useMemo(() => {
    const categoryCount = filteredEvents.reduce(
      (acc, event) => {
        const category = event.category || "Sem categoria"
        acc[category] = (acc[category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    }))
  }, [filteredEvents])

  // Dados por status
  const eventsByStatus = useMemo(() => {
    const confirmed = filteredEvents.filter((e) => e.confirmedGuests === e.totalGuests).length
    const partial = filteredEvents.filter((e) => e.confirmedGuests > 0 && e.confirmedGuests < e.totalGuests).length
    const pending = filteredEvents.filter((e) => e.confirmedGuests === 0).length

    return [
      {
        name: "Confirmados",
        value: confirmed,
        percentage: filteredEvents.length > 0 ? Math.round((confirmed / filteredEvents.length) * 100) : 0,
      },
      {
        name: "Parcial",
        value: partial,
        percentage: filteredEvents.length > 0 ? Math.round((partial / filteredEvents.length) * 100) : 0,
      },
      {
        name: "Pendentes",
        value: pending,
        percentage: filteredEvents.length > 0 ? Math.round((pending / filteredEvents.length) * 100) : 0,
      },
    ]
  }, [filteredEvents])

  // Dados de convidados por evento
  const guestsByEvent = useMemo(() => {
    return filteredEvents.slice(0, 10).map((event) => ({
      name: event.title.length > 20 ? event.title.substring(0, 20) + "..." : event.title,
      total: event.totalGuests,
      confirmados: event.confirmedGuests,
    }))
  }, [filteredEvents])

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const clearFilters = () => {
    setSelectedTypes(["Festa", "Colaborativo"])
    setSelectedCategories(allCategories)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Análise de Dados</h1>
            <p className="text-gray-600 dark:text-gray-400">Carregando eventos...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Análise de Dados</h1>
            <p className="text-gray-600 dark:text-gray-400">Visualize estatísticas dos seus eventos</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Filtros Avançados</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipo de Evento</Label>
                <div className="space-y-2">
                  {["Festa", "Colaborativo"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => toggleType(type)}
                      />
                      <Label htmlFor={`type-${type}`} className="cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {allCategories.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Categoria</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {allCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label htmlFor={`cat-${category}`} className="cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">Nenhum evento encontrado com os filtros aplicados</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Ajuste os filtros ou crie novos eventos</p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">Todos os eventos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGuests}</div>
                <p className="text-xs text-muted-foreground">Média de {stats.avgGuestsPerEvent} por evento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Confirmação</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.confirmationRate}%</div>
                <p className="text-xs text-muted-foreground">{stats.totalConfirmed} confirmados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {(stats.totalGuests * 1250).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Baseado em R$ 1.250 por evento</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="tendencias">Tendências</TabsTrigger>
              <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Eventos por Status</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Distribuição dos eventos por status atual
                    </p>
                  </CardHeader>
                  <CardContent>
                    {activeTab === "geral" && <PieChartWrapper data={eventsByStatus} colors={COLORS} height={320} />}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Eventos por Tipo</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Categorização dos eventos</p>
                  </CardHeader>
                  <CardContent>
                    {activeTab === "geral" && <BarChartWrapper data={eventsByType} colors={["#10b981"]} height={320} />}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tendencias" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Convidados por Evento</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Comparação de total vs confirmados</p>
                </CardHeader>
                <CardContent>
                  {activeTab === "tendencias" && (
                    <BarChartWrapper
                      data={guestsByEvent}
                      dataKeys={[
                        { key: "total", name: "Total", color: "#3b82f6" },
                        { key: "confirmados", name: "Confirmados", color: "#10b981" },
                      ]}
                      height={400}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribuicao" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Categoria</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Suas categorias personalizadas</p>
                </CardHeader>
                <CardContent>
                  {activeTab === "distribuicao" && (
                    <BarChartWrapper data={eventsByCategory} colors={["#10b981"]} height={400} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detalhes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes dos Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={event.type === "Colaborativo" ? "default" : "secondary"}>
                              {event.type}
                            </Badge>
                            {event.category && event.category !== "Sem categoria" && (
                              <Badge variant="outline">{event.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.fullDate} às {event.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {event.confirmedGuests} / {event.totalGuests}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">confirmados</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

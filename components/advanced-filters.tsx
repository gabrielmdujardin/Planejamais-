"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Filter, X, Search } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void
  locations: string[]
  categories: string[]
}

export function AdvancedFilters({ onFiltersChange, locations, categories }: AdvancedFiltersProps) {
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [type, setType] = useState<string[]>([])
  const [category, setCategory] = useState<string[]>([])
  const [location, setLocation] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const handleApplyFilters = () => {
    onFiltersChange({
      search,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      type,
      category,
      location: location === "all" ? "" : location,
    })
  }

  const handleClearFilters = () => {
    setSearch("")
    setStartDate(undefined)
    setEndDate(undefined)
    setType([])
    setCategory([])
    setLocation("all")
    onFiltersChange({})
  }

  const toggleType = (value: string) => {
    setType((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]))
  }

  const toggleCategory = (value: string) => {
    setCategory((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]))
  }

  const activeFiltersCount =
    (search ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    type.length +
    category.length +
    (location !== "all" ? 1 : 0)

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} {activeFiltersCount === 1 ? "filtro ativo" : "filtros ativos"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Refine sua busca com múltiplos critérios</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Ocultar" : "Mostrar"} Filtros
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Nome, categoria ou local..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Data Inicial */}
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Localização */}
            {locations.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Todas as localizações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as localizações</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Tipo de Evento */}
          <div className="space-y-2">
            <Label>Tipo de Pagamento</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={type.includes("Festa") ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleType("Festa")}
              >
                Festa
              </Badge>
              <Badge
                variant={type.includes("Colaborativo") ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleType("Colaborativo")}
              >
                Colaborativo
              </Badge>
            </div>
          </div>

          {/* Categorias */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Categorias Personalizadas</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={category.includes(cat) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClearFilters} disabled={activeFiltersCount === 0}>
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            <Button onClick={handleApplyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

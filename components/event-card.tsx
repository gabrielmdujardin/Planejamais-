import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, ArrowRight, DollarSign, Sparkles } from "lucide-react"

interface EventItem {
  name: string
  price: number
}

interface Event {
  id: string
  title: string
  type: string
  date: string
  confirmedGuests: number
  totalGuests: number
  financialMode?: "corporate_budget" | "collaborative_split"
  budgetEstimated?: number | null
  items?: EventItem[]
}

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const isCollaborative = event.financialMode === "collaborative_split" || event.type === "Colaborativo"
  const totalCost = event.items ? event.items.reduce((sum, item) => sum + item.price, 0) : 0
  const costPerPerson =
    event.confirmedGuests > 0 ? (totalCost / event.confirmedGuests).toFixed(2) : "0.00"

  const confirmationRate =
    event.totalGuests > 0
      ? Math.round((event.confirmedGuests / event.totalGuests) * 100)
      : 0

  return (
    <Card
      variant="interactive"
      className="group flex flex-col justify-between overflow-hidden border-border/80 hover:border-primary/40 transition-all duration-200"
    >
      <div>
        {/* Faixa decorativa sutil no topo */}
        <div
          className={`h-1.5 w-full ${
            isCollaborative
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800"
          }`}
        />

        <CardContent className="p-5 space-y-4">
          {/* Header do Card com Tipo e Título */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge
                variant={isCollaborative ? "success" : "secondary"}
                size="sm"
                className="gap-1 font-medium"
              >
                {isCollaborative && <Sparkles className="h-3 w-3" />}
                {event.type}
              </Badge>

              {event.totalGuests > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {confirmationRate}% conf.
                </span>
              )}
            </div>

            <h3 className="font-semibold text-lg text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
          </div>

          {/* Indicadores Principais: Data e Convidados */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium text-foreground truncate">{event.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium text-foreground truncate">
                {event.confirmedGuests}/{event.totalGuests} convidados
              </span>
            </div>
          </div>

          {/* Seção Financeira: Modo Colaborativo (Rateio) */}
          {isCollaborative && event.items && event.items.length > 0 && (
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {event.items.length} {event.items.length === 1 ? "item listado" : "itens listados"}
                </span>
                <span className="font-semibold text-foreground">
                  R$ {totalCost.toFixed(2)}
                </span>
              </div>

              {event.confirmedGuests > 0 && (
                <div className="flex items-center justify-between text-xs bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-md border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">Por pessoa:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    R$ {costPerPerson}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Seção Financeira: Modo Corporativo / Orçamento (Sem Rateio) */}
          {!isCollaborative && (totalCost > 0 || (event.budgetEstimated && event.budgetEstimated > 0)) && (
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                  {event.budgetEstimated ? "Verba alocada" : "Gastos comprometidos"}
                </span>
                <span className="font-semibold text-foreground">
                  R$ {(event.budgetEstimated || totalCost).toFixed(2)}
                </span>
              </div>

              {totalCost > 0 && event.budgetEstimated && (
                <div className="flex items-center justify-between text-xs bg-muted/60 px-2.5 py-1.5 rounded-md border border-border/50">
                  <span className="text-muted-foreground font-medium">Executado:</span>
                  <span className="font-semibold text-foreground">
                    R$ {totalCost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="p-5 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-colors"
        >
          <span>Gerenciar evento</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  )
}

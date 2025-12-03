import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, ArrowRight } from "lucide-react"

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
  items: EventItem[]
}

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  // Calculate cost per person for collaborative events
  const totalCost = event.items ? event.items.reduce((sum, item) => sum + item.price, 0) : 0
  const costPerPerson = event.confirmedGuests > 0 ? (totalCost / event.confirmedGuests).toFixed(2) : "0.00"

  return (
    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
      <CardContent className="p-0 h-full flex flex-col">
        <div className={`h-2 ${event.type === "Colaborativo" ? "bg-emerald-500" : "bg-blue-500"}`}></div>
        <div className="p-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                event.type === "Colaborativo" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
              }`}
            >
              {event.type}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center text-gray-700">
              <CalendarDays className="h-5 w-5 mr-2 text-gray-500" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              <span>
                {event.confirmedGuests}/{event.totalGuests} confirmados
              </span>
            </div>
          </div>

          {event.type === "Colaborativo" && event.items && event.items.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">Itens do evento:</h4>
              <ul className="space-y-2 text-sm">
                {event.items.slice(0, 3).map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">R$ {item.price.toFixed(2)}</span>
                  </li>
                ))}
                {event.items.length > 3 && (
                  <li className="text-center text-gray-500 text-xs">+ {event.items.length - 3} mais itens</li>
                )}
              </ul>
              {event.confirmedGuests > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between font-medium">
                  <span>Valor por pessoa:</span>
                  <span className="text-emerald-600">R$ {costPerPerson}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <CardFooter className="p-4 pt-0 mt-auto">
          <Button variant="ghost" className="w-full justify-between">
            Ver detalhes <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  )
}

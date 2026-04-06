import { describe, it, expect } from "vitest"
import { CalculateEventCosts } from "@/application/use-cases/calculate-event-costs"
import { Money } from "@/domain/value-objects/money"
import type { EventProps } from "@/domain/entities/event"
import type { GuestProps } from "@/domain/entities/guest"
import type { ItemProps } from "@/domain/entities/item"

function makeGuest(overrides: Partial<GuestProps> = {}): GuestProps {
  return {
    id: `guest-${Math.random().toString(36).substring(7)}`,
    name: "Convidado",
    email: "convidado@test.com",
    phone: "11987654321",
    status: "pending",
    createdAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function makeItem(overrides: Partial<ItemProps> = {}): ItemProps {
  return {
    id: `item-${Math.random().toString(36).substring(7)}`,
    name: "Item",
    price: 100,
    assignedTo: null,
    image: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function makeEventProps(overrides: Partial<EventProps> = {}): EventProps {
  return {
    id: "event-1",
    title: "Festa",
    type: "Colaborativo",
    date: "2025-06-15",
    time: "19:00",
    location: "Local",
    description: "Desc",
    confirmedGuests: 0,
    totalGuests: 0,
    items: [],
    guests: [],
    photos: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("CalculateEventCosts (Use Case)", () => {
  const useCase = new CalculateEventCosts()

  it("deve calcular custo total e por pessoa para evento colaborativo", () => {
    const result = useCase.execute(
      makeEventProps({
        type: "Colaborativo",
        items: [makeItem({ price: 100 }), makeItem({ price: 200 })],
        guests: [
          makeGuest({ id: "g1", status: "confirmed" }),
          makeGuest({ id: "g2", status: "confirmed" }),
        ],
      })
    )

    expect(result.totalCostRaw).toBe(300)
    expect(result.totalCost).toBe("R$ 300.00")
    expect(result.costPerPersonRaw).toBe(150)
    expect(result.costPerPerson).toBe("R$ 150.00")
    expect(result.itemsCount).toBe(2)
    expect(result.confirmedGuests).toBe(2)
    expect(result.isCollaborative).toBe(true)
  })

  it("deve retornar custo por pessoa zero quando sem confirmados", () => {
    const result = useCase.execute(
      makeEventProps({
        items: [makeItem({ price: 300 })],
        guests: [makeGuest({ status: "pending" })],
      })
    )

    expect(result.totalCostRaw).toBe(300)
    expect(result.costPerPersonRaw).toBe(0)
  })

  it("deve retornar custos zerados para evento sem itens", () => {
    const result = useCase.execute(makeEventProps())

    expect(result.totalCostRaw).toBe(0)
    expect(result.costPerPersonRaw).toBe(0)
    expect(result.itemsCount).toBe(0)
  })

  describe("sumPrices (metodo estatico)", () => {
    it("deve somar lista de precos", () => {
      const total = CalculateEventCosts.sumPrices([10, 20, 30.5])
      expect(total.reais).toBe(60.5)
    })

    it("deve retornar zero para lista vazia", () => {
      const total = CalculateEventCosts.sumPrices([])
      expect(total.isZero).toBe(true)
    })
  })
})

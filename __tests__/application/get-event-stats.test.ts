import { describe, it, expect } from "vitest"
import { GetEventStats } from "@/application/use-cases/get-event-stats"
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

describe("GetEventStats (Use Case)", () => {
  const useCase = new GetEventStats()

  it("deve retornar todas as estatisticas do evento", () => {
    const result = useCase.execute(
      makeEventProps({
        type: "Colaborativo",
        items: [makeItem({ price: 100 }), makeItem({ price: 200 })],
        guests: [
          makeGuest({ id: "g1", status: "confirmed" }),
          makeGuest({ id: "g2", status: "confirmed" }),
          makeGuest({ id: "g3", status: "pending" }),
          makeGuest({ id: "g4", status: "declined" }),
        ],
        photos: [
          {
            id: "p1",
            url: "http://example.com/p.jpg",
            filename: "p.jpg",
            uploadedBy: "u1",
            uploadedAt: "2025-01-01",
          },
        ],
      })
    )

    expect(result.totalGuests).toBe(4)
    expect(result.confirmedGuests).toBe(2)
    expect(result.pendingGuests).toBe(1)
    expect(result.declinedGuests).toBe(1)
    expect(result.confirmationRate).toBe(50)
    expect(result.totalCost).toBe(300)
    expect(result.totalCostFormatted).toBe("R$ 300.00")
    expect(result.costPerPerson).toBe(150)
    expect(result.costPerPersonFormatted).toBe("R$ 150.00")
    expect(result.itemsCount).toBe(2)
    expect(result.photosCount).toBe(1)
    expect(result.isCollaborative).toBe(true)
  })

  it("deve retornar zeros para evento vazio", () => {
    const result = useCase.execute(makeEventProps())

    expect(result.totalGuests).toBe(0)
    expect(result.confirmedGuests).toBe(0)
    expect(result.confirmationRate).toBe(0)
    expect(result.totalCost).toBe(0)
    expect(result.costPerPerson).toBe(0)
    expect(result.itemsCount).toBe(0)
    expect(result.photosCount).toBe(0)
  })
})

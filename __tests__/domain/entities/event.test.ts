import { describe, it, expect } from "vitest"
import { EventEntity, type EventProps } from "@/domain/entities/event"
import type { GuestProps } from "@/domain/entities/guest"
import type { ItemProps } from "@/domain/entities/item"

function makeGuest(overrides: Partial<GuestProps> = {}): GuestProps {
  return {
    id: `guest-${Math.random().toString(36).substring(7)}`,
    name: "Convidado Teste",
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
    name: "Item Teste",
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
    title: "Festa de Aniversario",
    type: "Colaborativo",
    category: "aniversario",
    date: "2025-06-15",
    time: "19:00",
    fullDate: "2025-06-15T19:00:00.000Z",
    location: "Salao de Festas",
    description: "Uma festa incrivel",
    confirmedGuests: 0,
    totalGuests: 0,
    items: [],
    guests: [],
    photos: [],
    bannerImage: undefined,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("EventEntity (Aggregate Root)", () => {
  describe("criacao", () => {
    it("deve criar evento valido", () => {
      const event = EventEntity.create(makeEventProps())
      expect(event.id).toBe("event-1")
      expect(event.title).toBe("Festa de Aniversario")
      expect(event.location).toBe("Salao de Festas")
    })

    it("deve lancar erro para titulo vazio", () => {
      expect(() => EventEntity.create(makeEventProps({ title: "" }))).toThrow("titulo e obrigatorio")
    })

    it("deve lancar erro para data vazia", () => {
      expect(() => EventEntity.create(makeEventProps({ date: "" }))).toThrow("data e obrigatoria")
    })

    it("deve lancar erro para localizacao vazia", () => {
      expect(() => EventEntity.create(makeEventProps({ location: "" }))).toThrow("localizacao e obrigatoria")
    })
  })

  describe("gestao de convidados", () => {
    it("deve adicionar convidados", () => {
      const event = EventEntity.create(makeEventProps())
      expect(event.totalGuests).toBe(0)

      event.addGuests([makeGuest({ id: "g1" }), makeGuest({ id: "g2" })])
      expect(event.totalGuests).toBe(2)
    })

    it("deve remover convidado por ID", () => {
      const guest = makeGuest({ id: "g1" })
      const event = EventEntity.create(makeEventProps({ guests: [guest] }))
      expect(event.totalGuests).toBe(1)

      event.removeGuest("g1")
      expect(event.totalGuests).toBe(0)
    })

    it("deve buscar convidado por ID", () => {
      const guest = makeGuest({ id: "g1", name: "Carlos" })
      const event = EventEntity.create(makeEventProps({ guests: [guest] }))

      const found = event.findGuest("g1")
      expect(found).toBeDefined()
      expect(found!.name).toBe("Carlos")
    })

    it("deve retornar undefined para convidado inexistente", () => {
      const event = EventEntity.create(makeEventProps())
      expect(event.findGuest("nao-existe")).toBeUndefined()
    })

    it("deve atualizar status de convidado", () => {
      const guest = makeGuest({ id: "g1" })
      const event = EventEntity.create(makeEventProps({ guests: [guest] }))

      event.updateGuestStatus("g1", "confirmed")
      const found = event.findGuest("g1")
      expect(found!.isConfirmed).toBe(true)
    })

    it("deve lancar erro ao atualizar status de convidado inexistente", () => {
      const event = EventEntity.create(makeEventProps())
      expect(() => event.updateGuestStatus("nao-existe", "confirmed")).toThrow("nao encontrado")
    })
  })

  describe("estatisticas de convidados", () => {
    it("deve contar convidados por status", () => {
      const guests = [
        makeGuest({ id: "g1", status: "confirmed" }),
        makeGuest({ id: "g2", status: "confirmed" }),
        makeGuest({ id: "g3", status: "pending" }),
        makeGuest({ id: "g4", status: "declined" }),
      ]
      const event = EventEntity.create(makeEventProps({ guests }))

      expect(event.totalGuests).toBe(4)
      expect(event.confirmedGuests).toBe(2)
      expect(event.pendingGuests).toBe(1)
      expect(event.declinedGuests).toBe(1)
    })

    it("deve calcular taxa de confirmacao", () => {
      const guests = [
        makeGuest({ id: "g1", status: "confirmed" }),
        makeGuest({ id: "g2", status: "pending" }),
      ]
      const event = EventEntity.create(makeEventProps({ guests }))

      expect(event.confirmationRate).toBe(50)
    })

    it("deve retornar 0% para evento sem convidados", () => {
      const event = EventEntity.create(makeEventProps())
      expect(event.confirmationRate).toBe(0)
    })
  })

  describe("gestao de itens/custos", () => {
    it("deve calcular custo total", () => {
      const items = [
        makeItem({ id: "i1", price: 100 }),
        makeItem({ id: "i2", price: 50.5 }),
        makeItem({ id: "i3", price: 200 }),
      ]
      const event = EventEntity.create(makeEventProps({ items }))

      expect(event.totalCost.reais).toBe(350.5)
    })

    it("deve retornar custo zero para evento sem itens", () => {
      const event = EventEntity.create(makeEventProps())
      expect(event.totalCost.isZero).toBe(true)
    })

    it("deve calcular custo por pessoa", () => {
      const items = [makeItem({ id: "i1", price: 300 })]
      const guests = [
        makeGuest({ id: "g1", status: "confirmed" }),
        makeGuest({ id: "g2", status: "confirmed" }),
        makeGuest({ id: "g3", status: "pending" }),
      ]
      const event = EventEntity.create(makeEventProps({ items, guests }))

      expect(event.costPerPerson.reais).toBe(150)
    })

    it("deve retornar custo zero por pessoa quando nenhum convidado confirmado", () => {
      const items = [makeItem({ id: "i1", price: 300 })]
      const guests = [makeGuest({ id: "g1", status: "pending" })]
      const event = EventEntity.create(makeEventProps({ items, guests }))

      expect(event.costPerPerson.isZero).toBe(true)
    })

    it("deve adicionar item", () => {
      const event = EventEntity.create(makeEventProps())
      expect(event.items.length).toBe(0)

      event.addItem(makeItem({ id: "new-item" }))
      expect(event.items.length).toBe(1)
    })

    it("deve remover item", () => {
      const event = EventEntity.create(makeEventProps({ items: [makeItem({ id: "i1" })] }))
      expect(event.items.length).toBe(1)

      event.removeItem("i1")
      expect(event.items.length).toBe(0)
    })

    it("deve buscar item por ID", () => {
      const item = makeItem({ id: "i1", name: "Bolo" })
      const event = EventEntity.create(makeEventProps({ items: [item] }))

      const found = event.findItem("i1")
      expect(found).toBeDefined()
      expect(found!.name).toBe("Bolo")
    })
  })

  describe("tipo de evento", () => {
    it("deve identificar evento colaborativo", () => {
      const event = EventEntity.create(makeEventProps({ type: "Colaborativo" }))
      expect(event.isCollaborative).toBe(true)
    })

    it("deve identificar evento nao-colaborativo", () => {
      const event = EventEntity.create(makeEventProps({ type: "Individual" }))
      expect(event.isCollaborative).toBe(false)
    })
  })

  describe("gestao de fotos", () => {
    it("deve adicionar foto", () => {
      const event = EventEntity.create(makeEventProps())
      expect(event.photos.length).toBe(0)

      event.addPhoto({
        url: "https://example.com/photo.jpg",
        filename: "photo.jpg",
        uploadedBy: "user-1",
      })
      expect(event.photos.length).toBe(1)
      expect(event.photos[0].url).toBe("https://example.com/photo.jpg")
    })

    it("deve remover foto", () => {
      const event = EventEntity.create(
        makeEventProps({
          photos: [
            {
              id: "photo-1",
              url: "https://example.com/photo.jpg",
              filename: "photo.jpg",
              uploadedBy: "user-1",
              uploadedAt: "2025-01-01T00:00:00.000Z",
            },
          ],
        })
      )
      expect(event.photos.length).toBe(1)

      event.removePhoto("photo-1")
      expect(event.photos.length).toBe(0)
    })
  })

  describe("serializacao", () => {
    it("deve serializar para plain object com contagens corretas", () => {
      const guests = [
        makeGuest({ id: "g1", status: "confirmed" }),
        makeGuest({ id: "g2", status: "pending" }),
      ]
      const items = [makeItem({ id: "i1", price: 100 })]
      const event = EventEntity.create(makeEventProps({ guests, items }))
      const plain = event.toPlainObject()

      expect(plain.totalGuests).toBe(2)
      expect(plain.confirmedGuests).toBe(1)
      expect(plain.items).toHaveLength(1)
      expect(plain.guests).toHaveLength(2)
    })

    it("deve retornar copias defensivas de guests e items", () => {
      const event = EventEntity.create(
        makeEventProps({ guests: [makeGuest({ id: "g1" })] })
      )
      const guestsArray = event.guests
      expect(guestsArray).toHaveLength(1)
      // Modifying the returned array should not affect the entity
      guestsArray.length = 0
      expect(event.guests).toHaveLength(1)
    })
  })
})

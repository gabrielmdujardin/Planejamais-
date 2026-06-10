"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Person {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  price: number
  assignedTo: Person[] | null
  image?: string | null
  category?: string
  description?: string
  quantity?: number
  unitPrice?: number
  estimatedCost?: number
  actualCost?: number
  paymentStatus?: string
  notes?: string
}

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  status: "confirmed" | "pending" | "declined" | "awaiting_approval" | "pending_approval" | "rejected"
  contactId?: string
  companions?: Array<{
    id: string
    name: string
    status: "pending" | "approved" | "rejected"
  }>
}

interface EventPhoto {
  id: string
  url: string
  filename: string
  uploadedBy: string
  uploadedAt: string
  description?: string
  tags?: string[]
}

interface Event {
  id: string
  title: string
  type: string
  category?: string
  status?: "draft" | "active" | "completed" | "canceled" | string
  visibility?: "private" | "public" | string
  date: string
  time: string
  fullDate?: string
  startDate?: string | null
  startTime?: string | null
  endDate?: string | null
  endTime?: string | null
  location: string
  address?: string | null
  mapsUrl?: string | null
  eventMode?: "presencial" | "online" | "hibrido" | string
  meetingUrl?: string | null
  description: string
  capacity?: number | null
  allowGuests?: boolean
  allowCompanions?: boolean
  maxCompanionsPerGuest?: number
  companionsRequireApproval?: boolean
  publicInviteEnabled?: boolean
  publicInviteToken?: string | null
  autoApprovePublicGuests?: boolean
  rsvpEnabled?: boolean
  rsvpDeadline?: string | null
  allowDecline?: boolean
  allowResponseEdit?: boolean
  invitationMessage?: string | null
  budgetEstimated?: number | null
  initialEstimatedCost?: number | null
  currency?: string
  financialNotes?: string | null
  confirmedGuests: number
  totalGuests: number
  items: Item[]
  guests: Guest[]
  photos: EventPhoto[]
  createdAt: string
  updatedAt: string
}

interface EventStore {
  events: Event[]
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  updateEvent: (id: string, event: Partial<Event>) => void
  removeEvent: (id: string) => void
  getEventById: (id: string) => Event | undefined

  // Itens
  addItem: (eventId: string, item: Item) => void
  updateItem: (eventId: string, itemId: string, item: Item) => void
  removeItem: (eventId: string, itemId: string) => void

  // Convidados
  addGuests: (eventId: string, guests: Guest[]) => void
  updateGuest: (eventId: string, guestId: string, guest: Partial<Guest>) => void
  removeGuest: (eventId: string, guestId: string) => void
  updateGuestStatus: (eventId: string, guestId: string, status: Guest["status"]) => void
  getGuestById: (eventId: string, guestId: string) => Guest | undefined

  // Fotos
  addPhoto: (eventId: string, photo: Omit<EventPhoto, "id" | "uploadedAt">) => void
  removePhoto: (eventId: string, photoId: string) => void
  updatePhoto: (eventId: string, photoId: string, updates: Partial<EventPhoto>) => void
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [
        {
          id: "1",
          title: "Churrasco na Casa do João",
          type: "Colaborativo",
          category: "Aniversário",
          status: "active",
          date: "Sábado, 15 de Junho",
          time: "16:00",
          fullDate: "15/06/2024",
          startDate: "2024-06-15",
          startTime: "16:00",
          endDate: "2024-06-15",
          endTime: "22:00",
          location: "Rua das Flores, 123 - São Paulo, SP",
          address: "Rua das Flores, 123 - São Paulo, SP",
          eventMode: "presencial",
          description: "Traga sua bebida favorita! Vamos comemorar o aniversário do João com um churrasco incrível.",
          capacity: 25,
          allowGuests: true,
          allowCompanions: true,
          maxCompanionsPerGuest: 1,
          companionsRequireApproval: true,
          publicInviteEnabled: true,
          publicInviteToken: "demo-churrasco",
          autoApprovePublicGuests: false,
          rsvpEnabled: true,
          budgetEstimated: 700,
          initialEstimatedCost: 370,
          currency: "BRL",
          confirmedGuests: 12,
          totalGuests: 15,
          items: [
            {
              id: "1",
              name: "Carne (5kg)",
              price: 150,
              category: "Alimentos",
              quantity: 5,
              unitPrice: 30,
              estimatedCost: 150,
              assignedTo: [{ id: "p1", name: "João" }],
              image: null,
            },
            {
              id: "2",
              name: "Carvão",
              price: 25,
              category: "Estrutura",
              quantity: 1,
              unitPrice: 25,
              estimatedCost: 25,
              assignedTo: [{ id: "p2", name: "Maria" }],
              image: null,
            },
            {
              id: "3",
              name: "Bebidas",
              price: 120,
              assignedTo: null,
              image: null,
            },
            {
              id: "4",
              name: "Pão de alho",
              price: 30,
              assignedTo: [{ id: "p3", name: "Pedro" }],
              image: null,
            },
            {
              id: "5",
              name: "Descartáveis",
              price: 45,
              assignedTo: null,
              image: null,
            },
          ],
          guests: [
            {
              id: "1",
              name: "João Silva",
              status: "confirmed",
              email: "joao@example.com",
              phone: "(11) 98765-4321",
              contactId: "contact_1",
            },
            {
              id: "2",
              name: "Maria Oliveira",
              status: "confirmed",
              email: "maria@example.com",
              phone: "(11) 91234-5678",
              contactId: "contact_2",
            },
            {
              id: "3",
              name: "Pedro Santos",
              status: "confirmed",
              email: "pedro@example.com",
              phone: "(11) 99876-5432",
              contactId: "contact_3",
            },
            {
              id: "4",
              name: "Ana Costa",
              status: "pending",
              email: "ana@example.com",
              phone: "(11) 95555-4444",
              contactId: "contact_4",
            },
            {
              id: "5",
              name: "Lucas Ferreira",
              status: "declined",
              email: "lucas@example.com",
              phone: "(11) 93333-2222",
              contactId: "contact_5",
            },
          ],
          photos: [
            {
              id: "photo_1",
              url: "/placeholder.svg?height=300&width=400&text=Churrasco+1",
              filename: "churrasco_1.jpg",
              uploadedBy: "João Silva",
              uploadedAt: "2024-06-15T18:30:00Z",
              description: "Início do churrasco",
              tags: ["churrasco", "amigos"],
            },
            {
              id: "photo_2",
              url: "/placeholder.svg?height=300&width=400&text=Churrasco+2",
              filename: "churrasco_2.jpg",
              uploadedBy: "Maria Oliveira",
              uploadedAt: "2024-06-15T19:15:00Z",
              description: "Galera reunida",
              tags: ["grupo", "diversão"],
            },
          ],
          createdAt: "2024-06-10T10:00:00Z",
          updatedAt: "2024-06-15T20:00:00Z",
        },
        {
          id: "2",
          title: "Aniversário da Maria",
          type: "Festa",
          category: "Festa de Aniversário",
          status: "active",
          date: "Domingo, 23 de Junho",
          time: "14:00",
          fullDate: "23/06/2024",
          startDate: "2024-06-23",
          startTime: "14:00",
          endDate: "2024-06-23",
          endTime: "18:00",
          location: "Salão de Festas Primavera - Av. Principal, 500",
          address: "Salão de Festas Primavera - Av. Principal, 500",
          eventMode: "presencial",
          description: "Venha celebrar o aniversário da Maria com muita diversão e alegria!",
          capacity: 40,
          allowGuests: true,
          allowCompanions: false,
          maxCompanionsPerGuest: 0,
          companionsRequireApproval: true,
          publicInviteEnabled: false,
          autoApprovePublicGuests: false,
          rsvpEnabled: true,
          budgetEstimated: 1200,
          currency: "BRL",
          confirmedGuests: 8,
          totalGuests: 20,
          items: [],
          guests: [
            {
              id: "1",
              name: "João Silva",
              status: "confirmed",
              email: "joao@example.com",
              phone: "(11) 98765-4321",
              contactId: "contact_1",
            },
            {
              id: "2",
              name: "Pedro Santos",
              status: "confirmed",
              email: "pedro@example.com",
              phone: "(11) 99876-5432",
              contactId: "contact_3",
            },
            {
              id: "3",
              name: "Ana Costa",
              status: "pending",
              email: "ana@example.com",
              phone: "(11) 95555-4444",
              contactId: "contact_4",
            },
          ],
          photos: [],
          createdAt: "2024-06-18T14:00:00Z",
          updatedAt: "2024-06-18T14:00:00Z",
        },
      ],

      setEvents: (events) =>
        set(() => ({
          events,
        })),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),

      updateEvent: (id, updatedEvent) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updatedEvent, updatedAt: new Date().toISOString() } : event,
          ),
        })),

      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),

      getEventById: (id) => {
        return get().events.find((event) => event.id === id)
      },

      // Itens
      addItem: (eventId, item) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  items: [...(event.items || []), item],
                  updatedAt: new Date().toISOString(),
                }
              : event,
          ),
        })),

      updateItem: (eventId, itemId, updatedItem) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  items: event.items.map((item) => (item.id === itemId ? updatedItem : item)),
                  updatedAt: new Date().toISOString(),
                }
              : event,
          ),
        })),

      removeItem: (eventId, itemId) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  items: event.items.filter((item) => item.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : event,
          ),
        })),

      // Convidados
      addGuests: (eventId, newGuests) =>
        set((state) => {
          const event = state.events.find((e) => e.id === eventId)
          if (!event) return state

          return {
            events: state.events.map((event) =>
              event.id === eventId
                ? {
                    ...event,
                    guests: [...(event.guests || []), ...newGuests],
                    totalGuests: (event.totalGuests || 0) + newGuests.length,
                    updatedAt: new Date().toISOString(),
                  }
                : event,
            ),
          }
        }),

      updateGuest: (eventId, guestId, updatedGuest) =>
        set((state) => {
          const event = state.events.find((e) => e.id === eventId)
          if (!event) return state

          const oldGuest = event.guests.find((g) => g.id === guestId)
          let confirmedDelta = 0

          const nextGuest = oldGuest ? { ...oldGuest, ...updatedGuest } : null

          if (oldGuest && nextGuest && oldGuest.status !== nextGuest.status) {
            if (oldGuest.status === "confirmed" && nextGuest.status !== "confirmed") {
              confirmedDelta = -1
            } else if (oldGuest.status !== "confirmed" && nextGuest.status === "confirmed") {
              confirmedDelta = 1
            }
          }

          return {
            events: state.events.map((event) =>
              event.id === eventId
                ? {
                    ...event,
                    guests: event.guests.map((guest) => (guest.id === guestId ? { ...guest, ...updatedGuest } : guest)),
                    confirmedGuests: event.confirmedGuests + confirmedDelta,
                    updatedAt: new Date().toISOString(),
                  }
                : event,
            ),
          }
        }),

      updateGuestStatus: (eventId, guestId, status) => {
        const { updateGuest, getEventById } = get()
        const event = getEventById(eventId)
        const guest = event?.guests.find((g) => g.id === guestId)

        if (guest) {
          updateGuest(eventId, guestId, { ...guest, status })
        }
      },

      getGuestById: (eventId, guestId) => {
        const event = get().events.find((e) => e.id === eventId)
        return event?.guests.find((g) => g.id === guestId)
      },

      removeGuest: (eventId, guestId) =>
        set((state) => {
          const event = state.events.find((e) => e.id === eventId)
          if (!event) return state

          const guest = event.guests.find((g) => g.id === guestId)
          const confirmedDelta = guest && guest.status === "confirmed" ? -1 : 0

          return {
            events: state.events.map((event) =>
              event.id === eventId
                ? {
                    ...event,
                    guests: event.guests.filter((guest) => guest.id !== guestId),
                    totalGuests: event.totalGuests - 1,
                    confirmedGuests: event.confirmedGuests + confirmedDelta,
                    updatedAt: new Date().toISOString(),
                  }
                : event,
            ),
          }
        }),

      // Fotos
      addPhoto: (eventId, photoData) =>
        set((state) => {
          const newPhoto: EventPhoto = {
            ...photoData,
            id: `photo_${Date.now()}`,
            uploadedAt: new Date().toISOString(),
          }

          return {
            events: state.events.map((event) =>
              event.id === eventId
                ? {
                    ...event,
                    photos: [...(event.photos || []), newPhoto],
                    updatedAt: new Date().toISOString(),
                  }
                : event,
            ),
          }
        }),

      removePhoto: (eventId, photoId) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  photos: (event.photos || []).filter((photo) => photo.id !== photoId),
                  updatedAt: new Date().toISOString(),
                }
              : event,
          ),
        })),

      updatePhoto: (eventId, photoId, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  photos: (event.photos || []).map((photo) =>
                    photo.id === photoId ? { ...photo, ...updates } : photo,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : event,
          ),
        })),
    }),
    {
      name: "event-storage",
    },
  ),
)

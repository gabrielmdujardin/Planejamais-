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
}

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  status: "confirmed" | "pending" | "declined"
  contactId?: string
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
  date: string
  time: string
  fullDate?: string
  location: string
  description: string
  confirmedGuests: number
  totalGuests: number
  items: Item[]
  guests: Guest[]
  photos: EventPhoto[]
  bannerImage?: string
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
  updateGuest: (eventId: string, guestId: string, guest: Guest) => void
  removeGuest: (eventId: string, guestId: string) => void
  updateGuestStatus: (eventId: string, guestId: string, status: "confirmed" | "pending" | "declined") => void

  // Fotos
  addPhoto: (eventId: string, photo: Omit<EventPhoto, "id" | "uploadedAt">) => void
  removePhoto: (eventId: string, photoId: string) => void
  updatePhoto: (eventId: string, photoId: string, updates: Partial<EventPhoto>) => void
}

const SAMPLE_EVENTS: Event[] = [
  {
    id: "1",
    title: "Casamento Maria & João",
    type: "Casamento",
    category: "Social",
    date: "2025-03-15",
    time: "18:00",
    location: "Espaço Jardim das Flores",
    description: "Cerimônia e recepção",
    confirmedGuests: 120,
    totalGuests: 150,
    items: [
      { id: "i1", name: "Buffet", price: 15000, assignedTo: null },
      { id: "i2", name: "Decoração", price: 8000, assignedTo: null },
      { id: "i3", name: "Fotografia", price: 5000, assignedTo: null },
    ],
    guests: Array.from({ length: 150 }, (_, i) => ({
      id: `g1-${i}`,
      name: `Convidado ${i + 1}`,
      email: `convidado${i + 1}@email.com`,
      phone: `(11) 9${String(i).padStart(4, "0")}-0000`,
      status: i < 120 ? "confirmed" : i < 140 ? "pending" : ("declined" as const),
    })),
    photos: [],
    bannerImage: "https://example.com/banner1.jpg",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "2",
    title: "Aniversário 15 Anos Ana",
    type: "Aniversário",
    category: "Celebração",
    date: "2025-04-20",
    time: "20:00",
    location: "Salão de Festas Premium",
    description: "Festa de 15 anos",
    confirmedGuests: 80,
    totalGuests: 100,
    items: [
      { id: "i4", name: "Buffet", price: 8000, assignedTo: null },
      { id: "i5", name: "DJ", price: 2000, assignedTo: null },
      { id: "i6", name: "Decoração", price: 4000, assignedTo: null },
    ],
    guests: Array.from({ length: 100 }, (_, i) => ({
      id: `g2-${i}`,
      name: `Convidado ${i + 1}`,
      email: `convidado${i + 1}@email.com`,
      phone: `(11) 9${String(i).padStart(4, "0")}-0000`,
      status: i < 80 ? "confirmed" : i < 90 ? "pending" : ("declined" as const),
    })),
    photos: [],
    bannerImage: "https://example.com/banner2.jpg",
    createdAt: "2025-01-15T14:00:00Z",
    updatedAt: "2025-01-15T14:00:00Z",
  },
  {
    id: "3",
    title: "Evento Corporativo Tech Summit",
    type: "Corporativo",
    category: "Profissional",
    date: "2025-05-10",
    time: "09:00",
    location: "Centro de Convenções",
    description: "Conferência de tecnologia",
    confirmedGuests: 200,
    totalGuests: 250,
    items: [
      { id: "i7", name: "Coffee Break", price: 5000, assignedTo: null },
      { id: "i8", name: "Equipamentos AV", price: 3000, assignedTo: null },
      { id: "i9", name: "Material Gráfico", price: 2000, assignedTo: null },
    ],
    guests: Array.from({ length: 250 }, (_, i) => ({
      id: `g3-${i}`,
      name: `Participante ${i + 1}`,
      email: `participante${i + 1}@empresa.com`,
      phone: `(11) 9${String(i).padStart(4, "0")}-0000`,
      status: i < 200 ? "confirmed" : i < 230 ? "pending" : ("declined" as const),
    })),
    photos: [],
    bannerImage: "https://example.com/banner3.jpg",
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-01T09:00:00Z",
  },
  {
    id: "4",
    title: "Formatura Turma 2025",
    type: "Formatura",
    category: "Acadêmico",
    date: "2025-06-25",
    time: "19:00",
    location: "Teatro Municipal",
    description: "Cerimônia de formatura",
    confirmedGuests: 180,
    totalGuests: 200,
    items: [
      { id: "i10", name: "Buffet", price: 12000, assignedTo: null },
      { id: "i11", name: "Fotografia", price: 4000, assignedTo: null },
      { id: "i12", name: "Decoração", price: 6000, assignedTo: null },
    ],
    guests: Array.from({ length: 200 }, (_, i) => ({
      id: `g4-${i}`,
      name: `Formando ${i + 1}`,
      email: `formando${i + 1}@universidade.edu`,
      phone: `(11) 9${String(i).padStart(4, "0")}-0000`,
      status: i < 180 ? "confirmed" : i < 195 ? "pending" : ("declined" as const),
    })),
    photos: [],
    bannerImage: "https://example.com/banner4.jpg",
    createdAt: "2025-02-10T11:00:00Z",
    updatedAt: "2025-02-10T11:00:00Z",
  },
  {
    id: "5",
    title: "Chá de Bebê Beatriz",
    type: "Chá de Bebê",
    category: "Celebração",
    date: "2025-03-30",
    time: "15:00",
    location: "Casa de Festas Infantil",
    description: "Chá revelação",
    confirmedGuests: 50,
    totalGuests: 60,
    items: [
      { id: "i13", name: "Decoração", price: 3000, assignedTo: null },
      { id: "i14", name: "Buffet", price: 4000, assignedTo: null },
      { id: "i15", name: "Lembrancinhas", price: 1000, assignedTo: null },
    ],
    guests: Array.from({ length: 60 }, (_, i) => ({
      id: `g5-${i}`,
      name: `Convidado ${i + 1}`,
      email: `convidado${i + 1}@email.com`,
      phone: `(11) 9${String(i).padStart(4, "0")}-0000`,
      status: i < 50 ? "confirmed" : i < 55 ? "pending" : ("declined" as const),
    })),
    photos: [],
    bannerImage: "https://example.com/banner5.jpg",
    createdAt: "2025-01-20T16:00:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
  },
]

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: SAMPLE_EVENTS,

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

          if (oldGuest && oldGuest.status !== updatedGuest.status) {
            if (oldGuest.status === "confirmed" && updatedGuest.status !== "confirmed") {
              confirmedDelta = -1
            } else if (oldGuest.status !== "confirmed" && updatedGuest.status === "confirmed") {
              confirmedDelta = 1
            }
          }

          return {
            events: state.events.map((event) =>
              event.id === eventId
                ? {
                    ...event,
                    guests: event.guests.map((guest) => (guest.id === guestId ? updatedGuest : guest)),
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

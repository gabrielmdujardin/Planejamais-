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
  paymentStatus?: "estimated" | "pending" | "partial" | "paid" | string
  supplier?: string
  dueDate?: string
  invoiceNumber?: string
  notes?: string
}

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  status: "confirmed" | "pending" | "declined" | "awaiting_approval" | "pending_approval" | "rejected"
  contactId?: string
  department?: string
  tableNumber?: string
  dietaryRestrictions?: string
  accessibilityNeeds?: string
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
  financialMode?: "corporate_budget" | "collaborative_split"
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
      events: [],
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
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<EventStore> | undefined

        return {
          ...currentState,
          ...persisted,
          events: persisted?.events ?? currentState.events,
        }
      },
    },
  ),
)

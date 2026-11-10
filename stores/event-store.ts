"use client"

import { calculateConfirmedParticipants, filterEffectiveGuests } from "@/lib/domain/business-rules"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Person {
  id?: string
  name: string
  type?: "guest" | "contact" | "manual" | "custom" | string
}

export interface Item {
  id: string
  name: string
  price: number
  assignedTo?: Person | Person[] | null
  image?: string | null
  category?: string
  description?: string
  quantity?: number
  unitPrice?: number
  estimatedCost?: number
  actualCost?: number
  paymentStatus?: "estimated" | "pending" | "partial" | "paid" | "cancelled" | string
  supplier?: string
  dueDate?: string
  invoiceNumber?: string
  notes?: string
}

export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  status:
    | "confirmed"
    | "pending"
    | "declined"
    | "awaiting_approval"
    | "expired"
    | "cancelled"
    | "pending_approval"
    | "rejected"
  source?: "manual" | "public_request" | "public_invite" | string
  contactId?: string
  token?: string
  notes?: string
  department?: string
  tableNumber?: string
  dietaryRestrictions?: string
  accessibilityNeeds?: string
  companions?: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    notes?: string
    status: "pending" | "awaiting_approval" | "approved" | "rejected" | "cancelled"
  }>
}

export interface EventPhoto {
  id: string
  url: string
  filename: string
  uploadedBy: string
  uploadedAt: string
  description?: string
  tags?: string[]
}

export interface Event {
  id: string
  title: string
  type: string
  category?: string
  status?: "draft" | "active" | "completed" | "canceled" | string
  visibility?: "private" | "public" | string
  financialMode?: "corporate_budget" | "collaborative_split"
  image?: string | null
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
  eventMode?: "presential" | "presencial" | "online" | "hybrid" | "hibrido" | string
  meetingUrl?: string | null
  description: string
  capacity?: number | null
  allowGuests?: boolean
  allowCompanions?: boolean
  maxCompanionsPerGuest?: number
  companionsRequireApproval?: boolean
  publicInviteEnabled?: boolean
  publicInviteToken?: string | null
  hostViewEnabled?: boolean
  hostViewToken?: string | null
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

function syncEventGuestMetrics(guests: Guest[]) {
  const effective = filterEffectiveGuests(guests)
  return {
    guests: effective,
    totalGuests: effective.length,
    confirmedGuests: calculateConfirmedParticipants(effective),
  }
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
  addPhoto: (eventId: string, photo: Omit<EventPhoto, "id" | "uploadedAt"> & { id?: string; uploadedAt?: string }) => void
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
          events: [event, ...state.events.filter((e) => e.id !== event.id)],
        })),

      updateEvent: (id, updatedEvent) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updatedEvent, updatedAt: new Date().toISOString() } : event
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
              : event
          ),
        })),

      updateItem: (eventId, itemId, updatedItem) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  items: (event.items || []).map((item) => (item.id === itemId ? updatedItem : item)),
                  updatedAt: new Date().toISOString(),
                }
              : event
          ),
        })),

      removeItem: (eventId, itemId) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  items: (event.items || []).filter((item) => item.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : event
          ),
        })),

      // Convidados
      addGuests: (eventId, newGuests) =>
        set((state) => {
          return {
            events: state.events.map((event) => {
              if (event.id !== eventId) return event
              const combined = [...(event.guests || []), ...newGuests]
              const metrics = syncEventGuestMetrics(combined)
              return {
                ...event,
                ...metrics,
                updatedAt: new Date().toISOString(),
              }
            }),
          }
        }),

      updateGuest: (eventId, guestId, updatedGuest) =>
        set((state) => {
          return {
            events: state.events.map((event) => {
              if (event.id !== eventId) return event
              const nextGuests = (event.guests || []).map((guest) =>
                guest.id === guestId ? { ...guest, ...updatedGuest } : guest
              )
              const metrics = syncEventGuestMetrics(nextGuests)
              return {
                ...event,
                ...metrics,
                updatedAt: new Date().toISOString(),
              }
            }),
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
          return {
            events: state.events.map((event) => {
              if (event.id !== eventId) return event
              const nextGuests = (event.guests || []).filter((guest) => guest.id !== guestId)
              const metrics = syncEventGuestMetrics(nextGuests)
              return {
                ...event,
                ...metrics,
                updatedAt: new Date().toISOString(),
              }
            }),
          }
        }),

      // Fotos
      addPhoto: (eventId, photoData) =>
        set((state) => {
          const newPhoto: EventPhoto = {
            ...photoData,
            id: photoData.id || `photo_${Date.now()}`,
            uploadedAt: photoData.uploadedAt || new Date().toISOString(),
          }

          return {
            events: state.events.map((event) =>
              event.id === eventId
                ? {
                    ...event,
                    photos: [...(event.photos || []), newPhoto],
                    updatedAt: new Date().toISOString(),
                  }
                : event
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
              : event
          ),
        })),

      updatePhoto: (eventId, photoId, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  photos: (event.photos || []).map((photo) =>
                    photo.id === photoId ? { ...photo, ...updates } : photo
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : event
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
    }
  )
)

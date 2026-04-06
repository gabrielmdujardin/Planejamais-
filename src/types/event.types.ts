/**
 * Tipos relacionados a eventos
 */

export interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  type: EventType
  status: EventStatus
  image?: string
  guests?: Guest[]
  items?: EventItem[]
  createdAt?: string
  updatedAt?: string
  userId?: string
}

export type EventType =
  | "Casamento"
  | "Aniversário"
  | "Corporativo"
  | "Formatura"
  | "Chá de Bebê"
  | "Colaborativo"
  | "festa"
  | "trabalho"
  | "família"

export type EventStatus = "confirmed" | "pending" | "cancelled"

export interface Guest {
  id: string
  name: string
  email?: string
  phone?: string
  status: GuestStatus
  confirmedAt?: string
}

export type GuestStatus = "confirmed" | "pending" | "declined"

export interface EventItem {
  id: string
  name: string
  quantity: number
  assignedTo?: string
  status: ItemStatus
}

export type ItemStatus = "pending" | "assigned" | "completed"

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    location: string
    description: string
    type: string
    status: EventStatus
    originalDate: string
    originalTime: string
  }
}

export interface EventTheme {
  primary: string
  secondary: string
  accent: string
  gradient: string
  textColor: string
}

export interface CreateEventInput {
  title: string
  date: string
  time: string
  location: string
  description: string
  type: EventType
  image?: string
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string
  status?: EventStatus
}

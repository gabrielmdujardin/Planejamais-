/**
 * Tipos relacionados a convidados e acompanhantes
 */

export type GuestStatus =
  | "awaiting_approval" // Aguardando aprovação do admin
  | "pending" // Aprovado, aguardando confirmação
  | "confirmed" // Presença confirmada
  | "declined" // Recusado (pelo admin ou pelo próprio convidado)
  | "expired" // Prazo expirado
  | "cancelled" // Cancelado

export type CompanionStatus =
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "cancelled"

export type GuestSource = "manual" | "public_request" | "public_invite"

export interface Companion {
  id: string
  guestId: string
  name: string
  email?: string
  phone?: string
  notes?: string
  status: CompanionStatus
  approvedBy?: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface Guest {
  id: string
  eventId: string
  name: string
  email: string
  phone: string
  status: GuestStatus
  token?: string
  confirmationDeadline?: string
  sentAt?: string
  respondedAt?: string
  notes?: string
  dietaryRestrictions?: string
  accessibilityNeeds?: string
  source: GuestSource
  requestedCompanionsCount: number
  companions?: Companion[]
  createdAt: string
  updatedAt: string
}

export interface PublicRequestInput {
  eventId: string
  name: string
  email: string
  phone: string
  notes?: string
  dietaryRestrictions?: string
  accessibilityNeeds?: string
  companions?: CompanionInput[]
}

export interface CompanionInput {
  name: string
  email?: string
  phone?: string
  notes?: string
}

export interface ApproveGuestInput {
  guestId: string
  approvedCompanionIds?: string[]
  rejectedCompanionIds?: string[]
  confirmationDeadlineDays?: number
}

export interface RejectGuestInput {
  guestId: string
  reason?: string
}

export interface GuestWithCompanions extends Guest {
  companions: Companion[]
  event?: {
    id: string
    title: string
    date: string
    time: string
    location: string
  }
}

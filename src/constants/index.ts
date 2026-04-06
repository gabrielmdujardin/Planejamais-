/**
 * Constantes da aplicação
 */

export const APP_NAME = "Planeja+"
export const APP_DESCRIPTION = "Plataforma para organização de eventos colaborativos"

// Tipos de eventos disponíveis
export const EVENT_TYPES = [
  "Casamento",
  "Aniversário",
  "Corporativo",
  "Formatura",
  "Chá de Bebê",
  "Colaborativo",
] as const

// Status de eventos
export const EVENT_STATUS = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  CANCELLED: "cancelled",
} as const

// Status de convidados
export const GUEST_STATUS = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  DECLINED: "declined",
} as const

// Mensagens do calendário em português
export const CALENDAR_MESSAGES = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há eventos neste período.",
  showMore: (total: number) => `+ Ver mais (${total})`,
} as const

// Rotas da aplicação
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  CALENDAR: "/calendar",
  PROFILE: "/profile",
  CREATE_EVENT: "/create-event",
  EVENT: (id: string) => `/event/${id}`,
  CONTACTS: "/contacts",
  ABOUT: "/about",
  PRICING: "/pricing",
} as const

// Rotas públicas (não requerem autenticação)
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/about",
  "/pricing",
  "/confirm-invitation",
] as const

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

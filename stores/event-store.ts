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

function mergeEventsWithDemoData(storedEvents: Event[] | undefined, demoEvents: Event[]) {
  if (!storedEvents || storedEvents.length === 0) return demoEvents

  const storedIds = new Set(storedEvents.map((event) => event.id))
  const missingDemoEvents = demoEvents.filter((event) => !storedIds.has(event.id))

  return [...storedEvents, ...missingDemoEvents]
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
        {
          id: "3",
          title: "Workshop de Planejamento Financeiro",
          type: "Corporativo",
          category: "Treinamento",
          status: "active",
          date: "Quarta, 10 de Julho",
          time: "09:00",
          fullDate: "10/07/2024",
          startDate: "2024-07-10",
          startTime: "09:00",
          endDate: "2024-07-10",
          endTime: "17:00",
          location: "Auditório Inova Center - Sao Paulo, SP",
          address: "Av. Paulista, 1000 - Sao Paulo, SP",
          eventMode: "presencial",
          description: "Workshop corporativo com trilhas de orcamento, metas e gestao de fornecedores.",
          capacity: 80,
          allowGuests: true,
          allowCompanions: false,
          maxCompanionsPerGuest: 0,
          companionsRequireApproval: false,
          publicInviteEnabled: false,
          autoApprovePublicGuests: false,
          rsvpEnabled: true,
          budgetEstimated: 6800,
          initialEstimatedCost: 5650,
          currency: "BRL",
          financialNotes: "Catering e material grafico concentrando a maior parte do custo.",
          confirmedGuests: 18,
          totalGuests: 30,
          items: [
            {
              id: "w1",
              name: "Coffee break",
              price: 2100,
              category: "Alimentos",
              quantity: 1,
              estimatedCost: 2100,
              assignedTo: [{ id: "p4", name: "Carla" }],
              image: null,
            },
            {
              id: "w2",
              name: "Material impresso",
              price: 850,
              category: "Materiais",
              quantity: 80,
              estimatedCost: 850,
              assignedTo: [{ id: "p5", name: "Renato" }],
              image: null,
            },
            {
              id: "w3",
              name: "Palestrante convidado",
              price: 2700,
              category: "Servicos",
              quantity: 1,
              estimatedCost: 2700,
              assignedTo: null,
              image: null,
            },
          ],
          guests: [
            { id: "w-g1", name: "Carla Ramos", status: "confirmed", email: "carla@example.com", phone: "(11) 90000-0001" },
            { id: "w-g2", name: "Renato Lima", status: "confirmed", email: "renato@example.com", phone: "(11) 90000-0002" },
            { id: "w-g3", name: "Bianca Souza", status: "confirmed", email: "bianca@example.com", phone: "(11) 90000-0003" },
            { id: "w-g4", name: "Marcos Freitas", status: "pending", email: "marcos@example.com", phone: "(11) 90000-0004" },
            { id: "w-g5", name: "Helena Costa", status: "pending", email: "helena@example.com", phone: "(11) 90000-0005" },
            { id: "w-g6", name: "Igor Martins", status: "declined", email: "igor@example.com", phone: "(11) 90000-0006" },
          ],
          photos: [
            {
              id: "w-photo-1",
              url: "/placeholder.svg?height=300&width=400&text=Workshop",
              filename: "workshop.jpg",
              uploadedBy: "Carla Ramos",
              uploadedAt: "2024-07-10T12:00:00Z",
              description: "Sala principal do workshop",
              tags: ["corporativo", "workshop"],
            },
          ],
          createdAt: "2024-06-20T09:00:00Z",
          updatedAt: "2024-06-25T11:30:00Z",
        },
        {
          id: "4",
          title: "Casamento Ana e Bruno",
          type: "Casamento",
          category: "Cerimonia",
          status: "active",
          date: "Sabado, 24 de Agosto",
          time: "17:30",
          fullDate: "24/08/2024",
          startDate: "2024-08-24",
          startTime: "17:30",
          endDate: "2024-08-25",
          endTime: "02:00",
          location: "Espaco Villa Jardim - Campinas, SP",
          address: "Rodovia dos Eventos, km 12 - Campinas, SP",
          eventMode: "presencial",
          description: "Cerimonia e festa com controle de RSVP, acompanhantes e custos de recepcao.",
          capacity: 150,
          allowGuests: true,
          allowCompanions: true,
          maxCompanionsPerGuest: 1,
          companionsRequireApproval: true,
          publicInviteEnabled: true,
          publicInviteToken: "ana-bruno-2024",
          autoApprovePublicGuests: false,
          rsvpEnabled: true,
          budgetEstimated: 42000,
          initialEstimatedCost: 38200,
          currency: "BRL",
          confirmedGuests: 4,
          totalGuests: 10,
          items: [
            { id: "c1", name: "Buffet completo", price: 24000, category: "Alimentos", quantity: 120, estimatedCost: 24000, assignedTo: null, image: null },
            { id: "c2", name: "Decoracao floral", price: 6200, category: "Decoracao", quantity: 1, estimatedCost: 6200, assignedTo: [{ id: "p6", name: "Ana" }], image: null },
            { id: "c3", name: "DJ e iluminacao", price: 4800, category: "Entretenimento", quantity: 1, estimatedCost: 4800, assignedTo: [{ id: "p7", name: "Bruno" }], image: null },
            { id: "c4", name: "Fotografia", price: 3200, category: "Servicos", quantity: 1, estimatedCost: 3200, assignedTo: null, image: null },
          ],
          guests: [
            { id: "c-g1", name: "Livia Pereira", status: "confirmed", email: "livia@example.com", phone: "(19) 90000-0001", companions: [{ id: "c-a1", name: "Rafael", status: "approved" }] },
            { id: "c-g2", name: "Rafael Pereira", status: "confirmed", email: "rafael@example.com", phone: "(19) 90000-0002" },
            { id: "c-g3", name: "Sofia Nunes", status: "pending", email: "sofia@example.com", phone: "(19) 90000-0003", companions: [{ id: "c-a2", name: "Mateus", status: "pending" }] },
            { id: "c-g4", name: "Daniel Rocha", status: "pending", email: "daniel@example.com", phone: "(19) 90000-0004" },
            { id: "c-g5", name: "Patricia Alves", status: "pending", email: "patricia@example.com", phone: "(19) 90000-0005" },
            { id: "c-g6", name: "Vitor Gomes", status: "declined", email: "vitor@example.com", phone: "(19) 90000-0006" },
          ],
          photos: [
            {
              id: "c-photo-1",
              url: "/placeholder.svg?height=300&width=400&text=Casamento",
              filename: "casamento.jpg",
              uploadedBy: "Ana",
              uploadedAt: "2024-08-24T20:00:00Z",
              description: "Decoracao da cerimonia",
              tags: ["casamento", "decoracao"],
            },
          ],
          createdAt: "2024-06-28T13:00:00Z",
          updatedAt: "2024-07-02T18:00:00Z",
        },
        {
          id: "5",
          title: "Aulao Online de Organizacao",
          type: "Online",
          category: "Educacional",
          status: "completed",
          date: "Terca, 17 de Setembro",
          time: "20:00",
          fullDate: "17/09/2024",
          startDate: "2024-09-17",
          startTime: "20:00",
          endDate: "2024-09-17",
          endTime: "22:00",
          location: "Google Meet",
          eventMode: "online",
          meetingUrl: "https://meet.example.com/planeja-demo",
          description: "Evento online para testar fluxo sem endereco fisico e com baixo custo.",
          capacity: 200,
          allowGuests: true,
          allowCompanions: false,
          maxCompanionsPerGuest: 0,
          publicInviteEnabled: true,
          publicInviteToken: "aulao-online-demo",
          autoApprovePublicGuests: true,
          rsvpEnabled: true,
          budgetEstimated: 900,
          initialEstimatedCost: 520,
          currency: "BRL",
          confirmedGuests: 5,
          totalGuests: 7,
          items: [
            { id: "o1", name: "Plataforma de transmissao", price: 320, category: "Tecnologia", quantity: 1, estimatedCost: 320, assignedTo: [{ id: "p8", name: "Equipe Tech" }], image: null },
            { id: "o2", name: "Arte de divulgacao", price: 200, category: "Marketing", quantity: 1, estimatedCost: 200, assignedTo: null, image: null },
          ],
          guests: [
            { id: "o-g1", name: "Nina Duarte", status: "confirmed", email: "nina@example.com", phone: "(21) 90000-0001" },
            { id: "o-g2", name: "Otavio Reis", status: "confirmed", email: "otavio@example.com", phone: "(21) 90000-0002" },
            { id: "o-g3", name: "Paula Melo", status: "confirmed", email: "paula@example.com", phone: "(21) 90000-0003" },
            { id: "o-g4", name: "Caio Vieira", status: "pending", email: "caio@example.com", phone: "(21) 90000-0004" },
            { id: "o-g5", name: "Dora Lima", status: "declined", email: "dora@example.com", phone: "(21) 90000-0005" },
          ],
          photos: [],
          createdAt: "2024-07-10T10:00:00Z",
          updatedAt: "2024-09-18T09:00:00Z",
        },
        {
          id: "6",
          title: "Formatura Engenharia 2024",
          type: "Formatura",
          category: "Celebracao",
          status: "draft",
          date: "Sexta, 08 de Novembro",
          time: "19:00",
          fullDate: "08/11/2024",
          startDate: "2024-11-08",
          startTime: "19:00",
          endDate: "2024-11-09",
          endTime: "01:00",
          location: "Centro de Convencoes Norte",
          address: "Rua Universitaria, 450 - Belo Horizonte, MG",
          eventMode: "presencial",
          description: "Evento grande em fase de rascunho para testar baixa confirmacao e risco alto.",
          capacity: 300,
          allowGuests: true,
          allowCompanions: true,
          maxCompanionsPerGuest: 2,
          companionsRequireApproval: true,
          publicInviteEnabled: false,
          rsvpEnabled: true,
          budgetEstimated: 65000,
          initialEstimatedCost: 48700,
          currency: "BRL",
          confirmedGuests: 1,
          totalGuests: 9,
          items: [
            { id: "f1", name: "Locacao do salao", price: 18000, category: "Estrutura", quantity: 1, estimatedCost: 18000, assignedTo: null, image: null },
            { id: "f2", name: "Buffet formatura", price: 22000, category: "Alimentos", quantity: 1, estimatedCost: 22000, assignedTo: null, image: null },
            { id: "f3", name: "Banda", price: 8700, category: "Entretenimento", quantity: 1, estimatedCost: 8700, assignedTo: [{ id: "p9", name: "Comissao" }], image: null },
          ],
          guests: [
            { id: "f-g1", name: "Comissao Central", status: "confirmed", email: "comissao@example.com", phone: "(31) 90000-0001" },
            { id: "f-g2", name: "Turma A", status: "pending", email: "turmaa@example.com", phone: "(31) 90000-0002" },
            { id: "f-g3", name: "Turma B", status: "pending", email: "turmab@example.com", phone: "(31) 90000-0003" },
            { id: "f-g4", name: "Turma C", status: "pending", email: "turmac@example.com", phone: "(31) 90000-0004" },
            { id: "f-g5", name: "Turma D", status: "pending", email: "turmad@example.com", phone: "(31) 90000-0005" },
            { id: "f-g6", name: "Turma E", status: "pending", email: "turmae@example.com", phone: "(31) 90000-0006" },
          ],
          photos: [],
          createdAt: "2024-08-01T08:00:00Z",
          updatedAt: "2024-08-10T08:00:00Z",
        },
        {
          id: "7",
          title: "Jantar de Encerramento Cancelado",
          type: "Corporativo",
          category: "Confraternizacao",
          status: "canceled",
          date: "Quinta, 12 de Dezembro",
          time: "20:00",
          fullDate: "12/12/2024",
          startDate: "2024-12-12",
          startTime: "20:00",
          endDate: "2024-12-12",
          endTime: "23:00",
          location: "Restaurante Central",
          address: "Rua Augusta, 800 - Sao Paulo, SP",
          eventMode: "presencial",
          description: "Evento cancelado para validar filtros por status e cards de risco sem acao pendente.",
          capacity: 60,
          allowGuests: true,
          allowCompanions: false,
          maxCompanionsPerGuest: 0,
          publicInviteEnabled: false,
          rsvpEnabled: false,
          budgetEstimated: 4800,
          initialEstimatedCost: 0,
          currency: "BRL",
          confirmedGuests: 0,
          totalGuests: 4,
          items: [
            { id: "j1", name: "Reserva sinal", price: 500, category: "Reserva", quantity: 1, estimatedCost: 500, assignedTo: null, image: null },
          ],
          guests: [
            { id: "j-g1", name: "Equipe Comercial", status: "declined", email: "comercial@example.com", phone: "(11) 90000-0101" },
            { id: "j-g2", name: "Equipe Produto", status: "declined", email: "produto@example.com", phone: "(11) 90000-0102" },
            { id: "j-g3", name: "Equipe Suporte", status: "pending", email: "suporte@example.com", phone: "(11) 90000-0103" },
          ],
          photos: [],
          createdAt: "2024-09-12T10:00:00Z",
          updatedAt: "2024-10-01T10:00:00Z",
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
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<EventStore> | undefined

        return {
          ...currentState,
          ...persisted,
          events: mergeEventsWithDemoData(persisted?.events, currentState.events),
        }
      },
    },
  ),
)

import type { EventProps } from "../entities/event"
import type { GuestProps } from "../entities/guest"
import type { ItemProps } from "../entities/item"

/**
 * Interface de Repositorio: IEventRepository
 * Define o contrato para persistencia de eventos.
 * O dominio depende desta interface, nao da implementacao concreta (Supabase, localStorage, etc).
 * Isso permite trocar a infraestrutura sem alterar o dominio.
 */
export interface IEventRepository {
  /** Busca todos os eventos do usuario */
  findAllByUserId(userId: string): Promise<EventProps[]>

  /** Busca um evento por ID */
  findById(eventId: string): Promise<EventProps | null>

  /** Cria um novo evento */
  create(event: Omit<EventProps, "id" | "createdAt" | "updatedAt">, userId: string): Promise<EventProps>

  /** Atualiza um evento existente */
  update(eventId: string, data: Partial<EventProps>): Promise<EventProps>

  /** Remove um evento */
  delete(eventId: string): Promise<void>

  /** Adiciona um convidado ao evento */
  addGuest(eventId: string, guest: Omit<GuestProps, "id" | "createdAt">): Promise<GuestProps>

  /** Adiciona multiplos convidados ao evento */
  addGuests(eventId: string, guests: Omit<GuestProps, "id" | "createdAt">[]): Promise<GuestProps[]>

  /** Atualiza o status de um convidado */
  updateGuestStatus(eventId: string, guestId: string, status: string): Promise<void>

  /** Remove um convidado */
  removeGuest(eventId: string, guestId: string): Promise<void>

  /** Adiciona um item ao evento */
  addItem(eventId: string, item: Omit<ItemProps, "id" | "createdAt">): Promise<ItemProps>

  /** Atualiza um item existente */
  updateItem(eventId: string, itemId: string, data: Partial<ItemProps>): Promise<ItemProps>

  /** Remove um item */
  removeItem(eventId: string, itemId: string): Promise<void>
}

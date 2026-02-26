import { EventEntity, type EventProps } from "../../domain/entities/event"

/**
 * Use Case: GetEventStats
 * Retorna estatisticas calculadas de um evento usando a entidade de dominio.
 * Centraliza a logica de contagem que antes estava espalhada no frontend.
 */

export interface EventStats {
  totalGuests: number
  confirmedGuests: number
  pendingGuests: number
  declinedGuests: number
  confirmationRate: number
  totalCost: number
  totalCostFormatted: string
  costPerPerson: number
  costPerPersonFormatted: string
  itemsCount: number
  photosCount: number
  isCollaborative: boolean
}

export class GetEventStats {
  /**
   * Calcula todas as estatisticas de um evento.
   * @param eventData Dados do evento em formato plain
   */
  execute(eventData: EventProps): EventStats {
    const event = EventEntity.create(eventData)

    return {
      totalGuests: event.totalGuests,
      confirmedGuests: event.confirmedGuests,
      pendingGuests: event.pendingGuests,
      declinedGuests: event.declinedGuests,
      confirmationRate: event.confirmationRate,
      totalCost: event.totalCost.reais,
      totalCostFormatted: event.totalCost.format(),
      costPerPerson: event.costPerPerson.reais,
      costPerPersonFormatted: event.costPerPerson.format(),
      itemsCount: event.items.length,
      photosCount: event.photos.length,
      isCollaborative: event.isCollaborative,
    }
  }
}

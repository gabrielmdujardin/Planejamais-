import { EventEntity, type EventProps } from "../../domain/entities/event"
import { Money } from "../../domain/value-objects/money"

/**
 * Use Case: CalculateEventCosts
 * Calcula os custos de um evento usando a entidade de dominio.
 * Centraliza a logica de calculo que antes estava espalhada no frontend.
 */

export interface EventCostSummary {
  totalCost: string
  totalCostRaw: number
  costPerPerson: string
  costPerPersonRaw: number
  itemsCount: number
  confirmedGuests: number
  isCollaborative: boolean
}

export class CalculateEventCosts {
  /**
   * Calcula o resumo de custos de um evento.
   * @param eventData Dados do evento em formato plain
   * @returns Resumo com custos formatados
   */
  execute(eventData: EventProps): EventCostSummary {
    const event = EventEntity.create(eventData)

    const totalCost = event.totalCost
    const costPerPerson = event.costPerPerson

    return {
      totalCost: totalCost.format(),
      totalCostRaw: totalCost.reais,
      costPerPerson: costPerPerson.format(),
      costPerPersonRaw: costPerPerson.reais,
      itemsCount: event.items.length,
      confirmedGuests: event.confirmedGuests,
      isCollaborative: event.isCollaborative,
    }
  }

  /**
   * Calcula o custo total a partir de uma lista de precos (helper estatico).
   * Pode ser usado sem instanciar a entidade completa.
   */
  static sumPrices(prices: number[]): Money {
    return prices.reduce((sum, price) => sum.add(Money.fromReais(price)), Money.zero())
  }
}

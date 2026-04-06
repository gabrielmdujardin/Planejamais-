import { GuestEntity, type GuestProps } from "../../domain/entities/guest"
import { Email } from "../../domain/value-objects/email"
import { Phone } from "../../domain/value-objects/phone"

/**
 * Use Case: ValidateGuest
 * Valida os dados de um convidado usando os Value Objects do dominio.
 * Centraliza a logica de validacao que antes estava no frontend (add-guest-dialog).
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class ValidateGuest {
  /**
   * Valida dados de um convidado individual.
   */
  execute(data: { name: string; email: string; phone: string }): ValidationResult {
    const errors: string[] = []

    if (!data.name || !data.name.trim()) {
      errors.push("Nome e obrigatorio")
    }

    if (!Email.tryCreate(data.email)) {
      errors.push("Email invalido")
    }

    if (!Phone.tryCreate(data.phone)) {
      errors.push("Telefone invalido (deve ter 10 ou 11 digitos)")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Valida uma lista de convidados em massa.
   */
  executeBulk(guests: { name: string; email: string; phone: string }[]): {
    validGuests: { name: string; email: string; phone: string }[]
    invalidGuests: { index: number; data: { name: string; email: string; phone: string }; errors: string[] }[]
  } {
    const validGuests: { name: string; email: string; phone: string }[] = []
    const invalidGuests: { index: number; data: { name: string; email: string; phone: string }; errors: string[] }[] = []

    guests.forEach((guest, index) => {
      const result = this.execute(guest)
      if (result.isValid) {
        validGuests.push(guest)
      } else {
        invalidGuests.push({ index, data: guest, errors: result.errors })
      }
    })

    return { validGuests, invalidGuests }
  }
}

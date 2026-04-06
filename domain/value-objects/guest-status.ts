/**
 * Value Object: GuestStatus
 * Representa o status de confirmação de um convidado.
 * Invariantes:
 * - Só pode ser "confirmed", "pending" ou "declined"
 * - Transições de estado são validadas
 */

const VALID_STATUSES = ["confirmed", "pending", "declined"] as const
export type GuestStatusValue = (typeof VALID_STATUSES)[number]

export class GuestStatus {
  private readonly _value: GuestStatusValue

  private constructor(value: GuestStatusValue) {
    this._value = value
  }

  static create(value: string): GuestStatus {
    if (!VALID_STATUSES.includes(value as GuestStatusValue)) {
      throw new Error(`GuestStatus: status inválido "${value}". Valores aceitos: ${VALID_STATUSES.join(", ")}`)
    }
    return new GuestStatus(value as GuestStatusValue)
  }

  static pending(): GuestStatus {
    return new GuestStatus("pending")
  }

  static confirmed(): GuestStatus {
    return new GuestStatus("confirmed")
  }

  static declined(): GuestStatus {
    return new GuestStatus("declined")
  }

  get value(): GuestStatusValue {
    return this._value
  }

  get isPending(): boolean {
    return this._value === "pending"
  }

  get isConfirmed(): boolean {
    return this._value === "confirmed"
  }

  get isDeclined(): boolean {
    return this._value === "declined"
  }

  /** Retorna o label em português */
  get label(): string {
    const labels: Record<GuestStatusValue, string> = {
      confirmed: "Confirmado",
      pending: "Pendente",
      declined: "Recusado",
    }
    return labels[this._value]
  }

  equals(other: GuestStatus): boolean {
    return this._value === other._value
  }

  toJSON(): string {
    return this._value
  }

  toString(): string {
    return this._value
  }
}

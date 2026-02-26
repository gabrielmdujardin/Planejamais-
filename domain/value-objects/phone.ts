/**
 * Value Object: Phone
 * Representa um número de telefone brasileiro validado e imutável.
 * Invariantes:
 * - Deve conter entre 10 e 11 dígitos (DDD + número)
 * - É armazenado apenas com dígitos internamente
 */
export class Phone {
  private readonly _digits: string

  private constructor(digits: string) {
    this._digits = digits
  }

  /** Cria um Phone validado */
  static create(value: string): Phone {
    if (!value || !value.trim()) {
      throw new Error("Phone: o número de telefone é obrigatório")
    }
    const digits = value.replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 11) {
      throw new Error("Phone: telefone brasileiro deve ter 10 ou 11 dígitos")
    }
    return new Phone(digits)
  }

  /** Tenta criar um Phone, retorna null se inválido */
  static tryCreate(value: string): Phone | null {
    try {
      return Phone.create(value)
    } catch {
      return null
    }
  }

  /** Retorna apenas os dígitos */
  get digits(): string {
    return this._digits
  }

  /** Retorna formatado como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX */
  get formatted(): string {
    if (this._digits.length === 11) {
      return `(${this._digits.substring(0, 2)}) ${this._digits.substring(2, 7)}-${this._digits.substring(7)}`
    }
    return `(${this._digits.substring(0, 2)}) ${this._digits.substring(2, 6)}-${this._digits.substring(6)}`
  }

  /** Verifica igualdade */
  equals(other: Phone): boolean {
    return this._digits === other._digits
  }

  /** Serializa para persistência */
  toJSON(): string {
    return this.formatted
  }

  toString(): string {
    return this.formatted
  }
}

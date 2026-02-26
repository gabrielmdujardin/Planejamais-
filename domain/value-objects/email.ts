/**
 * Value Object: Email
 * Representa um endereço de email validado e imutável.
 * Invariantes:
 * - Deve conter formato válido de email
 * - É sempre armazenado em lowercase
 */
export class Email {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value.toLowerCase().trim()
  }

  /** Cria um Email validado */
  static create(value: string): Email {
    if (!value || !value.trim()) {
      throw new Error("Email: o endereço de email é obrigatório")
    }
    const trimmed = value.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      throw new Error("Email: formato de email inválido")
    }
    return new Email(trimmed)
  }

  /** Tenta criar um Email, retorna null se inválido */
  static tryCreate(value: string): Email | null {
    try {
      return Email.create(value)
    } catch {
      return null
    }
  }

  /** Retorna o valor do email */
  get value(): string {
    return this._value
  }

  /** Verifica igualdade */
  equals(other: Email): boolean {
    return this._value === other._value
  }

  /** Serializa para persistência */
  toJSON(): string {
    return this._value
  }

  toString(): string {
    return this._value
  }
}

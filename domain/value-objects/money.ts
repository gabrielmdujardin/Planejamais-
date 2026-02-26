/**
 * Value Object: Money
 * Representa um valor monetário imutável em centavos para evitar erros de ponto flutuante.
 * Invariantes:
 * - O valor não pode ser negativo
 * - Operações retornam novas instâncias (imutabilidade)
 */
export class Money {
  private readonly _cents: number

  private constructor(cents: number) {
    if (cents < 0) {
      throw new Error("Money: o valor não pode ser negativo")
    }
    if (!Number.isFinite(cents)) {
      throw new Error("Money: o valor deve ser um número finito")
    }
    this._cents = Math.round(cents)
  }

  /** Cria Money a partir de reais (ex: 150.50) */
  static fromReais(reais: number): Money {
    return new Money(Math.round(reais * 100))
  }

  /** Cria Money a partir de centavos (ex: 15050) */
  static fromCents(cents: number): Money {
    return new Money(cents)
  }

  /** Cria Money com valor zero */
  static zero(): Money {
    return new Money(0)
  }

  /** Retorna o valor em reais */
  get reais(): number {
    return this._cents / 100
  }

  /** Retorna o valor em centavos */
  get cents(): number {
    return this._cents
  }

  /** Verifica se o valor é zero */
  get isZero(): boolean {
    return this._cents === 0
  }

  /** Soma dois valores monetários */
  add(other: Money): Money {
    return new Money(this._cents + other._cents)
  }

  /** Subtrai um valor monetário */
  subtract(other: Money): Money {
    const result = this._cents - other._cents
    if (result < 0) {
      throw new Error("Money: subtração resultaria em valor negativo")
    }
    return new Money(result)
  }

  /** Divide o valor por um número (ex: split entre convidados) */
  divideBy(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error("Money: divisor deve ser maior que zero")
    }
    return new Money(Math.round(this._cents / divisor))
  }

  /** Formata como moeda brasileira */
  format(): string {
    return `R$ ${this.reais.toFixed(2)}`
  }

  /** Verifica igualdade */
  equals(other: Money): boolean {
    return this._cents === other._cents
  }

  /** Verifica se é maior que outro valor */
  greaterThan(other: Money): boolean {
    return this._cents > other._cents
  }

  /** Serializa para persistência */
  toJSON(): number {
    return this.reais
  }
}

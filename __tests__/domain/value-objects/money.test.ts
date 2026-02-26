import { describe, it, expect } from "vitest"
import { Money } from "@/domain/value-objects/money"

describe("Money (Value Object)", () => {
  describe("criacao", () => {
    it("deve criar a partir de reais", () => {
      const money = Money.fromReais(150.5)
      expect(money.reais).toBe(150.5)
      expect(money.cents).toBe(15050)
    })

    it("deve criar a partir de centavos", () => {
      const money = Money.fromCents(15050)
      expect(money.reais).toBe(150.5)
      expect(money.cents).toBe(15050)
    })

    it("deve criar valor zero", () => {
      const money = Money.zero()
      expect(money.reais).toBe(0)
      expect(money.cents).toBe(0)
      expect(money.isZero).toBe(true)
    })

    it("deve lancar erro para valores negativos (reais)", () => {
      expect(() => Money.fromReais(-10)).toThrow("o valor não pode ser negativo")
    })

    it("deve lancar erro para valores negativos (centavos)", () => {
      expect(() => Money.fromCents(-100)).toThrow("o valor não pode ser negativo")
    })

    it("deve lancar erro para Infinity", () => {
      expect(() => Money.fromReais(Infinity)).toThrow("o valor deve ser um número finito")
    })

    it("deve lancar erro para NaN", () => {
      expect(() => Money.fromReais(NaN)).toThrow("o valor deve ser um número finito")
    })
  })

  describe("operacoes aritmeticas", () => {
    it("deve somar dois Money corretamente", () => {
      const a = Money.fromReais(10.5)
      const b = Money.fromReais(5.25)
      const result = a.add(b)
      expect(result.reais).toBe(15.75)
    })

    it("deve subtrair Money corretamente", () => {
      const a = Money.fromReais(20)
      const b = Money.fromReais(5.5)
      const result = a.subtract(b)
      expect(result.reais).toBe(14.5)
    })

    it("deve lancar erro ao subtrair resultando em negativo", () => {
      const a = Money.fromReais(5)
      const b = Money.fromReais(10)
      expect(() => a.subtract(b)).toThrow("valor negativo")
    })

    it("deve dividir corretamente", () => {
      const money = Money.fromReais(100)
      const result = money.divideBy(3)
      expect(result.reais).toBeCloseTo(33.33, 1)
    })

    it("deve lancar erro ao dividir por zero", () => {
      const money = Money.fromReais(100)
      expect(() => money.divideBy(0)).toThrow("divisor deve ser maior que zero")
    })

    it("deve lancar erro ao dividir por negativo", () => {
      const money = Money.fromReais(100)
      expect(() => money.divideBy(-1)).toThrow("divisor deve ser maior que zero")
    })
  })

  describe("imutabilidade", () => {
    it("add deve retornar nova instancia", () => {
      const a = Money.fromReais(10)
      const b = Money.fromReais(5)
      const result = a.add(b)
      expect(result).not.toBe(a)
      expect(result).not.toBe(b)
      expect(a.reais).toBe(10) // original inalterado
    })

    it("subtract deve retornar nova instancia", () => {
      const a = Money.fromReais(10)
      const b = Money.fromReais(5)
      const result = a.subtract(b)
      expect(result).not.toBe(a)
      expect(a.reais).toBe(10)
    })
  })

  describe("comparacao e formatacao", () => {
    it("deve verificar igualdade corretamente", () => {
      const a = Money.fromReais(10)
      const b = Money.fromReais(10)
      const c = Money.fromReais(20)
      expect(a.equals(b)).toBe(true)
      expect(a.equals(c)).toBe(false)
    })

    it("deve verificar greaterThan", () => {
      const a = Money.fromReais(20)
      const b = Money.fromReais(10)
      expect(a.greaterThan(b)).toBe(true)
      expect(b.greaterThan(a)).toBe(false)
    })

    it("deve formatar como moeda brasileira", () => {
      const money = Money.fromReais(1250.5)
      expect(money.format()).toBe("R$ 1250.50")
    })

    it("deve serializar corretamente com toJSON", () => {
      const money = Money.fromReais(99.99)
      expect(money.toJSON()).toBe(99.99)
    })
  })
})

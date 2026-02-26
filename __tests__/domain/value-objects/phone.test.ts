import { describe, it, expect } from "vitest"
import { Phone } from "@/domain/value-objects/phone"

describe("Phone (Value Object)", () => {
  describe("criacao com create()", () => {
    it("deve criar phone com 11 digitos (celular)", () => {
      const phone = Phone.create("11987654321")
      expect(phone.digits).toBe("11987654321")
    })

    it("deve criar phone com 10 digitos (fixo)", () => {
      const phone = Phone.create("1132654321")
      expect(phone.digits).toBe("1132654321")
    })

    it("deve remover caracteres nao-numericos", () => {
      const phone = Phone.create("(11) 98765-4321")
      expect(phone.digits).toBe("11987654321")
    })

    it("deve lancar erro para telefone vazio", () => {
      expect(() => Phone.create("")).toThrow("obrigatório")
    })

    it("deve lancar erro para telefone com poucos digitos", () => {
      expect(() => Phone.create("123456789")).toThrow("10 ou 11 dígitos")
    })

    it("deve lancar erro para telefone com muitos digitos", () => {
      expect(() => Phone.create("123456789012")).toThrow("10 ou 11 dígitos")
    })
  })

  describe("criacao com tryCreate()", () => {
    it("deve retornar Phone para dados validos", () => {
      const phone = Phone.tryCreate("11987654321")
      expect(phone).not.toBeNull()
      expect(phone!.digits).toBe("11987654321")
    })

    it("deve retornar null para dados invalidos", () => {
      const phone = Phone.tryCreate("123")
      expect(phone).toBeNull()
    })
  })

  describe("formatacao", () => {
    it("deve formatar celular corretamente (11 digitos)", () => {
      const phone = Phone.create("11987654321")
      expect(phone.formatted).toBe("(11) 98765-4321")
    })

    it("deve formatar fixo corretamente (10 digitos)", () => {
      const phone = Phone.create("1132654321")
      expect(phone.formatted).toBe("(11) 3265-4321")
    })
  })

  describe("igualdade e serializacao", () => {
    it("deve verificar igualdade por digitos", () => {
      const a = Phone.create("(11) 98765-4321")
      const b = Phone.create("11987654321")
      expect(a.equals(b)).toBe(true)
    })

    it("deve diferenciar phones distintos", () => {
      const a = Phone.create("11987654321")
      const b = Phone.create("21987654321")
      expect(a.equals(b)).toBe(false)
    })

    it("deve serializar com toJSON no formato formatado", () => {
      const phone = Phone.create("11987654321")
      expect(phone.toJSON()).toBe("(11) 98765-4321")
    })

    it("deve converter com toString no formato formatado", () => {
      const phone = Phone.create("11987654321")
      expect(phone.toString()).toBe("(11) 98765-4321")
    })
  })
})

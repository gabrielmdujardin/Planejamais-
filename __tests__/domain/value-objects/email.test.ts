import { describe, it, expect } from "vitest"
import { Email } from "@/domain/value-objects/email"

describe("Email (Value Object)", () => {
  describe("criacao com create()", () => {
    it("deve criar email valido", () => {
      const email = Email.create("User@Example.com")
      expect(email.value).toBe("user@example.com")
    })

    it("deve normalizar para lowercase", () => {
      const email = Email.create("GABRIEL@GMAIL.COM")
      expect(email.value).toBe("gabriel@gmail.com")
    })

    it("deve remover espacos em branco", () => {
      const email = Email.create("  gabriel@gmail.com  ")
      expect(email.value).toBe("gabriel@gmail.com")
    })

    it("deve lancar erro para email vazio", () => {
      expect(() => Email.create("")).toThrow("obrigatório")
    })

    it("deve lancar erro para email com apenas espacos", () => {
      expect(() => Email.create("   ")).toThrow("obrigatório")
    })

    it("deve lancar erro para email sem @", () => {
      expect(() => Email.create("invalido.com")).toThrow("formato de email inválido")
    })

    it("deve lancar erro para email sem dominio", () => {
      expect(() => Email.create("user@")).toThrow("formato de email inválido")
    })

    it("deve lancar erro para email sem usuario", () => {
      expect(() => Email.create("@domain.com")).toThrow("formato de email inválido")
    })
  })

  describe("criacao com tryCreate()", () => {
    it("deve retornar Email para dados validos", () => {
      const email = Email.tryCreate("test@test.com")
      expect(email).not.toBeNull()
      expect(email!.value).toBe("test@test.com")
    })

    it("deve retornar null para dados invalidos", () => {
      const email = Email.tryCreate("invalido")
      expect(email).toBeNull()
    })

    it("deve retornar null para email vazio", () => {
      const email = Email.tryCreate("")
      expect(email).toBeNull()
    })
  })

  describe("igualdade e serializacao", () => {
    it("deve verificar igualdade", () => {
      const a = Email.create("test@test.com")
      const b = Email.create("Test@Test.com")
      expect(a.equals(b)).toBe(true)
    })

    it("deve diferenciar emails distintos", () => {
      const a = Email.create("a@test.com")
      const b = Email.create("b@test.com")
      expect(a.equals(b)).toBe(false)
    })

    it("deve serializar com toJSON", () => {
      const email = Email.create("test@test.com")
      expect(email.toJSON()).toBe("test@test.com")
    })

    it("deve converter com toString", () => {
      const email = Email.create("test@test.com")
      expect(email.toString()).toBe("test@test.com")
    })
  })
})

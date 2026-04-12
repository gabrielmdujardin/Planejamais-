import { describe, it, expect } from "vitest"
import { GuestStatus } from "@/domain/value-objects/guest-status"

describe("GuestStatus (Value Object)", () => {
  describe("criacao", () => {
    it("deve criar status pending", () => {
      const status = GuestStatus.pending()
      expect(status.value).toBe("pending")
      expect(status.isPending).toBe(true)
      expect(status.isConfirmed).toBe(false)
      expect(status.isDeclined).toBe(false)
    })

    it("deve criar status confirmed", () => {
      const status = GuestStatus.confirmed()
      expect(status.value).toBe("confirmed")
      expect(status.isConfirmed).toBe(true)
    })

    it("deve criar status declined", () => {
      const status = GuestStatus.declined()
      expect(status.value).toBe("declined")
      expect(status.isDeclined).toBe(true)
    })

    it("deve criar a partir de string valida", () => {
      const status = GuestStatus.create("confirmed")
      expect(status.isConfirmed).toBe(true)
    })

    it("deve lancar erro para status invalido", () => {
      expect(() => GuestStatus.create("invalid")).toThrow('status inválido "invalid"')
    })
  })

  describe("labels", () => {
    it("deve retornar label em portugues para confirmed", () => {
      expect(GuestStatus.confirmed().label).toBe("Confirmado")
    })

    it("deve retornar label em portugues para pending", () => {
      expect(GuestStatus.pending().label).toBe("Pendente")
    })

    it("deve retornar label em portugues para declined", () => {
      expect(GuestStatus.declined().label).toBe("Recusado")
    })
  })

  describe("igualdade e serializacao", () => {
    it("deve verificar igualdade", () => {
      const a = GuestStatus.confirmed()
      const b = GuestStatus.confirmed()
      expect(a.equals(b)).toBe(true)
    })

    it("deve diferenciar status distintos", () => {
      const a = GuestStatus.confirmed()
      const b = GuestStatus.pending()
      expect(a.equals(b)).toBe(false)
    })

    it("deve serializar com toJSON", () => {
      expect(GuestStatus.confirmed().toJSON()).toBe("confirmed")
    })

    it("deve converter com toString", () => {
      expect(GuestStatus.declined().toString()).toBe("declined")
    })
  })
})

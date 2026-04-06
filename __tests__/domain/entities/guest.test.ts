import { describe, it, expect } from "vitest"
import { GuestEntity, type GuestProps } from "@/domain/entities/guest"

const validGuestProps: GuestProps = {
  id: "guest-1",
  name: "Gabriel Dujardin",
  email: "gabriel@example.com",
  phone: "11987654321",
  status: "pending",
  createdAt: "2025-01-01T00:00:00.000Z",
}

describe("GuestEntity", () => {
  describe("criacao com create()", () => {
    it("deve criar guest valido", () => {
      const guest = GuestEntity.create(validGuestProps)
      expect(guest.id).toBe("guest-1")
      expect(guest.name).toBe("Gabriel Dujardin")
      expect(guest.email.value).toBe("gabriel@example.com")
      expect(guest.phone.digits).toBe("11987654321")
      expect(guest.statusValue).toBe("pending")
    })

    it("deve lancar erro para nome vazio", () => {
      expect(() => GuestEntity.create({ ...validGuestProps, name: "" })).toThrow("nome é obrigatório")
    })

    it("deve lancar erro para email invalido", () => {
      expect(() => GuestEntity.create({ ...validGuestProps, email: "invalido" })).toThrow("email")
    })

    it("deve lancar erro para telefone invalido", () => {
      expect(() => GuestEntity.create({ ...validGuestProps, phone: "123" })).toThrow("telefone")
    })

    it("deve definir status como pending por padrao se for um status valido", () => {
      const guest = GuestEntity.create({ ...validGuestProps, status: "pending" })
      expect(guest.isPending).toBe(true)
    })
  })

  describe("reconstitute()", () => {
    it("deve reconstituir guest a partir de dados persistidos", () => {
      const guest = GuestEntity.reconstitute(validGuestProps)
      expect(guest.id).toBe("guest-1")
      expect(guest.name).toBe("Gabriel Dujardin")
    })
  })

  describe("transicoes de status", () => {
    it("deve confirmar presenca", () => {
      const guest = GuestEntity.create(validGuestProps)
      expect(guest.isPending).toBe(true)
      guest.confirm()
      expect(guest.isConfirmed).toBe(true)
      expect(guest.statusValue).toBe("confirmed")
    })

    it("deve recusar convite", () => {
      const guest = GuestEntity.create(validGuestProps)
      guest.decline()
      expect(guest.status.isDeclined).toBe(true)
      expect(guest.statusValue).toBe("declined")
    })

    it("deve redefinir para pendente", () => {
      const guest = GuestEntity.create({ ...validGuestProps, status: "confirmed" })
      expect(guest.isConfirmed).toBe(true)
      guest.resetToPending()
      expect(guest.isPending).toBe(true)
    })

    it("deve atualizar status generico", () => {
      const guest = GuestEntity.create(validGuestProps)
      guest.updateStatus("confirmed")
      expect(guest.isConfirmed).toBe(true)
      guest.updateStatus("declined")
      expect(guest.status.isDeclined).toBe(true)
    })
  })

  describe("serializacao", () => {
    it("deve serializar para plain object compativel", () => {
      const guest = GuestEntity.create(validGuestProps)
      const plain = guest.toPlainObject()
      expect(plain.id).toBe("guest-1")
      expect(plain.name).toBe("Gabriel Dujardin")
      expect(plain.email).toBe("gabriel@example.com")
      expect(plain.phone).toBe("(11) 98765-4321")
      expect(plain.status).toBe("pending")
    })
  })
})

import { describe, it, expect } from "vitest"
import { ValidateGuest } from "@/application/use-cases/validate-guest"

describe("ValidateGuest (Use Case)", () => {
  const useCase = new ValidateGuest()

  describe("execute() - validacao individual", () => {
    it("deve aceitar dados validos", () => {
      const result = useCase.execute({
        name: "Gabriel",
        email: "gabriel@test.com",
        phone: "11987654321",
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("deve rejeitar nome vazio", () => {
      const result = useCase.execute({
        name: "",
        email: "gabriel@test.com",
        phone: "11987654321",
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Nome e obrigatorio")
    })

    it("deve rejeitar email invalido", () => {
      const result = useCase.execute({
        name: "Gabriel",
        email: "invalido",
        phone: "11987654321",
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Email invalido")
    })

    it("deve rejeitar telefone invalido", () => {
      const result = useCase.execute({
        name: "Gabriel",
        email: "gabriel@test.com",
        phone: "123",
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Telefone invalido (deve ter 10 ou 11 digitos)")
    })

    it("deve acumular multiplos erros", () => {
      const result = useCase.execute({
        name: "",
        email: "invalido",
        phone: "123",
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })
  })

  describe("executeBulk() - validacao em massa", () => {
    it("deve separar validos e invalidos", () => {
      const result = useCase.executeBulk([
        { name: "Gabriel", email: "gabriel@test.com", phone: "11987654321" },
        { name: "", email: "invalido", phone: "123" },
        { name: "Ana", email: "ana@test.com", phone: "21987654321" },
      ])

      expect(result.validGuests).toHaveLength(2)
      expect(result.invalidGuests).toHaveLength(1)
      expect(result.invalidGuests[0].index).toBe(1)
      expect(result.invalidGuests[0].errors.length).toBeGreaterThan(0)
    })

    it("deve retornar todos validos quando todos sao corretos", () => {
      const result = useCase.executeBulk([
        { name: "Gabriel", email: "gabriel@test.com", phone: "11987654321" },
        { name: "Ana", email: "ana@test.com", phone: "21987654321" },
      ])

      expect(result.validGuests).toHaveLength(2)
      expect(result.invalidGuests).toHaveLength(0)
    })

    it("deve retornar todos invalidos quando todos estao incorretos", () => {
      const result = useCase.executeBulk([
        { name: "", email: "x", phone: "1" },
        { name: "", email: "y", phone: "2" },
      ])

      expect(result.validGuests).toHaveLength(0)
      expect(result.invalidGuests).toHaveLength(2)
    })

    it("deve lidar com lista vazia", () => {
      const result = useCase.executeBulk([])
      expect(result.validGuests).toHaveLength(0)
      expect(result.invalidGuests).toHaveLength(0)
    })
  })
})

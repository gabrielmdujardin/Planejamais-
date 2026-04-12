import { describe, it, expect } from "vitest"
import { ItemEntity, type ItemProps } from "@/domain/entities/item"

const validItemProps: ItemProps = {
  id: "item-1",
  name: "Bolo de Aniversario",
  price: 150.5,
  assignedTo: [{ id: "person-1", name: "Maria" }],
  image: null,
  createdAt: "2025-01-01T00:00:00.000Z",
}

describe("ItemEntity", () => {
  describe("criacao com create()", () => {
    it("deve criar item valido", () => {
      const item = ItemEntity.create(validItemProps)
      expect(item.id).toBe("item-1")
      expect(item.name).toBe("Bolo de Aniversario")
      expect(item.priceValue).toBe(150.5)
      expect(item.assignedTo).toHaveLength(1)
    })

    it("deve lancar erro para nome vazio", () => {
      expect(() => ItemEntity.create({ ...validItemProps, name: "" })).toThrow("nome é obrigatório")
    })

    it("deve lancar erro para preco negativo", () => {
      expect(() => ItemEntity.create({ ...validItemProps, price: -10 })).toThrow("preço não pode ser negativo")
    })

    it("deve aceitar preco zero", () => {
      const item = ItemEntity.create({ ...validItemProps, price: 0 })
      expect(item.priceValue).toBe(0)
    })

    it("deve definir assignedTo como array vazio quando null", () => {
      const item = ItemEntity.create({ ...validItemProps, assignedTo: null })
      expect(item.assignedTo).toEqual([])
      expect(item.hasAssignedPeople).toBe(false)
    })
  })

  describe("operacoes de atribuicao", () => {
    it("deve atribuir responsaveis", () => {
      const item = ItemEntity.create({ ...validItemProps, assignedTo: null })
      expect(item.hasAssignedPeople).toBe(false)
      item.assignPeople([{ id: "p1", name: "Joao" }, { id: "p2", name: "Ana" }])
      expect(item.hasAssignedPeople).toBe(true)
      expect(item.assignedTo).toHaveLength(2)
    })

    it("deve limpar atribuicoes", () => {
      const item = ItemEntity.create(validItemProps)
      expect(item.hasAssignedPeople).toBe(true)
      item.clearAssignment()
      expect(item.hasAssignedPeople).toBe(false)
    })

    it("deve retornar copia do array de assignedTo (encapsulamento)", () => {
      const item = ItemEntity.create(validItemProps)
      const assigned = item.assignedTo
      assigned.push({ id: "hacker", name: "Hacker" })
      expect(item.assignedTo).toHaveLength(1) // original inalterado
    })
  })

  describe("atualizacao de preco", () => {
    it("deve atualizar preco", () => {
      const item = ItemEntity.create(validItemProps)
      item.updatePrice(200)
      expect(item.priceValue).toBe(200)
    })

    it("deve lancar erro ao atualizar para preco negativo", () => {
      const item = ItemEntity.create(validItemProps)
      expect(() => item.updatePrice(-5)).toThrow("preço não pode ser negativo")
    })
  })

  describe("serializacao", () => {
    it("deve serializar para plain object", () => {
      const item = ItemEntity.create(validItemProps)
      const plain = item.toPlainObject()
      expect(plain.id).toBe("item-1")
      expect(plain.name).toBe("Bolo de Aniversario")
      expect(plain.price).toBe(150.5)
      expect(plain.assignedTo).toHaveLength(1)
    })

    it("deve serializar assignedTo como null quando vazio", () => {
      const item = ItemEntity.create({ ...validItemProps, assignedTo: null })
      const plain = item.toPlainObject()
      expect(plain.assignedTo).toBeNull()
    })
  })
})

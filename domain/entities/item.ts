import { Money } from "../value-objects/money"

/**
 * Entidade: Item
 * Representa um item/custo de um evento com comportamento e invariantes protegidos.
 * Invariantes:
 * - Nome é obrigatório
 * - Preço não pode ser negativo
 */

export interface ItemPerson {
  id: string
  name: string
}

export interface ItemProps {
  id: string
  name: string
  price: number
  assignedTo?: ItemPerson[] | null
  image?: string | null
  createdAt?: string
}

export class ItemEntity {
  readonly id: string
  readonly name: string
  private _price: Money
  private _assignedTo: ItemPerson[]
  readonly image: string | null
  readonly createdAt: string

  private constructor(props: {
    id: string
    name: string
    price: Money
    assignedTo: ItemPerson[]
    image: string | null
    createdAt: string
  }) {
    this.id = props.id
    this.name = props.name
    this._price = props.price
    this._assignedTo = props.assignedTo
    this.image = props.image
    this.createdAt = props.createdAt
  }

  /** Factory method para criar Item com validacoes */
  static create(props: ItemProps): ItemEntity {
    if (!props.name || !props.name.trim()) {
      throw new Error("Item: nome é obrigatório")
    }

    if (props.price < 0) {
      throw new Error("Item: preço não pode ser negativo")
    }

    return new ItemEntity({
      id: props.id,
      name: props.name.trim(),
      price: Money.fromReais(props.price),
      assignedTo: props.assignedTo || [],
      image: props.image || null,
      createdAt: props.createdAt || new Date().toISOString(),
    })
  }

  /** Reconstroi Item a partir de dados persistidos */
  static reconstitute(props: ItemProps): ItemEntity {
    return new ItemEntity({
      id: props.id,
      name: props.name,
      price: Money.fromReais(props.price),
      assignedTo: props.assignedTo || [],
      image: props.image || null,
      createdAt: props.createdAt || new Date().toISOString(),
    })
  }

  get price(): Money {
    return this._price
  }

  get priceValue(): number {
    return this._price.reais
  }

  get assignedTo(): ItemPerson[] {
    return [...this._assignedTo]
  }

  get hasAssignedPeople(): boolean {
    return this._assignedTo.length > 0
  }

  /** Atribui responsaveis ao item */
  assignPeople(people: ItemPerson[]): void {
    this._assignedTo = [...people]
  }

  /** Remove todos os responsaveis */
  clearAssignment(): void {
    this._assignedTo = []
  }

  /** Atualiza o preco */
  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error("Item: preço não pode ser negativo")
    }
    this._price = Money.fromReais(newPrice)
  }

  /** Serializa para formato compativel com o store/API existente */
  toPlainObject(): ItemProps {
    return {
      id: this.id,
      name: this.name,
      price: this._price.reais,
      assignedTo: this._assignedTo.length > 0 ? [...this._assignedTo] : null,
      image: this.image,
      createdAt: this.createdAt,
    }
  }
}

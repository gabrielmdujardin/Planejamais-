import { Money } from "../value-objects/money"
import { GuestEntity, type GuestProps } from "./guest"
import { ItemEntity, type ItemProps } from "./item"
import type { GuestStatusValue } from "../value-objects/guest-status"

/**
 * Aggregate Root: EventEntity
 * Representa um evento completo com toda sua logica de negocio encapsulada.
 * Invariantes:
 * - Titulo e obrigatorio
 * - Data e obrigatoria
 * - Localizacao e obrigatoria
 * - confirmed_guests deve ser consistente com a contagem real de convidados confirmados
 * - total_guests deve ser consistente com a contagem real de convidados
 */

export interface EventPhoto {
  id: string
  url: string
  filename: string
  uploadedBy: string
  uploadedAt: string
  description?: string
  tags?: string[]
}

export interface EventProps {
  id: string
  title: string
  type: string
  category?: string
  date: string
  time: string
  fullDate?: string
  location: string
  description: string
  confirmedGuests: number
  totalGuests: number
  items: ItemProps[]
  guests: GuestProps[]
  photos: EventPhoto[]
  bannerImage?: string
  createdAt: string
  updatedAt: string
}

export class EventEntity {
  readonly id: string
  private _title: string
  readonly type: string
  readonly category: string
  private _date: string
  private _time: string
  readonly fullDate: string
  private _location: string
  private _description: string
  private _guests: GuestEntity[]
  private _items: ItemEntity[]
  private _photos: EventPhoto[]
  readonly bannerImage?: string
  readonly createdAt: string
  private _updatedAt: string

  private constructor(props: {
    id: string
    title: string
    type: string
    category: string
    date: string
    time: string
    fullDate: string
    location: string
    description: string
    guests: GuestEntity[]
    items: ItemEntity[]
    photos: EventPhoto[]
    bannerImage?: string
    createdAt: string
    updatedAt: string
  }) {
    this.id = props.id
    this._title = props.title
    this.type = props.type
    this.category = props.category
    this._date = props.date
    this._time = props.time
    this.fullDate = props.fullDate
    this._location = props.location
    this._description = props.description
    this._guests = props.guests
    this._items = props.items
    this._photos = props.photos
    this.bannerImage = props.bannerImage
    this.createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  /** Factory method para criar um Event com validacoes */
  static create(props: EventProps): EventEntity {
    if (!props.title || !props.title.trim()) {
      throw new Error("Event: titulo e obrigatorio")
    }
    if (!props.date) {
      throw new Error("Event: data e obrigatoria")
    }
    if (!props.location || !props.location.trim()) {
      throw new Error("Event: localizacao e obrigatoria")
    }

    const guests = (props.guests || []).map((g) => GuestEntity.reconstitute(g))
    const items = (props.items || []).map((i) => ItemEntity.reconstitute(i))

    return new EventEntity({
      id: props.id,
      title: props.title.trim(),
      type: props.type,
      category: props.category || "",
      date: props.date,
      time: props.time,
      fullDate: props.fullDate || "",
      location: props.location.trim(),
      description: props.description || "",
      guests,
      items,
      photos: props.photos || [],
      bannerImage: props.bannerImage,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    })
  }

  // --- Getters ---

  get title(): string {
    return this._title
  }

  get date(): string {
    return this._date
  }

  get time(): string {
    return this._time
  }

  get location(): string {
    return this._location
  }

  get description(): string {
    return this._description
  }

  get updatedAt(): string {
    return this._updatedAt
  }

  get guests(): GuestEntity[] {
    return [...this._guests]
  }

  get items(): ItemEntity[] {
    return [...this._items]
  }

  get photos(): EventPhoto[] {
    return [...this._photos]
  }

  // --- Regras de negocio: Convidados ---

  /** Contagem total de convidados */
  get totalGuests(): number {
    return this._guests.length
  }

  /** Contagem de convidados confirmados */
  get confirmedGuests(): number {
    return this._guests.filter((g) => g.isConfirmed).length
  }

  /** Contagem de convidados pendentes */
  get pendingGuests(): number {
    return this._guests.filter((g) => g.isPending).length
  }

  /** Contagem de convidados que recusaram */
  get declinedGuests(): number {
    return this._guests.filter((g) => g.status.isDeclined).length
  }

  /** Porcentagem de confirmacao */
  get confirmationRate(): number {
    if (this._guests.length === 0) return 0
    return (this.confirmedGuests / this._guests.length) * 100
  }

  /** Adiciona convidados ao evento */
  addGuests(newGuests: GuestProps[]): void {
    const guestEntities = newGuests.map((g) => GuestEntity.create(g))
    this._guests = [...this._guests, ...guestEntities]
    this.touch()
  }

  /** Remove um convidado pelo ID */
  removeGuest(guestId: string): void {
    this._guests = this._guests.filter((g) => g.id !== guestId)
    this.touch()
  }

  /** Atualiza status de um convidado */
  updateGuestStatus(guestId: string, newStatus: GuestStatusValue): void {
    const guest = this._guests.find((g) => g.id === guestId)
    if (!guest) {
      throw new Error(`Event: convidado com ID "${guestId}" nao encontrado`)
    }
    guest.updateStatus(newStatus)
    this.touch()
  }

  /** Busca um convidado pelo ID */
  findGuest(guestId: string): GuestEntity | undefined {
    return this._guests.find((g) => g.id === guestId)
  }

  // --- Regras de negocio: Itens/Custos ---

  /** Custo total do evento */
  get totalCost(): Money {
    return this._items.reduce((sum, item) => sum.add(item.price), Money.zero())
  }

  /** Custo por pessoa (para eventos colaborativos) */
  get costPerPerson(): Money {
    if (this.confirmedGuests === 0) return Money.zero()
    return this.totalCost.divideBy(this.confirmedGuests)
  }

  /** Verifica se e um evento colaborativo */
  get isCollaborative(): boolean {
    return this.type === "Colaborativo"
  }

  /** Adiciona um item ao evento */
  addItem(itemProps: ItemProps): void {
    const item = ItemEntity.create(itemProps)
    this._items = [...this._items, item]
    this.touch()
  }

  /** Remove um item pelo ID */
  removeItem(itemId: string): void {
    this._items = this._items.filter((i) => i.id !== itemId)
    this.touch()
  }

  /** Busca um item pelo ID */
  findItem(itemId: string): ItemEntity | undefined {
    return this._items.find((i) => i.id === itemId)
  }

  // --- Regras de negocio: Fotos ---

  /** Adiciona uma foto */
  addPhoto(photo: Omit<EventPhoto, "id" | "uploadedAt">): void {
    const newPhoto: EventPhoto = {
      ...photo,
      id: `photo_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    }
    this._photos = [...this._photos, newPhoto]
    this.touch()
  }

  /** Remove uma foto pelo ID */
  removePhoto(photoId: string): void {
    this._photos = this._photos.filter((p) => p.id !== photoId)
    this.touch()
  }

  // --- Utilitarios ---

  /** Marca o evento como atualizado */
  private touch(): void {
    this._updatedAt = new Date().toISOString()
  }

  /** Serializa para formato compativel com o store/API existente */
  toPlainObject(): EventProps {
    return {
      id: this.id,
      title: this._title,
      type: this.type,
      category: this.category || undefined,
      date: this._date,
      time: this._time,
      fullDate: this.fullDate || undefined,
      location: this._location,
      description: this._description,
      confirmedGuests: this.confirmedGuests,
      totalGuests: this.totalGuests,
      items: this._items.map((i) => i.toPlainObject()),
      guests: this._guests.map((g) => g.toPlainObject()),
      photos: [...this._photos],
      bannerImage: this.bannerImage,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    }
  }
}

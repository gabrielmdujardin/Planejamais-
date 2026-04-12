import { Email } from "../value-objects/email"
import { Phone } from "../value-objects/phone"
import { GuestStatus, type GuestStatusValue } from "../value-objects/guest-status"

/**
 * Entidade: Guest (Convidado)
 * Representa um convidado de um evento com comportamento e invariantes protegidos.
 * Invariantes:
 * - Nome é obrigatório
 * - Email deve ser válido
 * - Telefone deve ser válido
 * - Status só pode ter valores permitidos
 */

export interface GuestProps {
  id: string
  name: string
  email: string
  phone: string
  status: GuestStatusValue
  contactId?: string
  createdAt?: string
}

export class GuestEntity {
  readonly id: string
  readonly name: string
  readonly email: Email
  readonly phone: Phone
  private _status: GuestStatus
  readonly contactId?: string
  readonly createdAt: string

  private constructor(props: {
    id: string
    name: string
    email: Email
    phone: Phone
    status: GuestStatus
    contactId?: string
    createdAt: string
  }) {
    this.id = props.id
    this.name = props.name
    this.email = props.email
    this.phone = props.phone
    this._status = props.status
    this.contactId = props.contactId
    this.createdAt = props.createdAt
  }

  /** Factory method para criar um Guest com validações */
  static create(props: GuestProps): GuestEntity {
    if (!props.name || !props.name.trim()) {
      throw new Error("Guest: nome é obrigatório")
    }

    const email = Email.create(props.email)
    const phone = Phone.create(props.phone)
    const status = props.status ? GuestStatus.create(props.status) : GuestStatus.pending()

    return new GuestEntity({
      id: props.id,
      name: props.name.trim(),
      email,
      phone,
      status,
      contactId: props.contactId,
      createdAt: props.createdAt || new Date().toISOString(),
    })
  }

  /** Reconstroi Guest a partir de dados persistidos (sem revalidar) */
  static reconstitute(props: GuestProps): GuestEntity {
    return new GuestEntity({
      id: props.id,
      name: props.name,
      email: Email.create(props.email),
      phone: Phone.create(props.phone),
      status: GuestStatus.create(props.status),
      contactId: props.contactId,
      createdAt: props.createdAt || new Date().toISOString(),
    })
  }

  get status(): GuestStatus {
    return this._status
  }

  get statusValue(): GuestStatusValue {
    return this._status.value
  }

  /** Confirma presenca do convidado */
  confirm(): void {
    this._status = GuestStatus.confirmed()
  }

  /** Recusa o convite */
  decline(): void {
    this._status = GuestStatus.declined()
  }

  /** Redefine para pendente */
  resetToPending(): void {
    this._status = GuestStatus.pending()
  }

  /** Atualiza status generico */
  updateStatus(newStatus: GuestStatusValue): void {
    this._status = GuestStatus.create(newStatus)
  }

  /** Verifica se o convidado esta confirmado */
  get isConfirmed(): boolean {
    return this._status.isConfirmed
  }

  /** Verifica se o convidado esta pendente */
  get isPending(): boolean {
    return this._status.isPending
  }

  /** Serializa para formato compativel com o store/API existente */
  toPlainObject(): GuestProps {
    return {
      id: this.id,
      name: this.name,
      email: this.email.value,
      phone: this.phone.formatted,
      status: this._status.value,
      contactId: this.contactId,
      createdAt: this.createdAt,
    }
  }
}

// Value Objects
export { Money } from "./value-objects/money"
export { Email } from "./value-objects/email"
export { Phone } from "./value-objects/phone"
export { GuestStatus, type GuestStatusValue } from "./value-objects/guest-status"

// Entities
export { EventEntity, type EventProps, type EventPhoto } from "./entities/event"
export { GuestEntity, type GuestProps } from "./entities/guest"
export { ItemEntity, type ItemProps, type ItemPerson } from "./entities/item"

// Repository Interfaces
export type { IEventRepository } from "./repositories/event-repository"
export type { IContactRepository, ContactData, ContactListData } from "./repositories/contact-repository"

/**
 * Interface de Repositorio: IContactRepository
 * Define o contrato para persistencia de contatos.
 */

export interface ContactData {
  id: string
  name: string
  email: string
  phone: string
  isFavorite: boolean
  lists: string[]
  avatar?: string
  createdAt: string
}

export interface ContactListData {
  id: string
  name: string
  contacts: string[]
  createdAt: string
}

export interface IContactRepository {
  /** Busca todos os contatos do usuario */
  findAll(): Promise<ContactData[]>

  /** Busca um contato por ID */
  findById(contactId: string): Promise<ContactData | null>

  /** Cria um novo contato */
  create(contact: Omit<ContactData, "id" | "createdAt" | "isFavorite">): Promise<ContactData>

  /** Atualiza um contato */
  update(contactId: string, data: Partial<ContactData>): Promise<ContactData>

  /** Remove um contato */
  delete(contactId: string): Promise<void>

  /** Busca todas as listas de contatos */
  findAllLists(): Promise<ContactListData[]>

  /** Cria uma lista de contatos */
  createList(list: Omit<ContactListData, "id" | "createdAt">): Promise<ContactListData>

  /** Atualiza uma lista de contatos */
  updateList(listId: string, data: Partial<ContactListData>): Promise<ContactListData>

  /** Remove uma lista de contatos */
  deleteList(listId: string): Promise<void>
}

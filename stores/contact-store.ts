"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  isFavorite: boolean
  lists: string[]
  avatar?: string
  createdAt: string
}

export interface ContactList {
  id: string
  name: string
  contacts: string[]
  createdAt: string
}

interface ContactStore {
  contacts: Contact[]
  contactLists: ContactList[]
  isLoading: boolean

  // Contacts
  addContact: (contact: Omit<Contact, "id" | "createdAt">) => void
  updateContact: (id: string, contact: Partial<Contact>) => void
  removeContact: (id: string) => void
  getContactById: (id: string) => Contact | undefined
  toggleFavorite: (id: string) => void

  // Lists
  addContactList: (list: Omit<ContactList, "id" | "createdAt">) => void
  updateContactList: (id: string, list: Partial<ContactList>) => void
  removeContactList: (id: string) => void
  getContactListById: (id: string) => ContactList | undefined
  addContactToList: (contactId: string, listId: string) => void
  removeContactFromList: (contactId: string, listId: string) => void

  // Utilities
  searchContacts: (query: string) => Contact[]
  getContactsByList: (listId: string) => Contact[]
  initializeData: () => void
}

const sampleContacts: Contact[] = [
  {
    id: "contact_1",
    name: "João Silva",
    email: "joao@example.com",
    phone: "(11) 98765-4321",
    isFavorite: true,
    lists: ["list_1"],
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "contact_2",
    name: "Maria Oliveira",
    email: "maria@example.com",
    phone: "(11) 91234-5678",
    isFavorite: true,
    lists: ["list_1"],
    createdAt: "2024-01-15T10:05:00Z",
  },
  {
    id: "contact_3",
    name: "Pedro Santos",
    email: "pedro@example.com",
    phone: "(11) 99876-5432",
    isFavorite: false,
    lists: ["list_2"],
    createdAt: "2024-01-15T10:10:00Z",
  },
  {
    id: "contact_4",
    name: "Ana Costa",
    email: "ana@example.com",
    phone: "(11) 95555-4444",
    isFavorite: false,
    lists: [],
    createdAt: "2024-01-15T10:15:00Z",
  },
  {
    id: "contact_5",
    name: "Lucas Ferreira",
    email: "lucas@example.com",
    phone: "(11) 93333-2222",
    isFavorite: false,
    lists: ["list_2"],
    createdAt: "2024-01-15T10:20:00Z",
  },
]

const sampleContactLists: ContactList[] = [
  {
    id: "list_1",
    name: "Amigos próximos",
    contacts: ["contact_1", "contact_2"],
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "list_2",
    name: "Colegas de trabalho",
    contacts: ["contact_3", "contact_5"],
    createdAt: "2024-01-15T09:05:00Z",
  },
]

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],
      contactLists: [],
      isLoading: false,

      initializeData: () => {
        const { contacts, contactLists } = get()
        if (contacts.length === 0) {
          set({ contacts: sampleContacts, contactLists: sampleContactLists })
        }
      },

      addContact: (contactData) => {
        const newContact: Contact = {
          ...contactData,
          id: `contact_${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          contacts: [...state.contacts, newContact],
        }))
      },

      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((contact) => (contact.id === id ? { ...contact, ...updates } : contact)),
        }))
      },

      removeContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
          contactLists: state.contactLists.map((list) => ({
            ...list,
            contacts: list.contacts.filter((contactId) => contactId !== id),
          })),
        }))
      },

      getContactById: (id) => {
        const { contacts } = get()
        return contacts.find((contact) => contact.id === id)
      },

      toggleFavorite: (id) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id ? { ...contact, isFavorite: !contact.isFavorite } : contact,
          ),
        }))
      },

      addContactList: (listData) => {
        const newList: ContactList = {
          ...listData,
          id: `list_${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          contactLists: [...state.contactLists, newList],
        }))
      },

      updateContactList: (id, updates) => {
        set((state) => ({
          contactLists: state.contactLists.map((list) => (list.id === id ? { ...list, ...updates } : list)),
        }))
      },

      removeContactList: (id) => {
        set((state) => ({
          contactLists: state.contactLists.filter((list) => list.id !== id),
          contacts: state.contacts.map((contact) => ({
            ...contact,
            lists: contact.lists.filter((listId) => listId !== id),
          })),
        }))
      },

      getContactListById: (id) => {
        const { contactLists } = get()
        return contactLists.find((list) => list.id === id)
      },

      addContactToList: (contactId, listId) => {
        set((state) => ({
          contactLists: state.contactLists.map((list) =>
            list.id === listId && !list.contacts.includes(contactId)
              ? { ...list, contacts: [...list.contacts, contactId] }
              : list,
          ),
          contacts: state.contacts.map((contact) =>
            contact.id === contactId && !contact.lists.includes(listId)
              ? { ...contact, lists: [...contact.lists, listId] }
              : contact,
          ),
        }))
      },

      removeContactFromList: (contactId, listId) => {
        set((state) => ({
          contactLists: state.contactLists.map((list) =>
            list.id === listId ? { ...list, contacts: list.contacts.filter((id) => id !== contactId) } : list,
          ),
          contacts: state.contacts.map((contact) =>
            contact.id === contactId ? { ...contact, lists: contact.lists.filter((id) => id !== listId) } : contact,
          ),
        }))
      },

      searchContacts: (query) => {
        const { contacts } = get()
        if (!query.trim()) return contacts

        return contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(query.toLowerCase()) ||
            contact.email.toLowerCase().includes(query.toLowerCase()) ||
            contact.phone.includes(query),
        )
      },

      getContactsByList: (listId) => {
        const { contacts, contactLists } = get()
        const list = contactLists.find((l) => l.id === listId)
        if (!list) return []

        return contacts.filter((contact) => list.contacts.includes(contact.id))
      },
    }),
    {
      name: "contact-storage",
    },
  ),
)

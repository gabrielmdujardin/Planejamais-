"use client"

import {
  createContactAction,
  createContactListAction,
  deleteContactAction,
  deleteContactListAction,
  getContactsDataAction,
  updateContactAction,
  updateContactListAction,
} from "@/app/actions/contacts"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  isFavorite?: boolean
  lists: string[]
  tags?: string[]
  notes?: string
  avatar?: string
  createdAt: string
}

export interface ContactList {
  id: string
  name: string
  description?: string
  color?: string
  contacts: string[]
  createdAt: string
}

interface ContactStore {
  contacts: Contact[]
  contactLists: ContactList[]
  isLoading: boolean

  // Contacts
  addContact: (contact: Omit<Contact, "id" | "createdAt">) => Promise<Contact>
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>
  removeContact: (id: string) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  getContactById: (id: string) => Contact | undefined
  toggleFavorite: (id: string) => void

  // Lists
  addContactList: (list: Omit<ContactList, "id" | "createdAt">) => Promise<ContactList>
  updateContactList: (id: string, list: Partial<ContactList>) => Promise<void>
  removeContactList: (id: string) => Promise<void>
  deleteContactList: (id: string) => Promise<void>
  getContactListById: (id: string) => ContactList | undefined
  addContactToList: (contactId: string, listId: string) => void
  removeContactFromList: (contactId: string, listId: string) => void

  // Utilities
  searchContacts: (query: string) => Contact[]
  getContactsByList: (listId: string) => Contact[]
  initializeData: () => Promise<void>
  clearAll: () => void
}

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],
      contactLists: [],
      isLoading: false,

      clearAll: () => set({ contacts: [], contactLists: [] }),

      initializeData: async () => {
        set({ isLoading: true })
        try {
          const result = await getContactsDataAction()
          if (!result.localOnly && !result.error) {
            set({
              contacts: result.contacts.map((c: any) => ({
                ...c,
                isFavorite: false,
                lists: Array.isArray(c.lists) ? c.lists : [],
              })),
              contactLists: result.contactLists.map((l: any) => ({
                ...l,
                contacts: Array.isArray(l.contacts) ? l.contacts : [],
              })),
            })
          }
        } catch {
          // Mantém fallback local em modo demo
        } finally {
          set({ isLoading: false })
        }
      },

      addContact: async (contactData) => {
        const lists = Array.isArray(contactData.lists) ? contactData.lists : []
        let createdContact: Contact = {
          ...contactData,
          lists,
          isFavorite: contactData.isFavorite ?? false,
          id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        }

        try {
          const res = await createContactAction({
            name: contactData.name,
            email: contactData.email,
            phone: contactData.phone,
            lists,
            tags: contactData.tags || [],
            notes: contactData.notes || null,
          })
          if (res.data) {
            createdContact = {
              ...createdContact,
              ...res.data,
              lists: Array.isArray(res.data.lists) ? res.data.lists : lists,
            }
          }
        } catch {
          // Fallback local
        }

        set((state) => ({
          contacts: [...state.contacts, createdContact],
          contactLists: state.contactLists.map((list) =>
            lists.includes(list.id) && !list.contacts.includes(createdContact.id)
              ? { ...list, contacts: [...list.contacts, createdContact.id] }
              : list
          ),
        }))

        return createdContact
      },

      updateContact: async (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        }))

        try {
          await updateContactAction(id, {
            name: updates.name,
            email: updates.email,
            phone: updates.phone,
            lists: updates.lists,
            tags: updates.tags,
            notes: updates.notes,
          })
        } catch {
          // Fallback local
        }
      },

      removeContact: async (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
          contactLists: state.contactLists.map((list) => ({
            ...list,
            contacts: list.contacts.filter((contactId) => contactId !== id),
          })),
        }))

        try {
          await deleteContactAction(id)
        } catch {
          // Fallback local
        }
      },

      deleteContact: async (id) => {
        await get().removeContact(id)
      },

      getContactById: (id) => {
        const { contacts } = get()
        return contacts.find((contact) => contact.id === id)
      },

      toggleFavorite: (id) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id ? { ...contact, isFavorite: !contact.isFavorite } : contact
          ),
        }))
      },

      addContactList: async (listData) => {
        const memberIds = Array.isArray(listData.contacts) ? listData.contacts : []
        let createdList: ContactList = {
          ...listData,
          contacts: memberIds,
          id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        }

        try {
          const res = await createContactListAction({
            name: listData.name,
            description: listData.description || "",
            color: listData.color || "#3b82f6",
            contacts: memberIds,
          })
          if (res.data) {
            createdList = {
              ...createdList,
              ...res.data,
              contacts: Array.isArray(res.data.contacts) ? res.data.contacts : memberIds,
            }
          }
        } catch {
          // Fallback local
        }

        set((state) => ({
          contactLists: [...state.contactLists, createdList],
          contacts: state.contacts.map((contact) =>
            memberIds.includes(contact.id) && !contact.lists.includes(createdList.id)
              ? { ...contact, lists: [...contact.lists, createdList.id] }
              : contact
          ),
        }))

        return createdList
      },

      updateContactList: async (id, updates) => {
        set((state) => ({
          contactLists: state.contactLists.map((list) =>
            list.id === id ? { ...list, ...updates } : list
          ),
        }))

        try {
          await updateContactListAction(id, {
            name: updates.name,
            description: updates.description,
            color: updates.color,
            contacts: updates.contacts,
          })
        } catch {
          // Fallback local
        }
      },

      removeContactList: async (id) => {
        set((state) => ({
          contactLists: state.contactLists.filter((list) => list.id !== id),
          contacts: state.contacts.map((contact) => ({
            ...contact,
            lists: (contact.lists || []).filter((listId) => listId !== id),
          })),
        }))

        try {
          await deleteContactListAction(id)
        } catch {
          // Fallback local
        }
      },

      deleteContactList: async (id) => {
        await get().removeContactList(id)
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
              : list
          ),
          contacts: state.contacts.map((contact) =>
            contact.id === contactId && !contact.lists.includes(listId)
              ? { ...contact, lists: [...contact.lists, listId] }
              : contact
          ),
        }))
      },

      removeContactFromList: (contactId, listId) => {
        set((state) => ({
          contactLists: state.contactLists.map((list) =>
            list.id === listId ? { ...list, contacts: list.contacts.filter((id) => id !== contactId) } : list
          ),
          contacts: state.contacts.map((contact) =>
            contact.id === contactId ? { ...contact, lists: contact.lists.filter((id) => id !== listId) } : contact
          ),
        }))
      },

      searchContacts: (query) => {
        const { contacts } = get()
        if (!query.trim()) return contacts

        const q = query.toLowerCase()
        return contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(q) ||
            contact.email.toLowerCase().includes(q) ||
            contact.phone.includes(query)
        )
      },

      getContactsByList: (listId) => {
        const { contacts, contactLists } = get()
        const list = contactLists.find((l) => l.id === listId)
        if (!list) return []

        return contacts.filter(
          (contact) => list.contacts.includes(contact.id) || (contact.lists || []).includes(listId)
        )
      },
    }),
    {
      name: "contact-storage",
    }
  )
)

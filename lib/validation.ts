import { z } from "zod"

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se um número de telefone está em formato válido
 * Aceita formatos mais flexíveis para telefones brasileiros
 */
export function isValidPhone(phone: string): boolean {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, "")

  // Verifica se tem pelo menos 10 dígitos (DDD + número)
  // Telefones brasileiros têm 10 ou 11 dígitos (com o 9 na frente)
  return numbers.length >= 10 && numbers.length <= 11
}

/**
 * Formata um número de telefone para o formato (00) 00000-0000
 */
export function formatPhone(phone: string): string {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, "")

  // Verifica se tem a quantidade correta de dígitos
  if (numbers.length < 10 || numbers.length > 11) {
    return phone // Retorna o original se não tiver o formato esperado
  }

  // Formata para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (numbers.length === 11) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`
  } else {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`
  }
}

/**
 * Zod Schema para validação de acompanhantes em convites públicos
 */
export const companionSchema = z.object({
  name: z.string().trim().min(2, "Nome do acompanhante deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail do acompanhante inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(500, "Observações muito longas").optional().or(z.literal("")),
})

/**
 * Zod Schema para validação de payload de RSVP / Convite Público
 */
export const publicRsvpSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório e deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Formato de e-mail inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  attendanceStatus: z.enum(["confirmed", "declined"]).default("confirmed"),
  notes: z.string().trim().max(500, "Observações devem ter no máximo 500 caracteres").optional().or(z.literal("")),
  dietaryRestrictions: z.string().trim().max(500, "Restrições alimentares devem ter no máximo 500 caracteres").optional().or(z.literal("")),
  accessibilityNeeds: z.string().trim().max(500, "Necessidades de acessibilidade devem ter no máximo 500 caracteres").optional().or(z.literal("")),
  companions: z.array(companionSchema).max(10, "Número de acompanhantes excede o limite").optional().default([]),
})

export type PublicRsvpInput = z.infer<typeof publicRsvpSchema>

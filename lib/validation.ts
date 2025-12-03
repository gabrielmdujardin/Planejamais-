/**
 * Valida se um email está em formato válido
 */
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

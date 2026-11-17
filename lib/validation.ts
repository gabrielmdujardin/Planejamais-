import { z } from "zod"

const GUEST_STATUS_MAP: Record<string, string> = {
  pendente: "pending",
  pending: "pending",
  confirmado: "confirmed",
  confirmed: "confirmed",
  recusado: "declined",
  declined: "declined",
  rejected: "declined",
  aguardando_aprovacao: "awaiting_approval",
  awaiting_approval: "awaiting_approval",
  pending_approval: "awaiting_approval",
  expirado: "expired",
  expired: "expired",
  cancelado: "cancelled",
  cancelled: "cancelled",
  canceled: "cancelled",
}

function normalizeGuestStatus(status: unknown): string | null {
  if (typeof status !== "string") return null
  return GUEST_STATUS_MAP[status.trim().toLowerCase()] ?? null
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se um número de telefone está em formato válido
 * Aceita formatos mais flexíveis para telefones brasileiros
 */
export function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, "")
  return numbers.length >= 10 && numbers.length <= 11
}

/**
 * Formata um número de telefone para o formato (00) 00000-0000
 */
export function formatPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, "")

  if (numbers.length < 10 || numbers.length > 11) {
    return phone
  }

  if (numbers.length === 11) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`
  } else {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`
  }
}

/**
 * RN-001, RF-001, RF-002: Autenticação e Cadastro de Conta
 */
export const registerUserSchema = z
  .object({
    name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres").max(120, "Nome muito longo"),
    email: z.string().trim().toLowerCase().email("Formato de e-mail inválido").max(255),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(128),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => data.confirmPassword === undefined || data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export const loginUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Formato de e-mail inválido").max(255),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(128),
})

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres").max(120).optional(),
  email: z.string().trim().toLowerCase().email("Formato de e-mail inválido").max(255).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  avatar: z.string().trim().max(2048).optional().or(z.literal("")),
})

/**
 * RN-003, RF-005, RF-007, RF-034: Criação e Edição de Evento
 */
const nullableNonNegativeNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
  z.number({ message: "Valor numérico inválido" }).min(0, "O valor não pode ser negativo").nullable()
)

const eventPayloadObjectSchema = z
  .object({
    title: z.string().trim().min(1, "Nome do evento é obrigatório").max(160, "Nome muito longo"),
    type: z.string().trim().min(1, "Tipo do evento é obrigatório").max(80),
    category: z.string().trim().max(80).nullable().optional(),
    status: z
      .enum(["draft", "active", "completed", "canceled", "confirmed", "pending", "cancelled"])
      .optional()
      .default("active"),
    visibility: z.enum(["private", "public"]).optional().default("private"),
    financialMode: z.enum(["corporate_budget", "collaborative_split"]).optional(),
    date: z.string().trim().optional().default(""),
    time: z.string().trim().optional().default(""),
    fullDate: z.string().trim().nullable().optional(),
    startDate: z.string().trim().nullable().optional(),
    startTime: z.string().trim().nullable().optional(),
    endDate: z.string().trim().nullable().optional(),
    endTime: z.string().trim().nullable().optional(),
    location: z.string().trim().max(255).optional().default(""),
    address: z.string().trim().max(255).nullable().optional(),
    mapsUrl: z.string().trim().max(1024).nullable().optional(),
    eventMode: z.enum(["presential", "online", "hybrid"]).optional().default("presential"),
    meetingUrl: z.string().trim().max(1024).nullable().optional(),
    description: z.string().trim().max(5000).optional().default(""),
    image: z.string().trim().max(2000000).nullable().optional(),
    capacity: nullableNonNegativeNumber.optional(),
    allowGuests: z.boolean().optional().default(true),
    allowCompanions: z.boolean().optional().default(false),
    maxCompanionsPerGuest: z.coerce.number().int().min(0, "O máximo de acompanhantes não pode ser negativo").max(20).optional().default(0),
    companionsRequireApproval: z.boolean().optional().default(false),
    publicInviteEnabled: z.boolean().optional().default(false),
    publicInviteToken: z.string().trim().nullable().optional(),
    hostViewEnabled: z.boolean().optional(),
    hostViewToken: z.string().trim().nullable().optional(),
    autoApprovePublicGuests: z.boolean().optional().default(false),
    rsvpEnabled: z.boolean().optional().default(true),
    rsvpDeadline: z.string().trim().nullable().optional(),
    allowResponseEdit: z.boolean().optional().default(true),
    invitationMessage: z.string().trim().max(1000).nullable().optional(),
    budgetEstimated: nullableNonNegativeNumber.optional(),
    initialEstimatedCost: nullableNonNegativeNumber.optional(),
    currency: z.string().trim().max(10).optional().default("BRL"),
    financialNotes: z.string().trim().max(2000).nullable().optional(),
    guests: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          email: z.string().trim().optional().default(""),
          phone: z.string().trim().optional().default(""),
          contactId: z.string().trim().nullable().optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const effectiveStartDate = data.startDate || data.fullDate || data.date
    const effectiveStartTime = data.startTime || data.time

    if (!effectiveStartDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data do evento é obrigatória", path: ["startDate"] })
    }

    if (!effectiveStartTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Horário de início é obrigatório", path: ["startTime"] })
    }

    if (data.endTime && effectiveStartTime && (!data.endDate || data.endDate === data.startDate) && data.endTime <= effectiveStartTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O horário de término precisa ser depois do início",
        path: ["endTime"],
      })
    }

    if (data.eventMode !== "online" && !String(data.location || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Local é obrigatório para eventos presenciais ou híbridos",
        path: ["location"],
      })
    }

    if (data.eventMode !== "presential" && !String(data.meetingUrl || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Link da reunião é obrigatório para eventos online ou híbridos",
        path: ["meetingUrl"],
      })
    }

    if (data.rsvpDeadline && data.startDate && data.rsvpDeadline.slice(0, 10) > data.startDate.slice(0, 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data limite de confirmação não pode ser depois da data do evento",
        path: ["rsvpDeadline"],
      })
    }
  })

export const eventPayloadSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw
  const input = raw as Record<string, any>
  return {
    ...input,
    type: input.type ?? input.event_type,
    startDate: input.startDate ?? input.start_date,
    startTime: input.startTime ?? input.start_time,
    endDate: input.endDate ?? input.end_date,
    endTime: input.endTime ?? input.end_time,
    eventMode: input.eventMode ?? input.event_mode,
    meetingUrl: input.meetingUrl ?? input.meeting_url,
    budgetEstimated: input.budgetEstimated ?? input.budget_estimated ?? input.budget,
  }
}, eventPayloadObjectSchema)

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
const publicRsvpObjectSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório e deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Formato de e-mail inválido").max(255),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || v.length >= 8, "Telefone inválido")
    .optional()
    .default(""),
  attendanceStatus: z.enum(["confirmed", "declined"]).default("confirmed"),
  notes: z.string().trim().max(500, "Observações devem ter no máximo 500 caracteres").optional().or(z.literal("")),
  dietaryRestrictions: z.string().trim().max(500, "Restrições alimentares devem ter no máximo 500 caracteres").optional().or(z.literal("")),
  accessibilityNeeds: z.string().trim().max(500, "Necessidades de acessibilidade devem ter no máximo 500 caracteres").optional().or(z.literal("")),
  companions: z.array(companionSchema).max(10, "Número de acompanhantes excede o limite").optional().default([]),
})

export const publicRsvpSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw
  const input = raw as Record<string, any>
  let mappedStatus = input.attendanceStatus
  if (mappedStatus === undefined && input.response !== undefined) {
    const resp = String(input.response).trim().toLowerCase()
    if (resp === "yes" || resp === "sim" || resp === "confirmed" || resp === "confirmado") {
      mappedStatus = "confirmed"
    } else if (resp === "no" || resp === "nao" || resp === "não" || resp === "declined" || resp === "recusado") {
      mappedStatus = "declined"
    } else {
      mappedStatus = input.response
    }
  }
  return {
    ...input,
    attendanceStatus: mappedStatus ?? "confirmed",
  }
}, publicRsvpObjectSchema)

export type PublicRsvpInput = z.infer<typeof publicRsvpSchema>

/**
 * RN-004, RF-010, RF-011, RF-013, RF-033, RF-035: Convidados e Aprovação
 */
export const guestStatusSchema = z.preprocess(
  (val) => normalizeGuestStatus(val) ?? val,
  z.enum([
    "awaiting_approval",
    "pending",
    "confirmed",
    "declined",
    "expired",
    "cancelled",
  ])
)

export const guestSingleCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome do convidado é obrigatório").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || isValidEmail(v), "E-mail do convidado inválido")
    .optional()
    .default(""),
  phone: z.string().trim().max(30).optional().default(""),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  dietaryRestrictions: z.string().trim().max(500).optional().or(z.literal("")),
  accessibilityNeeds: z.string().trim().max(500).optional().or(z.literal("")),
  contactId: z.string().trim().nullable().optional(),
  sendEmail: z.boolean().optional(),
})

export const guestBatchCreateSchema = z.object({
  guests: z.array(guestSingleCreateSchema).min(1, "Informe pelo menos um convidado").max(1000),
  sendEmails: z.boolean().optional().default(false),
  confirmationDeadlineDays: z.coerce.number().int().min(1).max(365).optional().default(7),
})

export const guestUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nome do convidado é obrigatório").max(120).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || isValidEmail(v), "E-mail do convidado inválido")
    .optional(),
  phone: z.string().trim().max(30).optional(),
  status: guestStatusSchema.optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  department: z.string().trim().max(120).nullable().optional(),
  dietaryRestrictions: z.string().trim().max(500).nullable().optional(),
  accessibilityNeeds: z.string().trim().max(500).nullable().optional(),
})

export const confirmInviteAcceptSchema = z.object({
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  dietaryRestrictions: z.string().trim().max(500).optional().or(z.literal("")),
  accessibilityNeeds: z.string().trim().max(500).optional().or(z.literal("")),
  companions: z.array(companionSchema).max(10).optional().default([]),
})

export const approvalDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]).optional(),
  approvedCompanionIds: z.array(z.string().trim()).optional(),
  rejectedCompanionIds: z.array(z.string().trim()).optional(),
  confirmationDeadlineDays: z.coerce.number().int().min(1).max(365).optional().default(7),
  approvalMessage: z.string().trim().max(500).optional().or(z.literal("")),
  sendEmail: z.boolean().optional().default(false),
})

export const rejectionDecisionSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  sendEmail: z.boolean().optional().default(true),
})

export const publicLinkSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  autoApprove: z.boolean().optional(),
  allowCompanions: z.boolean().optional(),
  maxCompanions: z.coerce.number().int().min(0).max(20).optional(),
  rsvpDeadline: z.string().trim().nullable().optional(),
  regenerateToken: z.boolean().optional(),
})

/**
 * RN-010, RF-018, RF-019: Itens / Gastos do Evento
 */
const itemPricePreprocessor = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
  z.number({ message: "Valor do item inválido" }).min(0, "O valor do item não pode ser negativo")
)

const assignedPersonItemSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1, "Nome do responsável inválido").max(120),
  type: z.enum(["guest", "contact", "manual", "custom"]).optional().default("manual"),
})

export const itemAssignedToSchema = z
  .union([
    z.array(assignedPersonItemSchema),
    assignedPersonItemSchema,
    z
      .string()
      .trim()
      .min(1)
      .max(120)
      .transform((name) => ({ name, type: "manual" as const })),
    z.null(),
  ])
  .optional()

const itemCreateObjectSchema = z.object({
  eventId: z.string().trim().min(1, "Evento é obrigatório"),
  name: z.string().trim().min(1, "O nome do item é obrigatório").max(160),
  price: itemPricePreprocessor,
  unitPrice: itemPricePreprocessor.optional(),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero").max(100000).optional().default(1),
  category: z.string().trim().max(80).optional().default("Geral"),
  supplier: z.string().trim().max(160).nullable().optional(),
  paymentStatus: z
    .enum(["pending", "partial", "paid", "estimated", "cancelled"])
    .optional()
    .default("pending"),
  dueDate: z.string().trim().nullable().optional(),
  invoiceNumber: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  image: z.string().trim().max(2000000).nullable().optional(),
  assignedTo: itemAssignedToSchema,
})

export const itemCreateSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw
  const input = raw as Record<string, any>
  const rawUnitPrice = input.unitPrice ?? input.unit_price
  const rawQty = input.quantity !== undefined && input.quantity !== null && input.quantity !== "" ? Number(input.quantity) : 1
  const computedPrice =
    input.price !== undefined
      ? input.price
      : rawUnitPrice !== undefined && rawUnitPrice !== null && rawUnitPrice !== ""
      ? Number(rawUnitPrice) * (Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1)
      : 0

  return {
    ...input,
    eventId: input.eventId ?? input.event_id,
    unitPrice: rawUnitPrice,
    price: computedPrice,
  }
}, itemCreateObjectSchema)

const itemUpdateObjectSchema = z.object({
  name: z.string().trim().min(1, "O nome do item é obrigatório").max(160).optional(),
  price: itemPricePreprocessor.optional(),
  unitPrice: itemPricePreprocessor.optional(),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero").max(100000).optional(),
  category: z.string().trim().max(80).optional(),
  supplier: z.string().trim().max(160).nullable().optional(),
  paymentStatus: z.enum(["pending", "partial", "paid", "estimated", "cancelled"]).optional(),
  dueDate: z.string().trim().nullable().optional(),
  invoiceNumber: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  image: z.string().trim().max(2000000).nullable().optional(),
  assignedTo: itemAssignedToSchema,
})

export const itemUpdateSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw
  const input = raw as Record<string, any>
  const rawUnitPrice = input.unitPrice ?? input.unit_price
  return {
    ...input,
    ...(rawUnitPrice !== undefined ? { unitPrice: rawUnitPrice } : {}),
  }
}, itemUpdateObjectSchema)

/**
 * RN-014, RF-022: Contatos e Listas de Contatos
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome do contato é obrigatório").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || isValidEmail(v), "Formato de e-mail inválido")
    .optional()
    .default(""),
  phone: z.string().trim().max(30).optional().default(""),
  tags: z.array(z.string().trim().max(50)).optional().default([]),
  lists: z.array(z.string().trim()).optional().default([]),
  notes: z.string().trim().max(500).nullable().optional(),
})

export const contactListSchema = z.object({
  name: z.string().trim().min(2, "Nome da lista é obrigatório").max(100),
  description: z.string().trim().max(500).optional().default(""),
  color: z.string().trim().max(30).optional().default("#3b82f6"),
  contacts: z.array(z.string().trim()).optional().default([]),
})

/**
 * RN-018, RF-028: Fotos da Galeria do Evento
 */
const photoCreateObjectSchema = z.object({
  eventId: z.string().trim().min(1, "Evento é obrigatório"),
  url: z.string().trim().min(1, "URL ou imagem é obrigatória").max(5000000),
  filename: z.string().trim().min(1, "Nome do arquivo é obrigatório").max(255),
  description: z.string().trim().max(500).nullable().optional(),
  tags: z.array(z.string().trim().max(50)).optional().default([]),
})

export const photoCreateSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw
  const input = raw as Record<string, any>
  const resolvedUrl = String(input.url ?? input.file_url ?? "").trim()
  const derivedFilename =
    input.filename ??
    (resolvedUrl ? resolvedUrl.split("/").pop()?.split("?")[0] || "foto.jpg" : "")

  return {
    ...input,
    eventId: input.eventId ?? input.event_id,
    url: resolvedUrl,
    filename: derivedFilename,
    description: input.description ?? input.caption,
  }
}, photoCreateObjectSchema)

/**
 * RN-017, RF-030: Envio de Convites e Lembretes
 */
export const sendInvitesPayloadSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw
  const input = raw as Record<string, any>
  return {
    ...input,
    guestIds: input.guestIds ?? input.guest_ids,
  }
}, z.object({
  eventId: z.string().trim().optional(),
  guestIds: z.array(z.string().trim()).optional(),
  onlyPending: z.boolean().optional().default(true),
  confirmationDeadlineDays: z.coerce.number().int().min(1).max(365).optional().default(7),
  subject: z.string().trim().max(200).optional(),
}))

/**
 * RN-002, RF-039 a RF-043: Gestão Colaborativa de Equipe e Permissões (RBAC por Evento)
 */
export const eventRoleSchema = z.enum(["owner", "admin", "collaborator", "viewer"])

export const teamInviteSchema = z.object({
  eventId: z.string().trim().min(1, "Identificador do evento é obrigatório"),
  email: z.string().trim().toLowerCase().email("E-mail do colaborador inválido").max(255),
  name: z.string().trim().min(2, "Nome do colaborador deve ter no mínimo 2 caracteres").max(120),
  role: z.enum(["admin", "collaborator", "viewer"]),
  permissions: z.record(z.string(), z.array(z.string())).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(90).optional().default(7),
})

export const teamUpdateRoleSchema = z.object({
  eventId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
  role: z.enum(["admin", "collaborator", "viewer"]),
  permissions: z.record(z.string(), z.array(z.string())).optional(),
})

export const teamTransferOwnershipSchema = z.object({
  eventId: z.string().trim().min(1),
  newOwnerMemberId: z.string().trim().min(1),
  confirmationTitle: z.string().trim().min(1, "Confirmação nominal do título é obrigatória"),
})
